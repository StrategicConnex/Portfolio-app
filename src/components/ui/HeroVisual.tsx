import Image from 'next/image'

/**
 * HeroVisual — imagen fotorrealista como background decorativo de sección.
 * Reemplaza los GLBs del3D con renders de alta calidad en el DOM layer (z-10+).
 * pointer-events: none para que no interfiera con la interacción.
 * Reduced-motion: la imagen es estática por diseño.
 */
export default function HeroVisual({
  src,
  alt,
  className = '',
  position = 'right',
  opacity = 0.25,
}: {
  src: string
  alt: string
  className?: string
  position?: 'left' | 'right' | 'center'
  opacity?: number
}) {
  const posClasses = {
    left: 'left-0 top-1/2 -translate-y-1/2 -translate-x-[10%]',
    right: 'right-0 top-1/2 -translate-y-1/2 translate-x-[10%]',
    center: 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
  }

  return (
    <div
      aria-hidden="true"
      className={`absolute pointer-events-none z-0 ${posClasses[position]} ${className}`}
      style={{ opacity }}
    >
      <Image
        src={src}
        alt={alt}
        width={600}
        height={600}
        className="object-contain filter drop-shadow-[0_0_60px_rgba(77,163,255,0.15)]"
        sizes="(max-width: 768px) 80vw, 50vw"
        priority={false}
      />
    </div>
  )
}
