import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { INSTALLATIONS, ADMIN_EMAILS, STATUSES } from '../lib/config'

export default function Admin() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [newEmail, setNewEmail] = useState('')
  const [newPass, setNewPass] = useState('')
  const [creating, setCreating] = useState(false)
  const [msg, setMsg] = useState('')
  const [activeInst, setActiveInst] = useState(INSTALLATIONS[0].id)
  const [excelMsg, setExcelMsg] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/'); return }
      if (!ADMIN_EMAILS.includes(data.user.email)) { router.push('/dashboard'); return }
      setUser(data.user)
    })
  }, [])

  // Создание пользователя через API роут
  async function createUser(e) {
    e.preventDefault()
    setCreating(true); setMsg('')
    const res = await fetch('/api/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, password: newPass })
    })
    const data = await res.json()
    setCreating(false)
    if (data.error) { setMsg('Ошибка: ' + data.error); return }
    setMsg('Пользователь создан: ' + newEmail)
    setNewEmail(''); setNewPass('')
  }

  // Скачать Excel с текущими статусами
  async function downloadExcel() {
    const res = await fetch(`/api/excel-export?inst_id=${activeInst}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const inst = INSTALLATIONS.find(i => i.id === activeInst)
    a.href = url
    a.download = `${inst?.name || activeInst}_статусы.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Загрузить Excel (импорт позиций)
  async function uploadExcel(e) {
    const file = e.target.files[0]
    if (!file) return
    setExcelMsg('Загрузка...')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('inst_id', activeInst)
    const res = await fetch('/api/excel-import', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.error) { setExcelMsg('Ошибка: ' + data.error); return }
    setExcelMsg(`Импортировано: ${data.imported} поз., обновлено: ${data.updated} поз.`)
    fileRef.current.value = ''
  }

  if (!user) return <div className="d-flex justify-content-center align-items-center min-vh-100"><div className="spinner-border text-primary"/></div>

  return (
    <>
      <nav className="navbar navbar-dark bg-dark py-2 px-3">
        <span className="navbar-brand mb-0 fw-semibold">⚙ Панель администратора</span>
        <div className="ms-auto d-flex gap-2">
          <a href="/dashboard" className="btn btn-outline-light btn-sm">← Дашборд</a>
          <button className="btn btn-outline-light btn-sm"
            onClick={async () => { await supabase.auth.signOut(); router.push('/') }}>Выйти</button>
        </div>
      </nav>

      <div className="container py-4" style={{maxWidth:700}}>

        {/* Создание пользователя */}
        <div className="card shadow-sm mb-4">
          <div className="card-header">👤 Создать пользователя</div>
          <div className="card-body">
            {msg && <div className={`alert py-2 small alert-${msg.startsWith('Ошибка') ? 'danger' : 'success'}`}>{msg}</div>}
            <form onSubmit={createUser} className="row g-2">
              <div className="col-sm-5">
                <input type="email" className="form-control form-control-sm" placeholder="Email"
                  value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
              </div>
              <div className="col-sm-4">
                <input type="text" className="form-control form-control-sm" placeholder="Пароль"
                  value={newPass} onChange={e => setNewPass(e.target.value)} required minLength={6}/>
              </div>
              <div className="col-sm-3">
                <button type="submit" className="btn btn-primary btn-sm w-100" disabled={creating}>
                  {creating ? '...' : 'Создать'}
                </button>
              </div>
            </form>
            <div className="mt-2 small text-muted">
              Администраторы задаются в <code>lib/config.js</code> (ADMIN_EMAILS).
            </div>
          </div>
        </div>

        {/* Excel операции */}
        <div className="card shadow-sm mb-4">
          <div className="card-header">📊 Excel — импорт / экспорт</div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label small fw-semibold">Установка</label>
              <select className="form-select form-select-sm" style={{maxWidth:250}}
                value={activeInst} onChange={e => setActiveInst(e.target.value)}>
                {INSTALLATIONS.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>

            {excelMsg && (
              <div className={`alert py-2 small alert-${excelMsg.startsWith('Ошибка') ? 'danger' : 'success'}`}>
                {excelMsg}
              </div>
            )}

            <div className="d-flex flex-wrap gap-2">
              <button className="btn btn-success btn-sm" onClick={downloadExcel}>
                ⬇ Скачать статусы (.xlsx)
              </button>
              <label className="btn btn-outline-primary btn-sm mb-0">
                ⬆ Импорт позиций (.xlsx)
                <input type="file" accept=".xlsx,.xls" className="d-none" ref={fileRef} onChange={uploadExcel}/>
              </label>
            </div>

            <div className="mt-3 small text-muted">
              <strong>Формат импорта</strong>: колонки <code>inst_id</code>, <code>reg_number</code> (и опционально <code>status_id</code>, <code>nk_percent</code>).<br/>
              Скачайте текущий файл как шаблон.
            </div>
          </div>
        </div>

        {/* Конфигурация установок */}
        <div className="card shadow-sm">
          <div className="card-header">🏭 Установки (из config.js)</div>
          <div className="card-body p-0">
            <table className="table table-sm table-bordered mb-0">
              <thead className="table-light">
                <tr><th>Установка</th><th>Позиций в конфиге</th></tr>
              </thead>
              <tbody>
                {INSTALLATIONS.map(i => (
                  <tr key={i.id}>
                    <td>{i.name}</td>
                    <td>{i.positions.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
