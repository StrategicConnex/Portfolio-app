'use client'

import { useRef, useMemo, useState, useEffect, useCallback, Suspense, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Text, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { COUNTRY_COORDS, latLngToVector3 } from '@/data/countryCoords'
import { useLanguage } from '@/context/LanguageContext'
import { interpolate } from '@/lib/utils'
import { WebGLFallback, hasWebGLSupport } from './WebGLBoundary'
import {
  ATTACK_TYPES,
  attackTypeFor,
  pickDestination,
  PROTECTED_DESTINATIONS,
  type AttackType,
} from './attackArc'
import { advanceEarthRotation } from './globeRotation'
import ArcTooltipPanel from './ArcTooltipPanel'

/**
 * Fuente de las etiquetas: la del sistema de diseño Strata Protocol, servida
 * desde `/public`. No se usa la fuente por defecto de troika (CDN de Google)
 * porque la CSP del proyecto solo permite `font-src 'self' data:`, y esa
 * petición acabaría bloqueada: las etiquetas no se verían.
 */
const LABEL_FONT = '/fonts/DMMono-Regular.ttf'

/**
 * Texturas del globo, servidas desde `/public/textures`.
 *
 * No se piden a un CDN en tiempo de ejecución: la escena no dependería de que
 * `unpkg.com` esté accesible (ni de que el visitante no lo bloquee), cada
 * visita dejaría su IP en un tercero, y la CSP tendría que mantener
 * `img-src https:` abierto para ellas. Servidas en local, `img-src` puede
 * quedarse en `'self' data:`.
 *
 * Procedencia y licencia: `public/textures/NOTICE.md` (three-globe MIT; las
 * imágenes son de dominio público, de la NASA).
 */
const GLOBE_TEXTURES = [
  '/textures/earth-blue-marble.jpg',
  '/textures/earth-topology.jpg',
  '/textures/earth-water.jpg',
] as const

/** Duración del viaje del arco, en ms. */
const ARC_TRAVEL_MS = 1800
/** Tiempo que el arco permanece visible tras llegar, en ms. */
const ARC_LINGER_MS = 2600
/** Duración de la explosión de impacto, en ms. */
const BURST_LIFE_MS = 1300
/** Radio de la esfera del globo. */
const GLOBE_RADIUS = 2
/**
 * Radio del tubo invisible que captura el puntero sobre el arco.
 *
 * El arco visible tiene un radio de 0.008 (una línea de un píxel): es
 * imposible de apuntar con el ratón. Este tubo, más ancho y sin pintar, es
 * el que recibe los eventos de puntero y alimenta el tooltip.
 */
const ARC_HIT_RADIUS = 0.035

/** Posición del puntero en píxeles de la ventana. */
type PointerPosition = { clientX: number; clientY: number }

/** Ancho del tooltip (`w-60`), usado para colocarlo dentro del marco. */
const TOOLTIP_WIDTH = 240
/** Alto aproximado del tooltip, usado para lo mismo. */
const TOOLTIP_HEIGHT = 120
/** Separación entre el puntero y el tooltip. */
const TOOLTIP_GAP = 14

interface AttackArcState {
  id: number
  /** País de origen. */
  start: string
  startCoords: [number, number]
  /** Destino del arco. */
  endKey: string
  endCoords: [number, number]
  /** El destino no es infraestructura real: es un país ilustrativo. */
  endIsIllustrative: boolean
  /**
   * El origen no se puede atribuir a una IP real: el país es una elección
   * ilustrativa, no el lugar real de un ataque.
   */
  originIsIllustrative: boolean
  color: string
  code: string
  startTime: number
  source?: string
  type?: string
  originIp?: string
  /** ASN de la IP de origen (dato de SANS). */
  originAs?: string
  /** Número de reportes que SANS asocia a esa IP. */
  reports?: number
}

/** Evento tal y como lo publica `/api/threat-intel`. */
interface ThreatEventPayload {
  originCountry?: string
  originIp?: string
  /** ASN de la IP, tal y como lo publica DShield. */
  originAs?: string
  /** Número de reportes de DShield para esa IP. */
  reports?: number
  type?: string
  source?: string
  blocklistCount?: number
}

/** Respuesta completa del endpoint de inteligencia de amenazas. */
interface ThreatIntelFeed {
  events: ThreatEventPayload[]
  /** 'live' = IPs reales; 'degraded' = muestra etiquetada como tal. */
  dataSource: 'live' | 'degraded'
  /** Estado real de cada fuente. */
  sourceStatus?: { dshield?: string; kev?: string }
}

/** Esquirla de una explosión de impacto. */
interface BurstParticle {
  /** Dirección de salida de la esquirla (unitario). */
  dir: THREE.Vector3
  /** Normal de la superficie en el punto del impacto. */
  normal: THREE.Vector3
  /** Distancia final a la que sale la esquirla. */
  dist: number
  /** Tamaño de la geometría. */
  size: number
  /** Geometría: 0 tetraedro, 1 caja, 2 octaedro. */
  shape: number
  color: string
  /** Retardo de la esquirla respecto al impacto. */
  offset: number
  /** Velocidad de giro por eje. */
  spin: THREE.Vector3
}

interface Burst {
  id: number
  position: [number, number, number]
  startTime: number
  color: string
  /** Esquirlas precalculadas: se generan al explotar, no en cada render. */
  particles: BurstParticle[]
}

/** Curva del arco: bezier cuadrática con el vértice fuera de la esfera. */
function buildCurve(startCoords: [number, number], endCoords: [number, number]) {
  const s = new THREE.Vector3(...latLngToVector3(startCoords[0], startCoords[1], GLOBE_RADIUS + 0.01))
  const e = new THREE.Vector3(...latLngToVector3(endCoords[0], endCoords[1], GLOBE_RADIUS + 0.01))

  const mid = s.clone().add(e).multiplyScalar(0.5)
  // Origen y destino antipodales: el punto medio cae en el centro de la
  // esfera y no se puede normalizar. Se usa un control perpendicular.
  if (mid.lengthSq() < 1e-6) {
    mid.copy(s).cross(new THREE.Vector3(0, 1, 0))
    if (mid.lengthSq() < 1e-6) mid.copy(s).cross(new THREE.Vector3(1, 0, 0))
  }
  mid.normalize().multiplyScalar(GLOBE_RADIUS + 0.01 + Math.min(0.9, s.distanceTo(e) * 0.35))

  return new THREE.QuadraticBezierCurve3(s, mid, e)
}

/**
 * Etiqueta de país pegada a la superficie: el texto queda tendido sobre el
 * globo, orientado por la normal de la superficie, como en los mapas
 * etiquetados. El globo la oculta cuando queda en la cara opuesta.
 */
function CountryLabel({
  coords,
  text,
  color = '#9fb0c0',
  size = 0.07,
}: {
  coords: [number, number]
  text: string
  color?: string
  size?: number
}) {
  const [lat, lng] = coords
  const pos = useMemo(
    () => latLngToVector3(lat, lng, GLOBE_RADIUS + 0.02),
    [lat, lng],
  )
  const quat = useMemo(() => {
    const normal = new THREE.Vector3(pos[0], pos[1], pos[2]).normalize()
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
  }, [pos])

  return (
    <group position={pos} quaternion={quat}>
      <Text
        font={LABEL_FONT}
        fontSize={size}
        color={color}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.12}
        outlineWidth={0.004}
        outlineColor="#000000"
      >
        {text.toUpperCase()}
      </Text>
    </group>
  )
}

