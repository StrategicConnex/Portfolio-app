'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'

type FormState = 'idle' | 'sending' | 'sent' | 'error'

const projectTypes = [
  'Auditoría de Seguridad OT/IT',
  'Implementación SIEM (Security Onion)',
  'Diseño Arquitectura IT/OT (Modelo Purdue)',
  'Infraestructura de Red – Oil & Gas',
  'Virtualización y Cloud (Azure/VMware)',
  'Automatización Python / Power BI',
  'Consultoría IEC 62443 / NIST / ISO 27001',
  'Desarrollo Web (Next.js / Full Stack)',
  'Otro',
]

const contactCards = [
  { icon: '✉', label: 'palacios_juan@hotmail.com',        sub: 'Email profesional',        href: 'mailto:palacios_juan@hotmail.com',                   color: 'var(--blue)' },
  { icon: '📞', label: '+54 299 586 9435',                sub: 'WhatsApp / Llamadas',      href: 'https://wa.me/542995869435',                      color: '#10B981', external: true },
  { icon: 'in', label: 'linkedin/juanfpalacios',          sub: 'LinkedIn',                href: 'https://linkedin.com/in/juanfpalacios',            color: '#0A66C2', external: true },
  { icon: '🐙', label: 'github/StrategicConnex',           sub: 'GitHub',                  href: 'https://github.com/StrategicConnex/',              color: '#333', external: true },
  { icon: '🏅', label: 'credly.com/users/juan-palacios',   sub: 'Certificaciones',         href: 'https://www.credly.com/users/juan-palacios.88e7ba6c', color: '#F9B400', external: true },
  { icon: '📍', label: 'Neuquén, Argentina',               sub: 'Trabajo remoto o presencial', href: null,                                          color: 'var(--gold)' },
]

