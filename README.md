# Donor Koi

**A fast, community-focused blood and plasma donor finder for Bangladesh.**

Donor Koi helps people find registered and available donors by blood group and location. Seekers can make immediate or scheduled requests, while a public emergency board provides another way to ask for help when no registered donor is available.

The project is free for seekers and designed to keep the search process simple: enter the need, verify the location, view eligible matches, and contact a donor directly or notify them by email.

> [!IMPORTANT]
> This project is a community support tool, not a medical or emergency service. For a life-threatening emergency in Bangladesh, call **999** first.

## Features

- Search for blood or plasma donors in nearby locations
- Filter by blood group, need type, timing, division, city, and address
- Match within a fixed 10 km radius before checking the rest of the selected city
- Respect blood and plasma donation waiting periods
- Contact immediate matches by phone or WhatsApp, with temporary primary/backup holds
- Email scheduled requests to up to 10 nearby eligible donors with private accept/decline links
- Confirm donations and automatically enforce donor recovery intervals
- Generate and email honorary donor certificates after confirmed donations
- View private donation achievements and opt in to a name-only public honorary wall
- Explain beta limitations, email delays and service changes
- Register and manage a donor profile
- Update availability and record the latest donation
- Reset a forgotten password using a time-limited email code
- Post and close public emergency requests
- Send categorized feedback through the contact page, saved to the database
- Expire scheduled requests four hours after their requested time and retain terminal requests for 30 days
- Use password-authenticated donor accounts with 30-day sessions
- Run the React client and Express API together in development and production

## How It Works

1. A seeker selects the blood group, component, and whether the need is immediate or scheduled.
2. The seeker provides contact details and a written address, with optional GPS coordinates.
3. The server resolves the location using browser GPS or OpenStreetMap Nominatim.
4. Eligible donors are grouped by:
   - donors within 10 km, sorted by distance
   - other available donors in the same city, sorted by distance
5. Recent donors are excluded according to the donation interval:
   - blood: 90 days
   - plasma: 28 days
6. Immediate requests expose matching phone numbers and let the seeker hold a primary and backup donor for two hours. Scheduled requests are saved and up to 10 eligible donors within 10 km receive individual queued emails with private accept/decline links.
7. Donation confirmation starts the donor's 90-day blood or 28-day plasma recovery period; availability is restored only if it was enabled before the donation.
8. A background job generates a downloadable SVG certificate for each confirmed donation and queues it by email. Donors can view their private achievement history and choose whether to appear by name and donation count on the public wall.

Donor registration accepts Gmail, Yahoo, and Outlook-family addresses. New accounts remain unavailable until the 6-digit email code is verified; codes expire after 30 minutes. If registration is interrupted, sign in and choose **Verify now** to request a fresh code.

Scheduled `datetime-local` values are interpreted in **Asia/Dhaka (UTC+06:00)** so stored request times do not depend on the server timezone.

## Public Emergency Board

When no registered donor is available, anyone can post a public request containing the blood group, component, location, phone number, and optional note.

The API generates a private close token for each post and stores it only in the browser that created the post. The close token is required to mark a request as fulfilled. Public phone numbers are not sufficient to close another person's post.

## Technology Stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, React Router 7, Tailwind CSS 3 |
| Build tool | Vite 8 |
| UI icons | Phosphor Icons |
| Backend | Express 5 |
| Database | Neon Postgres |
| Geocoding | OpenStreetMap Nominatim |
| Email | Database outbox with Gmail SMTP credential rotation |

The client and API are served by the same Node.js process. PostgreSQL data and table definitions are managed through `server/schema.sql`.

## Project Structure

```text
.
├── public/                # Public static assets
├── server/
│   ├── lib/               # Authentication, geocoding, mail, and validation helpers
│   ├── routes/            # Auth, search, and emergency API routes
│   ├── schema.sql         # PostgreSQL schema
│   ├── migrate.js         # Applies the database schema
│   ├── seed.js            # Adds optional demo data
│   └── index.js           # Express and Vite entry point
├── shared/                # Shared project files
└── src/
    ├── components/        # Reusable UI components
    ├── pages/             # Application pages
    └── lib/               # Browser-side session helpers
```

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- A Neon Postgres database

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd blood-lagbe

