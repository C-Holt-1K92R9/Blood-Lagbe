import { createRequire } from 'node:module'
import PDFDocument from 'pdfkit'
import SVGtoPDF from 'svg-to-pdfkit'

const XML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

const require = createRequire(import.meta.url)
const BENGALI_FONT_PATH = require.resolve(
  '@fontsource/noto-sans-bengali/files/noto-sans-bengali-bengali-400-normal.woff',
)

function escapeXml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => XML_ESCAPES[char])
}

export function donationDateLabel(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new TypeError('A valid donation date is required to generate a certificate.')
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function createCertificateSvg({ donorName, donatedAt, certificateNumber }) {
  const name = String(donorName || '').trim()
  const number = String(certificateNumber || '').trim()
  if (!name || !number) throw new TypeError('A donor name and certificate number are required.')

  const dateLabel = donationDateLabel(donatedAt)
  const nameFontSize = Math.max(16, Math.min(58, Math.floor(1300 / name.length)))
  const nameMarkup = name.split(/(\p{Script=Bengali}+)/gu).filter(Boolean).map((part) =>
    /^\p{Script=Bengali}/u.test(part)
      ? `<tspan font-family="Noto Sans Bengali">${escapeXml(part)}</tspan>`
      : escapeXml(part),
  ).join('')
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100" viewBox="0 0 1600 1100" role="img" aria-labelledby="title description">
  <title id="title">Donor Koi honorary donor certificate</title>
  <desc id="description">Certificate recognizing ${escapeXml(name)} for a voluntary blood donation on ${escapeXml(dateLabel)}.</desc>
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fffdf7"/>
      <stop offset="1" stop-color="#f6f1e4"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#b9903e"/>
      <stop offset="0.5" stop-color="#ead18a"/>
      <stop offset="1" stop-color="#a77c2e"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="1100" fill="#eee9dc"/>
  <rect x="36" y="36" width="1528" height="1028" rx="18" fill="url(#paper)" stroke="#173b39" stroke-width="4"/>
  <rect x="58" y="58" width="1484" height="984" rx="12" fill="none" stroke="url(#gold)" stroke-width="5"/>
  <path d="M92 150V92h58M1508 150V92h-58M92 950v58h58M1508 950v58h-58" fill="none" stroke="#173b39" stroke-width="5"/>
  <g transform="translate(800 186)">
    <path d="M0-54c-22 28-38 50-38 72a38 38 0 0 0 76 0C38-4 22-26 0-54z" fill="#c9362b"/>
    <circle cy="20" r="13" fill="#fffdf7"/>
  </g>
  <text x="800" y="282" text-anchor="middle" fill="#173b39" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" letter-spacing="9">DONOR KOI</text>
  <text x="800" y="400" text-anchor="middle" fill="#173b39" font-family="Georgia, 'Times New Roman', serif" font-size="70" font-weight="700">Honorary Donor</text>
  <text x="800" y="462" text-anchor="middle" fill="#766b55" font-family="Arial, Helvetica, sans-serif" font-size="27" letter-spacing="3">CERTIFICATE OF APPRECIATION</text>
  <path d="M510 500h580" stroke="url(#gold)" stroke-width="3"/>
  <text x="800" y="574" text-anchor="middle" fill="#4a4b43" font-family="Arial, Helvetica, sans-serif" font-size="28">Presented with gratitude to</text>
  <text x="800" y="680" text-anchor="middle" fill="#a12c27" font-family="Georgia, 'Times New Roman', serif" font-size="${nameFontSize}" font-weight="700">${nameMarkup}</text>
  <text x="800" y="756" text-anchor="middle" fill="#4a4b43" font-family="Arial, Helvetica, sans-serif" font-size="27">In recognition of a voluntary donation on</text>
  <text x="800" y="808" text-anchor="middle" fill="#173b39" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="700">${escapeXml(dateLabel)} · Bangladesh</text>
  <g transform="translate(800 916)">
    <path d="M0-35 9-10 35 0 9 10 0 35-9 10-35 0-9-10z" fill="url(#gold)"/>
  </g>
  <text x="800" y="994" text-anchor="middle" fill="#766b55" font-family="Arial, Helvetica, sans-serif" font-size="17" letter-spacing="2">CERTIFICATE ${escapeXml(number)}</text>
  <text x="800" y="1024" text-anchor="middle" fill="#766b55" font-family="Arial, Helvetica, sans-serif" font-size="15">A community recognition from Donor Koi. Medical eligibility is determined by licensed professionals.</text>
</svg>`
}

export function createCertificatePdf(svg) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 0,
      info: {
        Title: 'Donor Koi honorary donor certificate',
        Author: 'Donor Koi',
      },
    })
    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.once('error', reject)
    doc.once('end', () => resolve(Buffer.concat(chunks)))

    try {
      doc.registerFont('Noto Sans Bengali', BENGALI_FONT_PATH)
      SVGtoPDF(doc, svg, 0, 0, { width: doc.page.width, height: doc.page.height })
      doc.end()
    } catch (error) {
      reject(error)
      doc.destroy()
    }
  })
}
