'use client'

import { motion } from 'framer-motion'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'
import { useLanguage } from '@/context/LanguageContext'

const actions = [
  {
    label: 'LinkedIn',
    sub: 'linkedin.com/in/juanfpalacios',
    href: 'https://linkedin.com/in/juanfpalacios',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    color: '#0A66C2',
    bg: 'rgba(10,102,194,0.12)',
    border: 'rgba(10,102,194,0.25)',
    hoverBorder: 'rgba(10,102,194,0.6)',
  },
  {
    label: 'Descargar CV',
    sub: 'CV-JuanFelipePalacios.pdf',
    href: '/CV-JuanFelipePalacios.pdf',
    download: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    color: '#C5A46D',
    bg: 'rgba(197,164,109,0.10)',
    border: 'rgba(197,164,109,0.25)',
    hoverBorder: 'rgba(197,164,109,0.6)',
  },
  {
    label: 'Credly Badges',
    sub: 'credly.com/users/juan-palacios',
    href: 'https://www.credly.com/users/juan-palacios.88e7ba6c/badges/credly',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
      </svg>
    ),
    color: '#F9B400',
    bg: 'rgba(249,180,0,0.10)',
    border: 'rgba(249,180,0,0.25)',
    hoverBorder: 'rgba(249,180,0,0.6)',
  },
]

export default function Contacto() {
  const { t } = useLanguage()

  return (
    <section
      id="contacto"
      style={{
        padding: 'clamp(2rem, 5vw, 5rem) clamp(1rem, 5vw, 2rem)',
        background: 'var(--bg2)',
      }}
    >
      <div style={{ maxWidth: 640, margin: 'auto' }}>
        <SectionHeader
          label={t('contact.label')}
          title={t('contact.title')}
          highlight={t('contact.highlight')}
          center
        />

        <FadeIn delay={0.05}>
          <p
            style={{
              color: 'var(--muted)',
              fontSize: 'clamp(0.82rem, 1.8vw, 0.92rem)',
              lineHeight: 1.8,
              textAlign: 'center',
              marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)',
            }}
          >
            {t('contact.description')}
          </p>
        </FadeIn>

        {/* Action cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {actions.map((a, i) => (
            <FadeIn key={i} delay={i * 0.1 + 0.15} direction="up">
              <motion.a
                href={a.href}
                target={a.download ? undefined : '_blank'}
                rel={a.download ? undefined : 'noopener noreferrer'}
                {...(a.download ? { download: true } : {})}
                whileHover={{
                  y: -3,
                  borderColor: a.hoverBorder,
                  boxShadow: `0 8px 32px ${a.color}22`,
                }}
                transition={{ duration: 0.2 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.1rem 1.4rem',
                  background: a.bg,
                  border: `1px solid ${a.border}`,
                  borderRadius: 14,
                  textDecoration: 'none',
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
              >
                {/* Icon circle */}
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    background: `${a.color}20`,
                    border: `1px solid ${a.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: a.color,
                  }}
                >
                  {a.icon}
                </div>

                {/* Text */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                    {a.label}
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {a.sub}
                  </div>
                </div>

                {/* Arrow */}
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '1.1rem',
                    color: a.color,
                    opacity: 0.7,
                    flexShrink: 0,
                  }}
                >
                  {a.download ? '↓' : '↗'}
                </span>
              </motion.a>
            </FadeIn>
          ))}
        </div>

        {/* Availability badge */}
        <FadeIn delay={0.5}>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0px rgba(74,222,128,0)',
                  '0 0 18px rgba(74,222,128,0.2)',
                  '0 0 0px rgba(74,222,128,0)',
                ],
              }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(34,197,94,0.07)',
                color: '#4ade80',
                border: '1px solid rgba(34,197,94,0.22)',
                padding: '0.5rem 1.2rem',
                borderRadius: 20,
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
            >
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#4ade80',
                }}
              />
              {t('contact.availability')}
            </motion.div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