/**
 * Pin de infraestructura protegida con anillo pulsante. Se ancla a la
 * superficie con un cono (la base del pin entra en el globo) y un anillo que
 * se expande y desvanece.
 */
function ProtectedPin({ coords }: { coords: [number, number] }) {
  const [lat, lng] = coords
  const pos = useMemo(
    () => latLngToVector3(lat, lng, GLOBE_RADIUS),
    [lat, lng],
  )
  const quat = useMemo(() => {
    const normal = new THREE.Vector3(pos[0], pos[1], pos[2]).normalize()
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)
  }, [pos])

  const ringRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ringRef.current) {
      const t = (clock.getElapsedTime() % 1.6) / 1.6
      ringRef.current.scale.setScalar(0.5 + t * 1.8)
      ;(ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - t)
    }
  })

  return (
    <group position={pos} quaternion={quat}>
      <mesh position={[0, 0.09, 0]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial color="#e5e7eb" emissive="#9ca3af" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.045, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.028, 0.09, 12]} />
        <meshStandardMaterial color="#d1d5db" />
      </mesh>
      <mesh ref={ringRef} position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.09, 0.1, 32]} />
        <meshBasicMaterial color="#ff2d78" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/**
 * Genera las esquirlas de una explosión.
 *
 * Se llama al EXPLOTAR el arco (un manejador de evento), nunca durante el
 * render: `Math.random()` en render es una impureza que React Compiler
 * rechaza y, además, haría que las esquirlas cambiasen de forma en cada
 * repintado.
 */
