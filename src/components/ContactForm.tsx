'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

type FormStatus = 'idle' | 'sending' | 'sent' | 'error'

interface FormValues {
  name: string
  email: string
  company: string
  type: string
  message: string
}

type FormErrors = Partial<Record<keyof FormValues, string>>

const INITIAL_FORM: FormValues = { name: '', email: '', company: '', type: '', message: '' }

const PROJECT_TYPES = [
  'contact.type.audit',
  'contact.type.siem',
  'contact.type.arch',
  'contact.type.network',
  'contact.type.cloud',
  'contact.type.automation',
  'contact.type.compliance',
  'contact.type.dev',
  'contact.type.other',
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: 'clamp(0.6rem, 1.5vw, 0.75rem) clamp(0.7rem, 1.5vw, 1rem)',
  color: 'var(--text)',
  fontSize: 'clamp(0.8rem, 1.5vw, 0.88rem)',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  color: 'var(--muted)',
  display: 'block',
  marginBottom: '0.3rem',
}

const errorStyle: React.CSSProperties = {
  color: '#f87171',
  fontSize: '0.72rem',
  margin: '0.3rem 0 0',
}

export default function ContactForm() {
  const { t } = useLanguage()
  const [form, setForm] = useState<FormValues>(INITIAL_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<FormStatus>('idle')

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    // Clear the field's error as soon as the user edits it again.
    if (errors[name as keyof FormValues]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  function validate(values: FormValues): FormErrors {
    const next: FormErrors = {}
    if (!values.name.trim()) next.name = t('contact.form.error.name')
    if (!EMAIL_RE.test(values.email.trim())) next.email = t('contact.form.error.email')
    if (!values.type) next.type = t('contact.form.error.type')
    if (!values.message.trim()) next.message = t('contact.form.error.message')
    return next
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        setStatus('error')
      } else {
        setStatus('sent')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 'clamp(1.25rem, 3vw, 2rem)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: 'linear-gradient(90deg, var(--blue), var(--gold))',
        }}
      />

      {status === 'sent' ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }} role="status">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4ade80"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ margin: '0 auto 0.75rem' }}
            aria-hidden="true"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <h3 style={{ color: '#4ade80', margin: '0 0 0.5rem', fontSize: '1rem' }}>
            {t('contact.form.success')}
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>
            {t('contact.form.success_msg')}
          </p>
        </div>
      ) : status === 'error' ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }} role="alert">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ margin: '0 auto 0.75rem' }}
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3 style={{ color: '#ef4444', margin: '0 0 0.5rem', fontSize: '1rem' }}>
            {t('contact.form.error.title')}
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: '0 0 1.25rem' }}>
            {t('contact.form.error.msg')}
          </p>
          <button
            type="button"
            onClick={() => setStatus('idle')}
            style={{
              padding: '0.6rem 1.2rem',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'var(--text)',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            {t('contact.form.error.retry')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.3rem' }}>
            {t('contact.form.title')}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '0 0 1.5rem' }}>
            {t('contact.form.subtitle')}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.75rem',
              marginBottom: '0.75rem',
            }}
          >
            <div>
              <label htmlFor="contact-name" style={labelStyle}>
                {t('contact.form.name')} *
              </label>
              <input
                id="contact-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                style={inputStyle}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'contact-name-error' : undefined}
              />
              {errors.name && (
                <p id="contact-name-error" role="alert" style={errorStyle}>
                  {errors.name}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="contact-email" style={labelStyle}>
                {t('contact.form.email')} *
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                style={inputStyle}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'contact-email-error' : undefined}
              />
              {errors.email && (
                <p id="contact-email-error" role="alert" style={errorStyle}>
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label htmlFor="contact-company" style={labelStyle}>
              {t('contact.form.company')}
            </label>
            <input
              id="contact-company"
              name="company"
              value={form.company}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label htmlFor="contact-type" style={labelStyle}>
              {t('contact.form.type')}
            </label>
            <select
              id="contact-type"
              name="type"
              value={form.type}
              onChange={handleChange}
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              aria-invalid={!!errors.type}
              aria-describedby={errors.type ? 'contact-type-error' : undefined}
            >
              <option value="" disabled>
                {t('contact.form.type.placeholder')}
              </option>
              {PROJECT_TYPES.map((key) => (
                <option key={key} value={key}>
                  {t(key)}
                </option>
              ))}
            </select>
            {errors.type && (
              <p id="contact-type-error" role="alert" style={errorStyle}>
                {errors.type}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="contact-message" style={labelStyle}>
              {t('contact.form.message')} *
            </label>
            <textarea
              id="contact-message"
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={3}
              placeholder={t('contact.form.message.placeholder')}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? 'contact-message-error' : undefined}
            />
            {errors.message && (
              <p id="contact-message-error" role="alert" style={errorStyle}>
                {errors.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={status === 'sending'}
            style={{
              width: '100%',
              padding: '0.85rem',
              background: status === 'sending' ? 'rgba(30,144,255,0.5)' : 'var(--blue)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.92rem',
              border: 'none',
              borderRadius: 8,
              cursor: status === 'sending' ? 'wait' : 'pointer',
            }}
          >
            {status === 'sending' ? t('contact.form.sending') : t('contact.form.send')}
          </button>
          <p style={{ fontSize: '0.68rem', color: 'var(--muted)', textAlign: 'center', margin: '0.6rem 0 0' }}>
            {t('contact.form.footer')}
          </p>
        </form>
      )}
    </div>
  )
}
