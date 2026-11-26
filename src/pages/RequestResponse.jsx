import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle, Clock, XCircle } from '@phosphor-icons/react'
import { api } from '../lib/api.js'

const dateLabel = (value) =>
  value
    ? new Date(value).toLocaleString('en-GB', {
        timeZone: 'Asia/Dhaka',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'As soon as possible'

export default function RequestResponse() {
  const { token = '' } = useParams()
  const [response, setResponse] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api('/requests/scheduled-response', { method: 'POST', body: { token, action: 'view' } })
      .then((data) => {
        if (active) setResponse(data)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
    return () => {
      active = false
    }
  }, [token])

  const respond = async (action) => {
    setBusy(true)
    setError('')
    try {
      const data = await api('/requests/scheduled-response', { method: 'POST', body: { token, action } })
      setResponse((current) => ({ ...current, ...data }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const status = response?.status
  const request = response?.request

  return (
    <div className="min-h-screen bg-canvas px-4 pb-16 pt-28 sm:px-6">
      <section className="mx-auto max-w-xl rounded-2xl border-2 border-strong bg-raised p-6 shadow-[var(--shadow-card)]">
        <p className="caption-3 uppercase tracking-widest text-brand">Donor response</p>
        <h1 className="heading-5 mt-2">Scheduled donation request</h1>

        {error && <p className="mt-4 rounded-xl border border-brand/20 bg-brand-soft p-3 caption-2 text-brand" role="alert">{error}</p>}
        {!request && !error && <p className="mt-5 caption-2 text-mute" aria-live="polite">Loading private request details…</p>}

        {request && (
          <>
            <dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-surface p-4">
              <div><dt className="caption-5 text-faint">Blood needed</dt><dd className="title-4 mt-1">{request.bloodGroup} {request.needType}</dd></div>
              <div><dt className="caption-5 text-faint">Area</dt><dd className="title-4 mt-1">{request.city}</dd></div>
              <div className="col-span-2"><dt className="caption-5 text-faint">Needed</dt><dd className="caption-2 mt-1 text-strong">{dateLabel(request.neededAt)} Bangladesh time</dd></div>
            </dl>

            {status === 'pending' && (
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" disabled={busy} onClick={() => respond('accept')} className="button-md inline-flex items-center gap-2 rounded-xl bg-brand-solid px-4 py-2.5 text-onbrand hover:bg-brand-solid-hover disabled:opacity-60">
                  <CheckCircle size={17} weight="fill" aria-hidden="true" /> I can help
                </button>
                <button type="button" disabled={busy} onClick={() => respond('reject')} className="button-md inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-mute hover:text-strong disabled:opacity-60">
                  <XCircle size={17} aria-hidden="true" /> I cannot help
                </button>
              </div>
            )}

            {status === 'accepted' && (
              <div className="mt-5 space-y-3">
                <p className="caption-2 rounded-xl border border-good/20 bg-good-soft p-3 text-good">
                  You are held as the {response.role || 'selected'} donor until {dateLabel(response.holdExpiresAt)} Bangladesh time.
                </p>
                {request.requesterPhone && (
                  <a href={`tel:${request.requesterPhone.replace(/[^\d+]/g, '')}`} className="button-md inline-flex rounded-xl bg-brand-solid px-4 py-2.5 text-onbrand hover:bg-brand-solid-hover">
                    Call requester · {request.requesterPhone}
                  </a>
                )}
                <div className="flex flex-wrap gap-3">
                  <button type="button" disabled={busy} onClick={() => respond('confirm')} className="button-md inline-flex items-center gap-2 rounded-xl bg-good-soft px-4 py-2.5 text-good disabled:opacity-60">
                    <CheckCircle size={17} weight="fill" aria-hidden="true" /> Confirm donation
                  </button>
                  <button type="button" disabled={busy} onClick={() => respond('cannot_donate')} className="button-md rounded-xl border border-line px-4 py-2.5 text-mute hover:text-strong disabled:opacity-60">
                    Release my hold
                  </button>
                </div>
                <p className="caption-5 flex items-center gap-1.5 text-mute"><Clock size={14} aria-hidden="true" /> Confirm only after the donation has happened. The request cannot be confirmed before its scheduled time.</p>
              </div>
            )}

            {['rejected', 'unavailable', 'slots_filled', 'closed', 'fulfilled', 'completed', 'released'].includes(status) && (
              <p className="mt-5 rounded-xl border border-line bg-surface p-3 caption-2 text-mute">
                {status === 'rejected'
                  ? 'You declined this request.'
                  : status === 'slots_filled'
                    ? 'Enough donors have already accepted this request.'
                    : status === 'unavailable'
                      ? 'You are no longer available for this request.'
                      : status === 'fulfilled' || status === 'completed'
                        ? 'This request has been fulfilled. Thank you for supporting the community.'
                        : status === 'released'
                          ? 'Your hold has been released.'
                          : 'This request is no longer accepting responses.'}
              </p>
            )}
          </>
        )}

        <Link to="/" className="caption-2 mt-6 inline-block text-mute underline underline-offset-4 hover:text-strong">Return to Donor Koi</Link>
      </section>
    </div>
  )
}
