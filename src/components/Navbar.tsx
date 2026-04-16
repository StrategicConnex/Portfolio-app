'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const links = [
  { href: '#perfil',       label: 'Perfil' },
  { href: '#arquitectura', label: 'Arquitectura' },
  { href: '#experiencia',  label: 'Experiencia' },
  { href: '#siem',         label: 'SIEM' },
  { href: '#stack',        label: 'Stack' },
  { href: '#proyecto',     label: 'Proyecto' },
  { href: '#contacto',     label: 'Contacto' },
]

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false)
  const [active,   setActive]     = useState('')
  const [menuOpen, setMenuOpen]   = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // highlight active section via IntersectionObserver
  useEffect(() => {
    const ids = links.map(l => l.href.slice(1))
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) })
      },
      { rootMargin: '-40% 0px -55% 0px' }
    )
    ids.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: scrolled ? 'rgba(10,25,47,0.95)' : 'rgba(10,25,47,0.7)',
          backdropFilter: 'blur(16px)',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
          transition: 'background 0.4s, border-color 0.4s',
        }}
      >
        <div style={{ maxWidth: 1100, margin: 'auto', padding: 'clamp(0.5rem, 2vw, 1rem) clamp(1rem, 5vw, 2rem)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 'auto', minHeight: 60 }}>
          {/* Logo */}
          <motion.span
            whileHover={{ scale: 1.05 }}
            style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)', letterSpacing: '2px', cursor: 'default' }}
          >
            JFP
          </motion.span>

          {/* Desktop links */}
          <ul style={{ display: 'flex', gap: 'clamp(1rem, 3vw, 1.75rem)', listStyle: 'none', margin: 0, padding: 0, flexWrap: 'wrap', justifyContent: 'center' }}
              className="hidden-mobile">
            {links.map(link => (
              <li key={link.href}>
                <a
                  href={link.href}
                  style={{
                    color: active === link.href.slice(1) ? 'var(--blue)' : 'var(--muted)',
                    textDecoration: 'none',
                    fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)',
                    fontWeight: active === link.href.slice(1) ? 600 : 400,
                    transition: 'color 0.2s',
                    position: 'relative',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--blue)')}
                  onMouseLeave={e => {
                    if (active !== link.href.slice(1))
                      e.currentTarget.style.color = 'var(--muted)'
                  }}
                >
                  {link.label}
                  {active === link.href.slice(1) && (
                    <motion.span
                      layoutId="nav-dot"
                      style={{
                        position: 'absolute', bottom: -4, left: 0, right: 0,
                        height: 2, background: 'var(--blue)', borderRadius: 1,
                      }}
                    />
                  )}
                </a>
              </li>
            ))}
          </ul>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '0.5rem', display: 'none' }}
            className="show-mobile"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            style={{
              position: 'fixed', top: 60, right: 0, bottom: 0, width: 'min(280px, 100vw)',
              background: 'rgba(10,25,47,0.98)', backdropFilter: 'blur(20px)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              zIndex: 99, padding: 'clamp(1rem, 5vw, 2rem)',
              display: 'flex', flexDirection: 'column', gap: '1.25rem',
            }}
          >
            {links.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 + 0.1 }}
                onClick={() => setMenuOpen(false)}
                style={{
                  color: active === link.href.slice(1) ? 'var(--blue)' : 'var(--muted)',
                  textDecoration: 'none', fontSize: 'clamp(0.9rem, 2vw, 1rem)', fontWeight: 500,
                }}
              >
                {link.label}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (min-width: 641px) { .show-mobile { display: none !important; } }
        @media (max-width: 640px) { .hidden-mobile { display: none !important; } }
      `}</style>
    </>
  )
}
