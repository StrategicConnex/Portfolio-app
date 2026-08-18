/**
 * Cloud and storm SVG icons for the Tanos AI launcher.
 *
 * CloudIcon  — idle state: a fluffy white cloud
 * StormIcon  — thinking state: cloud with lightning bolt
 *
 * Both inherit the currentColor for the stroke/fill so they work
 * inside any container. The lightning bolt is amber-400.
 */
export function CloudIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Cloud body — fills most of the 32x32 viewBox */}
      <path
        d="M7 26a6 6 0 0 1-.56-11.97A9.3 9.3 0 0 1 26 16a6 6 0 0 1-.97 11.98A5.97 5.97 0 0 1 22 28H8.5a5.97 5.97 0 0 1-1.5-.67z"
        fill="white"
      />
      {/* Cloud highlight */}
      <path
        d="M10.5 17a4 4 0 0 1 7.65-1.6"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

export function StormIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Cloud body — fills top portion */}
      <path
        d="M6 19a6 6 0 0 1-.56-11.97A9.3 9.3 0 0 1 25 10a6 6 0 0 1-.97 11.98A5.97 5.97 0 0 1 21 22H7.5a5.97 5.97 0 0 1-1.5-.67z"
        fill="white"
      />
      {/* Lightning bolt — bigger, centered */}
      <path
        d="M17.5 14l-2 4.5h2.5l-3 6.5L18.5 20H16l2.5-4.5H16L18 12l-3 4h2.5L15 14h2.5z"
        fill="#FBBF24"
        stroke="#F59E0B"
        strokeWidth="0.4"
        strokeLinejoin="round"
      />
      {/* Rain drops */}
      <line x1="9" y1="22" x2="9" y2="25" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinecap="round" />
      <line x1="21" y1="22.5" x2="21" y2="25.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinecap="round" />
      <line x1="12" y1="23" x2="12" y2="26" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}
