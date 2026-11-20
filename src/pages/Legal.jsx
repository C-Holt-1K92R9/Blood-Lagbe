import { Link } from 'react-router-dom'

function LegalPage({ title, updated, children }) {
  return (
    <div className="min-h-screen bg-canvas pt-24 sm:pt-28">
      <div className="mx-auto max-w-3xl px-6 py-12 sm:px-8">
        <Link to="/" className="caption-2 text-mute transition-colors duration-300 hover:text-strong">← Back to home</Link>
        <h1 className="heading-4 mt-6">{title}</h1>
        <p className="caption-5 mt-2 text-faint">Last updated {updated}</p>
        <div className="mt-8 space-y-8">{children}</div>
      </div>
    </div>
  )
}

const Section = ({ heading, children }) => (
  <section>
    <h2 className="heading-6">{heading}</h2>
    <div className="body-3 mt-2 text-mute">{children}</div>
  </section>
)

export function Privacy() {
  return (
    <LegalPage title="Privacy policy" updated="20 November 2026">
      <Section heading="What we collect">
        <p>
          Donors: name, email, mobile number, a password (stored only as a scrypt hash), blood group, whether you donate
          blood or plasma, last donation date, division and city, a written home address, and an optional GPS coordinate
          for your current or home location. Seekers: name, mobile number, optional email, the blood group and component
          needed, the hospital or address, whether the need is immediate or later, the requested date and time, and the
          location shared for the search. We do not collect NID, passport or bank details.
        </p>
      </Section>
      <Section heading="How location is handled">
        <p>
          A donor's map pin is used to calculate distance from a patient. If you share GPS, we store that coordinate. If
          you do not, we look up your written address with OpenStreetMap Nominatim, and if that fails we fall back to
          your district centre, so the pin may be approximate. Seekers see the city, area and approximate distance, never
          a donor's precise coordinate on a map. A seeker's search location is stored with the request so we can show
          which donors matched.
        </p>
      </Section>
      <Section heading="Who sees your contact details">
        <p>
          A donor's name, blood group, city, approximate distance and email are shown to a seeker who has submitted a
          request. A donor's phone number is shown only when the seeker marks the need as immediate, so the family can
          call directly. When a request is scheduled for later, we email matching donors the seeker's name, phone number,
          address and requested time. Donors can hide themselves at any time by switching availability off.
        </p>
      </Section>
      <Section heading="Storage and deletion">
        <p>
          Data is stored in Neon Postgres, a managed PostgreSQL service, in the ap-southeast-1 (Singapore) region over
          TLS. Passwords are hashed with scrypt and salting. Sign-in uses an httpOnly session cookie. Delete your account
          any time from your donor page, or write to privacy@bloodlagbe.com.bd. Deletion completes within 30 days, and
          backups roll off within 90.
        </p>
      </Section>
      <Section heading="What we never do">
        <p>
          We never sell personal data, never run ads against donation profiles and never message you for anything except
          requests matching your blood group, plus essential account notices.
        </p>
      </Section>
    </LegalPage>
  )
}

export function Terms() {
  return (
    <LegalPage title="Terms of use" updated="20 November 2026">
      <Section heading="What Blood Lagbe is">
        <p>
          Blood Lagbe is a matching layer between people who need blood and registered voluntary donors. We are not a
          blood bank, not a hospital and not a substitute for medical advice. Every transfusion happens at a licensed
          facility under medical supervision.
        </p>
      </Section>
      <Section heading="Voluntary and unpaid">
        <p id="donations">
          Selling blood is against the law in Bangladesh. Donors may never accept money, goods or favours in exchange for
          a donation. If anyone asks you for payment connected to a Blood Lagbe request, refuse and write to
          trust@bloodlagbe.com.bd.
        </p>
      </Section>
      <Section heading="Donor accounts">
        <p>
          You are responsible for the password on your donor account and for keeping your availability, location and last
          donation date accurate. Do not register someone else without their consent. We may suspend an account that
          repeatedly posts false requests or misuses donor contact details.
        </p>
      </Section>
      <Section heading="No guarantee of availability">
        <p>
          We cannot guarantee that a matching donor will respond, or that a unit will be compatible. Always confirm blood
          group, cross match and consent at the donation site. In doubt, call the hospital blood bank directly.
        </p>
      </Section>
      <Section heading="Your responsibilities">
        <p>
          Donors must keep availability and donation history honest. Seekers must use the service for genuine
          transfusion needs and not hoard contacts for later. Misuse leads to removal from the platform.
        </p>
      </Section>
      <Section heading="Liability">
        <p>
          Blood Lagbe operates as is. To the maximum extent allowed by law we accept no liability for medical outcomes,
          donor conduct or hospital decisions. In an emergency, always reach the nearest hospital or call 999 first.
        </p>
      </Section>
    </LegalPage>
  )
}
