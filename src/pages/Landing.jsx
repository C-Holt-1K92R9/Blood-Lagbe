import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  Broadcast,
  CheckCircle,
  HandHeart,
  Drop,
  MagnifyingGlass,
  MapPin,
  PhoneCall,
  Quotes,
  X,
  Siren,
} from '@phosphor-icons/react'
import Reveal from '../components/Reveal.jsx'
import TaglineReveal from '../components/TaglineReveal.jsx'
import { FAQS, STATS, TESTIMONIALS } from '../data.js'
import { useState } from 'react'

const HERO_DONORS = [
  { name: 'Arup Mondal', area: 'Dhanmondi', km: '0.8', group: 'O+', initials: 'AM' },
  { name: 'Imran Sheikh', area: 'New Market', km: '1.1', group: 'B-', initials: 'IS' },
  { name: 'Soumyajit Roy', area: 'Mohakhali', km: '2.3', group: 'O-', initials: 'SR' },
]

function BloodChip({ group, size = 'md' }) {
  const pad = size === 'sm' ? 'h-7 min-w-7 px-1.5 text-[11px]' : 'h-8 min-w-8 px-2 text-xs'
  return (
    <span
      className={`button-xsm inline-flex items-center justify-center rounded-md bg-brand-soft font-mono text-brand-hover ${pad}`}
    >
      {group}
    </span>
  )
}

