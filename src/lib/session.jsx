import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [donor, setDonor] = useState(null)
  const [loading, setLoading] = useState(true)
  // A sign-in that happens while the initial /me request is still in flight must
  // not be wiped out when that older response lands.
  const authVersion = useRef(0)

  const refresh = useCallback(async () => {
    const startedAt = authVersion.current
    try {
      const data = await api('/me')
      if (authVersion.current === startedAt) setDonor(data.donor || null)
    } catch {
      if (authVersion.current === startedAt) setDonor(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(async (email, password) => {
    const data = await api('/login', { method: 'POST', body: { email, password } })
    if (data.verificationRequired) return data
    authVersion.current += 1
    setDonor(data.donor)
    return data
  }, [])

  const register = useCallback(async (payload) => {
    return api('/register', { method: 'POST', body: payload })
  }, [])

  const verifyEmail = useCallback(async (email, code) => {
    const data = await api('/verify-email', { method: 'POST', body: { email, code } })
    authVersion.current += 1
    setDonor(data.donor)
    return data.donor
  }, [])

  const resendVerificationCode = useCallback(
    (email) => api('/verify-email/resend', { method: 'POST', body: { email } }),
    [],
  )

  const logout = useCallback(async () => {
    await api('/logout', { method: 'POST' })
    setDonor(null)
  }, [])

  const update = useCallback(async (patch) => {
    const data = await api('/me', { method: 'PATCH', body: patch })
    setDonor(data.donor)
    return data.donor
  }, [])

  const updateLocation = useCallback(async (patch) => {
    const data = await api('/me/location', { method: 'PATCH', body: patch })
    setDonor(data.donor)
    return data.donor
  }, [])

  const remove = useCallback(async () => {
    await api('/me', { method: 'DELETE' })
    setDonor(null)
  }, [])

  const value = useMemo(
    () => ({
      donor,
      loading,
      refresh,
      login,
      register,
      verifyEmail,
      resendVerificationCode,
      logout,
      update,
      updateLocation,
      remove,
      setDonor,
    }),
    [donor, loading, refresh, login, register, verifyEmail, resendVerificationCode, logout, update, updateLocation, remove],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
