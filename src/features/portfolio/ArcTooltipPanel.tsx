import { useLanguage } from '@/context/LanguageContext'
import { buildArcTooltip, type ArcTooltipSource } from './arcTooltip'

/**
 * Panel del tooltip de un arco: IP real, ASN, número de reportes y país de
 * origen.
 *
 * Los valores que el proveedor no publicó se muestran como «—» y los que no
 * proceden del proveedor (arcos ilustrativos) se marcan como tales, para que
 * el tooltip no afirme más de lo que el feed sabe. Las etiquetas salen del
 * diccionario: el mapa se lee igual en español y en inglés.
 */
export default function ArcTooltipPanel({ attack }: { attack: ArcTooltipSource }) {
  const { t } = useLanguage()

  const tooltip = buildArcTooltip(attack, {
    ip: t('threatmap.tooltip.ip'),
    asn: t('threatmap.tooltip.asn'),
    reports: t('threatmap.tooltip.reports'),
    country: t('threatmap.tooltip.country'),
    illustrativeSuffix: t('threatmap.tooltip.illustrative_suffix'),
    fallbackTitle: t('threatmap.tooltip.fallback_title'),
    notice: t('threatmap.tooltip.notice'),
  })

  return (
    <div>
      <div className="text-[10px] font-bold tracking-[2px] text-blue-300 uppercase">
        {tooltip.title}
      </div>
      {tooltip.source && (
        <div className="text-[9px] text-gray-400 mt-0.5">{tooltip.source}</div>
      )}

      <dl className="mt-2 space-y-1">
        {tooltip.rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3">
            <dt className="text-[9px] tracking-wide text-gray-400 uppercase">{row.label}</dt>
            <dd
              className={`min-w-0 text-right font-mono text-[10px] break-all ${
                row.real ? 'text-emerald-300' : 'text-gray-500'
              }`}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      {tooltip.notice && (
        <p className="mt-2 text-[9px] leading-snug text-amber-300/90">{tooltip.notice}</p>
      )}
    </div>
  )
}