function createBurstParticles(
  position: [number, number, number],
  color: string,
): BurstParticle[] {
  const normal = new THREE.Vector3(...position).normalize()
  const helper =
    Math.abs(normal.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
  const t1 = new THREE.Vector3().crossVectors(normal, helper).normalize()
  const t2 = new THREE.Vector3().crossVectors(normal, t1).normalize()
  const palette = [color, '#ff2d78', '#ffffff', '#ff7ab8']

  return Array.from({ length: 14 }, (_, i) => {
    const angle = Math.random() * Math.PI * 2
    const dir = new THREE.Vector3()
      .addScaledVector(t1, Math.cos(angle))
      .addScaledVector(t2, Math.sin(angle))
      .normalize()

    return {
      dir,
      normal,
      dist: 0.14 + Math.random() * 0.3,
      size: 0.012 + Math.random() * 0.02,
      shape: i % 3,
      color: palette[i % 4],
      offset: Math.random() * 0.12,
      spin: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6),
    }
  })
}

/** Esquirlas que explotan al llegar el arco. */
function ImpactBurst({ burst }: { burst: Burst }) {
  const refs = useRef<(THREE.Mesh | null)[]>([])
  // `particles` se genera al explotar el arco. El fallback cubre un estado
  // heredado de una recarga en caliente, donde el burst conservado todavía no
  // trae esquirlas.
  const particles = burst.particles ?? []

  useFrame((_, delta) => {
    const elapsed = (performance.now() - burst.startTime) / 1000
    const life = BURST_LIFE_MS / 1000

    particles.forEach((p, i) => {
      const mesh = refs.current[i]
      if (!mesh) return
      const t = Math.max(0, elapsed - p.offset)
      const ease = 1 - Math.exp(-t * 3.4)
      mesh.position
        .copy(p.dir)
        .multiplyScalar(p.dist * ease)
        .addScaledVector(p.normal, 0.02 + t * 0.05)
      mesh.rotation.x += p.spin.x * delta
      mesh.rotation.y += p.spin.y * delta
      ;(mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - t / life)
      mesh.visible = t < life
    })
  })

  return (
    <group position={burst.position}>
      {particles.map((p, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el }}>
          {p.shape === 0 ? (
            <tetrahedronGeometry args={[p.size]} />
          ) : p.shape === 1 ? (
            <boxGeometry args={[p.size, p.size * 0.6, p.size * 0.3]} />
          ) : (
            <octahedronGeometry args={[p.size * 0.8]} />
          )}
          <meshBasicMaterial color={p.color} transparent opacity={1} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Arco con pulso viajero: viaja del origen al destino y se desvanece.
 *
 * El tubo visible es una línea de un píxel: no se puede apuntar con el ratón.
 * Por eso se dibuja además un segundo tubo, invisible y mucho más ancho, que
 * es el que captura el puntero y alimenta el tooltip del arco.
 */
function Arc({
  attack,
  onArrive,
  onHover,
  onLeave,
}: {
  attack: AttackArcState
  onArrive: (a: AttackArcState) => void
  onHover: (a: AttackArcState, pointer: PointerPosition) => void
  onLeave: (a: AttackArcState) => void
}) {
  const curve = useMemo(
    () => buildCurve(attack.startCoords, attack.endCoords),
    [attack.startCoords, attack.endCoords],
  )
  const geometry = useMemo(
    () => new THREE.TubeGeometry(curve, 24, 0.008, 8, false),
    [curve],
  )
  const hitGeometry = useMemo(
    () => new THREE.TubeGeometry(curve, 24, ARC_HIT_RADIUS, 8, false),
    [curve],
  )
  const pulseRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const arrivedRef = useRef(false)

  useFrame(() => {
    const elapsed = performance.now() - attack.startTime
    const p = Math.min(1, elapsed / ARC_TRAVEL_MS)

    if (pulseRef.current) {
      pulseRef.current.position.copy(curve.getPoint(p))
      pulseRef.current.visible = p < 1
    }
    if (matRef.current) {
      const fadeIn = Math.min(1, elapsed / 300)
      const fadeOut =
        elapsed > ARC_TRAVEL_MS
          ? Math.max(0, 1 - (elapsed - ARC_TRAVEL_MS) / ARC_LINGER_MS)
          : 1
      matRef.current.opacity = 0.75 * fadeIn * fadeOut
    }
    if (!arrivedRef.current && p >= 1) {
      arrivedRef.current = true
      onArrive(attack)
    }
  })

  const startVec = useMemo(
    () => latLngToVector3(attack.startCoords[0], attack.startCoords[1], GLOBE_RADIUS + 0.01),
    [attack.startCoords],
  )

  return (
    <group>
      <mesh geometry={geometry}>
        <meshBasicMaterial ref={matRef} color={attack.color} transparent opacity={0} />
      </mesh>
      {/*
        Zona de captura del puntero: invisible, pero con `depthWrite` apagado
        para que no tape el arco que tiene delante.
      */}
      <mesh
        geometry={hitGeometry}
        onPointerOver={(e) => {
          // Solo el arco más cercano al puntero responde: si no, dos arcos
          // solapados se pelearían por el tooltip.
          e.stopPropagation()
          onHover(attack, e.nativeEvent)
        }}
        onPointerMove={(e) => {
          e.stopPropagation()
          onHover(attack, e.nativeEvent)
        }}
        onPointerOut={() => onLeave(attack)}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* Punto de origen: la IP real reportada por DShield. */}
      <mesh position={startVec}>
        <sphereGeometry args={[0.016, 8, 8]} />
        <meshBasicMaterial color={attack.color} />
      </mesh>
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshBasicMaterial color={attack.color} />
      </mesh>
    </group>
  )
}

/**
 * Textura diurna real (NASA Blue Marble) + relieve topográfico + máscara de
 * océanos. El globe NO rota por su cuenta: gira el grupo `RotatingEarth` que
 * lo envuelve, junto con las etiquetas, el pin, los arcos y las explosiones.
 * Si el globo rotase solo, todo lo demás se desfasaría de la superficie.
 */
function Globe() {
  const [colorMap, bumpMap, specMap] = useTexture([...GLOBE_TEXTURES])

  return (
    <group>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 128, 128]} />
        <meshPhongMaterial
          map={colorMap}
          bumpMap={bumpMap}
          bumpScale={0.08}
          specularMap={specMap}
          specular="#444444"
          shininess={25}
          emissive="#001133"
          emissiveIntensity={0.05}
        />
      </mesh>
      {/* Atmósfera (Glow) */}
      <mesh scale={1.02}>
        <sphereGeometry args={[GLOBE_RADIUS, 128, 128]} />
        <meshBasicMaterial color="#4a9eff" transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

/**
 * Gira la tierra + todo lo que está anclado a ella como una sola unidad.
 * Es lo que mantiene las etiquetas, el pin y los arcos sobre sus coordenadas.
 */
function RotatingEarth({ children }: { children: ReactNode }) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = advanceEarthRotation(groupRef.current.rotation.y, delta)
    }
  })
  return <group ref={groupRef}>{children}</group>
}

