import { Link } from 'react-router-dom'

function LegalPage({ title, updated, children }) {
  return (
    <div className="min-h-screen bg-canvas pt-24 sm:pt-28">
      <div className="mx-auto max-w-3xl px-6 py-12 sm:px-8">
        <Link to="/" className="caption-2 text-mute transition-colors duration-300 hover:text-strong">
          ← Back to home
        </Link>
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
    <div className="body-3 mt-2 space-y-3 text-mute">{children}</div>
  </section>
)

const UPDATED = '20 November 2026'

export function Privacy() {
  return (
    <LegalPage title="Privacy policy" updated={UPDATED}>
      <Section heading="About this policy">
        <p>
          This policy explains what information Donor Koi handles, why it is used, who may receive it and what the
          current app does when you update or delete information. Donor Koi is a donor-matching service, not a medical
          records system. Please do not submit identity documents, payment details, diagnoses or other information that
          the forms do not ask for.
        </p>
      </Section>

      <Section heading="Information you provide">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Donor account:</strong> name, email, mobile number, password, blood group, blood or plasma donation
            type, optional last-donation date, availability, division, city, written address and optional GPS
            coordinates. A temporary email verification code is stored for verification, becomes unusable after 5
            minutes, is replaced when you request another, and is cleared after verification. The password is stored as
            a salted scrypt hash, not as the original password.
          </li>
          <li>
            <strong>Blood search:</strong> requester name and phone number, optional email, requested blood group and
            component, urgency or requested date and time, hospital or address, division, city and the coordinates used
            to search for nearby donors.
          </li>
          <li>
            <strong>Emergency board:</strong> the name and phone number you enter, blood group and component, location
            and address, requested date and time, and any optional note. These details are displayed publicly while the
            post is open.
          </li>
          <li>
            <strong>Service records:</strong> account sessions, request and notification status, email delivery
            records, and the public reference numbers generated for requests and board posts.
          </li>
        </ul>
      </Section>

      <Section heading="How we use information">
        <p>We use the information above to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>create and secure donor accounts and let donors manage their profile and availability;</li>
          <li>match requests by blood group, donation type, donor availability, donation date and location;</li>
          <li>show matching donor contact details to a seeker so they can make contact directly;</li>
          <li>email matching donors about scheduled requests and send a receipt when a requester provides an email;</li>
          <li>publish and manage emergency-board posts, including marking a post fulfilled; and</li>
          <li>protect the service, investigate misuse and keep essential operational records.</li>
        </ul>
      </Section>

      <Section heading="When information is shared">
        <p>
          A donor is not listed in a general public directory. When a donor matches a search, the results can show the
          donor&apos;s name, email, blood group, donation type, city, approximate distance and last-donation date. For an
          immediate request, the donor&apos;s phone number is also shown so the seeker can call. Only share details you
          are comfortable making available to matching seekers.
        </p>
        <p>
          For a scheduled request, the service emails up to 25 matching donors with the requester&apos;s name, phone
          number, hospital or address, area and requested time. The requester&apos;s optional email may also be included.
          Email providers process these messages to deliver them.
        </p>
        <p>
          Emergency-board posts are public. Anyone viewing an open post can see the name, phone number, blood group,
          requested component, division, city, address, requested time and note. A public request reference can show a
          limited status summary, but not the requester&apos;s name or phone number.
        </p>
        <p>
          We also use service providers for hosting, database storage, geocoding and email delivery. The current
          application uses Neon Postgres for its database, OpenStreetMap Nominatim for address geocoding, and Gmail
          SMTP for email when configured. Email content and delivery status are recorded in the database outbox in
          either mode. If Gmail is not configured, messages are queued in the outbox and are not automatically
          delivered.
          The exact hosting and data regions depend on the deployment. These providers handle data under their own
          service terms and privacy notices.
        </p>
      </Section>

      <Section heading="Location and geocoding">
        <p>
          GPS is optional and is used only after you choose to share it through your browser or device. The submitted
          coordinates are stored with the donor profile or blood request and used to calculate search distance. We do
          not continuously track a device.
        </p>
        <p>
          If the app needs to place a written address, it sends the address, city and division to OpenStreetMap
          Nominatim and stores the coordinates returned. If a donor address cannot be placed, an approximate city
          location may be used. Search results show an approximate distance, not a donor&apos;s exact GPS coordinates.
          Geocoding results can be inaccurate; verify locations directly before travelling.
        </p>
      </Section>

      <Section heading="Cookies and browser storage">
        <p>
          When a donor signs in, the app uses an HttpOnly session cookie that expires after 30 days. The production
          cookie is marked Secure when the deployment is configured for production. The database stores a hash of the
          session token rather than the token itself.
        </p>
        <p>
          The browser also stores your theme preference and, when you create an emergency-board post, a private token
          used to close that post from the same browser. Clearing browser storage may remove that token; keep the post
          reference and contact us if you can no longer close a post you created.
        </p>
      </Section>

      <Section heading="Retention and deletion">
        <p>
          Donor account information remains in the donor profile until the account is deleted. You can delete your
          account from your donor page. This removes the donor record and its related sessions and notification records.
          It does not automatically delete independent blood-search records, email-outbox records, or copies of emails
          already delivered to other people.
        </p>
        <p>
          The current application does not set an automatic deletion period for blood-search records or email delivery
          records. Open and fulfilled emergency-board posts are configured for automatic deletion after 30 days from
          creation when the scheduled cleanup job is running. Closing a post marks it fulfilled and removes it from the
          open board; it does not immediately erase the database row. Provider backups may also follow separate
          retention schedules.
        </p>
        <p>
          To ask about or request removal of a blood-search record or board post, email{' '}
          <a className="font-medium text-strong underline underline-offset-4" href="mailto:trust@donorkoi.2bd.net">
            trust@donorkoi.2bd.net
          </a>{' '}
          and include its public reference if you have it. Do not send passwords, identity documents or additional
          medical details in your message.
        </p>
      </Section>

      <Section heading="Your choices and account security">
        <p>
          Donors can update their profile, donation date, location and availability, change their password, sign out, or
          delete their account. Sharing GPS is optional. Seekers can leave the receipt email blank, but the other fields
          needed to find donors are required.
        </p>
        <p>
          Depending on the law that applies to you, you may have additional rights to request access to, correction of,
          or deletion of personal information. Contact us using the address in the retention section. We may need
          enough information to identify the relevant record and will handle the request under applicable law.
        </p>
        <p>
          Passwords are hashed and donor sessions use an HttpOnly cookie. These measures reduce risk but cannot
          guarantee that information is always secure. Use a unique password, protect access to your device and avoid
          including unnecessary private details in a public-board note.
        </p>
      </Section>

      <Section heading="Policy changes">
        <p>
          We may revise this policy when the service or its data practices change. The updated date at the top indicates
          the latest revision. Please review this page periodically, especially before submitting new information.
        </p>
      </Section>
    </LegalPage>
  )
}

export function Terms() {
  return (
    <LegalPage title="Terms & Conditions" updated={UPDATED}>
      <Section heading="1. The service and these terms">
        <p>
          Donor Koi helps people looking for blood or plasma contact registered donors and post requests on a
          community emergency board. It is a matching and communication service only. By accessing or using the
          service, you agree to these terms and the <Link className="underline underline-offset-4" to="/privacy">Privacy
          Policy</Link>. If you do not agree, do not create an account or submit a request.
        </p>
        <p>
          Donor Koi is not a hospital, blood bank, medical provider, emergency dispatch service or representative of
          any donor, seeker or healthcare facility. It does not collect, test, store, transport or transfuse blood.
        </p>
      </Section>

      <Section heading="2. Emergency and medical care">
        <p>
          Do not wait for a response through Donor Koi when someone needs urgent medical care. Call 999 and go to the
          nearest hospital or licensed medical facility. The service is not monitored as an emergency hotline and cannot
          provide medical advice, triage or treatment.
        </p>
        <p>
          A qualified healthcare professional and the receiving facility must decide whether a donation or transfusion
          is appropriate. Never delay care to use this website.
        </p>
      </Section>

      <Section heading="3. Donor accounts and accurate information">
        <p>
          Donors must provide their own accurate contact, blood-group, donation-type, location and donation-history
          information, and keep it current. Do not create an account for another person without their permission. You
          are responsible for keeping your password private and for activity performed through your account.
        </p>
        <p>
          Availability is voluntary and may change at any time. Turn it off when you cannot be contacted or are unable
          to consider a request. The app&apos;s donation-date filters are matching aids only; they do not confirm
          eligibility to donate.
        </p>
      </Section>

      <Section heading="4. Requests and contact">
        <p>
          Seekers must submit genuine requests, provide a reachable phone number and accurate location and timing, and
          have permission to share another person&apos;s information when making a request on their behalf. Do not use
          donor contact details for marketing, repeated unwanted contact or any purpose unrelated to the request.
        </p>
        <p>
          Search results are based on information supplied by users and the matching rules in the app. For scheduled
          needs, the service may email up to 25 eligible matches with the requester&apos;s contact and request details.
          Email delivery, a donor response, a meeting or a donation is not guaranteed.
        </p>
      </Section>

      <Section heading="5. Emergency-board posts">
        <p>
          An open emergency-board post is visible to the public and displays the contact and location information entered
          by its author. Post only information you are authorised to share. Keep it accurate and remove it from the open
          board when help is no longer needed by marking it fulfilled. The app also schedules removal of posts older
          than 30 days when its cleanup job is enabled and operating.
        </p>
        <p>
          A private close token is stored in the browser that created the post and is required to close it. Do not share
          that token. If you lose it, contact{' '}
          <a className="font-medium text-strong underline underline-offset-4" href="mailto:trust@donorkoi.2bd.net">
            trust@donorkoi.2bd.net
          </a>{' '}
          with the post reference.
        </p>
      </Section>

      <Section heading="6. Voluntary, unpaid donation">
        <p>
          Donating through Donor Koi is voluntary and unpaid. Users must not offer, request, accept or arrange money,
          gifts, services or other benefits in exchange for a donation. Donor Koi does not sell blood, accept donation
          payments or collect a fee for connecting a seeker with a donor. Read the separate{' '}
          <Link className="font-medium text-strong underline underline-offset-4" to="/donation-disclaimer">
            Donation Disclaimer
          </Link>{' '}
          before acting on a match.
        </p>
      </Section>

      <Section heading="7. Prohibited use">
        <p>You must not:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>submit a knowingly false, misleading, duplicate or non-genuine request or donor profile;</li>
          <li>impersonate another person or share their details without permission;</li>
          <li>harass, threaten, discriminate against, defraud or repeatedly contact another user against their wishes;</li>
          <li>scrape, harvest, sell or redistribute donor or seeker contact details;</li>
          <li>use the service for advertising, spam, commercial solicitation or payment collection; or</li>
          <li>attempt to interfere with, bypass or damage the service or another user&apos;s account.</li>
        </ul>
      </Section>

      <Section heading="8. Matching limitations and external services">
        <p>
          Donor profiles and request details are user-submitted and are not independently verified as medical facts.
          Location and distance may be approximate. A listed donor may be unavailable, may not respond, or may not be
          suitable after clinical screening. A matching blood group alone does not establish compatibility.
        </p>
        <p>
          Geocoding, hosting, database and email functions rely on external providers and internet connectivity. Those
          services may be unavailable, delayed or inaccurate, and are subject to their own terms.
        </p>
      </Section>

      <Section heading="9. Moderation and service changes">
        <p>
          We may remove a post, restrict access or suspend an account when we reasonably believe these terms are being
          violated, the service is being misused, or action is needed to protect users or comply with a legal
          requirement. We may change, pause or discontinue a feature, and cannot promise uninterrupted availability.
        </p>
      </Section>

      <Section heading="10. Disclaimers and responsibility">
        <p>
          The service is provided as available, without a promise that a request will find a donor or lead to a
          successful donation. To the extent allowed by applicable law, Donor Koi is not responsible for users&apos;
          independent conduct, medical decisions, facility decisions, inaccurate user-submitted information, or
          interruptions caused by external providers.
        </p>
        <p>
          Nothing in these terms excludes a right or responsibility that cannot legally be excluded. These terms do not
          replace professional medical advice or applicable law.
        </p>
      </Section>

      <Section heading="11. Changes and contact">
        <p>
          We may update these terms as the service changes. Continued use after an update means you accept the revised
          terms. The updated date at the top identifies the current version. For concerns about a request, post or
          misuse, contact{' '}
          <a className="font-medium text-strong underline underline-offset-4" href="mailto:trust@donorkoi.2bd.net">
            trust@donorkoi.2bd.net
          </a>.
        </p>
      </Section>
    </LegalPage>
  )
}

export function DonationDisclaimer() {
  return (
    <LegalPage title="Donation Disclaimer" updated={UPDATED}>
      <Section heading="Donor Koi is not a medical service">
        <p>
          Donor Koi helps seekers contact people who have registered as donors. It is not a hospital, blood bank,
          laboratory, medical professional or emergency service. We do not collect, test, screen, store, transport,
          match for clinical compatibility, or transfuse blood or plasma.
        </p>
        <p>
          For a life-threatening emergency, call 999 and go to the nearest hospital or licensed medical facility
          immediately. Do not wait for a donor to respond through this service.
        </p>
      </Section>

      <Section heading="A match is not medical clearance">
        <p>
          Blood group, donation type, last-donation date, availability and location are entered by users and are not
          independently verified by Donor Koi. The app uses a 90-day interval for whole-blood matching and a 28-day
          interval for plasma matching. These are software filters only: they do not determine whether a person is
          healthy, eligible or safe to donate.
        </p>
        <p>
          Only qualified staff at a licensed donation or treatment facility can assess donor eligibility, perform
          required testing and cross-matching, and decide whether a donation or transfusion is appropriate. Follow
          their instructions and local clinical guidance.
        </p>
      </Section>

      <Section heading="No guarantee of donors or outcomes">
        <p>
          A search result or emergency-board post does not guarantee that a donor exists, is available, will respond,
          passes screening, has compatible blood, or can donate at the required time. A donor may decline without giving
          a reason. Seekers must confirm details directly with the donor and the receiving facility.
        </p>
      </Section>

      <Section heading="Donations must be voluntary and unpaid">
        <p>
          Donor Koi does not sell blood, arrange paid donations or process payments. No user may offer, request, accept
          or arrange money, gifts, services or other benefits in exchange for a donation through this service. Do not
          send money to someone who claims payment is required to secure a donor or blood.
        </p>
        <p>
          If someone solicits payment or you suspect fraud or coercion, do not proceed. Contact the hospital and report
          the concern to{' '}
          <a className="font-medium text-strong underline underline-offset-4" href="mailto:trust@donorkoi.2bd.net">
            trust@donorkoi.2bd.net
          </a>.
        </p>
      </Section>

      <Section heading="Protect yourself and others">
        <p>
          Share only the contact and location details necessary to arrange a request. Verify the person and the request
          directly, and conduct all screening and donation arrangements through a licensed facility. Never share your
          password, one-time codes, financial credentials or another person&apos;s contact details without permission.
          Emergency-board posts are public while open.
        </p>
      </Section>
    </LegalPage>
  )
}
