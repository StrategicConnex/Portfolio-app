/**
 * Datos del tooltip de un arco.
 *
 * El tooltip es por donde se ve el detalle real de un ataque (IP, ASN, número
 * de reportes), así que tiene que distinguir siempre entre lo que publicó el
 * proveedor y lo que el mapa eligió por su cuenta: un arco ilustrativo no
 * puede presentar como dato lo que nadie publicó.
 *
 * Las **etiquetas** no viven aquí: entran como parámetro (`TooltipLabels`)
 * para que el panel las saque del diccionario y el mapa sea bilingüe. Esta
 * función sigue siendo pura y sin dependencias de React.
 */

/** Datos que el tooltip necesita de un arco. */
export interface ArcTooltipSource {
  /** País de origen dibujado en el mapa. */
  start: string
  /** IP real reportada por el proveedor. */
  originIp?: string
  /** ASN de la IP, tal y como lo publica el proveedor. */
  originAs?: string
  /** Número de reportes del proveedor para esa IP. */
  reports?: number
  /** El origen del arco no se puede atribuir a una IP real. */
  originIsIllustrative: boolean
  /** Tipo de ataque declarado por la fuente. */
  type?: string
  /** Feed del que procede el evento. */
  source?: string
}

/** Etiquetas de las filas del tooltip, en el idioma de la interfaz. */
export interface TooltipLabels {
  ip: string
  asn: string
  reports: string
  country: string
  /** Sufijo que marca el país de origen como ilustrativo. */
  illustrativeSuffix: string
  /** Título de reserva cuando la fuente no declara el tipo de ataque. */
  fallbackTitle: string
  /** Aviso para los arcos que no tienen datos de proveedor detrás. */
  notice: string
}

/** Una fila del tooltip. */
export interface TooltipRow {
  label: string
  value: string
  /** La fila contiene un dato real del proveedor. */
  real: boolean
}

/** Contenido completo del tooltip. */
export interface ArcTooltip {
  /** Título: el tipo de ataque. */
  title: string
  /** Subtítulo: el feed del que procede. */
  source?: string
  rows: TooltipRow[]
  /** Aviso para los arcos que no tienen datos de proveedor detrás. */
  notice?: string
}

/** Separador de miles en formato español. */
function formatCount(value: number): string {
  return new Intl.NumberFormat('es-ES').format(value)
}

/**
 * Construye el contenido del tooltip de un arco.
 *
 * Los campos que el proveedor no publicó se muestran como «—» (no como un
 * cero ni como un valor inventado) y las filas que no proceden del proveedor
 * quedan marcadas como no reales para que la interfaz las pueda distinguir.
 */
export function buildArcTooltip(
  attack: ArcTooltipSource,
  labels: TooltipLabels,
): ArcTooltip {
  const illustrative = attack.originIsIllustrative

  const rows: TooltipRow[] = [
    {
      label: labels.ip,
      value: attack.originIp ?? '—',
      real: !illustrative && Boolean(attack.originIp),
    },
    {
      label: labels.asn,
      value: attack.originAs ?? '—',
      real: !illustrative && Boolean(attack.originAs),
    },
    {
      label: labels.reports,
      value: typeof attack.reports === 'number' ? formatCount(attack.reports) : '—',
      real: !illustrative && typeof attack.reports === 'number',
    },
    {
      label: labels.country,
      value: illustrative ? `${attack.start}${labels.illustrativeSuffix}` : attack.start,
      real: !illustrative,
    },
  ]

  return {
    title: attack.type ?? labels.fallbackTitle,
    source: attack.source,
    rows,
    notice: illustrative ? labels.notice : undefined,
  }
}
