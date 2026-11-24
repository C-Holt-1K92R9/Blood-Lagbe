import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowClockwise, CheckCircle, EnvelopeSimple, ShieldCheck } from '@phosphor-icons/react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FormAlert } from '../components/Form.jsx'
import { useAuth } from '../lib/session.jsx'

const EMPTY_CODE = ['', '', '', '', '', '']

export default function VerifyEmail() {
  const location = useLocation()
  const navigate = useNavigate()
  const { verifyEmail, resendVerificationCode } = useAuth()
  const routeState = location.state || {}
  const [email] = useState(() => routeState.email || sessionStorage.getItem('verificationEmail') || '')
  const [emailStatus, setEmailStatus] = useState(
    () => routeState.needsSend ? '' : routeState.emailStatus || sessionStorage.getItem('verificationEmailStatus') || '',
  )
  const [started, setStarted] = useState(
    () => !routeState.needsSend && (routeState.emailStatus === 'sent' || sessionStorage.getItem('verificationEmailStatus') === 'sent'),
  )
  const [code, setCode] = useState(EMPTY_CODE)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [success, setSuccess] = useState(false)
  const inputs = useRef([])
  const verificationInProgress = useRef(false)

  useEffect(() => {
    if (!routeState.email) return
    sessionStorage.setItem('verificationEmail', routeState.email)
    if (routeState.needsSend) {
      sessionStorage.removeItem('verificationEmailStatus')
    } else {
      if (routeState.emailStatus === 'sent') {
        sessionStorage.setItem('verificationEmailStatus', 'sent')
      } else {
        sessionStorage.removeItem('verificationEmailStatus')
      }
    }
  }, [routeState.email, routeState.emailStatus, routeState.needsSend])

  useEffect(() => {
    if (started) inputs.current[0]?.focus()
  }, [started])

  useEffect(() => {
    if (!success) return undefined
    const timeout = window.setTimeout(() => navigate('/donor?welcome=1', { replace: true }), 1400)
    return () => window.clearTimeout(timeout)
  }, [success, navigate])

  const submitCode = async (value) => {
    if (value.length !== 6 || verificationInProgress.current || success) return
    verificationInProgress.current = true
    setVerifying(true)
    setError('')
    try {
      await verifyEmail(email, value)
      sessionStorage.removeItem('verificationEmail')
      sessionStorage.removeItem('verificationEmailStatus')
      setSuccess(true)
    } catch (err) {
      setError(err.message)
      setCode(EMPTY_CODE)
      requestAnimationFrame(() => inputs.current[0]?.focus())
    } finally {
      verificationInProgress.current = false
      setVerifying(false)
    }
  }

  const setDigits = (index, rawValue) => {
    const digits = rawValue.replace(/\D/g, '').slice(0, 6 - index)
    const next = [...code]
    if (!digits) {
      next[index] = ''
    } else {
      for (const [offset, digit] of [...digits].entries()) next[index + offset] = digit
    }
    setCode(next)
    setError('')
    if (digits) inputs.current[Math.min(index + digits.length, 5)]?.focus()
    if (next.every(Boolean)) void submitCode(next.join(''))
  }

  const sendCode = async () => {
    if (!email || sending) return
    setSending(true)
    setError('')
    try {
      const result = await resendVerificationCode(email)
      setEmailStatus(result.emailStatus)
      sessionStorage.setItem('verificationEmailStatus', result.emailStatus === 'sent' ? 'sent' : '')
      setCode(EMPTY_CODE)
      setStarted(result.emailStatus === 'sent')
      if (result.emailStatus !== 'sent') {
        setError(
          result.emailStatus === 'logged'
            ? 'Email delivery is not configured, so the code was not sent. Please try again later.'
            : 'We could not send the code. Please try again.',
        )
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const deliveryMessage =
    emailStatus === 'logged'
      ? 'Email delivery is not configured, so the code was not sent. Please try again later.'
      : emailStatus === 'failed'
        ? 'We could not send the code. Please request a new one.'
        : ''

  if (success) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-canvas px-4 py-16">
        <section className="w-full max-w-lg rounded-3xl border border-line bg-raised px-6 py-12 text-center shadow-[var(--shadow-card)] sm:px-10">
          <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
            <span className="verify-success-ring absolute inset-0 rounded-full border-2 border-good/40" />
            <span className="absolute inset-3 rounded-full bg-good-soft animate-ping" />
            <CheckCircle
              size={76}
              weight="fill"
              className="verify-success-icon relative text-good"
              aria-hidden="true"
            />
          </div>
          <p className="caption-3 mt-7 uppercase tracking-[0.18em] text-good">Email verified</p>
          <h1 className="heading-4 mt-3">You’re ready to help</h1>
          <p className="body-3 mt-3 text-mute">Your donor account is active. Taking you to your donor page…</p>
        </section>
      </div>
    )
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
            {started ? <ShieldCheck size={25} aria-hidden="true" /> : <EnvelopeSimple size={25} aria-hidden="true" />}
          </div>
          <p className="caption-3 mt-6 uppercase tracking-widest text-brand">Donor account verification</p>
          <h1 className="heading-4 mt-2">{started ? 'Enter your 6-digit code' : 'Verify your email address'}</h1>
          <p className="body-3 mt-3 text-mute">
            {email ? (
              <>
                {started ? 'We sent a verification code to ' : 'Your donor account is not verified yet. Send a code to '}
                <span className="font-medium text-strong">{email}</span>.
              </>
            ) : (
              'Sign in with your donor account to continue email verification.'
            )}
          </p>

          <div className="mt-6">
            <FormAlert>{error || (!started ? deliveryMessage : '')}</FormAlert>
          </div>

          {!email ? (
            <Link
              to="/login"
              className="button-md mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-brand-solid px-5 text-onbrand transition-all duration-300 hover:bg-brand-solid-hover active:scale-[0.98]"
            >
              Go to sign in
            </Link>
          ) : !started ? (
            <button
              type="button"
              onClick={sendCode}
              disabled={sending}
              className="button-lg mt-7 flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-brand-solid px-5 text-onbrand transition-all duration-300 hover:bg-brand-solid-hover active:scale-[0.98] disabled:opacity-70"
            >
              <EnvelopeSimple size={22} aria-hidden="true" />
              {sending ? 'Sending your code…' : 'Verify now'}
            </button>
          ) : (
            <>
              <form
                className="mt-8"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (code.every(Boolean)) void submitCode(code.join(''))
                }}
              >
                <p id="otp-label" className="title-4 mb-3">
                  Verification code
                </p>
                <div className="flex justify-between gap-2 sm:gap-3" role="group" aria-labelledby="otp-label">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        inputs.current[index] = element
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      maxLength={6}
                      value={digit}
                      disabled={verifying}
                      aria-label={`Digit ${index + 1} of 6`}
                      aria-invalid={Boolean(error)}
                      onChange={(event) => setDigits(index, event.target.value)}
                      onPaste={(event) => {
                        event.preventDefault()
                        setDigits(index, event.clipboardData.getData('text'))
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Backspace') {
                          event.preventDefault()
                          const next = [...code]
                          if (next[index]) {
                            next[index] = ''
                            setCode(next)
                            if (index > 0) inputs.current[index - 1]?.focus()
                          } else if (index > 0) {
                            next[index - 1] = ''
                            setCode(next)
                            inputs.current[index - 1]?.focus()
                          }
                        } else if (event.key === 'ArrowLeft' && index > 0) {
                          event.preventDefault()
                          inputs.current[index - 1]?.focus()
                        } else if (event.key === 'ArrowRight' && index < 5) {
                          event.preventDefault()
                          inputs.current[index + 1]?.focus()
                        }
                      }}
                      className={`body-1 h-14 min-w-0 flex-1 rounded-xl border bg-surface text-center font-mono text-2xl focus:border-brand focus:outline-none sm:h-16 sm:text-3xl ${
                        error ? 'border-brand' : 'border-line'
                      }`}
                    />
                  ))}
                </div>
                <p className="caption-5 mt-3 text-faint">The code expires 5 minutes after it is sent.</p>
                {verifying && <p className="caption-2 mt-4 text-mute" role="status">Checking your code…</p>}
              </form>

              <button
                type="button"
                onClick={sendCode}
                disabled={sending || verifying}
                className="button-sm mt-6 inline-flex items-center gap-2 rounded-xl border border-line px-4 py-3 text-strong transition-colors hover:border-brand hover:text-brand disabled:opacity-60"
              >
                <ArrowClockwise size={17} aria-hidden="true" />
                {sending ? 'Sending…' : 'Send a new code'}
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
