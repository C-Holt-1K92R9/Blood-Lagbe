import test from 'node:test'
import assert from 'node:assert/strict'
import { inflateSync } from 'node:zlib'
import { createCertificatePdf, createCertificateSvg, donationDateLabel } from './certificateArtwork.js'

test('certificate SVG escapes donor-controlled text and includes the donation date', () => {
  const svg = createCertificateSvg({
    donorName: 'A & <B>',
    donatedAt: '2026-11-25T18:00:00.000Z',
    certificateNumber: 'DK-20261126-ABC123',
  })

  assert.match(svg, /A &amp; &lt;B&gt;/)
  assert.match(svg, /26 November 2026/)
  assert.match(svg, /DK-20261126-ABC123/)
  assert.doesNotMatch(svg, /A & <B>/)
})

test('certificate date formatting rejects invalid dates', () => {
  assert.throws(() => donationDateLabel('not-a-date'), /valid donation date/)
})

test('certificate font size shrinks for the maximum-length donor name', () => {
  const svg = createCertificateSvg({
    donorName: 'D'.repeat(80),
    donatedAt: '2026-11-25T18:00:00.000Z',
    certificateNumber: 'DK-20261126-ABC123',
  })

  assert.match(svg, /font-size="16" font-weight="700">D{80}<\/text>/)
})

test('certificate PDF includes Bengali donor names and has a valid PDF signature', async () => {
  const svg = createCertificateSvg({
    donorName: 'রহিম Uddin',
    donatedAt: '2026-11-25T18:00:00.000Z',
    certificateNumber: 'DK-20261126-ABC123',
  })
  const pdf = await createCertificatePdf(svg)

  assert.equal(pdf.subarray(0, 5).toString('ascii'), '%PDF-')
  assert.match(pdf.subarray(-20).toString('latin1'), /%%EOF/)
  const contents = pdf.toString('latin1')
  assert.equal((contents.match(/\/Type \/Page\b/g) || []).length, 1)
  const pageContent = [...contents.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)]
    .map((match) => inflateSync(Buffer.from(match[1], 'latin1')).toString('latin1'))
    .find((stream) => stream.includes('0.75 0 0 0.75'))
  assert.ok(pageContent)
  const scales = [...pageContent.matchAll(/([\d.]+) 0 0 \1 [\d.]+ [\d.]+ cm/g)].map((match) => Number(match[1]))
  assert.ok(scales.some((scale) => scale > 0.65 && scale < 0.75))
})
