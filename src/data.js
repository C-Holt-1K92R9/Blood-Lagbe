/* Sample prototype data. All names, numbers, partners and phone numbers are
   fictional and exist for design review only. Replace with real data at launch.
   Context: Dhaka, Bangladesh. Distances in km. */

export const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

export const COMPONENTS = ['Whole blood', 'Platelets', 'Plasma']

// Deterministic sample donors around central Dhaka. Distances in km.
export const DONORS = [
  { id: 'bl-1042', name: 'Arup Mondal', group: 'O+', area: 'Dhanmondi', km: 0.8, lastDonation: 'March 2026', available: true, components: ['Whole blood', 'Platelets'], phone: '+880 1712 304 112', donations: 7 },
  { id: 'bl-0987', name: 'Rituparna Sen', group: 'A+', area: 'Lalmatia', km: 1.6, lastDonation: 'January 2026', available: true, components: ['Whole blood'], phone: '+880 1819 220 884', donations: 3 },
  { id: 'bl-0231', name: 'Soumyajit Roy', group: 'O-', area: 'Mohammadpur', km: 2.3, lastDonation: 'November 2025', available: true, components: ['Whole blood', 'Platelets', 'Plasma'], phone: '+880 1631 447 590', donations: 12 },
  { id: 'bl-0319', name: 'Debashree Ghosh', group: 'B+', area: 'Hazaribagh', km: 3.1, lastDonation: 'June 2026', available: false, components: ['Whole blood'], phone: '+880 1915 623 040', donations: 2 },
  { id: 'bl-1154', name: 'Imran Sheikh', group: 'B-', area: 'New Market', km: 1.1, lastDonation: 'February 2026', available: true, components: ['Whole blood', 'Plasma'], phone: '+880 1731 782 519', donations: 5 },
  { id: 'bl-0764', name: 'Poulami Chakraborty', group: 'AB+', area: 'Banani', km: 6.4, lastDonation: 'April 2026', available: true, components: ['Whole blood', 'Platelets'], phone: '+880 1828 430 627', donations: 9 },
  { id: 'bl-0508', name: 'Aniket Biswas', group: 'O+', area: 'Jigatola', km: 4.2, lastDonation: 'August 2025', available: true, components: ['Whole blood'], phone: '+880 1640 987 231', donations: 4 },
  { id: 'bl-0411', name: 'Nandini Pal', group: 'A-', area: 'Kalabagan', km: 2.7, lastDonation: 'May 2026', available: true, components: ['Whole blood', 'Plasma'], phone: '+880 1754 062 847', donations: 6 },
  { id: 'bl-0296', name: 'Rohit Dey', group: 'AB-', area: 'Motijheel', km: 7.9, lastDonation: 'December 2025', available: false, components: ['Whole blood', 'Platelets'], phone: '+880 1890 213 694', donations: 8 },
  { id: 'bl-0873', name: 'Meghna Kundu', group: 'B+', area: 'Panthapath', km: 1.9, lastDonation: 'July 2026', available: true, components: ['Whole blood', 'Platelets', 'Plasma'], phone: '+880 1611 580 342', donations: 11 },
]

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
    quote: 'As a platelet donor I just toggle my availability on and off. Last month I got a request from Ananda Nursing Home in nine minutes and made it in time.',
    name: 'Arup Mondal',
    role: 'Platelet donor, Dhanmondi',
  },
  {
    quote: 'We stopped forwarding screenshots in family groups. The list shows who is actually free today, and we call them straight away.',
    name: 'Nandini Pal',
    role: 'Donor and nurse, Kalabagan',
  },
]

export const FAQS = [
  {
    q: 'Is Blood Lagbe free for patients and families?',
    a: 'Yes, always. Blood Lagbe will never charge a seeker, a patient or a family for finding a donor. Donors donate voluntarily and are never paid through the platform. Anyone asking for money in exchange for a blood unit is a red flag — report it and walk away.',
  },
  {
    q: 'Who can donate blood?',
    a: 'In general, healthy adults between 18 and 65 weighing at least 45 kg can donate whole blood, roughly every three to four months depending on the donation type and your hemoglobin level. The doctor or hospital where you donate makes the final call on the day, based on your health check.',
  },
  {
    q: 'How are donors verified on the app?',
    a: 'Every donor registers with a phone number verified by OTP, along with blood group, last donation date and area. In this release, donation history is self reported. We are working with partner hospitals to cross-check donation records so a donor shown as eligible is genuinely eligible.',
  },
  {
    q: 'What if no donor is available near me?',
    a: 'Widen the radius filter to 5 or 10 km, or send a request blast. A blast notifies every matching, available donor in range at once; the first to accept is connected to you. For rare groups like AB negative, also contact the nearest government blood bank — the app shows contact numbers alongside donors.',
  },
  {
    q: 'Can I request platelets or plasma, not just whole blood?',
    a: 'Yes. Each donor lists what they can give: whole blood, platelets or plasma. Filter by component in the search. Note that platelet and plasma donations use apheresis machines and are usually done at a hospital or donation camp, not door to door.',
  },
  {
    q: 'What happens to my personal data?',
    a: 'Seekers see only a donor first name, blood group, area and distance — never a home address or full phone number until a donor accepts your request. Donor locations are rounded to the nearest area, not pinpointed. Delete your account and data anytime from your profile, or email privacy@bloodlagbe.com.bd.',
  },
  {
    q: 'Which cities are covered right now?',
    a: 'The pilot covers Dhaka and 14 neighbouring districts, including Gazipur, Narayanganj, Manikganj and Munshiganj. We are adding districts through 2026. Coverage maps are updated as new donor clusters form.',
  },
  {
    q: 'Does Blood Lagbe replace the hospital blood bank?',
    a: 'No. In an emergency, go to the nearest hospital first — 999 ambulance or straight to the casualty. Blood Lagbe works alongside the system to reach voluntary donors fast, but transfusion always happens at a licensed blood bank or hospital under medical supervision.',
  },
]
