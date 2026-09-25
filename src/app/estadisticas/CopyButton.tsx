'use client'

import { useRef, useState } from 'react'

/**
 * Copia la tabla de descargas como texto plano (TSV) al portapapeles.
 *
 * Patrón igual al de las tool cards de Ask AI: estado `copied` con timeout de
 * 2s. `renderValue` entra por props para que el texto copiado refleje el CSV
 * real aunque la tabla esté truncada visualmente (`max-w` + `truncate`).
 * Fallback silencioso si el portapapeles no está disponible (http, permisos).
 */
export function CopyButton({
  getText,
  label,
  copiedLabel,
  className,
}: {
  getText: () => string
  label: string
  copiedLabel: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getText())
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Sin permiso de portapapeles: no pasa nada, la tabla sigue visible.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      className={
        className ??
        'rounded-lg border border-[var(--surface-border)] px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-[var(--blue)] hover:text-foreground'
      }
    >
      {copied ? copiedLabel : label}
    </button>
  )
}
