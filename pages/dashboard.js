import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { INSTALLATIONS, STATUSES, ADMIN_EMAILS } from '../lib/config'

function statusLabel(sid, pct) {
  const s = STATUSES.find(x => x.id === sid)
  if (!s) return sid
  return sid === 'nk_prep' && pct != null ? `Подготовка к НК на ${pct}%` : s.label
}

function statusColor(sid) {
  return STATUSES.find(x => x.id === sid)?.color || 'secondary'
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeInst, setActiveInst] = useState(INSTALLATIONS[0].id)
  const [positions, setPositions] = useState([])
  const [statuses, setStatuses] = useState({}) // posId -> {status_id, nk_percent}
  const [history, setHistory] = useState(null)  // null = closed, array = open
  const [historyPos, setHistoryPos] = useState(null)
  const [modal, setModal] = useState(null) // {posId, regNumber}
  const [selStatus, setSelStatus] = useState('')
  const [nkPct, setNkPct] = useState('')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('positions') // positions | report

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/'); return }
      setUser(data.user)
      setIsAdmin(ADMIN_EMAILS.includes(data.user.email))
    })
  }, [])

  const loadData = useCallback(async () => {
    const inst = INSTALLATIONS.find(i => i.id === activeInst)
    if (!inst) return

    const { data: posRows } = await supabase
      .from('positions')
      .select('*')
      .eq('inst_id', activeInst)
      .order('reg_number')

    // Убедимся что все позиции из конфига существуют в БД
    const existing = new Set((posRows || []).map(p => p.reg_number))
    const missing = inst.positions.filter(r => !existing.has(r))
    if (missing.length) {
      await supabase.from('positions').insert(
        missing.map(r => ({ inst_id: activeInst, reg_number: r }))
      )
    }

    const { data: allPos } = await supabase
      .from('positions').select('*').eq('inst_id', activeInst).order('reg_number')
    setPositions(allPos || [])

    const ids = (allPos || []).map(p => p.id)
    if (ids.length) {
      const { data: stRows } = await supabase
        .from('position_status').select('*').in('position_id', ids)
      const map = {}
      ;(stRows || []).forEach(s => { map[s.position_id] = s })
      setStatuses(map)
    }
  }, [activeInst])

  useEffect(() => { if (user) loadData() }, [user, loadData])

  async function openHistory(pos) {
    setHistoryPos(pos)
    const { data } = await supabase
      .from('status_history')
      .select('*')
      .eq('position_id', pos.id)
      .order('changed_at', { ascending: false })
      .limit(50)
    setHistory(data || [])
  }

  async function saveStatus() {
    if (!selStatus || !modal) return
    setSaving(true)
    const pct = selStatus === 'nk_prep' ? (parseInt(nkPct) || 0) : null

    // Upsert текущего статуса
    await supabase.from('position_status').upsert({
      position_id: modal.posId,
      status_id: selStatus,
      nk_percent: pct,
      updated_at: new Date().toISOString(),
      updated_by: user.email,
    }, { onConflict: 'position_id' })

    // Запись в историю
    await supabase.from('status_history').insert({
      position_id: modal.posId,
      status_id: selStatus,
      nk_percent: pct,
      changed_by: user.email,
    })

    setSaving(false)
    setModal(null)
    setSelStatus('')
    setNkPct('')
    loadData()
  }

  // Отчёт
  function buildReport() {
    const inst = INSTALLATIONS.find(i => i.id === activeInst)
    return STATUSES.map(s => {
      const count = positions.filter(p => {
        const st = statuses[p.id]
        return st && st.status_id === s.id
      }).length
      return { ...s, count }
    })
  }

  if (!user) return <div className="d-flex justify-content-center align-items-center min-vh-100"><div className="spinner-border text-primary"/></div>

  const instObj = INSTALLATIONS.find(i => i.id === activeInst)

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-sm navbar-dark bg-primary py-2 px-3">
        <span className="navbar-brand mb-0 fw-semibold">🔧 Мониторинг работ</span>
        <div className="ms-auto d-flex align-items-center gap-2">
          {isAdmin && (
            <a href="/admin" className="btn btn-outline-light btn-sm">⚙ Админ</a>
          )}
          <span className="text-white-50 small">{user.email}</span>
          <button className="btn btn-outline-light btn-sm"
            onClick={async () => { await supabase.auth.signOut(); router.push('/') }}>
            Выйти
          </button>
        </div>
      </nav>

      <div className="container-fluid py-3 px-3">
        {/* Выбор установки */}
        <div className="d-flex flex-wrap gap-2 mb-3">
          {INSTALLATIONS.map(inst => (
            <button key={inst.id}
              className={`btn btn-sm ${activeInst === inst.id ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => { setActiveInst(inst.id); setTab('positions') }}>
              {inst.name}
            </button>
          ))}
        </div>

        {/* Вкладки */}
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button className={`nav-link ${tab === 'positions' ? 'active' : ''}`}
              onClick={() => setTab('positions')}>Позиции</button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${tab === 'report' ? 'active' : ''}`}
              onClick={() => setTab('report')}>Отчёт</button>
          </li>
        </ul>

        {/* Таблица позиций */}
        {tab === 'positions' && (
          <div className="card shadow-sm">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <span>{instObj?.name} — позиции ({positions.length})</span>
            </div>
            <div className="card-body p-0">
              <table className="table table-hover table-bordered mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{width:220}}>Регистрационный №</th>
                    <th>Текущий статус</th>
                    <th style={{width:80}}>Изменён</th>
                    <th style={{width:160}}>Кем</th>
                    <th style={{width:110}}></th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map(pos => {
                    const st = statuses[pos.id]
                    return (
                      <tr key={pos.id}>
                        <td className="fw-semibold">{instObj?.name}, {pos.reg_number}</td>
                        <td>
                          {st
                            ? <span className={`badge bg-${statusColor(st.status_id)} status-badge`}>
                                {statusLabel(st.status_id, st.nk_percent)}
                              </span>
                            : <span className="text-muted small">—</span>}
                        </td>
                        <td className="history-time">
                          {st ? new Date(st.updated_at).toLocaleString('ru-RU', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : ''}
                        </td>
                        <td className="small text-truncate" style={{maxWidth:160}}>{st?.updated_by || ''}</td>
                        <td className="text-end">
                          <button className="btn btn-sm btn-outline-secondary me-1"
                            onClick={() => openHistory(pos)}>📋</button>
                          <button className="btn btn-sm btn-outline-primary"
                            onClick={() => { setModal({posId: pos.id, regNumber: pos.reg_number}); setSelStatus(st?.status_id || ''); setNkPct(st?.nk_percent || '') }}>
                            Статус
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {positions.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-muted py-3">Нет позиций</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Отчёт */}
        {tab === 'report' && (
          <div className="card shadow-sm" style={{maxWidth:520}}>
            <div className="card-header bg-light">
              Отчёт — {instObj?.name}
            </div>
            <div className="card-body">
              <p className="mb-2 fw-semibold">На текущий момент по {instObj?.name}:</p>
              {buildReport().map(r => (
                <div key={r.id} className="d-flex justify-content-between border-bottom py-1">
                  <span className="small">
                    {r.id === 'nk_prep' ? 'Подготовка к НК на XX% (в процессе)' : r.label}
                  </span>
                  <span className={`badge bg-${r.color} ms-2`}>{r.count} поз.</span>
                </div>
              ))}
              <div className="d-flex justify-content-between pt-2 fw-semibold">
                <span>Итого позиций</span>
                <span>{positions.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal смены статуса */}
      {modal && (
        <div className="modal show d-block" style={{background:'rgba(0,0,0,0.4)'}}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header py-2">
                <h6 className="modal-title">Смена статуса</h6>
                <button className="btn-close btn-sm" onClick={() => setModal(null)}/>
              </div>
              <div className="modal-body">
                <p className="small text-muted mb-2">{instObj?.name}, {modal.regNumber}</p>
                {STATUSES.map(s => (
                  <div key={s.id} className="form-check mb-1">
                    <input className="form-check-input" type="radio" name="status"
                      id={`st_${s.id}`} value={s.id}
                      checked={selStatus === s.id}
                      onChange={() => setSelStatus(s.id)} />
                    <label className="form-check-label small" htmlFor={`st_${s.id}`}>
                      <span className={`badge bg-${s.color} me-1`}></span>
                      {s.label}
                    </label>
                  </div>
                ))}
                {selStatus === 'nk_prep' && (
                  <div className="mt-2">
                    <label className="form-label small">Процент готовности</label>
                    <div className="input-group input-group-sm">
                      <input type="number" min="0" max="100" className="form-control"
                        value={nkPct} onChange={e => setNkPct(e.target.value)} placeholder="0–100"/>
                      <span className="input-group-text">%</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer py-2">
                <button className="btn btn-sm btn-secondary" onClick={() => setModal(null)}>Отмена</button>
                <button className="btn btn-sm btn-primary" onClick={saveStatus}
                  disabled={!selStatus || saving}>
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal истории */}
      {history !== null && historyPos && (
        <div className="modal show d-block" style={{background:'rgba(0,0,0,0.4)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header py-2">
                <h6 className="modal-title">История — {instObj?.name}, {historyPos.reg_number}</h6>
                <button className="btn-close btn-sm" onClick={() => { setHistory(null); setHistoryPos(null) }}/>
              </div>
              <div className="modal-body p-0">
                <table className="table table-sm table-bordered mb-0">
                  <thead className="table-light">
                    <tr><th>Дата/время</th><th>Статус</th><th>Кем изменено</th></tr>
                  </thead>
                  <tbody>
                    {history.map(h => (
                      <tr key={h.id}>
                        <td className="history-time">
                          {new Date(h.changed_at).toLocaleString('ru-RU')}
                        </td>
                        <td>
                          <span className={`badge bg-${statusColor(h.status_id)}`}>
                            {statusLabel(h.status_id, h.nk_percent)}
                          </span>
                        </td>
                        <td className="small">{h.changed_by}</td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr><td colSpan={3} className="text-center text-muted">Нет истории</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer py-2">
                <button className="btn btn-sm btn-secondary"
                  onClick={() => { setHistory(null); setHistoryPos(null) }}>Закрыть</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
