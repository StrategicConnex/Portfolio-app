/**
 * Vitest setup: suppress React warnings for Three.js intrinsic elements in jsdom.
 *
 * Three.js primitives like <ambientLight>, <mesh>, <bufferGeometry> are lowercase
 * JSX elements that work at runtime via @react-three/fiber's custom reconciler,
 * but in jsdom they trigger React warnings about unrecognized HTML tags and
 * incorrect casing. This setup replaces console.error before React loads so
 * that its internal reference points to the filtered version.
 */

const originalConsoleError = console.error

// Three.js intrinsic element tags (lowercase) to suppress
const suppressedTags = new Set([
  'ambientlight', 'pointlight', 'mesh', 'meshbasicmaterial', 'points',
  'pointsmaterial', 'spheregeometry', 'buffergeometry', 'bufferattribute',
  'line', 'linebasicmaterial', 'group', 'color', 'fog',
])

// String patterns for Three.js-specific warnings that the tag filter misses
const suppressedPatterns = [
  'using incorrect casing',
  'Received `true` for a non-boolean',
]

console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : ''

  // Check for Three.js tag warnings by extracted tag name
  const tagMatch = msg.match(/<([\w]+)/)?.[1]?.toLowerCase()
  if (tagMatch && suppressedTags.has(tagMatch)) {
    return
  }

  // Check for specific Three.js prop/casing patterns
  for (const pattern of suppressedPatterns) {
    if (msg.includes(pattern)) return
  }

  originalConsoleError.call(console, ...args)
}
