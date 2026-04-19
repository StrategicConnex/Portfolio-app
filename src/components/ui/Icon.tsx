'use client'

import Image from 'next/image'

type IconProps = {
  name: string
  label: string
  size?: number
  className?: string
}

export default function Icon({ name, label, size = 32, className }: IconProps) {
  return (
    <Image
      src={`/icons/${name}.svg`}
      alt={label}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, minWidth: size, display: 'block' }}
    />
  )
}
