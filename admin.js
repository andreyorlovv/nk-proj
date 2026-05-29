import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError('Неверный email или пароль'); return }
    router.push('/dashboard')
  }

  return (
    <div style={{ minHeight:'100vh', background:'#1a237e', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ marginBottom:32, textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:8 }}>🔧</div>
        <h1 style={{ color:'white', fontSize:'1.5rem', fontWeight:700, margin:0 }}>Мониторинг работ</h1>
        <p style={{ color:'rgba(255,255,255,0.6)', margin:'4px 0 0', fontSize:'0.9rem' }}>Система контроля статусов НК</p>
      </div>
      <div style={{ background:'white', borderRadius:20, padding:'28px 24px', width:'100%', maxWidth:380, boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
        {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label small fw-semibold text-muted">EMAIL</label>
            <input type="email" className="form-control" style={{borderRadius:10, padding:'10px 14px'}}
              value={email} onChange={e => setEmail(e.target.value)} required autoFocus
              placeholder="your@email.com" />
          </div>
          <div className="mb-4">
            <label className="form-label small fw-semibold text-muted">ПАРОЛЬ</label>
            <input type="password" className="form-control" style={{borderRadius:10, padding:'10px 14px'}}
              value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••" />
          </div>
          <button type="submit" className="btn btn-primary w-100 btn-action" disabled={loading}
            style={{borderRadius:12, padding:'12px', fontWeight:600, background:'#1a237e', border:'none'}}>
            {loading ? <><span className="spinner-border spinner-border-sm me-2"/>Вход...</> : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}
