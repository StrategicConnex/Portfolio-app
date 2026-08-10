'use client'

import dynamic from 'next/dynamic'

// Next 16: `ssr: false` no está permitido con next/dynamic en Server Components;
// se hace aquí, en un Client Component (descubierto en Fase 1).
const DatacenterExperience = dynamic(() => import('./DatacenterExperience'), {
  ssr: false,
  loading: () => null,
})

/** Mount point del Living Datacenter (capa Z-20). Client-only por diseño. */
export default function DatacenterMount() {
  return <DatacenterExperience />
}
