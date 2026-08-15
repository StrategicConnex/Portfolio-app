/**
 * Console filter para warnings conocidos de Three.js/postprocessing:
 *
 * 1. THREE.Clock deprecation - R3F internamente usa THREE.Clock para su
 *    frame loop. No es reemplazable sin actualizar R3F.
 * 2. WebGLProgram X4122 shader precision - warnings del compilador D3D
 *    (Windows) en shaders de postprocessing (DOF/Bloom). Son artifacts
 *    de precision float, no bugs visuales.
 *
 * Se ejecuta una vez al importar (app init).
 */

type LogFn = (...args: unknown[]) => void

const SUPPRESSED: RegExp[] = [
  /^THREE\.Clock:.*deprecated/,
  /warning X4122.*cannot be represented accurately/,
  /THREE\.\w+:.*has been deprecated/,
]

let patched = false

export function installConsoleFilter(): void {
  if (patched || typeof console === 'undefined') return
  patched = true

  const origWarn = console.warn.bind(console) as LogFn
  const origError = console.error.bind(console) as LogFn

  function match(args: unknown[]): boolean {
    const msg = args.map(a => (typeof a === 'string' ? a : String(a))).join(' ')
    return SUPPRESSED.some(p => p.test(msg))
  }

  console.warn = (...args: unknown[]) => {
    if (match(args)) {
      if (process.env.NODE_ENV !== 'production') console.debug('[suppressed]', ...args)
      return
    }
    origWarn(...args)
  }

  console.error = (...args: unknown[]) => {
    if (match(args)) {
      if (process.env.NODE_ENV !== 'production') console.debug('[suppressed]', ...args)
      return
    }
    origError(...args)
  }
}
