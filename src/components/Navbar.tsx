'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Languages, Menu, X } from 'lucide-react'

const linkKeys = [
  { href: '#perfil',       key: 'nav.profile', label: 'Perfil' },
  { href: '#arquitectura', key: 'nav.architecture', label: 'Arquitectura' },
  { href: '#experiencia',  key: 'nav.experience', label: 'Experiencia' },
  { href: '#siem',         key: 'nav.siem', label: 'SIEM' },
  { href: '#audit-hub',    key: 'nav.audit', label: 'Audit' },
  { href: '#blog',         key: 'nav.blog', label: 'Inteligencia' },
  { href: '#stack',        key: 'nav.stack', label: 'Stack' },
  { href: '#proyecto',     key: 'nav.projects', label: 'Proyectos' },
  { href: '#contacto',     key: 'nav.contact', label: 'Contacto' },
]

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage()
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
    const ids = linkKeys.map(l => l.href.slice(1))
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
            ? 'bg-[var(--navbar-bg)] border-[var(--navbar-border)]' 
            : 'bg-[color-mix(in_srgb,var(--navbar-bg)_75%,transparent)] border-transparent'
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
            {linkKeys.map(link => {
              const isActive = active === link.href.slice(1)
              const label = t(link.key) || link.label
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className={`nav-link text-[10px] uppercase tracking-wider transition-colors duration-300 font-medium relative py-1 ${
                      isActive ? 'text-[var(--blue)]' : 'text-muted-foreground hover:text-[var(--blue)]'
                    }`}
                  >
                    {label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-dot"
                        className="absolute bottom-[-6px] left-0 right-0 h-[2.5px] bg-[var(--blue)] rounded-full"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                  </a>
                </li>
              )
            })}
          </ul>

          <div className="flex items-center gap-3">
            {/* Theme switcher (System / Light / Dark) */}
            <ThemeToggle />

            {/* Language Switcher */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border-interactive text-xs font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-all group"
            >
              <Languages size={14} className="text-[var(--blue)] group-hover:rotate-12 transition-transform" />
              <span className="uppercase tracking-widest">{language}</span>
            </motion.button>

            {/* Mobile hamburger toggle */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="lg:hidden p-2 text-foreground hover:text-[var(--blue)] transition-colors"
              aria-label={language === 'en' ? 'Toggle menu' : 'Abrir menú'}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
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
            {/* Scrim stays dark in both themes — it must dim whatever sits behind. */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 35 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-[var(--surface-elevated)] z-[99] p-8 flex flex-col gap-8 shadow-2xl lg:hidden"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-[var(--gold)] font-bold text-xl tracking-wider">MENU</span>
                <button onClick={() => setMenuOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label={language === 'en' ? 'Close menu' : 'Cerrar menú'}>
                  <X size={24} />
                </button>
              </div>
              <div className="flex flex-col gap-6">
                {linkKeys.map((link, i) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setMenuOpen(false)}
                    className={`text-lg font-medium transition-colors ${
                      active === link.href.slice(1) ? 'text-[var(--blue)]' : 'text-muted-foreground'
                    }`}
                  >
                    {t(link.key) || link.label}
                  </motion.a>
                ))}
              </div>
              
              <div className="mt-auto pt-8 border-t border-border">
                <p className="text-muted-foreground text-xs uppercase tracking-widest mb-4">Language / Idioma</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setLanguage('es')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${language === 'es' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                  >
                    ESPAÑOL
                  </button>
                  <button 
                    onClick={() => setLanguage('en')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${language === 'en' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                  >
                    ENGLISH
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
