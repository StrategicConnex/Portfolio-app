/**
 * Root loading shell (Next.js `loading.tsx` convention).
 * The home page is deliberately dynamic (SSR i18n via cookies/headers,
 * see ADR-001), so this shell renders instantly while sections stream in.
 */
export default function Loading() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* Navbar skeleton */}
      <header
        className="sticky top-0 z-[100] backdrop-blur-xl border-b"
        style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span
            className="font-mono font-bold tracking-tight animate-pulse"
            style={{ color: 'var(--gold)' }}
          >
            JFP
          </span>
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-8 rounded-md animate-pulse"
              style={{ background: 'var(--border)' }}
            />
            <span
              className="w-8 h-8 rounded-md animate-pulse"
              style={{ background: 'var(--border)' }}
            />
          </div>
        </nav>
      </header>

      {/* Hero skeleton */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24">
        <span
          className="w-24 h-3 rounded-full animate-pulse mb-6"
          style={{ background: 'var(--border)' }}
        />
        <span
          className="w-72 max-w-full h-10 rounded-md animate-pulse mb-4"
          style={{ background: 'var(--border)' }}
        />
        <span
          className="w-56 max-w-full h-3 rounded-full animate-pulse mb-10"
          style={{ background: 'var(--border)' }}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-2xl animate-pulse"
              style={{ background: 'var(--border)' }}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
