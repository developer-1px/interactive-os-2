import { useNavigate } from 'react-router-dom'

export default function PageLanding() {
  const navigate = useNavigate()

  return (
    <main className="content" style={{ gridColumn: '2 / -1' }}>
      <div style={{ maxWidth: 640, margin: '80px auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>interactive-os</h1>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 32 }}>
          Keyboard-first UI primitives for building accessible interfaces.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={() => navigate('/docs')} className="btn-primary">Get Started</button>
          <button onClick={() => navigate('/ui')} className="btn-secondary">Browse UI</button>
        </div>
      </div>
    </main>
  )
}
