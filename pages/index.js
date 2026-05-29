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
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push('/dashboard')
  }

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="card shadow-sm" style={{ width: 360 }}>
        <div className="card-header bg-primary text-white text-center py-3">
          <h5 className="mb-0">🔧 Мониторинг работ</h5>
          <small className="opacity-75">Система контроля статусов НК</small>
        </div>
        <div className="card-body p-4">
          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Email</label>
              <input type="email" className="form-control form-control-sm"
                value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Пароль</label>
              <input type="password" className="form-control form-control-sm"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary btn-sm w-100" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
