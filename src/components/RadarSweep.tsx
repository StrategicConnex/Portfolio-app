'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

/* ── Animated radar sweep on a canvas ── */
export default function RadarSweep() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width  = 220
    const H = canvas.height = 220
    // Cast after null guard — TS can't narrow through the nested draw() closure
    const c = canvas.getContext('2d')!
    if (!c) return
    const cx = W / 2, cy = H / 2, R = 90
    let angle = 0
    let rafId: number

    // Static blips (Purdue zones)
    const blips = [
      { a: 0.8,  r: 0.35, label: 'L0', color: '#F97316' },
      { a: 2.1,  r: 0.55, label: 'L1', color: '#C5A46D' },
      { a: 3.8,  r: 0.70, label: 'L2', color: '#1E90FF' },
      { a: 5.2,  r: 0.48, label: 'L3', color: '#06B6D4' },
      { a: 1.5,  r: 0.82, label: 'L4', color: '#10B981' },
    ]

    function draw() {
      c.clearRect(0, 0, W, H)

      // Background
      c.fillStyle = 'rgba(5,14,26,0.95)'
      c.fillRect(0, 0, W, H)

      // Concentric rings (Purdue levels)
      const ringColors = ['#F97316', '#C5A46D', '#1E90FF', '#06B6D4', '#10B981']
      for (let i = 1; i <= 5; i++) {
        const rr = (R / 5) * i
        c.beginPath()
        c.arc(cx, cy, rr, 0, Math.PI * 2)
        c.strokeStyle = ringColors[i - 1] + '22'
        c.lineWidth = 1
        c.stroke()
      }

      // Cross lines
      c.strokeStyle = 'rgba(30,144,255,0.1)'
      c.lineWidth = 0.5
      c.beginPath(); c.moveTo(cx - R, cy); c.lineTo(cx + R, cy); c.stroke()
      c.beginPath(); c.moveTo(cx, cy - R); c.lineTo(cx, cy + R); c.stroke()

      // Sweep gradient
      c.save()
      c.translate(cx, cy)
      c.rotate(angle)
      const grad = c.createLinearGradient(0, 0, R, 0)
      grad.addColorStop(0, 'rgba(30,144,255,0.5)')
      grad.addColorStop(1, 'rgba(30,144,255,0)')
      c.beginPath()
      c.moveTo(0, 0)
      c.arc(0, 0, R, -0.3, 0.01)
      c.closePath()
      c.fillStyle = grad
      c.fill()

      // Sweep line
      c.beginPath()
      c.moveTo(0, 0)
      c.lineTo(R, 0)
      c.strokeStyle = '#1E90FF'
      c.lineWidth = 1.5
      c.stroke()
      c.restore()

      // Blips
      blips.forEach(b => {
        const bx = cx + Math.cos(b.a) * R * b.r
        const by = cy + Math.sin(b.a) * R * b.r
        const delta = (angle - b.a + Math.PI * 4) % (Math.PI * 2)
        const glow  = Math.max(0, 1 - delta / (Math.PI * 0.6))
        c.beginPath()
        c.arc(bx, by, 3.5, 0, Math.PI * 2)
        c.fillStyle = b.color
        c.shadowBlur  = 8 * glow
        c.shadowColor = b.color
        c.globalAlpha = 0.5 + glow * 0.5
        c.fill()
        c.globalAlpha = 1
        c.shadowBlur = 0
      })

      // Center dot
      c.beginPath()
      c.arc(cx, cy, 5, 0, Math.PI * 2)
      c.fillStyle = '#C5A46D'
      c.shadowBlur = 12
      c.shadowColor = '#C5A46D'
      c.fill()
      c.shadowBlur = 0

      // Border circle
      c.beginPath()
      c.arc(cx, cy, R, 0, Math.PI * 2)
      c.strokeStyle = 'rgba(30,144,255,0.3)'
      c.lineWidth = 1.5
      c.stroke()

      angle = (angle + 0.018) % (Math.PI * 2)
      rafId = requestAnimationFrame(draw)
    }


    draw()
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.4, duration: 0.8, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        right: '8%',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.6rem',
        zIndex: 2,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ borderRadius: '50%', boxShadow: '0 0 40px rgba(30,144,255,0.15)' }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
        {[
          { color: '#10B981', label: 'L4 Enterprise' },
          { color: '#06B6D4', label: 'L3 Operations' },
          { color: '#1E90FF', label: 'L2 Supervisory' },
          { color: '#C5A46D', label: 'L1 Control' },
          { color: '#F97316', label: 'L0 Field' },
        ].map(z => (
          <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: z.color, boxShadow: `0 0 4px ${z.color}` }} />
            <span style={{ fontSize: '0.6rem', color: 'rgba(148,163,184,0.7)', fontFamily: 'monospace' }}>{z.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
