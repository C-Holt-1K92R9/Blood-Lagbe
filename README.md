# Blood Lagbe

**A fast, community-focused blood and plasma donor finder for Bangladesh.**

Blood Lagbe helps people find registered and available donors by blood group and location. Seekers can make immediate or scheduled requests, while a public emergency board provides another way to ask for help when no registered donor is available.

The project is free for seekers and designed to keep the search process simple: enter the need, verify the location, view eligible matches, and contact a donor directly or notify them by email.

> [!IMPORTANT]
> This project is a community support tool, not a medical or emergency service. For a life-threatening emergency in Bangladesh, call **999** first.

## Features

- Search for blood or plasma donors in nearby locations
- Filter by blood group, need type, timing, division, city, and address
- Match within a fixed 10 km radius before checking the rest of the selected city
- Respect blood and plasma donation waiting periods
- Contact immediate matches directly by phone
- Email scheduled requests to eligible donors
- Register and manage a donor profile
- Update availability and record the latest donation
- Post and close public emergency requests
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
6. Immediate requests expose matching phone numbers for direct calls. Scheduled requests are saved and emailed to up to 25 matched donors.

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
| Email | Resend, with database-backed fallback |

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

Set `DATABASE_URL` and, optionally, `DATABASE_URL_POOLED` in `.env`.

### Database Setup

```bash
npm run db:setup
npm run db:seed
```

`db:setup` safely re-applies `server/schema.sql`. `db:seed` is optional and only adds demo data when the donor table is empty.

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
| `DATABASE_URL` | Yes | Neon pooled PostgreSQL connection string |
| `DATABASE_URL_POOLED` | Optional | Pooled database connection used by database helpers |
| `RESEND_API_KEY` | Optional | Enables Resend email delivery |
| `MAIL_FROM` | Optional | Verified sender address shown in outgoing mail |
| `CRON_SECRET` | Required on Vercel | Protects the scheduled emergency-board cleanup endpoint |
| `PORT` | Optional | Server port; defaults to 5173 in development and 4173 in production |
| `NODE_ENV` | Optional | Set to `production` for secure production cookies and static serving |

Copy `.env.example` to `.env` and keep `.env` private. Without a Resend API key, mail is recorded in the `email_outbox` table and the interface reports it as queued.

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
| `npm run lint` | Runs Oxlint |

## Application Routes

| Route | Page |
| --- | --- |
| `/` | Landing page |
| `/find` | Blood and plasma request form and donor results |
| `/register` | Donor registration |
| `/login` | Donor sign-in |
| `/donor` | Donor profile and received requests |
| `/emergency` | Public emergency board |
| `/privacy` | Privacy policy |
| `/terms` | Terms of use |

## API Overview

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Database and mail status |
| `GET` | `/api/cleanup-board` | Delete emergency board posts older than 30 days; requires `CRON_SECRET` |
| `POST` | `/api/register` | Create a donor account and session |
| `POST` | `/api/login` | Sign in a donor |
| `POST` | `/api/logout` | End the current session |
| `GET` | `/api/me` | Get the current donor |
| `PATCH` | `/api/me` | Update profile and availability |
| `PATCH` | `/api/me/location` | Set GPS coordinates or re-geocode an address |
| `POST` | `/api/me/password` | Change password |
| `GET` | `/api/me/requests` | List requests sent to the donor |
| `DELETE` | `/api/me` | Delete the donor account |
| `POST` | `/api/requests/search` | Resolve a request and find eligible donors |
| `GET` | `/api/requests/:publicId` | Get a public request summary |
| `GET` | `/api/emergency` | List open emergency posts |
| `POST` | `/api/emergency` | Create an emergency post |
| `POST` | `/api/emergency/:publicId/fulfil` | Fulfil a post using its private close token |

Donor authentication uses an httpOnly `bl_session` cookie with a 30-day lifetime and `SameSite=Lax`. Passwords are hashed with scrypt. Sessions are stored in PostgreSQL, so changing a password or signing out can revoke existing sessions.

## Data Model

The main database tables are:

- `donors`
- `sessions`
- `blood_requests`
- `request_notifications`
- `email_outbox`
- `emergency_posts`

See [server/schema.sql](server/schema.sql) for constraints, indexes, and relations.

## Deployment

1. Create a Neon Postgres database and enable SSL.
2. Set the environment variables on the host.
3. Run `npm run db:setup` against the production database.
4. Run `npm run build`.
5. Start the app with `npm start`.
6. Set `NODE_ENV=production` when using HTTPS. The session cookie then receives the `Secure` flag.

Emergency board posts older than 30 days are removed once per day by the Vercel scheduled cleanup.

### Deploying to Vercel

The Vercel deployment serves the Vite frontend and exposes the Express API through functions in `api/`. In the Vercel project settings, add `DATABASE_URL` (and optionally `DATABASE_URL_POOLED`), `CRON_SECRET`, plus `RESEND_API_KEY` and `MAIL_FROM` if email delivery is required. Use a random `CRON_SECRET` with at least 16 characters. Add variables to each environment you deploy to, then redeploy.

Before using the app, run `npm run db:setup` once against the same database configured in Vercel. After deployment, visit `/api/health` to check the API and database connection. A `404` on an API route usually means the API function is not included in the deployment. Ensure `DATABASE_URL` is configured; a missing value prevents the API function from starting, while a `503` from `/api/health` indicates the function ran but could not connect to the database.

## Privacy and Safety

- Public emergency posts expose phone numbers and selected location details.
- Close tokens are browser-local secrets for managing emergency posts.
- Donor coordinates are not publicly disclosed.
- No email verification or OTP is currently implemented.
- There is no forgotten-password flow. Signed-in users can change their password from the donor page.
- Emergency posts can be closed by the browser that created them and are automatically deleted after 30 days.

Do not use the system to replace professional medical advice, hospital screening, blood-bank procedures, or emergency services.

## Known Limitations

- A registered donor's address may be inaccurate because email ownership is not currently verified.
- Email delivery requires `RESEND_API_KEY` and a verified `MAIL_FROM`.
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
