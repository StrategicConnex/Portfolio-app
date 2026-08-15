import FadeIn from './FadeIn'
import TextReveal from './TextReveal'

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
        className="font-bold tracking-tight mb-3 overflow-hidden"
        style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          lineHeight: 1.05,
          letterSpacing: '-0.035em',
          color: 'var(--text)',
        }}
      >
        <TextReveal
          as="span"
          lines={[title]}
          className="block"
          lineClassName="block"
        />
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
