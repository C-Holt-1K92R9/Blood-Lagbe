import { useState } from 'react'
import { CheckCircle, EnvelopeSimple, PaperPlaneTilt } from '@phosphor-icons/react'
import { FormAlert, SelectField, TextAreaField, TextField } from '../components/Form.jsx'
import { api, fieldErrors } from '../lib/api.js'

const emptyForm = { name: '', email: '', feedbackType: '', message: '' }

export default function Contact() {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const set = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setSubmitted(false)
  }

  const submit = async (event) => {
    event.preventDefault()
    setServerError('')
    setSubmitted(false)
    setSubmitting(true)

    try {
      await api('/contact', { method: 'POST', body: form })
      setForm(emptyForm)
      setErrors({})
      setSubmitted(true)
    } catch (error) {
      const mapped = fieldErrors(error)
      const aliases = {
        'Your name': 'name',
        'Your email': 'email',
        'Your feedback': 'message',
      }
      for (const [label, field] of Object.entries(aliases)) {
        if (mapped[label]) {
          mapped[field] = mapped[label]
          delete mapped[label]
        }
      }
      setErrors(mapped)
      if (Object.keys(mapped).length === 0) setServerError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas pt-24 sm:pt-28">
      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="max-w-2xl">
          <p className="caption-3 uppercase tracking-widest text-brand">We are listening</p>
          <h1 className="heading-3 mt-2">Contact &amp; feedback</h1>
          <p className="body-3 mt-3 text-mute">
            Have a question, suggestion, or something we should improve? Send us a message and help make Donor Koi
            better for everyone.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section aria-labelledby="feedback-heading" className="rounded-2xl border border-line bg-raised p-5 shadow-[var(--shadow-card)] sm:p-7">
            <h2 id="feedback-heading" className="title-1">Send us feedback</h2>
            <p className="caption-2 mt-1 text-mute">Your message is saved in our database so our team can review it.</p>

            <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
              <TextField
                label="Your name"
                required
                value={form.name}
                onChange={set('name')}
                error={errors.name}
                autoComplete="name"
                maxLength={80}
              />
              <TextField
                label="Email address"
                type="email"
                required
                value={form.email}
                onChange={set('email')}
                error={errors.email}
                autoComplete="email"
                maxLength={254}
              />
              <SelectField
                label="Type of feedback"
                required
                value={form.feedbackType}
                onChange={set('feedbackType')}
                error={errors.feedbackType}
              >
                <option value="">Choose a feedback type</option>
                <option value="complaint">Complaint</option>
                <option value="suggestion">Suggestion</option>
                <option value="other">Other feedback</option>
              </SelectField>
              <TextAreaField
                label="Your feedback"
                required
                rows={6}
                value={form.message}
                onChange={set('message')}
                error={errors.message}
                maxLength={2000}
                hint="Please do not include passwords or sensitive medical information."
                placeholder="Tell us what is on your mind..."
              />

              {serverError && <FormAlert>{serverError}</FormAlert>}
              {submitted && (
                <div className="flex items-start gap-2 rounded-xl border border-good/20 bg-good-soft px-4 py-3" role="status">
                  <CheckCircle size={18} className="mt-0.5 shrink-0 text-good" aria-hidden="true" />
                  <p className="caption-2 text-strong">Thank you. Your feedback has been received.</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="button-md flex w-full items-center justify-center gap-2 rounded-xl bg-brand-solid px-5 py-3 text-onbrand transition-colors duration-300 hover:bg-brand-solid-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <PaperPlaneTilt size={17} weight="bold" aria-hidden="true" />
                {submitting ? 'Sending...' : 'Send feedback'}
              </button>
            </form>
          </section>

          <aside className="h-fit rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <EnvelopeSimple size={22} aria-hidden="true" />
            </div>
            <h2 className="title-1 mt-4">Contact us</h2>
            <p className="body-6 mt-2 text-mute">
              For general questions or support, email us directly. We will get back to you as soon as we can.
            </p>
            <a
              href="mailto:contact@donorkoi.2bd.com"
              className="body-5 mt-4 inline-flex break-all text-brand underline underline-offset-4 hover:text-brand-hover"
            >
              contact@donorkoi.2bd.com
            </a>
            <p className="caption-5 mt-6 border-t border-line pt-4 text-faint">
              For a life-threatening emergency, call 999 or go to the nearest hospital. Donor Koi is not a substitute
              for emergency medical care.
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}
