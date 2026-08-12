import FadeIn from './FadeIn'

interface SectionHeaderProps {
  label: string
  title: string
  highlight?: string
  center?: boolean
}

export default function SectionHeader({
  label,
  title,
  highlight,
  center = false,
}: SectionHeaderProps) {
  return (
    <FadeIn className={center ? 'text-center' : ''}>
      {/* Eyebrow editorial (audit G6): mono teletipo + tracking amplio */}
      <p
        className="font-mono text-[0.68rem] tracking-[0.3em] uppercase mb-1.5 opacity-80"
        style={{ color: 'var(--blue)' }}
      >
        {label}
      </p>
      <h2
        className="font-bold tracking-tight mb-3"
        style={{
          fontSize: 'clamp(1.75rem, 3.6vw, 2.6rem)',
          lineHeight: 1.12,
          color: 'var(--text)',
        }}
      >
        {title}{' '}
        {highlight && (
          <span style={{ color: 'var(--gold)' }}>{highlight}</span>
        )}
      </h2>
      <div
        className="sec-divider"
        style={{ margin: center ? '0 auto 2.5rem' : undefined }}
      />
    </FadeIn>
  )
}