export default function Contacto() {
  const [form, setForm]   = useState({ name: '', email: '', company: '', type: '', message: '' })
  const [status, setStatus] = useState<FormState>('idle')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    // Simulate async send (replace with fetch to /api/contact or Formspree)
    await new Promise(r => setTimeout(r, 1200))
    setStatus('sent')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
    padding: 'clamp(0.6rem, 1.5vw, 0.75rem) clamp(0.7rem, 1.5vw, 1rem)', color: 'var(--text)', fontSize: 'clamp(0.8rem, 1.5vw, 0.88rem)',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  return (
    <section id="contacto" style={{ padding: 'clamp(2rem, 5vw, 5rem) clamp(1rem, 5vw, 2rem)', background: 'var(--bg2)' }}>
      <div style={{ maxWidth: 1100, margin: 'auto' }}>
        <SectionHeader label="Contacto" title="Trabajemos" highlight="Juntos" center />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 'clamp(1.5rem, 4vw, 3rem)', alignItems: 'start' }}>

          {/* LEFT — contact cards + availability */}
          <div>
            <FadeIn delay={0.05}>
              <p style={{ color: 'var(--muted)', fontSize: 'clamp(0.8rem, 1.8vw, 0.9rem)', lineHeight: 1.8, marginBottom: 'clamp(1rem, 3vw, 1.75rem)' }}>
                Especializado en proyectos de alta criticidad en entornos industriales Oil &amp; Gas.
                Disponible para consultoría, arquitectura IT/OT, ciberseguridad y liderazgo técnico.
              </p>
            </FadeIn>

            <FadeIn delay={0.18} direction="left">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1.5rem' }}>
                <motion.a
                  href="mailto:palacios_juan@hotmail.com"
                  whileHover={{ y: -2 }}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.85rem 1.2rem', background: 'var(--blue)', color: '#fff', borderRadius: 999, fontWeight: 700, textDecoration: 'none', boxShadow: '0 14px 30px rgba(15, 23, 42, 0.12)' }}
                >
                  Enviar email
                </motion.a>
                <motion.a
                  href="https://linkedin.com/in/juanfpalacios"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -2 }}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.85rem 1.2rem', background: 'rgba(10,102,194,0.12)', color: 'var(--text)', borderRadius: 999, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(10,102,194,0.18)' }}
                >
                  LinkedIn
                </motion.a>
                <motion.a
                  href="/CV-JuanFelipePalacios.pdf"
                  download
                  whileHover={{ y: -2 }}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.85rem 1.2rem', background: 'rgba(255,215,0,0.12)', color: 'var(--text)', borderRadius: 999, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,215,0,0.28)' }}
                >
                  Descargar CV
                </motion.a>
              </div>
            </FadeIn>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.5rem, 1.5vw, 0.7rem)', marginBottom: '1.5rem' }}>
              {contactCards.map((c, i) => (
                <FadeIn key={i} delay={i * 0.07 + 0.1} direction="left">
                  {c.href ? (
                    <motion.a
                      href={c.href}
                      target={c.external ? '_blank' : undefined}
                      rel={c.external ? 'noopener noreferrer' : undefined}
                      whileHover={{ borderColor: c.color, x: 4 }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', padding: '0.85rem 1.1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, textDecoration: 'none', color: 'var(--text)', transition: 'border-color 0.2s' }}
                    >
                      <div style={{ width: 38, height: 38, borderRadius: 8, background: `${c.color}18`, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, flexShrink: 0 }}>{c.icon}</div>
                      <div><div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{c.label}</div><div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{c.sub}</div></div>
                      <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: c.color, opacity: 0.6 }}>↗</span>
                    </motion.a>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', padding: '0.85rem 1.1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 8, background: `${c.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>{c.icon}</div>
                      <div><div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{c.label}</div><div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{c.sub}</div></div>
                    </div>
                  )}
                </FadeIn>
              ))}
            </div>

            <FadeIn delay={0.4}>
              <motion.div
                animate={{ boxShadow: ['0 0 0px rgba(74,222,128,0)', '0 0 18px rgba(74,222,128,0.2)', '0 0 0px rgba(74,222,128,0)'] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(34,197,94,0.07)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.22)', padding: '0.5rem 1.1rem', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600 }}
              >
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.8 }} style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
                Disponible para proyectos de alta criticidad
              </motion.div>
            </FadeIn>
          </div>

          {/* RIGHT — qualified contact form */}
          <FadeIn delay={0.15} direction="right">
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--blue), var(--gold))' }} />

              <AnimatePresence mode="wait">
                {status === 'sent' ? (
                  <motion.div key="sent" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✅</div>
                    <h3 style={{ color: '#4ade80', marginBottom: '0.5rem' }}>¡Mensaje enviado!</h3>
                    <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Respondo en menos de 24 horas hábiles.</p>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={handleSubmit}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.3rem' }}>Iniciar conversación</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>Contame sobre tu proyecto para darte una respuesta más precisa.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: '0.3rem' }}>Nombre *</label>
                        <input required name="name" value={form.name} onChange={handleChange} placeholder="Tu nombre" style={inputStyle}
                          onFocus={e => e.currentTarget.style.borderColor = 'rgba(30,144,255,0.5)'}
                          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: '0.3rem' }}>Email *</label>
                        <input required type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@empresa.com" style={inputStyle}
                          onFocus={e => e.currentTarget.style.borderColor = 'rgba(30,144,255,0.5)'}
                          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: '0.3rem' }}>Empresa / Organización</label>
                      <input name="company" value={form.company} onChange={handleChange} placeholder="YPF, PAE, Vista Oil…" style={inputStyle}
                        onFocus={e => e.currentTarget.style.borderColor = 'rgba(30,144,255,0.5)'}
                        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: '0.3rem' }}>Tipo de proyecto *</label>
                      <select required name="type" value={form.type} onChange={handleChange}
                        style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                        onFocus={e => e.currentTarget.style.borderColor = 'rgba(30,144,255,0.5)'}
                        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                      >
                        <option value="" disabled>Seleccioná el tipo de proyecto…</option>
                        {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: '0.3rem' }}>Descripción breve</label>
                      <textarea name="message" value={form.message} onChange={handleChange} rows={3} placeholder="Contame brevemente el contexto (sector, urgencia, alcance)…"
                        style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                        onFocus={e => e.currentTarget.style.borderColor = 'rgba(30,144,255,0.5)'}
                        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                    </div>

                    <motion.button
                      type="submit"
                      disabled={status === 'sending'}
                      whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(30,144,255,0.3)' }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        width: '100%', padding: '0.85rem',
                        background: status === 'sending' ? 'rgba(30,144,255,0.5)' : 'var(--blue)',
                        color: '#fff', fontWeight: 700, fontSize: '0.92rem',
                        border: 'none', borderRadius: 8, cursor: status === 'sending' ? 'wait' : 'pointer',
                      }}
                    >
                      {status === 'sending' ? 'Enviando…' : 'Enviar consulta →'}
                    </motion.button>
                    <p style={{ fontSize: '0.68rem', color: 'var(--muted)', textAlign: 'center', marginTop: '0.6rem' }}>
                      Respuesta en &lt; 24h · Sin spam · Datos confidenciales
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
