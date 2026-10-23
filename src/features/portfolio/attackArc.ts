import { COUNTRY_COORDS, PROTECTED_HUB } from '@/data/countryCoords'

export interface AttackType {
  /** Código corto que se muestra en la barra de estadísticas. */
  code: string
  type: string
  color: string
}

/** Tipos de ataque que el mapa sabe pintar. */
export const ATTACK_TYPES: AttackType[] = [
  { code: 'DDS', type: 'DDoS / Flood', color: '#ff4444' },
  { code: 'BC2', type: 'Botnet C2', color: '#ff8800' },
  { code: 'BRF', type: 'Brute Force (SSH/RDP)', color: '#ffff00' },
  { code: 'SQL', type: 'SQL Injection', color: '#ff00ff' },
  { code: 'APT', type: 'APT / Exploit', color: '#ff0088' },
  { code: 'SCN', type: 'Port Scan / Probe', color: '#00ffff' },
]

/**
 * Palabras clave que identifican cada tipo de ataque dentro del texto del
 * evento que publica el endpoint (`"Port Scan / Probe"`, `"Exploit: CVE-..."`).
 */
const TYPE_KEYWORDS: Array<{ keywords: string[]; type: string }> = [
  { keywords: ['ddos', 'flood'], type: 'DDoS / Flood' },
  { keywords: ['botnet', 'c2'], type: 'Botnet C2' },
  { keywords: ['brute', 'ssh', 'rdp'], type: 'Brute Force (SSH/RDP)' },
  { keywords: ['sql', 'inject'], type: 'SQL Injection' },
  { keywords: ['apt', 'exploit', 'cve'], type: 'APT / Exploit' },
  { keywords: ['scan', 'probe', 'port'], type: 'Port Scan / Probe' },
]

export interface AttackOrigin {
  /** País de origen resuelto por el endpoint. */
  originCountry?: string
  /** Texto del tipo de ataque que declara la fuente. */
  type?: string
  /** Feed del que procede el evento. */
  source?: string
}

/**
 * Destino de un arco.
 *
 * `kind` distingue lo que es real de lo que es ilustrativo:
 *  - `hub`: infraestructura que el autor dice proteger (Argentina / Neuquén).
 *  - `illustrative`: un país cualquiera del mundo, elegido al azar. No es un
 *    dato del proveedor: DShield no publica a quién ataca.
 */
export interface Destination {
  key: string
  coords: [number, number]
  kind: 'hub' | 'illustrative'
}

/**
 * Destinos protegidos reales: la infraestructura del autor.
 * NO vienen de ningún feed de amenazas, así que se marcan como `hub`.
 */
export const PROTECTED_DESTINATIONS: Record<'argentina' | 'neuquen', Destination> = {
  argentina: { key: 'Argentina', coords: COUNTRY_COORDS['Argentina'], kind: 'hub' },
  neuquen: { key: 'Neuquén', coords: [PROTECTED_HUB.lat, PROTECTED_HUB.lng], kind: 'hub' },
}

/** Pesos del destino: 5% Neuquén, 20% Argentina, 75% global (ilustrativo). */
export const DESTINATION_WEIGHTS = {
  neuquen: 0.05,
  argentina: 0.2,
  global: 0.75,
} as const

/**
 * Elige el destino de un arco según los pesos definidos.
 *
 * @param countries Países con coordenadas conocidas (candidatos al destino global).
 * @param originCountry País de origen; se excluye del destino global para no
 *                      dibujar un arco de un país a sí mismo.
 * @param random Fuente de aleatoriedad. Se inyecta para poder testear los pesos.
 */
export function pickDestination(
  countries: string[],
  originCountry?: string,
  random: () => number = Math.random,
): Destination {
  const roll = random()

  if (roll < DESTINATION_WEIGHTS.neuquen) {
    return { ...PROTECTED_DESTINATIONS.neuquen, coords: [...PROTECTED_DESTINATIONS.neuquen.coords] }
  }

  if (roll < DESTINATION_WEIGHTS.neuquen + DESTINATION_WEIGHTS.argentina) {
    return {
      ...PROTECTED_DESTINATIONS.argentina,
      coords: [...PROTECTED_DESTINATIONS.argentina.coords],
    }
  }

  // Destino global: cualquier país salvo Argentina (ya tiene rama propia) y
  // el propio origen.
  const pool = countries.filter(
    (country) => country !== 'Argentina' && country !== originCountry,
  )
  const key = pool[Math.floor(random() * pool.length)] ?? 'Argentina'
  return { key, coords: COUNTRY_COORDS[key], kind: 'illustrative' }
}

export interface AttackArcData {
  /** Origen del arco, en `[latitud, longitud]`. */
  start: [number, number]
  /** Destino del arco, en `[latitud, longitud]`. */
  end: [number, number]
  color: string
  type: string
  source: string
  /** El arco no sale de un evento real: se dibuja atenuado. */
  illustrative: boolean
  /** Nombre del destino, para etiquetarlo en la superficie. */
  destinationKey: string
  /** Si el destino es infraestructura real o un país ilustrativo. */
  destinationKind: Destination['kind']
}

/**
 * Traduce el texto del evento al tipo de ataque que lo representa.
 * Si no hay coincidencia se devuelve el tipo de respaldo, nunca un acierto falso.
 */
export function attackTypeFor(eventType: string | undefined, fallback: AttackType): AttackType {
  if (!eventType) return fallback

  const normalized = eventType.toLowerCase()
  const match = TYPE_KEYWORDS.find(({ keywords }) => keywords.some((k) => normalized.includes(k)))
  if (!match) return fallback

  return ATTACK_TYPES.find((t) => t.type === match.type) ?? fallback
}

/**
 * Construye el arco de un evento de amenazas.
 *
 * El origen es el país real que resolvió el endpoint. El destino es el hub
 * protegido por defecto, pero puede pasarse otro (el mapa reparte los arcos
 * entre Argentina, Neuquén y destinos globales ilustrativos).
 *
 * @param event Evento real, o `undefined` si no hay ninguno disponible.
 * @param fallbackCountry País al que se recurre cuando el evento no aporta
 *                        un origen resoluble. Solo se usa para arcos ilustrativos.
 * @param fallbackType Tipo de ataque al que se recurre si el evento no lo declara.
 * @param destination Destino del arco.
 */
export function buildAttackArc(
  event: AttackOrigin | undefined,
  fallbackCountry: string,
  fallbackType: AttackType,
  destination: Destination = PROTECTED_DESTINATIONS.neuquen,
): AttackArcData {
  const origin = event?.originCountry ? COUNTRY_COORDS[event.originCountry] : undefined
  const start: [number, number] = origin ?? COUNTRY_COORDS[fallbackCountry] ?? [0, 0]
  const type = attackTypeFor(event?.type, fallbackType)

  return {
    start,
    end: destination.coords,
    color: type.color,
    type: event?.type ?? type.type,
    source: event?.source ?? 'Muestra',
    illustrative: !origin,
    destinationKey: destination.key,
    destinationKind: destination.kind,
  }
}
