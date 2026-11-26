import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle, PhoneCall } from '@phosphor-icons/react'
import { api } from '../lib/api.js'

const timeLabel = (value) =>
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

export default function RequestManagement() {
  const { publicId = '' } = useParams()
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const token = window.sessionStorage.getItem(`donorkoi-request:${publicId}`) || ''

  const refresh = useCallback(async () => {
    if (!token) return
    try {
      const result = await api(`/requests/${publicId}/manage`, { method: 'POST', body: { token } })
      setData(result)
    } catch (err) {
      setError(err.message)
    }
  }, [publicId, token])

  useEffect(() => {
    if (!token) return undefined
    let active = true
    api(`/requests/${publicId}/manage`, { method: 'POST', body: { token } })
      .then((result) => {
        if (active) setData(result)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
    return () => {
      active = false
    }
  }, [publicId, token])

  const release = async (donorId) => {
    setBusy(donorId)
    setError('')
    setNotice('')
    try {
      await api(`/requests/${publicId}/holds/${donorId}`, { method: 'DELETE', body: { token } })
      setNotice('The donor hold has been released.')
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const confirmDonation = async (donorId) => {
    setBusy(donorId)
    setError('')
    setNotice('')
    try {
      await api(`/requests/${publicId}/confirm`, { method: 'POST', body: { token, donorId } })
      setNotice('Donation recorded. The donor is hidden from search during recovery.')
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const request = data?.request
  const displayError =
    error || (!token ? 'This private management link is available only in the browser session that created the request.' : '')

  return (
    <div className="min-h-screen bg-canvas px-4 pb-16 pt-28 sm:px-6">
      <section className="mx-auto max-w-2xl rounded-2xl border-2 border-strong bg-raised p-6 shadow-[var(--shadow-card)]">
        <p className="caption-3 uppercase tracking-widest text-brand">Private request controls</p>
        <h1 className="heading-5 mt-2">Manage request {publicId}</h1>
        {displayError && <p className="mt-4 rounded-xl border border-brand/20 bg-brand-soft p-3 caption-2 text-brand" role="alert">{displayError}</p>}
        {notice && <p className="mt-4 rounded-xl border border-good/20 bg-good-soft p-3 caption-2 text-good" role="status">{notice}</p>}
        {!request && !error && <p className="mt-5 caption-2 text-mute">Loading request controls…</p>}
        {request && (
          <>
            <div className="mt-5 rounded-xl bg-surface p-4">
              <p className="title-4">{request.bloodGroup} {request.needType} · {request.city}</p>
              <p className="caption-2 mt-1 text-mute">Needed {timeLabel(request.neededAt)} Bangladesh time · Status: {request.status}</p>
              <p className="caption-2 mt-3 text-strong">{request.addressText}</p>
              <a href={`tel:${request.requesterPhone.replace(/[^\d+]/g, '')}`} className="caption-2 mt-2 inline-flex items-center gap-1.5 text-brand hover:underline">
                <PhoneCall size={15} aria-hidden="true" /> Your contact number: {request.requesterPhone}
              </a>
            </div>

            <h2 className="title-3 mt-6">Active donor holds</h2>
            {data.holds.length === 0 ? (
              <p className="caption-2 mt-2 text-mute">No donors are currently held for this request.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {data.holds.map((hold) => (
                  <li key={hold.id} className="rounded-xl border border-line bg-surface p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="title-4">{hold.name} <span className="caption-5 font-normal text-mute">· {hold.role}</span></p>
                        <a href={`tel:${hold.phone.replace(/[^\d+]/g, '')}`} className="caption-2 mt-1 inline-block text-brand hover:underline">{hold.phone}</a>
                        <p className="caption-5 mt-1 text-faint">Hold expires {timeLabel(hold.holdExpiresAt)} Bangladesh time</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" disabled={busy === hold.donorId} onClick={() => confirmDonation(hold.donorId)} className="button-sm inline-flex items-center gap-1.5 rounded-lg bg-good-soft px-3 py-2 text-good disabled:opacity-60">
                          <CheckCircle size={15} weight="fill" aria-hidden="true" /> Confirm donation
                        </button>
                        <button type="button" disabled={busy === hold.donorId} onClick={() => release(hold.donorId)} className="button-sm rounded-lg border border-line px-3 py-2 text-mute hover:text-strong disabled:opacity-60">
                          Release hold
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        <Link to="/find" className="caption-2 mt-6 inline-block text-mute underline underline-offset-4 hover:text-strong">Return to donor search</Link>
      </section>
    </div>
  )
}
