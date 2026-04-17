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
      <p style={{ marginTop: '0.75rem', opacity: 0.72 }}>
        <a href="https://linkedin.com/in/juanfpalacios" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', marginRight: '0.75rem' }}>LinkedIn</a>
        <a href="https://github.com/StrategicConnex/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', marginRight: '0.75rem' }}>GitHub</a>
        <a href="https://www.credly.com/users/juan-palacios.88e7ba6c" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Credly</a>
      </p>
    </footer>
  )
}
