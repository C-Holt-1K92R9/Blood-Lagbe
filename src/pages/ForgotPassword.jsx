import { useState } from 'react'
import { ArrowLeft, EnvelopeSimple, LockKey, PaperPlaneTilt } from '@phosphor-icons/react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FormAlert, TextField } from '../components/Form.jsx'
import { api, fieldErrors } from '../lib/api.js'

export default function ForgotPassword() {
  const location = useLocation()
  const navigate = useNavigate()
  const [step, setStep] = useState('request')
  const [email, setEmail] = useState(location.state?.email || '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const clearError = (field) => {
    setErrors((current) => ({ ...current, [field]: undefined }))
    setServerError('')
  }

  const requestCode = async (event) => {
    event?.preventDefault()
    setErrors({})
    setServerError('')
    setNotice('')
    setBusy(true)

    try {
      const result = await api('/forgot-password', { method: 'POST', body: { email } })
      setCode('')
      setNotice(result.message)
      setStep('reset')
    } catch (error) {
      const mapped = fieldErrors(error)
      setErrors(mapped)
      if (Object.keys(mapped).length === 0) setServerError(error.message)
    } finally {
      setBusy(false)
    }
  }

  const resetPassword = async (event) => {
    event.preventDefault()
    setErrors({})
    setServerError('')

    const nextErrors = {}
    if (!/^\d{6}$/.test(code)) nextErrors.code = 'Enter the 6-digit code from your email.'
    if (password.length < 8) nextErrors.password = 'Password must be at least 8 characters.'
    if (password.length > 200) nextErrors.password = 'Password is too long.'
    if (confirmPassword !== password) nextErrors.confirmPassword = 'Passwords do not match.'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setBusy(true)
    try {
      await api('/reset-password', {
        method: 'POST',
        body: { email, code, password },
      })
      navigate('/login', { replace: true, state: { passwordReset: true } })
    } catch (error) {
      const mapped = fieldErrors(error)
      setErrors(mapped)
      if (Object.keys(mapped).length === 0) setServerError(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-[80vh] bg-canvas px-4 pb-16 pt-28">
      <div className="mx-auto max-w-xl">
        <Link
          to="/login"
          className="caption-2 inline-flex items-center gap-2 text-mute transition-colors hover:text-strong"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to sign in
        </Link>

        <section className="mt-6 rounded-3xl border border-line bg-raised p-6 shadow-[var(--shadow-card)] sm:p-9">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            {step === 'request' ? <EnvelopeSimple size={25} aria-hidden="true" /> : <LockKey size={25} aria-hidden="true" />}
          </div>
          <p className="caption-3 mt-6 uppercase tracking-widest text-brand">Account recovery</p>
          <h1 className="heading-4 mt-2">{step === 'request' ? 'Forgot your password?' : 'Choose a new password'}</h1>
          <p className="body-3 mt-3 text-mute">
            {step === 'request'
              ? 'Enter the email address on your donor account. We will send a code if a verified account is found.'
              : <>Enter the 6-digit code sent to <span className="font-medium text-strong">{email}</span>, then choose a new password.</>}
          </p>

          <div className="mt-6 space-y-4">
            <FormAlert>{serverError}</FormAlert>
            {notice && <p className="caption-2 rounded-xl border border-line bg-surface px-4 py-3 text-mute" role="status">{notice}</p>}

            {step === 'request' ? (
              <form className="space-y-4" onSubmit={requestCode} noValidate>
                <TextField
                  label="Email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    clearError('email')
                  }}
                  error={errors.email || errors.Email}
                  maxLength={254}
                  placeholder="name@example.com"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="button-md flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-solid text-onbrand transition-colors duration-300 hover:bg-brand-solid-hover disabled:opacity-70"
                >
                  <PaperPlaneTilt size={18} aria-hidden="true" />
                  {busy ? 'Sending code...' : 'Send reset code'}
                </button>
              </form>
            ) : (
              <>
                <form className="space-y-4" onSubmit={resetPassword} noValidate>
                  <TextField
                    label="6-digit reset code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    value={code}
                    onChange={(event) => {
                      setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                      clearError('code')
                    }}
                    error={errors.code}
                    maxLength={6}
                    placeholder="000000"
                  />
                  <TextField
                    label="New password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      clearError('password')
                      clearError('confirmPassword')
                    }}
                    error={errors.password}
                    maxLength={200}
                    hint="Use at least 8 characters."
                  />
                  <TextField
                    label="Confirm new password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value)
                      clearError('confirmPassword')
                    }}
                    error={errors.confirmPassword}
                    maxLength={200}
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="button-md flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-solid text-onbrand transition-colors duration-300 hover:bg-brand-solid-hover disabled:opacity-70"
                  >
                    <LockKey size={18} aria-hidden="true" />
                    {busy ? 'Updating password...' : 'Reset password'}
                  </button>
                </form>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="caption-5 text-faint">The code expires 5 minutes after it is sent.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('request')
                      setNotice('')
                      setServerError('')
                    }}
                    className="caption-5 text-brand underline underline-offset-4 hover:text-brand-hover"
                  >
                    Change email
                  </button>
                </div>
                <button
                  type="button"
                  onClick={requestCode}
                  disabled={busy}
                  className="button-sm rounded-xl border border-line px-4 py-3 text-strong transition-colors hover:border-brand hover:text-brand disabled:opacity-60"
                >
                  {busy ? 'Sending...' : 'Send another code'}
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
