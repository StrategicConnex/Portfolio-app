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
      {/* Eyebrow editorial (G6 + P0): mono teletipo + tracking amplio */}
      <p className="eyebrow mb-2">{label}</p>
      <h2
        className="font-bold tracking-tight mb-3"
        style={{
          fontSize: 'clamp(1.9rem, 3.8vw, 3rem)',
          lineHeight: 1.08,
          letterSpacing: '-0.03em',
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
