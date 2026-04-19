export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function randomizePercentages(items: { label: string; pct: number }[]) {
  const next = items.map(item => ({
    ...item,
    pct: clamp(item.pct + Math.round((Math.random() - 0.5) * 6), 1, 90),
  }))
  const total = next.reduce((sum, item) => sum + item.pct, 0)
  return next.map(item => ({
    ...item,
    pct: Math.max(1, Math.round((item.pct / total) * 100)),
  })).sort((a, b) => b.pct - a.pct)
}

export function randomizeThreatCounts(items: { label: string; count: number; color: string }[]) {
  return items.map(item => ({
    ...item,
    count: clamp(item.count + Math.round((Math.random() - 0.5) * 4), 0, 40),
  }))
}

export function randomizeZones(items: { label: string; pct: number; color: string; events: number }[]) {
  return items.map(item => ({
    ...item,
    pct: clamp(item.pct + Math.round((Math.random() - 0.5) * 2), 90, 100),
    events: clamp(item.events + Math.round((Math.random() - 0.5) * 16), 10, 1400),
  }))
}

export function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
