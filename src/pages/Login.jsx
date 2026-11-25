import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Drop, SignIn } from '@phosphor-icons/react'
import { useAuth } from '../lib/session.jsx'
import { FormAlert } from '../components/Form.jsx'
import { fieldErrors } from '../lib/api.js'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState(false)

  const target = location.state?.from || '/donor'

  const submit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Enter your password.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setBusy(true)
    setServerError('')
    try {
      const result = await login(email, password)
      if (result.verificationRequired) {
        navigate('/verify-email', { replace: true, state: { email: result.email, needsSend: true } })
        return
      }
      navigate(target, { replace: true })
    } catch (err) {
      const mapped = fieldErrors(err)
      setErrors(mapped)
      if (Object.keys(mapped).length === 0) setServerError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas pt-24 sm:pt-28">
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <p className="caption-3 uppercase tracking-widest text-brand">Donor sign in</p>
          <h1 className="heading-3 mt-3 max-w-hero">Your donor page keeps your pin and availability current</h1>
          <p className="body-3 mt-4 max-w-hero text-mute">
            Sign in to update where you are, flip your availability, record a donation or review the requests you were
            emailed about. Patients find you faster when your location is fresh.
          </p>

          <ul className="body-6 mt-6 space-y-3 text-mute">
            <li className="flex items-start gap-2">
              <Drop size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
              Only available donors who are past the waiting period appear in search.
            </li>
            <li className="flex items-start gap-2">
              <Drop size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
              Your phone number is shared only on an immediate request.
            </li>
            <li className="flex items-start gap-2">
              <Drop size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
              Delete your account and data at any time.
            </li>
          </ul>
        </div>

        <form
          onSubmit={submit}
          noValidate
          className="rounded-2xl border border-line bg-raised p-6 shadow-[var(--shadow-card)] lg:col-span-6"
        >
          <p className="heading-6">Welcome back</p>
          <p className="caption-2 mt-1 text-mute">Use the email and password you registered with.</p>

          <div className="mt-6 space-y-4">
            <FormAlert>{serverError}</FormAlert>

            <div>
              <label htmlFor="email" className="title-4 mb-2 block">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setErrors((x) => ({ ...x, email: undefined }))
                }}
                aria-invalid={errors.email ? 'true' : undefined}
                className="body-3 h-11 w-full rounded-xl border border-line bg-surface px-3 placeholder:text-faint focus:border-brand focus:outline-none"
                placeholder="name@example.com"
              />
              {errors.email && (
                <p className="caption-2 mt-1.5 text-brand" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="password" className="title-4">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  state={{ email }}
                  className="caption-5 text-brand underline underline-offset-4 hover:text-brand-hover"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setErrors((x) => ({ ...x, password: undefined }))
                }}
                aria-invalid={errors.password ? 'true' : undefined}
                className="body-3 h-11 w-full rounded-xl border border-line bg-surface px-3 placeholder:text-faint focus:border-brand focus:outline-none"
                placeholder="Your password"
              />
              {errors.password && (
                <p className="caption-2 mt-1.5 text-brand" role="alert">
                  {errors.password}
                </p>
              )}
            </div>
            {location.state?.passwordReset && (
              <p className="caption-2 text-good" role="status">
                Your password has been reset. Sign in with your new password.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={busy}
            className="button-md mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-solid text-onbrand transition-all duration-300 ease-out hover:bg-brand-solid-hover active:scale-[0.98] disabled:opacity-70"
          >
            <SignIn size={19} aria-hidden="true" />
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="caption-2 mt-5 text-center text-mute">
            New to Donor Koi?{' '}
            <Link
              to="/register"
              className="inline-flex items-center gap-1 font-medium text-strong underline decoration-line underline-offset-4 hover:decoration-brand"
            >
              Create a donor account
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
