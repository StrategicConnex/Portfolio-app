/**
 * StaticPoster — fallback "modo operational / low power" (SPEC §25).
 * Puramente decorativo (aria-hidden) y estático (sin animación): se muestra
 * con reduced-motion, sin WebGL, tier LOW, error del canvas o context lost.
 * No debe parecer un modo error: mantiene la identidad visual del datacenter.
 */
export default function StaticPoster() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        pointerEvents: 'none',
        background:
          'radial-gradient(ellipse at 50% 30%, #0d1b2e 0%, #050b14 55%, #02060c 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Rejilla técnica */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(30,144,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(30,144,255,0.05) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Rack central */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(340px, 70vw)',
          height: 'min(480px, 70vh)',
          border: '1px solid rgba(30,144,255,0.25)',
          borderRadius: 8,
          background: 'linear-gradient(180deg, rgba(13,27,46,0.9), rgba(5,11,20,0.95))',
          boxShadow: '0 0 80px rgba(30,144,255,0.08), inset 0 0 40px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '16px 14px',
        }}
      >
        {/* LEDs de estado */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <span style={led('#22c55e')} />
          <span style={led('#1e90ff')} />
          <span style={led('#f59e0b')} />
        </div>

        {/* Unidades del rack */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 44,
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.025)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 10px',
              gap: 8,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(30,144,255,0.5)' }} />
            <span
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: 9,
                letterSpacing: 1,
                color: 'rgba(148,163,184,0.55)',
              }}
            >
              U{String(20 - i).padStart(2, '0')} · {i % 2 === 0 ? 'CORE' : 'STORE'} · ONLINE
            </span>
          </div>
        ))}

        {/* Telemetría */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 10,
            letterSpacing: 2,
            color: 'rgba(94,234,212,0.5)',
            textAlign: 'center',
          }}
        >
          SYS IDLE · SAFE MODE · LOW POWER
        </div>
      </div>
    </div>
  )
}

function led(color: string) {
  return {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: color,
    boxShadow: `0 0 8px ${color}`,
    display: 'inline-block',
  } as const
}
