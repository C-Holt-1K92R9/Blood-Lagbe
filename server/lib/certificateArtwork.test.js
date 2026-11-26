import test from 'node:test'
import assert from 'node:assert/strict'
import { createCertificateSvg, donationDateLabel } from './certificateArtwork.js'

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