export default function CyberAttackMap3D() {
  const { t } = useLanguage()
  const [attacks, setAttacks] = useState<AttackArcState[]>([])
  const [bursts, setBursts] = useState<Burst[]>([])
  /**
   * `null` = server render / first paint, `false` = no WebGL context
   * available (render the fallback instead of letting three.js throw).
   */
  const [webglReady, setWebglReady] = useState<boolean | null>(null)
  const [feed, setFeed] = useState<ThreatIntelFeed>({
    events: [],
    dataSource: 'degraded',
  })
  const [lastUpdate, setLastUpdate] = useState('')
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(ATTACK_TYPES.map((a) => [a.code, 0])),
  )
  const attackIdRef = useRef(0)
  const burstIdRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  /** Arco que el puntero está señalando ahora mismo. */
  const [hovered, setHovered] = useState<AttackArcState | null>(null)

  const countries = useMemo(() => Object.keys(COUNTRY_COORDS), [])

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const res = await fetch('/api/threat-intel')
        if (res.ok) {
          const data = await res.json()
          setFeed({
            events: data.events || [],
            dataSource: data.dataSource === 'live' ? 'live' : 'degraded',
            sourceStatus: data.sourceStatus,
          })
          setLastUpdate(new Date(data.lastUpdated).toLocaleTimeString())
        }
      } catch (e) {
        console.error('Failed to fetch threat intel:', e)
      }
    }
    fetchRealData()
    const id = setInterval(fetchRealData, 60000)
    return () => clearInterval(id)
  }, [])

  // Probe WebGL on the client before mounting the renderer: without a context
  // three.js throws during render and would take the whole section down.
  // The probe needs the DOM, so it can only run after mount: a one-shot state
  // update here is intentional (no render-loop) and cannot be a lazy initial
  // state without breaking SSR/hydration.
  useEffect(() => {
    // Client-only probe (needs the DOM): one-shot state update, not a loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebglReady(hasWebGLSupport())
  }, [])

  /**
   * Eventos con origen atribuible: una IP real reportada por SANS y el país
   * que resolvió esa IP.
   *
   * Los eventos de CISA KEV no traen origen (KEV confirma explotación, no a
   * quién se atribuye) y los de muestra tampoco traen IP: usarlos como origen
   * de un arco sería inventar una atribución de país.
   */
  const attributableEvents = useMemo(
    () =>
      feed.events.filter(
        (event) =>
          Boolean(event.originIp) &&
          Boolean(event.originCountry) &&
          Boolean(COUNTRY_COORDS[event.originCountry as string]),
      ),
    [feed.events],
  )

  /** Generación de arcos: origen = país real de la IP, destino ponderado. */
  useEffect(() => {
    const interval = setInterval(() => {
      const realEvent =
        attributableEvents.length > 0
          ? attributableEvents[Math.floor(Math.random() * attributableEvents.length)]
          : undefined

      const start =
        realEvent?.originCountry && COUNTRY_COORDS[realEvent.originCountry]
          ? realEvent.originCountry
          : countries[Math.floor(Math.random() * countries.length)]

      const destination = pickDestination(countries, start)
      const fallbackType: AttackType =
        ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)]
      const kind = attackTypeFor(realEvent?.type, fallbackType)

      const newAttack: AttackArcState = {
        id: attackIdRef.current++,
        start,
        startCoords: COUNTRY_COORDS[start],
        endKey: destination.key,
        endCoords: destination.coords,
        endIsIllustrative: destination.kind === 'illustrative',
        originIsIllustrative: !realEvent,
        color: kind.color,
        code: kind.code,
        startTime: performance.now(),
        source: realEvent?.source,
        type: realEvent?.type || kind.type,
        originIp: realEvent?.originIp,
        originAs: realEvent?.originAs,
        reports: realEvent?.reports,
      }

      setAttacks((prev) => [...prev.slice(-34), newAttack])
      setTypeCounts((prev) => ({ ...prev, [kind.code]: (prev[kind.code] ?? 0) + 1 }))
    }, 700)
    return () => clearInterval(interval)
  }, [attributableEvents, countries])

  /** Poda de arcos y explosiones expirados. */
  useEffect(() => {
    const id = setInterval(() => {
      const now = performance.now()
      setAttacks((prev) => prev.filter((a) => now - a.startTime < ARC_TRAVEL_MS + ARC_LINGER_MS))
      setBursts((prev) => prev.filter((b) => now - b.startTime < BURST_LIFE_MS + 200))
      // Si el arco señalado ha expirado, su tooltip también se cierra.
      setHovered((prev) =>
        prev && now - prev.startTime >= ARC_TRAVEL_MS + ARC_LINGER_MS ? null : prev,
      )
    }, 500)
    return () => clearInterval(id)
  }, [])

  /**
   * Posiciona el tooltip bajo el puntero.
   *
   * La posición se escribe directamente en el DOM y no en el estado de React:
   * así el tooltip sigue al ratón sin re-renderizar la escena 3D en cada
   * movimiento. El estado solo cambia cuando cambia el arco apuntado.
   */
  const handleArcHover = useCallback((attack: AttackArcState, pointer: PointerPosition) => {
    const container = containerRef.current
    const tooltip = tooltipRef.current
    if (!container || !tooltip) return

    const rect = container.getBoundingClientRect()
    const x = pointer.clientX - rect.left
    const y = pointer.clientY - rect.top

    // El tooltip se coloca junto al puntero, pero siempre dentro del marco:
    // el contenedor recorta lo que se salga de él.
    let left = x + TOOLTIP_GAP
    if (left + TOOLTIP_WIDTH > rect.width) left = x - TOOLTIP_GAP - TOOLTIP_WIDTH
    if (left < 0) left = 0

    let top = y - TOOLTIP_HEIGHT / 2
    if (top < 0) top = 0
    if (top + TOOLTIP_HEIGHT > rect.height) top = Math.max(0, rect.height - TOOLTIP_HEIGHT)

    tooltip.style.left = `${left}px`
    tooltip.style.top = `${top}px`

    setHovered((prev) => (prev?.id === attack.id ? prev : attack))
  }, [])

  /**
   * Al salir el puntero del arco, el tooltip se cierra solo si sigue siendo ese
   * arco el señalado: si el puntero ya está sobre otro, no se toca.
   */
  const handleArcLeave = useCallback((attack: AttackArcState) => {
    setHovered((prev) => (prev?.id === attack.id ? null : prev))
  }, [])

  const handleArrive = useCallback((a: AttackArcState) => {
    const position = latLngToVector3(a.endCoords[0], a.endCoords[1], GLOBE_RADIUS + 0.01)
    setBursts((prev) => [
      ...prev.slice(-9),
      {
        id: burstIdRef.current++,
        position,
        startTime: performance.now(),
        color: a.color,
        particles: createBurstParticles(position, a.color),
      },
    ])
  }, [])

  /**
   * Etiquetas: Argentina siempre, más los países con arcos activos.
   * Los destinos que no son infraestructura real se marcan en otro color.
   */
  const labels = useMemo(() => {
    const seen = new Map<string, { coords: [number, number]; color: string }>()
    const argentina = COUNTRY_COORDS['Argentina']
    if (argentina) seen.set('Argentina', { coords: argentina, color: '#ff8fb3' })

    for (const attack of attacks) {
      if (seen.size >= 12) break
      const origin = COUNTRY_COORDS[attack.start]
      if (origin && !seen.has(attack.start)) {
        seen.set(attack.start, {
          coords: origin,
          color: attack.originIsIllustrative ? '#6b7a8c' : '#9fb0c0',
        })
      }
      if (seen.size >= 12) break
      const dest = COUNTRY_COORDS[attack.endKey]
      if (dest && !seen.has(attack.endKey)) {
        seen.set(attack.endKey, {
          coords: dest,
          color: attack.endIsIllustrative ? '#7f8fa3' : '#ff8fb3',
        })
      }
    }

    return Array.from(seen.entries())
  }, [attacks])

  /** IPs reales distintas que aparecen en el feed actual. */
  const distinctIps = useMemo(
    () => new Set(feed.events.map((e) => e.originIp).filter(Boolean)).size,
    [feed.events],
  )

  /** Sumatoria de listas de bloqueo que reporta SANS para las IPs del feed. */
  const blocklists = useMemo(
    () => feed.events.reduce((acc, e) => acc + (e.blocklistCount ?? 0), 0),
    [feed.events],
  )

  /** Vulnerabilidades de CISA KEV con explotación confirmada. */
  const kevCount = useMemo(
    () => feed.events.filter((e) => e.source === 'CISA KEV').length,
    [feed.events],
  )

  /** ¿El mapa se está alimentando de IPs reales? */
  const hasLiveOrigins = attributableEvents.length > 0
  const kevAvailable = feed.sourceStatus?.kev === 'live'

  const statCells = [
    ...ATTACK_TYPES.map((a) => ({
      code: a.code,
      value: typeCounts[a.code] ?? 0,
      title: interpolate(t('threatmap.stat.arcs'), { type: a.type }),
    })),
    { code: 'IPS', value: distinctIps, title: t('threatmap.stat.ips') },
    { code: 'BLS', value: blocklists, title: t('threatmap.stat.blocklists') },
    { code: 'CVE', value: kevCount, title: t('threatmap.stat.kev') },
  ]

  if (webglReady === false) {
    return <WebGLFallback message={t('threatmap.webgl.unavailable')} />
  }

  // Keep the map's height during SSR/first paint to avoid layout shift.
  if (webglReady === null) {
    return (
      <div className="relative w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden border border-blue-500/20 bg-black shadow-2xl" />
    )
  }

  return (
    <div
      ref={containerRef}
      style={{ cursor: hovered ? 'pointer' : undefined }}
      className="relative w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden border border-blue-500/20 bg-black shadow-2xl"
    >
      {/* Badge superior izquierdo */}
      <div className="absolute top-4 left-4 z-10 bg-black/70 backdrop-blur-md px-4 py-3 rounded-lg border border-blue-500/30">
        <div className="text-[10px] text-blue-400 font-bold tracking-[2px] mb-1">
          {t('threatmap.badge.title')}
        </div>
        <div
          className={`text-[10px] flex items-center gap-2 ${
            hasLiveOrigins ? 'text-emerald-400' : 'text-amber-400'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full animate-pulse ${
              hasLiveOrigins ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          {hasLiveOrigins ? t('threatmap.status.live') : t('threatmap.status.degraded')}
        </div>
        <div className="text-[9px] text-gray-400 mt-1" suppressHydrationWarning>
          {t('threatmap.status.updated')} {lastUpdate || '--:--:--'}
        </div>
      </div>

      {/* Leyenda de tipos */}
      <div className="absolute top-4 right-4 z-10 bg-black/70 backdrop-blur-md px-4 py-3 rounded-lg border border-blue-500/30">
        <div className="text-[9px] text-gray-400 mb-2 font-bold tracking-wider">
          {t('threatmap.legend.types')}
        </div>
        <div className="space-y-1.5">
          {ATTACK_TYPES.map((t) => (
            <div key={t.code} className="flex items-center gap-2 text-[10px]">
              <div
                className="w-3 h-0.5 rounded-full"
                style={{ backgroundColor: t.color, boxShadow: `0 0 6px ${t.color}` }}
              />
              <span className="text-gray-300">{t.type}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-blue-500/20 flex items-center gap-2 text-[10px]">
          <div
            className="w-2 h-2 rounded-full bg-pink-400"
            style={{ boxShadow: '0 0 6px #ff2d78' }}
          />
          <span className="text-pink-200">{t('threatmap.legend.protected')}</span>
        </div>
        {/* Estado real de cada feed: la leyenda no afirma lo que no hay. */}
        <div className="mt-2 pt-2 border-t border-blue-500/20 text-[9px] space-y-1">
          <div className="text-gray-400 font-bold tracking-wider">
            {t('threatmap.legend.sources')}
          </div>
          <div className="text-gray-300">
            DShield (SANS ISC):{' '}
            {hasLiveOrigins
              ? interpolate(t('threatmap.legend.dshield_live'), { count: distinctIps })
              : t('threatmap.legend.unavailable')}
          </div>
          <div className="text-gray-300">
            CISA KEV:{' '}
            {kevAvailable
              ? interpolate(t('threatmap.legend.kev_live'), { count: kevCount })
              : t('threatmap.legend.unavailable')}
          </div>
        </div>
      </div>

      <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, alpha: false }}>
        <color attach="background" args={['#000000']} />

        {/* Iluminación fotorrealista */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 3, 5]} intensity={2.0} color="#ffffff" />
        <directionalLight position={[-5, -3, -5]} intensity={0.5} color="#4a9eff" />
        <pointLight position={[0, 5, 0]} intensity={0.8} color="#ffffff" />

        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        {/* Todo lo anclado a la superficie gira junto: es lo que evita que las
            etiquetas, el pin y los arcos se desfasen de la superficie. */}
        <RotatingEarth>
          <Suspense fallback={null}>
            <Globe />

            {labels.map(([name, label]) => (
              <CountryLabel key={name} coords={label.coords} text={name} color={label.color} />
            ))}
            <CountryLabel
              coords={PROTECTED_DESTINATIONS.neuquen.coords}
              text="Neuquén"
              color="#ff8fb3"
              size={0.055}
            />

            <ProtectedPin coords={PROTECTED_DESTINATIONS.neuquen.coords} />

            {attacks.map((a) => (
              <Arc
                key={a.id}
                attack={a}
                onArrive={handleArrive}
                onHover={handleArcHover}
                onLeave={handleArcLeave}
              />
            ))}
            {bursts.map((b) => (
              <ImpactBurst key={b.id} burst={b} />
            ))}
          </Suspense>
        </RotatingEarth>

        <OrbitControls
          enableZoom
          enablePan={false}
          minDistance={3.5}
          maxDistance={9}
          autoRotate
          autoRotateSpeed={0.4}
        />
      </Canvas>

      {/*
        Tooltip del arco señalado: IP real, ASN, número de reportes y país de
        origen. Se posiciona por adelantado (escritura directa en el DOM) para
        que siga al puntero sin re-renderizar la escena.
      */}
      <div
        ref={tooltipRef}
        role={hovered ? 'tooltip' : undefined}
        aria-hidden={hovered ? undefined : true}
        className={`pointer-events-none absolute top-0 left-0 z-20 w-60 rounded-lg border border-blue-500/40 bg-black/90 px-3 py-2 shadow-xl backdrop-blur-md transition-opacity duration-150 ${
          hovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {hovered && <ArcTooltipPanel attack={hovered} />}
      </div>

      {/* Barra de estadísticas: número arriba, código abajo */}
      <div
        role="group"
        aria-label={t('threatmap.stats.aria')}
        className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 flex-wrap justify-center px-2"
      >
        {statCells.map((cell) => (
          <div key={cell.code} title={cell.title} className="flex flex-col items-center gap-1">
            <span className="bg-blue-700 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm tabular-nums">
              {cell.value}
            </span>
            <span className="bg-emerald-950/90 border border-emerald-500/30 text-emerald-100 font-mono text-[9px] px-2 py-0.5">
              {cell.code}
            </span>
          </div>
        ))}
      </div>

      {/* Pie honesto */}
      <div className="absolute bottom-4 left-4 right-4 z-10 bg-black/70 backdrop-blur-md px-4 py-2 rounded-lg border border-blue-500/30 flex justify-between items-center flex-wrap gap-2">
        <div
          className={`text-[9px] font-medium ${
            hasLiveOrigins ? 'text-emerald-400' : 'text-amber-400'
          }`}
        >
          {hasLiveOrigins ? t('threatmap.footer.live') : t('threatmap.footer.degraded')}
        </div>
      </div>
    </div>
  )
}
