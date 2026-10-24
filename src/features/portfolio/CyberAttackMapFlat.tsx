'use client'

import { useMemo } from 'react'
import { PROTECTED_DESTINATIONS } from './attackArc'
import { buildFlatArcPath, projectToFlat, wrapFlatLongitude } from './flatProjection'
import { useLanguage } from '@/context/LanguageContext'

/**
 * Vista plana del mapa de ciberataques.
 *
 * Es un mapa equirectangular real (la misma textura NASA del globo) con los
 * arcos proyectados a 2D. No rota: los botones laterales desplazan el
 * encuadre y el zoom escala la imagen y los arcos juntos.
 */

interface FlatAttack {
  id: number
  startCoords: [number, number]
  endCoords: [number, number]
  color: string
}

interface FlatMapProps {
  attacks: FlatAttack[]
  labels: Array<[string, { coords: [number, number]; color: string }]>
  /** Escala actual de la vista plana. */
  scale: number
  /** Desplazamiento horizontal, en porcentaje del ancho. */
  pan: number
}

export default function CyberAttackMapFlat({
  attacks,
  labels,
  scale,
  pan,
}: FlatMapProps) {
  const { t } = useLanguage()

  const arcs = useMemo(
    () =>
      attacks.map((attack) => {
        const start = projectToFlat(attack.startCoords[0], attack.startCoords[1])
        const end = projectToFlat(attack.endCoords[0], attack.endCoords[1])
        end.x = wrapFlatLongitude(start.x, end.x)

        return {
          id: attack.id,
          color: attack.color,
          d: buildFlatArcPath(attack.startCoords, attack.endCoords),
          start,
          end,
        }
      }),
    [attacks],
  )

  const hub = projectToFlat(
    PROTECTED_DESTINATIONS.neuquen.coords[0],
    PROTECTED_DESTINATIONS.neuquen.coords[1],
  )

  return (
    <div
      data-testid="flat-attack-map"
      className="absolute inset-0 overflow-hidden bg-black"
    >
      <div
        className="absolute inset-0 origin-center transition-transform duration-200 ease-out"
        style={{ transform: `scale(${scale}) translateX(${pan}%)` }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-55"
          style={{
            backgroundImage: "url('/textures/earth-blue-marble.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-black/45" />

        <svg
          viewBox="0 0 360 180"
          preserveAspectRatio="xMidYMid slice"
          role="img"
          aria-label={t('threatmap.flat.aria')}
          className="absolute inset-0 h-full w-full"
        >
          {/* Tres copias con el mismo desplazamiento del antimeridiano: la
              parte que sale por un borde aparece por el otro. El viewBox
              recorta el resto. */}
          {[-360, 0, 360].map((offset) => (
            <g key={offset} transform={`translate(${offset} 0)`}>
              {arcs.map((arc) => (
                <g key={arc.id}>
                  <path
                    d={arc.d}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth={0.55}
                    strokeLinecap="round"
                    opacity={0.9}
                  />
                  <circle cx={arc.start.x} cy={arc.start.y} r={0.8} fill={arc.color} />
                  <circle cx={arc.end.x} cy={arc.end.y} r={0.9} fill={arc.color} opacity={0.8} />
                </g>
              ))}
            </g>
          ))}

          {labels.map(([name, label]) => {
            const point = projectToFlat(label.coords[0], label.coords[1])
            return (
              <text
                key={name}
                x={point.x}
                y={point.y - 2}
                fill={label.color}
                fontSize={4}
                textAnchor="middle"
                fontFamily="monospace"
                letterSpacing={0.2}
                stroke="#000000"
                strokeWidth={0.8}
                paintOrder="stroke"
              >
                {name.toUpperCase()}
              </text>
            )
          })}

          {/* Hub protegido: el mismo punto del globo, proyectado en 2D. */}
          <circle
            cx={hub.x}
            cy={hub.y}
            r={2.6}
            fill="none"
            stroke="#ff2d78"
            strokeWidth={0.5}
            opacity={0.55}
          />
          <circle cx={hub.x} cy={hub.y} r={1.1} fill="#ff2d78" />
          <text
            x={hub.x + 2.4}
            y={hub.y - 2}
            fill="#ff8fb3"
            fontSize={3.4}
            fontFamily="monospace"
            stroke="#000000"
            strokeWidth={0.6}
            paintOrder="stroke"
          >
            Neuquén
          </text>
        </svg>
      </div>
    </div>
  )
}