# Install dependencies
npm install

# Create local environment variables
cp .env.example .env
```

On Windows PowerShell, create `.env` with:

```powershell
Copy-Item .env.example .env
```

Set `DATABASE_URL` and, optionally, `DATABASE_URL_POOLED` in `.env`. For Neon, set `DATABASE_URL_UNPOOLED` to the direct connection string for schema setup.

### Database Setup

```bash
npm run db:setup
npm run db:seed
```

`db:setup` safely re-applies `server/schema.sql`, preferring `DATABASE_URL_UNPOOLED` for direct connections and falling back to `DATABASE_URL`. `db:seed` is optional and only adds demo data when the donor table is empty.

### Run Locally

```bash
npm run dev
```

Open `http://localhost:5173`.

### Production Build

```bash
npm run build
npm run start
```

The production server runs on `http://localhost:4173` unless `PORT` is configured.

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by database helpers |
| `DATABASE_URL_POOLED` | Optional | Pooled database connection used by database helpers |
| `DATABASE_URL_UNPOOLED` | Optional | Direct Neon connection preferred by `npm run db:setup` |
| `GMAIL_USER` | Optional if a backup is configured | Primary Gmail account used to send application email |
| `GMAIL_APP_PASSWORD` | Required with `GMAIL_USER` | Google App Password for Gmail SMTP |
| `GMAIL_BACKUP_1_USER`, `GMAIL_BACKUP_1_APP_PASSWORD` | Optional | First fallback Gmail account |
| `GMAIL_BACKUP_2_USER`, `GMAIL_BACKUP_2_APP_PASSWORD` | Optional | Second fallback Gmail account; backups 3–5 are also supported |
| `GMAIL_DAILY_LIMIT` | Optional | Per-account rolling 24-hour limit; defaults to 450 and cannot exceed 500 |
| `MAIL_FROM` | Optional | Sender alias configured in Gmail |
| `PUBLIC_APP_URL` | Optional locally; required outside Vercel in production | Public origin used to build scheduled donor response links |
| `CRON_SECRET` | Required for worker endpoints | Bearer secret for email delivery and certificate generation |
| `FEEDBACK_EXPORT_SECRET` | Required for feedback exports | Bearer secret protecting the feedback CSV email endpoint |
| `PORT` | Optional | Server port; defaults to 5173 in development and 4173 in production |
| `NODE_ENV` | Optional | Set to `production` for secure production cookies and static serving |

Copy `.env.example` to `.env` and keep `.env` private. SMTP credentials are read from environment variables and never stored in the database. All messages are first recorded individually in `email_outbox`; retryable failures are rescheduled, quota/authentication failures cool down that account and rotate to an available backup, and permanent SMTP failures are marked failed. Verification and password-reset codes are high-priority, trigger an immediate delivery attempt rather than waiting for the scheduled worker, and expire after 30 minutes.

## Demo Accounts

`npm run db:seed` adds 15 fictional donors across Dhaka and Chattogram. Demo emails use the `@example.com` domain.

| Field | Value |
| --- | --- |
| Example email | `arup.mondal@example.com` |
| Password | `donor1234` |

The seed also creates three public emergency board posts.

## NPM Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Runs Express and Vite middleware on port 5173 |
| `npm run build` | Creates the production client in `dist/` |
| `npm run preview` | Builds and serves the production app on port 4173 |
| `npm run start` | Serves the existing production build on port 4173 |
| `npm run db:setup` | Applies `server/schema.sql` |
| `npm run db:seed` | Inserts optional demo data |
| `npm test` | Runs focused Node.js tests |
| `npm run lint` | Runs Oxlint |

## Application Routes

| Route | Page |
| --- | --- |
| `/` | Landing page |
| `/find` | Blood and plasma request form and donor results |
| `/request/:publicId` | Private request holds and donation confirmation (same browser session) |
| `/request-response/:token` | Private scheduled donor response page |
| `/honorary-donors` | Public opt-in donors wall (names and confirmed donation counts only) |
| `/beta-disclaimer` | Beta phase, email limitations and support contact |
| `/register` | Donor registration |
| `/login` | Donor sign-in |
| `/forgot-password` | Reset a donor password by email code |
| `/donor` | Donor profile and received requests |
| `/emergency` | Public emergency board |
| `/contact` | Contact details and feedback form |
| `/privacy` | Privacy policy |
| `/terms` | Terms and conditions |
| `/donation-disclaimer` | Donation disclaimer |

