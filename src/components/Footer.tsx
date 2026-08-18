'use client'

import { useLanguage } from '@/context/LanguageContext'

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer
      className="text-center px-4 sm:px-8 md:px-12 py-4 md:py-6 text-xs md:text-sm border-t leading-relaxed"
      style={{
        // --muted is a surface tint in the shadcn convention; the text color
        // belongs to --muted-foreground.
        color: 'var(--muted-foreground)',
        borderColor: 'var(--border)',
        background: 'var(--bg)',
      }}
    >
      <p>
        © {new Date().getFullYear()}{' '}
        <span className="font-semibold" style={{ color: 'var(--text)' }}>Juan Felipe Palacios</span>
        {' · '}IT/OT Cybersecurity Architect
        {' · '}Neuquén, Argentina
      </p>
      <p className="mt-1 opacity-60 text-xs">
        {t('footer.built_with')}
      </p>
      <p className="mt-3 opacity-70 text-xs">
        <a href="https://linkedin.com/in/juanfpalacios" target="_blank" rel="noopener noreferrer" className="underline mr-3" style={{ color: 'inherit' }}>LinkedIn</a>
        <a href="https://github.com/StrategicConnex/" target="_blank" rel="noopener noreferrer" className="underline mr-3" style={{ color: 'inherit' }}>GitHub</a>
        <a href="https://www.credly.com/users/juan-palacios.88e7ba6c" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'inherit' }}>Credly</a>
      </p>
    </footer>
  )
}
