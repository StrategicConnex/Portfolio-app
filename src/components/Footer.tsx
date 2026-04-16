export default function Footer() {
  return (
    <footer
      style={{
        textAlign: 'center',
        padding: '1.75rem 2rem',
        color: 'var(--muted)',
        fontSize: '0.78rem',
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
      <p style={{ marginTop: '0.25rem', opacity: 0.6 }}>
        Construido con Next.js 14 · Framer Motion · Three.js
      </p>
    </footer>
  )
}