## API Overview

| Method | Path | Purpose |
| --- | --- | --- |
| `HEAD` or `GET` | `/api/health` | Database and mail status |
| `HEAD` or `GET` | `/api/process-email-outbox` | Process a bounded batch of queued emails; requires `CRON_SECRET` |
| `HEAD` or `GET` | `/api/process-certificates` | Generate missing donation certificates; requires `CRON_SECRET` |
| `POST` | `/api/register` | Create a donor account and session |
| `POST` | `/api/login` | Sign in a donor |
| `POST` | `/api/forgot-password` | Send a time-limited password reset code |
| `POST` | `/api/reset-password` | Reset a password and revoke existing sessions |
| `POST` | `/api/logout` | End the current session |
| `GET` | `/api/me` | Get the current donor |
| `PATCH` | `/api/me` | Update profile and availability |
| `PATCH` | `/api/me/location` | Set GPS coordinates or re-geocode an address |
| `POST` | `/api/me/password` | Change password |
| `GET` | `/api/me/requests` | List requests sent to the donor |
| `GET` | `/api/me/achievements` | List the signed-in donor's confirmed donation count and certificates |
| `GET` | `/api/me/certificates/:certificateId/download` | Download a certificate owned by the signed-in donor |
| `DELETE` | `/api/me` | Delete the donor account |
| `POST` | `/api/requests/search` | Resolve a request and find eligible donors |
| `POST` | `/api/requests/:publicId/manage` | Read private request management details using its session token |
| `POST` | `/api/requests/:publicId/holds` | Hold an immediate-request donor as primary or backup |
| `DELETE` | `/api/requests/:publicId/holds/:donorId` | Release an immediate-request donor hold |
| `POST` | `/api/requests/:publicId/confirm` | Confirm a donation and start donor recovery |
| `POST` | `/api/requests/scheduled-response` | View or respond to a scheduled request using a private donor token |
| `GET` | `/api/requests/:publicId` | Get a public request summary |
| `GET` | `/api/honorary-donors` | List opted-in donor names and confirmed donation counts only |
| `GET` | `/api/emergency` | List open emergency posts |
| `POST` | `/api/emergency` | Create an emergency post |
| `POST` | `/api/emergency/:publicId/fulfil` | Fulfil a post using its private close token |
| `POST` | `/api/contact` | Store a contact feedback submission |
| `HEAD` or `POST` | `/api/contact/export` | Queue all feedback as a CSV email to the configured project owner; requires `FEEDBACK_EXPORT_SECRET` |

Donor authentication uses an httpOnly `bl_session` cookie with a 30-day lifetime and `SameSite=Lax`. Passwords are hashed with scrypt. Sessions are stored in PostgreSQL, so changing a password or signing out can revoke existing sessions.

Both methods queue a new export email on every call. `HEAD` is supported for UptimeRobot monitors; choose the monitor interval with care to avoid repeated emails.

## Data Model

The main database tables and donor preferences are:

- `donors`
- `sessions`
- `blood_requests`
- `request_notifications`
- `email_outbox` — individual messages queued for background delivery and retry
- `email_credential_state` — quota, cooldown, and pacing state; SMTP passwords remain environment-only
- `request_donor_holds`
- `donation_events`
- `certificates`
- `emergency_posts`
- `contact_feedback`

Expired emergency posts are deleted before each application database query. Scheduled requests expire four hours after their requested time and terminal requests are retained for 30 days. Active donor holds expire at their configured deadline; recovery periods are applied automatically during database cleanup.

See [server/schema.sql](server/schema.sql) for constraints, indexes, and relations.

The schema includes durable outbox scheduling and retry fields, donor hold/recovery fields, request action-token fields, opt-in honorary wall visibility, and per-donation certificate tracking. Reapplying `npm run db:setup` is additive and idempotent; historical BCC outbox records are retained as legacy records rather than being automatically re-queued.