export default function Landing() {
  const location = useLocation()
  const [openFaq, setOpenFaq] = useState(0)

  useEffect(() => {
    if (location.hash === '#faq') {
      const t = setTimeout(() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }), 80)
      return () => clearTimeout(t)
    }
    return undefined
  }, [location.hash])

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden border-b border-line pt-28 sm:pt-32">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 sm:px-8 sm:pb-24 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-2 pr-4">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping-ring rounded-full bg-brand" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-solid" />
              </span>
              <span className="caption-3 text-mute">Dhaka pilot is live</span>
            </div>

            <h1 className="heading-1 heading-gradient mt-6 max-w-hero">
              <span className="block">Blood donors</span>
              <span className="block">near you, in minutes</span>
            </h1>

            <p className="body-3 mt-6 max-w-hero text-mute md:text-lg md:leading-7">
              Blood Lagbe connects families in an emergency with registered donors across your city. Pick a blood
              group, see who is nearby and available, and call them directly.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/find"
                className="button-lg group inline-flex items-center gap-2 rounded-2xl bg-brand-solid px-6 py-3 text-onbrand transition-all duration-300 ease-out hover:bg-brand-solid-hover active:scale-[0.98]"
              >
                Find blood now
                <ArrowRight size={20} weight="bold" className="transition-transform duration-500 ease-out group-hover:translate-x-1" />
              </Link>
              <p className="caption-2 text-faint">No signup needed to search</p>
            </div>

            {/* proof line */}
            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-2.5" aria-hidden="true">
                {['AM', 'SR', 'RS', 'IG'].map((init, i) => (
                  <span
                    key={i}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-base bg-raised-2 caption-4 text-mute"
                  >
                    {init}
                  </span>
                ))}
              </div>
              <p className="caption-1 max-w-[220px] text-mute">
                <span className="font-semibold text-strong">2,847 donors</span> across 14 districts, ready to answer
              </p>
            </div>
          </div>

          {/* hero visual: the product itself */}
          <div className="relative lg:col-span-5" aria-hidden="true">
            <div className="relative mx-auto max-w-sm rounded-2xl border border-line bg-raised p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <p className="caption-4 text-faint">Available now, within 5 km</p>
                  <p className="title-4 mt-0.5">3 O+ donors near Dhanmondi</p>
                </div>
                <BloodChip group="O+" />
              </div>
              <ul className="mt-2 divide-y divide-line">
                {HERO_DONORS.map((d) => (
                  <li key={d.name} className="flex items-center gap-3 py-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lifted caption-3 text-mute">
                      {d.initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="title-4 block truncate">{d.name}</span>
                      <span className="caption-5 block text-faint">{d.area}</span>
                    </span>
                    <span className="font-mono text-xs text-mute">{d.km} km</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-brand-solid py-3">
                <PhoneCall size={18} weight="bold" className="text-onbrand" />
                <span className="button-sm text-onbrand">Call Arup Mondal</span>
              </div>
            </div>

            {/* floating toast */}
            <div className="absolute -left-2 top-6 w-56 animate-float-y rounded-2xl border border-line bg-raised p-3 shadow-[var(--shadow-card)] sm:-left-8">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} weight="fill" className="text-good" />
                <p className="caption-3 text-strong">Request accepted</p>
              </div>
              <p className="caption-5 mt-1.5 text-mute">Soumyajit Roy confirmed, heading to Ananda Nursing Home</p>
              <p className="caption-5 mt-1 text-faint">2 min ago</p>
            </div>

            {/* floating distance badge */}
            <div
              className="absolute -right-1 bottom-16 animate-float-y rounded-2xl border border-line bg-raised px-4 py-2.5 shadow-[var(--shadow-card)] sm:-right-6"
              style={{ animationDelay: '900ms' }}
            >
              <div className="flex items-center gap-2">
                <MapPin size={16} weight="fill" className="text-brand" />
                <p className="font-mono text-sm text-strong">2.3 km</p>
              </div>
              <p className="caption-5 text-faint">away, 4 min ride</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- STATS STRIP ---------------- */}
      <section className="border-b border-line bg-surface">
        <dl className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-line px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1 py-8 text-center sm:px-6">
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-mono text-2xl font-semibold text-strong md:text-3xl">{s.value}</dd>
              <dd className="caption-2 max-w-[26ch] text-mute">{s.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------------- PROBLEM → SOLUTION ---------------- */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:px-8 sm:py-28">
        <Reveal className="max-w-hero">
          <p className="caption-3 uppercase tracking-widest text-brand">Why it exists</p>
          <h2 className="heading-2 mt-4">Stop forwarding screenshots. See who is ready today.</h2>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <Reveal className="rounded-2xl border border-line bg-surface p-6 sm:p-8" delay={0}>
            <p className="title-2 text-mute">The 2 am group chat</p>
            <ul className="mt-6 space-y-4">
              {[
                'Forwards reach hundreds of people and three already moved cities',
                'No way to know who is healthy, eligible and actually available today',
                'Repeated pings at dawn, then silence — while the patient waits',
                'Blood group details copied by hand, errors slip in',
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <X size={18} weight="bold" className="mt-0.5 shrink-0 text-faint" aria-hidden="true" />
                  <span className="body-6 text-mute">{line}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="rounded-2xl border border-line bg-raised p-6 sm:p-8" delay={120}>
            <p className="title-2">One search, live answers</p>
            <ul className="mt-6 space-y-4">
              {[
                'Donors toggle availability, so you only see people who can give now',
                'Sorted by distance to the hospital, with last donation date shown',
                'Call or request in one tap, no coordinator in between',
                'Rare groups trigger a blast to every matching donor in range',
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-good" aria-hidden="true" />
                  <span className="body-6 text-strong">{line}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ---------------- BENEFITS ---------------- */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 sm:py-28">
          <Reveal className="max-w-hero">
            <p className="caption-3 uppercase tracking-widest text-brand">What you get</p>
            <h2 className="heading-2 mt-4">Built for the worst hour of your life</h2>
          </Reveal>

          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            {[
              {
                icon: MagnifyingGlass,
                title: 'Match by blood group in seconds',
                body: 'Filter by group, component and distance instead of scrolling a chat full of stale forwards.',
              },
              {
                icon: PhoneCall,
                title: 'Reach donors directly',
                body: 'Tap call or tap request. The donor confirms, and you are both on the same page immediately.',
              },
              {
                icon: Broadcast,
                title: 'See who is actually available',
                body: 'Donors flip their availability on and off, so results reflect today, not last Diwali camp.',
              },
              {
                icon: HandHeart,
                title: 'Always free for seekers',
                body: 'No fees, no commissions, no donations paid. Blood Lagbe never charges a patient’s family.',
              },
            ].map(({ icon: Icon, title, body }) => (
              <Reveal key={title} className="bg-raised p-6 sm:p-8" delay={80}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft">
                  <Icon size={22} weight="regular" className="text-brand" aria-hidden="true" />
                </div>
                <p className="title-2 mt-5"><strong>{title}</strong></p>
                <p className="body-6 mt-2 text-mute">{body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- TAGLINE REVEAL (B11) ---------------- */}
      <section className="bg-[#131209] px-6 py-24 text-center sm:px-8 sm:py-32" style={{ '--text': '#ffffff' }}>
        <TaglineReveal
          text="One message, three taps, a donor already on the way."
          className="mx-auto max-w-hero text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl md:leading-none"
        />
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section id="how" className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 sm:py-28">
          <Reveal className="max-w-hero">
            <p className="caption-3 uppercase tracking-widest text-brand">How it works</p>
            <h2 className="heading-2 mt-4">From emergency to donation in three steps</h2>
          </Reveal>

          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              {
                n: '01',
                title: 'Pick blood group and area',
                body: 'Choose the group and component, then set your location or use your current position.',
                visual: (
                  <div className="mt-5 flex flex-wrap gap-2" aria-hidden="true">
                    {['O+', 'A+', 'B+', 'O-', 'AB+'].map((g) => (
                      <BloodChip key={g} group={g} size="sm" />
                    ))}
                  </div>
                ),
              },
              {
                n: '02',
                title: 'See donors sorted by distance',
                body: 'Available donors appear with area, distance and last donation date. No stale lists.',
                visual: (
                  <div className="mt-5 space-y-2" aria-hidden="true">
                    {HERO_DONORS.slice(0, 2).map((d) => (
                      <div key={d.name} className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2">
                        <span className="caption-4 text-mute">{d.name}</span>
                        <span className="font-mono text-xs text-faint">{d.km} km</span>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                n: '03',
                title: 'Call or request in one tap',
                body: 'The donor confirms by phone, shares an ETA and heads to the hospital with you.',
                visual: (
                  <div className="mt-5 flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5" aria-hidden="true">
                    <PhoneCall size={18} weight="bold" className="text-good" />
                    <span className="caption-4 text-mute">Arup accepted, 4 min away</span>
                  </div>
                ),
              },
            ].map((step) => (
              <Reveal as="li" key={step.n} className="rounded-2xl border border-line bg-raised p-6 sm:p-8" delay={Number(step.n) * 90}>
                <span className="font-mono text-sm text-faint">{step.n}</span>
                <p className="title-1 mt-3">{step.title}</p>
                <p className="body-6 mt-2 text-mute">{step.body}</p>
                {step.visual}
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------- PROOF / TESTIMONIALS ---------------- */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 sm:py-28">
          <Reveal className="max-w-hero">
            <p className="caption-3 uppercase tracking-widest text-brand">From the pilot</p>
            <h2 className="heading-2 mt-4">Families who found blood in time</h2>
          </Reveal>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <Reveal key={t.name} className="flex flex-col rounded-2xl border border-line bg-raised p-6" delay={100}>
                <Quotes size={26} weight="fill" className="text-brand" aria-hidden="true" />
                <blockquote className="body-3 mt-4 text-strong">“{t.quote}”</blockquote>
                <div className="mt-auto flex items-center gap-3 pt-6">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lifted caption-3 text-mute">
                    {t.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </span>
                  <span>
                    <span className="title-4 block">{t.name}</span>
                    <span className="caption-5 text-faint">{t.role}</span>
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="caption-5 mt-6 text-faint">Stories from the pilot cohort. Details generalized for privacy.</p>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section id="faq" className="scroll-mt-24 border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 sm:px-8 sm:py-28 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="caption-3 uppercase tracking-widest text-brand">Questions</p>
            <h2 className="heading-3 mt-4">Before you search</h2>
            <p className="body-6 mt-4 text-mute">
              Still stuck? Write to{' '}
              <a className="font-medium text-strong underline decoration-line underline-offset-4 hover:decoration-brand" href="mailto:hello@bloodlagbe.com.bd">
                hello@bloodlagbe.com.bd
              </a>
              . We answer within a working day.
            </p>
          </div>

          <div className="lg:col-span-8">
            <div className="divide-y divide-line rounded-2xl border border-line bg-raised">
              {FAQS.map((item, i) => {
                const open = openFaq === i
                return (
                  <div key={i}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? -1 : i)}
                      aria-expanded={open}
                      aria-controls={`faq-panel-${i}`}
                      className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition-colors duration-300 hover:bg-lifted"
                    >
                      <span className="title-3">{item.q}</span>
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line text-mute transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          open ? 'rotate-45' : ''
                        }`}
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </button>
                    {open && (
                      <div id={`faq-panel-${i}`} role="region" className="px-6 pb-6">
                        <p className="body-3 max-w-prose text-mute">{item.a}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- FINAL CTA ---------------- */}
      <section className="border-t border-line bg-canvas">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center sm:px-8">
          <Reveal>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft">
              <Drop size={26} weight="fill" className="text-brand" aria-hidden="true" />
            </div>
            <h2 className="heading-2 mx-auto mt-6 max-w-hero">When every minute counts, help should be one tap away</h2>
            <p className="body-3 mx-auto mt-4 max-w-hero text-mute">
              Search takes less time than writing the group message did last night.
            </p>
            <Link
              to="/find"
              className="button-lg group mx-auto mt-8 inline-flex items-center gap-2 rounded-2xl bg-brand-solid px-6 py-3 text-onbrand transition-all duration-300 ease-out hover:bg-brand-solid-hover active:scale-[0.98]"
            >
              Find blood now
              <ArrowRight size={20} weight="bold" className="transition-transform duration-500 ease-out group-hover:translate-x-1" />
            </Link>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {['Free for seekers, forever', 'No signup to search', 'Donors donate voluntarily'].map((line) => (
                <p key={line} className="caption-2 flex items-center gap-2 text-faint">
                  <CheckCircle size={15} weight="fill" className="text-good" aria-hidden="true" />
                  {line}
                </p>
              ))}
            </div>
            <p className="caption-5 mx-auto mt-8 flex max-w-md items-center justify-center gap-2 text-faint">
              <Siren size={15} aria-hidden="true" /> Life threatening emergency? Call 999 first.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  )
}
