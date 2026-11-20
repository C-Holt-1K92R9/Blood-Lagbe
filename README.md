# Blood Lagbe

Find blood and plasma donors near you in minutes. Blood Lagbe connects families in Bangladesh with registered, available donors, and gives the community a public emergency board when nobody in the network matches. Always free for seekers.

## Stack

- **Client:** React 19, Vite, Tailwind CSS 3, Phosphor icons, HashRouter
- **API:** Express 5 running in the same process (`server/`)
- **Database:** Neon Postgres (`server/schema.sql`)
- **Geocoding:** OpenStreetMap Nominatim, with district centroids as a fallback
- **Email:** Resend when `RESEND_API_KEY` is set, otherwise every message is recorded in `email_outbox`

## Run it

```bash
npm install

npm run db:setup     # create tables (safe to re-run)
npm run db:seed      # optional demo donors + emergency posts

npm run dev          # API + Vite dev server on http://localhost:5173
# or
npm run build
npm run preview      # production build + API on http://localhost:4173
```

Copy `.env.example` to `.env` and fill in `DATABASE_URL` (pooled Neon connection string). `.env` is gitignored.

### Demo accounts

`npm run db:seed` inserts 15 fictional donors across Dhaka and Chattogram (all `@example.com`) and three board posts. Every demo donor uses the password `donor1234`. Example: `arup.mondal@example.com` / `donor1234`.

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Express + Vite middleware, port 5173 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serves `dist/` and the API on port 4173 |
| `npm run start` | Same as preview, for a real host |
| `npm run db:setup` | Applies `server/schema.sql` |
| `npm run db:seed` | Inserts demo data if the donor table is empty |
| `npm run lint` | Oxlint |

## Routes

| Route | Page |
| --- | --- |
| `/` | Landing |
| `/find` | Request form, 10 km search, donor results |
| `/register` | Donor account creation |
| `/login` | Donor sign in |
| `/donor` | Donor profile, availability, location, requests received |
| `/emergency` | Public emergency board |
| `/privacy`, `/terms` | Legal |

## How matching works

1. A seeker picks a blood group, blood or plasma, immediate or later, then enters their own name, phone, address, division, city, an optional email for a receipt and (optionally) GPS.
2. The server resolves the search origin: GPS if given, otherwise Nominatim on the written address (trying the full address, then the city and division). If neither produces a real fix, the search is rejected rather than run from a coarse district centroid; donor registration can still fall back to the centroid for display purposes.
3. The query returns eligible donors **within 10 km first**, then eligible donors **elsewhere in the same city**, each group sorted by distance.
4. A donor is eligible only when they are marked available **and** past the waiting period: **90 days** after blood, **28 days** after plasma. Recent donors are hidden automatically. Calendar dates and scheduled times are handled in **Asia/Dhaka**.
5. **Immediate:** results include the donor's phone number and a `tel:` call button. The requester also gets a receipt email if they shared an address.
6. **Later:** the request is saved, every matched donor (up to 25) gets an email with the requester's name, phone, address and schedule, and the requester gets a receipt with the reference.

Search radius is fixed at 10 km; there is no radius input. Scheduled times from the browser's `datetime-local` input are interpreted as Bangladesh time (`UTC+06:00`), so the stored instant does not depend on the server's timezone.

## Emergency board

The board is the fallback when no registered donor matches. Anyone can post a request with the patient's blood group, component, address, contact number and an optional note; the post is public and includes a call button. Creating a post also returns a private close token, stored only in the poster's browser. The "Your posts from this browser" list uses that token to close the post once the patient is helped. Phone numbers are public, so they are never sufficient to close someone else's post.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Database and mail mode |
| `POST` | `/api/register` | Create donor account, starts a session |
| `POST` | `/api/login` | Donor sign in |
| `POST` | `/api/logout` | End session |
| `GET` | `/api/me` | Current donor |
| `PATCH` | `/api/me` | Update profile, availability, last donation, address |
| `PATCH` | `/api/me/location` | Set GPS or re-geocode the saved address |
| `POST` | `/api/me/password` | Change password |
| `GET` | `/api/me/requests` | Requests emailed to this donor |
| `DELETE` | `/api/me` | Delete the account |
| `POST` | `/api/requests/search` | Search donors and create the request |
| `GET` | `/api/requests/:publicId` | Request summary |
| `GET` | `/api/emergency` | Open board posts |
| `POST` | `/api/emergency` | Add a board post |
| `POST` | `/api/emergency/:publicId/fulfil` | Close a post with its private close token |

Auth uses an httpOnly session cookie (`bl_session`, 30 days, SameSite=Lax). Passwords are hashed with scrypt. Sessions live in the `sessions` table, so signing out or changing a password revokes them.

## Data model

`donors`, `sessions`, `blood_requests`, `request_notifications`, `email_outbox`, `emergency_posts`. See `server/schema.sql`.

## Deployment notes

- Set `NODE_ENV=production` on an HTTPS host so the session cookie gets the `Secure` flag. Local HTTP preview intentionally runs without it.
- Set `PORT` if the host does not provide one. The default is 4173 for `start`/`preview` and 5173 for dev.
- Run `npm run db:setup` once against the production database.
- Add `RESEND_API_KEY` and a verified `MAIL_FROM`. Without them, the API records messages in `email_outbox` and reports them as queued.
- The map on `/find` is a stylised SVG. Distances are real; pin angles are illustrative so precise donor coordinates are never exposed.

## Known limits

- No email verification or OTP yet, so a donor can register with an address they do not own.
- No forgotten-password flow yet; a signed-in donor can change a password from their page, which signs out other devices.
- Emergency posts stay open until the poster closes them from the board; there is no automatic expiry. Closing requires the browser that created the post, because the close token is stored locally.
- Receipt and donor emails need `RESEND_API_KEY` to leave the server. Without it they are recorded in `email_outbox` and the UI says so.
