import { Link } from 'react-router-dom'
import { Warning } from '@phosphor-icons/react'

const HELPLINE = 'trust@donorkoi.2bd.net'

export default function BetaDisclaimer() {
  return (
    <div className="min-h-screen bg-canvas pt-24 sm:pt-28">
      <div className="mx-auto max-w-3xl px-6 py-12 sm:px-8">
        <Link to="/" className="caption-2 text-mute transition-colors duration-300 hover:text-strong">
          ← Back to home
        </Link>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber/25 bg-amber-soft px-3 py-1.5 caption-3 font-semibold tracking-wider text-amber">
          <Warning size={15} weight="fill" aria-hidden="true" />
          BETA SERVICE
        </div>
        <h1 className="heading-4 mt-4">Beta disclaimer</h1>
        <p className="caption-5 mt-2 text-faint">Last updated 26 November 2026</p>

        <div className="mt-8 space-y-8 body-3 text-mute">
          <section>
            <h2 className="heading-6 text-strong">An active beta on free-tier infrastructure</h2>
            <p className="mt-2">
              Donor Koi is being tested and improved during its beta phase using bootstrapped, free-tier infrastructure.
              Features, data handling and availability may change as the service develops. Please report unexpected
              behavior so it can be investigated.
            </p>
          </section>

          <section>
            <h2 className="heading-6 text-strong">Email and notification limitations</h2>
            <p className="mt-2">
              Free email services impose daily quotas and rate limits. Verification codes, password resets, donor
              requests and certificates may be delayed or occasionally not arrive. A queued email is not proof of
              delivery, and email delivery or a donor response is not guaranteed. Check your spam folder and use the
              contact options shown in the app when appropriate.
            </p>
          </section>

          <section>
            <h2 className="heading-6 text-strong">Report a bug or missing email</h2>
            <p className="mt-2">
              Email the Donor Koi trust and support helpline with a brief description of the issue and the public
              reference number, if available. Do not include passwords, verification codes, identity documents or
              unnecessary medical information.
            </p>
            <a
              href={`mailto:${HELPLINE}?subject=${encodeURIComponent('Donor Koi beta issue')}`}
              className="button-md mt-4 inline-flex rounded-xl bg-brand-solid px-5 py-3 text-onbrand transition-colors hover:bg-brand-solid-hover"
            >
              Email {HELPLINE}
            </a>
          </section>

          <section>
            <h2 className="heading-6 text-strong">Not an emergency service</h2>
            <p className="mt-2">
              Do not wait for Donor Koi or an email response in an emergency. In Bangladesh, call 999 and go to a
              licensed medical facility. Donor availability, compatibility and eligibility must be assessed by
              qualified medical professionals.
            </p>
          </section>

          <p>
            Read the current <Link className="underline underline-offset-4" to="/privacy">Privacy Policy</Link> and{' '}
            <Link className="underline underline-offset-4" to="/terms">Terms &amp; Conditions</Link> before using the
            service.
          </p>
        </div>
      </div>
    </div>
  )
}
