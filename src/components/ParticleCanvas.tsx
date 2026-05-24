'use client'

import { useEffect, useMemo, useState } from "react"
import Particles, { initParticlesEngine } from "@tsparticles/react"
import { loadLinksPreset } from "@tsparticles/preset-links"

export default function ParticleCanvas() {
  const [init, setInit] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadLinksPreset(engine)
    }).then(() => {
      setInit(true)
    })
  }, [])

  const options = useMemo(() => ({
    preset: "links",
    background: {
      color: {
        value: "transparent"
      }
    },
    fullScreen: {
      enable: false,
      zIndex: 0
    },
    particles: {
      number: {
        value: 100,
        density: {
          enable: true,
          area: 800
        }
      },
      color: {
        value: "#00f0ff",
        animation: {
          enable: true,
          speed: 15,
          sync: false
        }
      },
      links: {
        enable: true,
        distance: 140,
        blink: false,
        consent: false,
        opacity: 0.35,
        width: 1
      },
      move: {
        enable: true,
        speed: 1.5,
        direction: "none",
        random: true,
        straight: false,
        outModes: {
          default: "bounce"
        }
      },
      size: {
        value: { min: 2, max: 4 }
      },
      opacity: {
        value: { min: 0.3, max: 0.7 }
      }
    },
    interactivity: {
      detectsOn: "canvas",
      events: {
        onHover: {
          enable: true,
          mode: ["grab", "bubble"]
        },
        onClick: {
          enable: true,
          mode: "push"
        }
      },
      modes: {
        grab: {
          distance: 180,
          links: {
            opacity: 0.7
          }
        },
        bubble: {
          distance: 150,
          size: 10,
          duration: 2,
          opacity: 1,
          color: {
            value: "#ffffff"
          }
        },
        push: {
          quantity: 4
        }
      }
    }
  }), [])

  if (!init) {
    return (
      <div 
        style={{ position: 'absolute', inset: 0, zIndex: 0, background: '#000000' }}
        aria-hidden="true"
      />
    )
  }

  return (
    <div
      style={{ position: 'absolute', inset: 0, zIndex: 0, background: '#000000', overflow: 'hidden' }}
      aria-hidden="true"
    >
      <Particles
        id="tsparticles"
        options={options as Record<string, unknown>}
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
      />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at center, transparent 0%, #000000 100%)',
        pointerEvents: 'none',
        zIndex: 1
      }} />
    </div>
  )
}

