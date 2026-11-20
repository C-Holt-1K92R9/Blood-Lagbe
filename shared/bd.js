/* Bangladesh administrative reference data, shared by the API server and the
   React client so the dropdowns and the server validation never drift apart.
   City coordinates are district centroids, used as a geocoding fallback when
   OpenStreetMap cannot resolve a written address. */

export const DIVISIONS = [
  {
    name: 'Dhaka',
    cities: [
      ['Dhaka', 23.8103, 90.4125],
      ['Gazipur', 23.9999, 90.4203],
      ['Narayanganj', 23.6238, 90.499],
      ['Manikganj', 23.8617, 90.0003],
      ['Munshiganj', 23.5422, 90.5305],
      ['Narsingdi', 23.9322, 90.715],
      ['Tangail', 24.2513, 89.9167],
      ['Kishoreganj', 24.4449, 90.7766],
      ['Faridpur', 23.607, 89.8429],
      ['Madaripur', 23.1641, 90.1897],
      ['Gopalganj', 23.0051, 89.8266],
      ['Rajbari', 23.7574, 89.6445],
      ['Shariatpur', 23.2423, 90.4348],
    ],
  },
  {
    name: 'Chattogram',
    cities: [
      ['Chattogram', 22.3569, 91.7832],
      ['Cox\u2019s Bazar', 21.4272, 92.0058],
      ['Cumilla', 23.4607, 91.1809],
      ['Brahmanbaria', 23.9571, 91.1115],
      ['Chandpur', 23.2333, 90.6712],
      ['Feni', 23.0159, 91.3976],
      ['Noakhali', 22.8696, 91.0995],
      ['Lakshmipur', 22.9447, 90.8282],
      ['Khagrachhari', 23.1193, 91.9847],
      ['Rangamati', 22.6533, 92.1735],
      ['Bandarban', 22.1953, 92.2184],
    ],
  },
  {
    name: 'Rajshahi',
    cities: [
      ['Rajshahi', 24.3745, 88.6042],
      ['Bogura', 24.8465, 89.3773],
      ['Pabna', 24.0064, 89.2372],
      ['Sirajganj', 24.4534, 89.7007],
      ['Natore', 24.4206, 89.0003],
      ['Naogaon', 24.7936, 88.9318],
      ['Chapainawabganj', 24.5965, 88.2775],
      ['Joypurhat', 25.0947, 89.0227],
    ],
  },
  {
    name: 'Khulna',
    cities: [
      ['Khulna', 22.8456, 89.5403],
      ['Jashore', 23.1664, 89.2081],
      ['Satkhira', 22.7185, 89.0705],
      ['Bagerhat', 22.6516, 89.7859],
      ['Kushtia', 23.9013, 89.1206],
      ['Jhenaidah', 23.5449, 89.1539],
      ['Magura', 23.4855, 89.4198],
      ['Meherpur', 23.7622, 88.6318],
      ['Chuadanga', 23.6402, 88.8418],
      ['Narail', 23.1725, 89.5127],
    ],
  },
  {
    name: 'Barishal',
    cities: [
      ['Barishal', 22.701, 90.3535],
      ['Patuakhali', 22.3596, 90.3299],
      ['Bhola', 22.6859, 90.6482],
      ['Pirojpur', 22.5841, 89.972],
      ['Barguna', 22.0953, 90.1121],
      ['Jhalokathi', 22.6406, 90.1987],
    ],
  },
  {
    name: 'Sylhet',
    cities: [
      ['Sylhet', 24.8949, 91.8687],
      ['Moulvibazar', 24.4829, 91.7774],
      ['Habiganj', 24.3745, 91.4155],
      ['Sunamganj', 25.0658, 91.395],
    ],
  },
  {
    name: 'Rangpur',
    cities: [
      ['Rangpur', 25.7439, 89.2752],
      ['Dinajpur', 25.6217, 88.6354],
      ['Gaibandha', 25.3288, 89.528],
      ['Kurigram', 25.8072, 89.6295],
      ['Lalmonirhat', 25.9923, 89.2847],
      ['Nilphamari', 25.9317, 88.856],
      ['Panchagarh', 26.3411, 88.5542],
      ['Thakurgaon', 26.0337, 88.4616],
    ],
  },
  {
    name: 'Mymensingh',
    cities: [
      ['Mymensingh', 24.7471, 90.4203],
      ['Jamalpur', 24.9375, 89.9372],
      ['Netrokona', 24.8709, 90.7279],
      ['Sherpur', 25.0205, 90.0153],
    ],
  },
]

export const DIVISION_NAMES = DIVISIONS.map((d) => d.name)

export function citiesOf(division) {
  const found = DIVISIONS.find((d) => d.name === division)
  return found ? found.cities.map((c) => c[0]) : []
}

export function isKnownCity(division, city) {
  return citiesOf(division).includes(city)
}

export function cityCentroid(division, city) {
  const entry = DIVISIONS.find((d) => d.name === division)
  if (!entry) return null
  const match = entry.cities.find((c) => c[0].toLowerCase() === String(city || '').toLowerCase())
  if (!match) return null
  return { lat: match[1], lng: match[2] }
}
