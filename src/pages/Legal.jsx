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
    <LegalPage title="Privacy policy" updated="14 November 2026">
      <Section heading="What we collect">
        <p>Donors: name, phone number, blood group, area and post code, last donation date, components you can give and your availability. Seekers: the blood group and component requested, and the hospital or area where transfusion will happen. We do not collect NID, passport or bank details.</p>
      </Section>
      <Section heading="How location is handled">
        <p>Seekers may share precise location voluntarily to sort donors by distance. Donor positions shown publicly are rounded to the locality, never a home address. If you tap Locate me, your position is used for that search only and is not stored.</p>
      </Section>
      <Section heading="Who sees your number">
        <p>A donor’s phone number is revealed to a seeker only after that donor accepts the request. Before acceptance, seekers see first name, group, area and distance.</p>
      </Section>
      <Section heading="Storage and deletion">
        <p>Data is stored in Supabase (PostgreSQL) in the ap-southeast-1 (Singapore) region with row level security, so a user can read or change only their own records. Delete your account any time from the profile, or write to privacy@bloodlagbe.com.bd. Deletion completes within 30 days, backups roll off within 90.</p>
      </Section>
      <Section heading="What we never do">
        <p>We never sell personal data, never run ads against donation profiles and never message you for anything except requests matching your blood group.</p>
      </Section>
    </LegalPage>
  )
}

export function Terms() {
  return (
    <LegalPage title="Terms of use" updated="14 November 2026">
      <Section heading="What Blood Lagbe is">
        <p>Blood Lagbe is a matching layer between people who need blood and registered voluntary donors. We are not a blood bank, not a hospital and not a substitute for medical advice. Every transfusion happens at a licensed facility under medical supervision.</p>
      </Section>
      <Section heading="Voluntary and unpaid">
        <p id="donations">Selling blood is against the law in Bangladesh. Donors may never accept money, goods or favours in exchange for a donation. If anyone asks you for payment connected to a Blood Lagbe request, refuse and write to trust@bloodlagbe.com.bd.</p>
      </Section>
      <Section heading="No guarantee of availability">
        <p>We cannot guarantee that a matching donor will respond, or that a unit will be compatible. Always confirm blood group, cross match and consent at the donation site. In doubt, call the hospital blood bank directly.</p>
      </Section>
      <Section heading="Your responsibilities">
        <p>Donors must keep availability and donation history honest. Seekers must use the service for genuine transfusion needs and not hoard contacts for later. Misuse leads to removal from the platform.</p>
      </Section>
      <Section heading="Liability">
        <p>Blood Lagbe operates as is. To the maximum extent allowed by law we accept no liability for medical outcomes, donor conduct or hospital decisions. In an emergency, always reach the nearest hospital or call 999 first.</p>
      </Section>
    </LegalPage>
  )
}
