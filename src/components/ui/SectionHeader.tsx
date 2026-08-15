import FadeIn from './FadeIn'
import KineticText from './KineticText'

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
        <KineticText
          as="span"
          text={title}
          className="block"
          stagger={0.03}
          duration={0.45}
          slideFrom={35}
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
