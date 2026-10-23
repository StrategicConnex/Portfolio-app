import { describe, it, expect } from 'vitest'
import { buildArcTooltip, type TooltipLabels } from './arcTooltip'

/**
 * El tooltip es la única vía por la que se ve el detalle real de un ataque.
 * Estos tests fijan su contenido en los dos casos que importan: el arco con
 * datos de proveedor y el arco ilustrativo, que no puede presentar como
 * real nada que nadie publicó.
 *
 * Las etiquetas entran como parámetro (el panel las saca del diccionario),
 * así que aquí se usan unas fijas: lo que se verifica es la lógica del dato,
 * no el idioma.
 */
const LABELS: TooltipLabels = {
  ip: 'IP real',
  asn: 'ASN',
  reports: 'Reportes',
  country: 'País de origen',
  illustrativeSuffix: ' (ilustrativo)',
  fallbackTitle: 'Ataque',
  notice: 'Origen ilustrativo: el proveedor no publicó una IP para este arco.',
}

describe('buildArcTooltip', () => {
  it('muestra la IP, el ASN, los reportes y el país de origen reales', () => {
    const tooltip = buildArcTooltip(
      {
        start: 'United States',
        originIp: '13.94.254.200',
        originAs: 'MICROSOFT-CORP-MSN-AS-BLOCK',
        reports: 319739,
        originIsIllustrative: false,
        type: 'Port Scan / Probe',
        source: 'DShield (SANS ISC)',
      },
      LABELS,
    )

    expect(tooltip.title).toBe('Port Scan / Probe')
    expect(tooltip.source).toBe('DShield (SANS ISC)')
    expect(tooltip.rows).toEqual([
      { label: 'IP real', value: '13.94.254.200', real: true },
      { label: 'ASN', value: 'MICROSOFT-CORP-MSN-AS-BLOCK', real: true },
      { label: 'Reportes', value: '319.739', real: true },
      { label: 'País de origen', value: 'United States', real: true },
    ])
    expect(tooltip.notice).toBeUndefined()
  })

  it('no inventa datos en un arco sin IP real', () => {
    const tooltip = buildArcTooltip(
      {
        start: 'China',
        originIsIllustrative: true,
        type: 'DDoS / Flood',
      },
      LABELS,
    )

    expect(tooltip.rows).toEqual([
      { label: 'IP real', value: '—', real: false },
      { label: 'ASN', value: '—', real: false },
      { label: 'Reportes', value: '—', real: false },
      { label: 'País de origen', value: 'China (ilustrativo)', real: false },
    ])
    expect(tooltip.notice).toBeDefined()
    expect(tooltip.notice).toContain('Origen ilustrativo')
  })

  it('marca como no real el campo que el proveedor no publicó', () => {
    // SANS puede no conocer el ASN de una IP: el tooltip lo dice en vez de
    // rellenar el hueco con una cadena vacía.
    const tooltip = buildArcTooltip(
      {
        start: 'Germany',
        originIp: '1.2.3.4',
        reports: 42,
        originIsIllustrative: false,
      },
      LABELS,
    )

    const asn = tooltip.rows.find((row) => row.label === 'ASN')
    const reports = tooltip.rows.find((row) => row.label === 'Reportes')
    const ip = tooltip.rows.find((row) => row.label === 'IP real')

    expect(asn).toEqual({ label: 'ASN', value: '—', real: false })
    expect(reports?.real).toBe(true)
    expect(ip?.real).toBe(true)
  })

  it('usa un título de reserva cuando la fuente no declara el tipo', () => {
    const tooltip = buildArcTooltip(
      { start: 'Spain', originIsIllustrative: true },
      LABELS,
    )

    expect(tooltip.title).toBe('Ataque')
    expect(tooltip.source).toBeUndefined()
  })

  it('traduce las etiquetas que le llegan sin alterar los valores', () => {
    // El mismo arco, con el diccionario en inglés: cambian los rótulos y el
    // aviso, pero los datos del proveedor son idénticos.
    const tooltip = buildArcTooltip(
      {
        start: 'United States',
        originIp: '13.94.254.200',
        originAs: 'MICROSOFT-CORP-MSN-AS-BLOCK',
        reports: 319739,
        originIsIllustrative: false,
      },
      {
        ip: 'Real IP',
        asn: 'ASN',
        reports: 'Reports',
        country: 'Origin country',
        illustrativeSuffix: ' (illustrative)',
        fallbackTitle: 'Attack',
        notice: 'Illustrative origin.',
      },
    )

    expect(tooltip.rows.map((r) => r.label)).toEqual([
      'Real IP',
      'ASN',
      'Reports',
      'Origin country',
    ])
    expect(tooltip.rows[0].value).toBe('13.94.254.200')
  })
})
