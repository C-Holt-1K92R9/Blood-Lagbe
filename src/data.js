/* Shared product content for the marketing pages. Live donor and request data
   now comes from the API, not from this file. */

export const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

export const DONATION_TYPES = [
  { value: 'blood', label: 'Blood' },
  { value: 'plasma', label: 'Plasma' },
]

export const DONATION_LABEL = { blood: 'Blood', plasma: 'Plasma' }

export const STATS = [
  { value: '2,847', label: 'Registered donors across 14 districts' },
  { value: '11 min', label: 'Median time to first donor response' },
  { value: '1,312', label: 'Units arranged since the Dhaka pilot began' },
]

export const TESTIMONIALS = [
  {
    quote: 'My father needed AB negative during a bypass at 2 in the morning. Within ten minutes we had two callbacks from donors in Dhanmondi.',
    name: 'Saurabh Chatterjee',
    role: 'Son of a cardiac patient, Dhanmondi',
  },
  {
    quote: 'As a plasma donor I just toggle my availability on and off. Last month I got a request from Ananda Nursing Home in nine minutes and made it in time.',
    name: 'Arup Mondal',
    role: 'Plasma donor, Dhanmondi',
  },
  {
    quote: 'We stopped forwarding screenshots in family groups. The list shows who is actually free today, and we call them straight away.',
    name: 'Nandini Pal',
    role: 'Donor and nurse, Kalabagan',
  },
]

export const FAQS = [
  {
    q: 'Is Donor Koi free for patients and families?',
    a: 'Yes, always. Donor Koi will never charge a seeker, a patient or a family for finding a donor. Donors donate voluntarily and are never paid through the platform. Anyone asking for money in exchange for a blood unit is a red flag — report it and walk away.',
  },
  {
    q: 'Who can donate blood?',
    a: 'In general, healthy adults between 18 and 65 weighing at least 45 kg can donate whole blood, roughly every three to four months depending on the donation type and your hemoglobin level. The doctor or hospital where you donate makes the final call on the day, based on your health check.',
  },
  {
    q: 'How are donors verified on the app?',
    a: 'Every donor creates an account with an email address and a Bangladeshi mobile number, then records their blood group, donation type, city and last donation date. Donation history is self reported for now. We are working with partner hospitals to cross-check records so a donor shown as eligible is genuinely eligible.',
  },
  {
    q: 'What if no donor is available near me?',
    a: 'Every search covers a fixed 10 km around you, then the rest of your city. Donors who donated too recently are hidden until they are eligible again. If nobody is listed, post the request on the emergency board so the wider community can respond, and contact the nearest government blood bank for rare groups like AB negative.',
  },
  {
    q: 'Can I request plasma as well as blood?',
    a: 'Yes. Donors register as either a blood donor or a plasma donor, and you filter the search by what the patient needs. Plasma donations use an apheresis machine and are usually done at a hospital or donation camp, not door to door.',
  },
  {
    q: 'What happens to my personal data?',
    a: 'Seekers see a donor name, blood group, city, distance and email so they can reach out. A phone number appears only on an immediate request, so the family can call directly. Donors can hide themselves or update their location at any time from their own page.',
  },
  {
    q: 'Which cities are covered right now?',
    a: 'The pilot covers Dhaka and 14 neighbouring districts, including Gazipur, Narayanganj, Manikganj and Munshiganj. We are adding districts through 2026. Coverage maps are updated as new donor clusters form.',
  },
  {
    q: 'Does Donor Koi replace the hospital blood bank?',
    a: 'No. In an emergency, go to the nearest hospital first — 999 ambulance or straight to the casualty. Donor Koi works alongside the system to reach voluntary donors fast, but transfusion always happens at a licensed blood bank or hospital under medical supervision.',
  },
]
