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
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Cloud body */}
      <path
        d="M6.5 19a4.5 4.5 0 0 1-.42-8.98A7.003 7.003 0 0 1 19.73 11a4.5 4.5 0 0 1-.73 8.98A4.48 4.48 0 0 1 16 20H7.5a4.48 4.48 0 0 1-1-.5z"
        fill="white"
      />
      {/* Cloud highlight */}
      <path
        d="M9 12.5a3 3 0 0 1 5.73-1.2"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

export function StormIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Cloud body */}
      <path
        d="M6.5 15a4.5 4.5 0 0 1-.42-8.98A7.003 7.003 0 0 1 19.73 7a4.5 4.5 0 0 1-.73 8.98A4.48 4.48 0 0 1 16 16H7.5a4.48 4.48 0 0 1-1-.5z"
        fill="white"
      />
      {/* Lightning bolt */}
      <path
        d="M13 12l-1.5 3H13l-2 4.5L13.5 16H12l1.5-3H12l1.5-3.5L11 13h1.5L11.5 12h1.5z"
        fill="#FBBF24"
        stroke="#F59E0B"
        strokeWidth="0.3"
        strokeLinejoin="round"
      />
      {/* Small rain drops */}
      <line x1="8" y1="17" x2="8" y2="19" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="16" y1="17.5" x2="16" y2="19.5" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="10" y1="18" x2="10" y2="20" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  )
}