Outgoing mail is queued by the API and delivered by `HEAD /api/process-email-outbox`. Configure a recurring external pinger to call this endpoint with `Authorization: Bearer <CRON_SECRET>`; the worker processes a bounded batch on each call, queues due scheduled-request follow-ups, and creates certificates for confirmed donation events. You can also call `HEAD /api/process-certificates` from a daily pinger; processing is idempotent, so an event receives only one certificate and email. If no Gmail credential is configured, queued messages remain pending and the outbox endpoint returns `503`.

See [docs/uptimerobot-scheduled-jobs.md](docs/uptimerobot-scheduled-jobs.md) for UptimeRobot setup, recommended cadence, authentication, and troubleshooting.

## Deployment

1. Create a Neon Postgres database and enable SSL.
2. Set the environment variables on the host.
3. Run `npm run db:setup` against the production database.
4. Run `npm run build`.
5. Start the app with `npm start`.
6. Set `NODE_ENV=production` when using HTTPS. The session cookie then receives the `Secure` flag.

Emergency posts are removed when their needed time passes. Scheduled blood requests expire four hours after their needed time and are retained for 30 days after reaching a terminal state.

Set `PUBLIC_APP_URL` to the canonical public application origin when deploying outside Vercel so scheduled donor links open the correct site. The navigation BETA badge links to the beta disclaimer, which is also available in the footer.

### Deploying to Vercel

The Vercel deployment serves the Vite frontend and exposes the Express API through functions in `api/`. In the Vercel project settings, add `DATABASE_URL` (and optionally `DATABASE_URL_POOLED`), `CRON_SECRET`, `FEEDBACK_EXPORT_SECRET`, `GMAIL_USER`, and `GMAIL_APP_PASSWORD`; add any configured `GMAIL_BACKUP_n_*` pairs and `GMAIL_DAILY_LIMIT` as needed. Configure `MAIL_FROM` only if the address is a Gmail send-as alias. Use random secrets with at least 16 characters. Add variables to each environment you deploy to, then redeploy.

Before using the app, run `npm run db:setup` once against the same database configured in Vercel. After deployment, visit `/api/health` to check the API and database connection. A `404` on an API route usually means the API function is not included in the deployment. Ensure `DATABASE_URL` is configured; a missing value prevents the API function from starting, while a `503` from `/api/health` indicates the function ran but could not connect to the database.

## Privacy and Safety

- Public emergency posts expose phone numbers and selected location details.
- Close tokens are browser-local secrets for managing emergency posts.
- Donor coordinates are not publicly disclosed.
- Honorary wall visibility is opt-in; the public endpoint returns only the donor name and confirmed donation count.
- Certificate download routes require the donor's authenticated session and only return that donor's own certificate.
- Password reset uses a six-digit email code that expires after 30 minutes and revokes existing sessions.
- Emergency posts can be closed by the browser that created them, are deleted when their requested time passes, and are also removed after 30 days.

Do not use the system to replace professional medical advice, hospital screening, blood-bank procedures, or emergency services.

## Known Limitations

- A registered donor's address may be inaccurate because email ownership is not currently verified.
- Email delivery requires `GMAIL_USER` and a Google App Password in `GMAIL_APP_PASSWORD`.
- The search radius is fixed at 10 km and cannot be adjusted by seekers.
- If geocoding fails, the server rejects the search instead of falling back to a coarse district centroid.
- Demo data is fictional and must not be used for real medical requests.

## Contributing

Contributions are welcome. Before opening a pull request:

1. Fork the repository and create a focused feature branch.
2. Keep changes surgical and preserve existing behaviour.
3. Run `npm run lint` and `npm run build`.
4. Describe the problem, implementation, and verification steps clearly.
5. Add or update focused tests when changing behaviour.

Please avoid submitting sensitive personal or medical data as test fixtures.

## Support

For bugs or feature requests, open a GitHub issue with reproduction steps, screenshots or logs where useful, and the expected behaviour.

For medical emergencies, contact local emergency services or a blood bank directly.

## License

No license is currently declared in this repository. Until a license is added, the repository's default copyright terms apply; please ask the maintainer before redistribution or commercial use.
