'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import CyberAttackMap3DLoader from './CyberAttackMap3D.loader'

/**
 * three.js + @react-three/fiber + drei are ~600 KB. This wrapper keeps them in
 * their own lazily-fetched chunk: the module is only requested when the map
 * approaches the viewport (or immediately on the dedicated map page).
 *
 * `ssr: false` must live in a Client Component in Next.js App Router — the
 * dedicated page is a Server Component, so it renders this wrapper instead of
 * calling `next/dynamic` itself.
 */
const CyberAttackMap3D = dynamic(() => import('./CyberAttackMap3D'), {
  ssr: false,
  loading: () => <CyberAttackMap3DLoader />,
})

interface LazyCyberAttackMapProps {
  /** Skip the viewport gate (dedicated /cyber-attack-map page). */
  immediate?: boolean
}

export default function LazyCyberAttackMap({ immediate = false }: LazyCyberAttackMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(immediate)

  useEffect(() => {
    if (immediate) return

    // jsdom / browsers without IntersectionObserver: mount right away.
    if (typeof IntersectionObserver === 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActive(true)
      return
    }

    const node = containerRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActive(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }, // pre-carga 200px antes de llegar
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [immediate])

  return (
    <div ref={containerRef} className="w-full">
      {active ? <CyberAttackMap3D /> : <CyberAttackMap3DLoader />}
    </div>
  )
}
