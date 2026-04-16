export default function Footer() {
  return (
    <footer
      style={{
        textAlign: 'center',
        padding: 'clamp(1rem, 2vw, 1.75rem) clamp(1rem, 5vw, 2rem)',
        color: 'var(--muted)',
        fontSize: 'clamp(0.7rem, 1.3vw, 0.78rem)',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg)',
        lineHeight: 1.8,
      }}
    >
      <p>
        © {new Date().getFullYear()}{' '}
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>Juan Felipe Palacios</span>
        {' · '}IT/OT Cybersecurity Architect
        {' · '}Neuquén, Argentina
      </p>
      <p style={{ marginTop: 'clamp(0.15rem, 0.5vw, 0.25rem)', opacity: 0.6 }}>
        Construido con Next.js 14 · Framer Motion · Three.js
      </p>
    </footer>
  )
}
