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
      <p
        className="text-xs tracking-[3px] uppercase mb-1"
        style={{ color: 'var(--blue)' }}
      >
        {label}
      </p>
      <h2
        className="font-bold mb-3"
        style={{
          fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
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
