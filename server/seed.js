/* Demo data for local review. Every email uses example.com and every phone
   number is fictional. Run with `npm run db:seed`. Skips itself if donors
   already exist. */
import { projectRoot } from './env.js'
import { pool, query } from './db.js'
import { hashPassword } from './lib/auth.js'

void projectRoot

const DEMO_PASSWORD = 'donor1234'
const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)

const donors = [
  ['Arup Mondal', 'arup.mondal@example.com', '+8801712304112', 'O+', 'blood', null, 'Dhaka', 'Dhaka', 'Road 8, Dhanmondi, near Jigatola bus stand', 23.7465, 90.376],
  ['Rituparna Sen', 'rituparna.sen@example.com', '+8801819220884', 'A+', 'blood', daysAgo(150), 'Dhaka', 'Dhaka', 'Block C, Lalmatia, Mohammadpur', 23.7557, 90.3729],
  ['Soumyajit Roy', 'soumyajit.roy@example.com', '+8801631447590', 'O-', 'blood', daysAgo(210), 'Dhaka', 'Dhaka', 'Ring Road, Mohammadpur', 23.7639, 90.3582],
  ['Imran Sheikh', 'imran.sheikh@example.com', '+8801731782519', 'B-', 'plasma', daysAgo(64), 'Dhaka', 'Dhaka', 'New Market, Azimpur Road', 23.7335, 90.3845],
  ['Meghna Kundu', 'meghna.kundu@example.com', '+8801611580342', 'B+', 'blood', daysAgo(120), 'Dhaka', 'Dhaka', 'Panthapath, near Square Hospital', 23.7519, 90.3933],
  ['Poulami Chakraborty', 'poulami.chakraborty@example.com', '+8801828430627', 'AB+', 'blood', daysAgo(96), 'Dhaka', 'Dhaka', 'Road 11, Banani', 23.7936, 90.4044],
  ['Nandini Pal', 'nandini.pal@example.com', '+8801754062847', 'A-', 'plasma', daysAgo(45), 'Dhaka', 'Dhaka', 'Kalabagan, near Dhanmondi 27', 23.7509, 90.3825],
  ['Aniket Biswas', 'aniket.biswas@example.com', '+8801640987231', 'O+', 'blood', daysAgo(200), 'Dhaka', 'Dhaka', 'Jigatola, Hazaribagh Road', 23.7382, 90.3739],
  ['Farhana Islam', 'farhana.islam@example.com', '+8801915623040', 'O+', 'blood', daysAgo(24), 'Dhaka', 'Dhaka', 'Sector 4, Uttara', 23.8759, 90.3795],
  ['Tanvir Ahmed', 'tanvir.ahmed@example.com', '+8801890213694', 'AB-', 'blood', daysAgo(300), 'Dhaka', 'Dhaka', 'Motijheel, near Shapla Chattar', 23.7287, 90.4175],
  ['Sabrina Haque', 'sabrina.haque@example.com', '+8801521347890', 'B+', 'plasma', daysAgo(20), 'Dhaka', 'Dhaka', 'Gulshan 2, near police plaza', 23.7806, 90.4156],
  ['Rafiq Hasan', 'rafiq.hasan@example.com', '+8801733991204', 'A+', 'blood', daysAgo(140), 'Dhaka', 'Dhaka', 'Mirpur 10, roundabout', 23.8223, 90.3654],
  ['Sharmin Akter', 'sharmin.akter@example.com', '+8801867442109', 'O-', 'blood', daysAgo(180), 'Dhaka', 'Narayanganj', 'Chashara, Narayanganj', 23.6238, 90.499],
  ['Jubayer Karim', 'jubayer.karim@example.com', '+8801677112456', 'B+', 'blood', daysAgo(75), 'Dhaka', 'Gazipur', 'Board Bazar, Gazipur', 23.9999, 90.4203],
  ['Nusrat Jahan', 'nusrat.jahan@example.com', '+8801955338120', 'AB+', 'plasma', daysAgo(33), 'Chattogram', 'Chattogram', 'Agrabad, Chattogram', 22.3569, 91.7832],
]

const emergency = [
  ['Rezaul Karim', '+8801711223344', 'AB-', 'blood', 'Dhaka', 'Dhaka', 'Dhaka Medical College Hospital, Bakshi Bazar', 18, 'Patient in ICU, platelet count low. Family is at the gate.'],
  ['Moushumi Sultana', '+8801811998877', 'O+', 'blood', 'Dhaka', 'Narayanganj', '300 bed hospital, Chashara', 30, 'Caesarean scheduled, two units requested by the doctor.'],
  ['Abdul Halim', '+8801911445566', 'B+', 'plasma', 'Khulna', 'Khulna', 'Khulna Medical College Hospital', null, 'Plasma needed for a dengue patient. Please call before visiting.'],
]

const existing = await query('select count(*)::int as count from donors')
if (existing.rows[0].count > 0) {
  console.log(`Seed skipped: ${existing.rows[0].count} donors already exist.`)
  await pool.end()
  process.exit(0)
}

const passwordHash = hashPassword(DEMO_PASSWORD)

for (const [name, email, phone, bloodGroup, donationType, lastDonated, division, city, addressText, lat, lng] of donors) {
  await query(
    `insert into donors
       (name, email, phone, password_hash, blood_group, donation_type, last_donated,
        division, city, address_text, lat, lng, location_source, available, varified)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'gps',true,true)`,
    [name, email, phone, passwordHash, bloodGroup, donationType, lastDonated, division, city, addressText, lat, lng],
  )
}

const { rows } = await query('select id, name, email from donors order by created_at limit 1')
for (const [i, [name, phone, bloodGroup, needType, division, city, addressText, hoursAhead, note]] of emergency.entries()) {
  await query(
    `insert into emergency_posts
       (public_id, name, phone, blood_group, need_type, division, city, address_text, needed_at, note)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      `EMR-2026-DEMO${i + 1}`,
      name,
      phone,
      bloodGroup,
      needType,
      division,
      city,
      addressText,
      hoursAhead === null ? null : new Date(Date.now() + hoursAhead * 3_600_000).toISOString(),
      note,
    ],
  )
}

console.log(`Seeded ${donors.length} donors and ${emergency.length} emergency posts.`)
console.log(`Demo donor sign in: ${rows[0].email} / ${DEMO_PASSWORD}`)
await pool.end()
