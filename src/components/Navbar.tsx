'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const links = [
  { href: '#perfil',       label: 'Perfil' },
  { href: '#arquitectura', label: 'Arquitectura' },
  { href: '#experiencia',  label: 'Experiencia' },
  { href: '#siem',         label: 'SIEM' },
  { href: '#audit-hub',    label: 'Audit' },
  { href: '#stack',        label: 'Stack' },
  { href: '#proyecto',     label: 'Proyecto' },
  { href: '#contacto',     label: 'Contacto' },
]

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false)
  const [active,   setActive]     = useState('')
  const [menuOpen, setMenuOpen]   = useState(false)
  const [progress,  setProgress]  = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      setProgress(maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
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
        className={`fixed top-0 left-0 right-0 z-[100] backdrop-blur-xl border-b transition-all duration-300 ${
          scrolled 
            ? 'bg-slate-950/95 border-white/10' 
            : 'bg-slate-950/70 border-white/0'
        }`}
      >
        {/* Scroll Progress Bar */}
        <div 
          className="absolute top-0 left-0 h-[3px] bg-gradient-to-r from-blue-500 to-[var(--gold)] transition-all duration-150 ease-out z-[101]"
          style={{ width: `${progress}%` }} 
        />

        <div className="max-w-[1100px] mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          
          {/* Logo */}
          <motion.a
            href="#"
            whileHover={{ scale: 1.05 }}
            className="text-[var(--gold)] font-bold text-lg md:text-xl tracking-[2px] cursor-pointer"
          >
            JFP
          </motion.a>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex items-center gap-6 md:gap-8 list-none m-0 p-0">
            {links.map(link => {
              const isActive = active === link.href.slice(1)
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className={`nav-link text-[11px] md:text-xs uppercase tracking-wider transition-colors duration-300 font-medium relative py-1 ${
                      isActive ? 'text-blue-400' : 'text-slate-400 hover:text-blue-400'
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-dot"
                        className="absolute bottom-[-6px] left-0 right-0 h-[2.5px] bg-blue-500 rounded-full"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                  </a>
                </li>
              )
            })}
          </ul>

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="lg:hidden p-2 text-slate-200 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[98] lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 35 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-slate-900 z-[99] p-8 flex flex-col gap-8 shadow-2xl lg:hidden"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-[var(--gold)] font-bold text-xl tracking-wider">MENU</span>
                <button onClick={() => setMenuOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              {links.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setMenuOpen(false)}
                  className={`text-lg font-medium transition-colors ${
                    active === link.href.slice(1) ? 'text-blue-400' : 'text-slate-400'
                  }`}
                >
                  {link.label}
                </motion.a>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
