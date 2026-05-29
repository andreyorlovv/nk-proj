import { createClient } from '@supabase/supabase-js'
import { INSTALLATIONS, STATUSES } from '../../lib/config'
import * as XLSX from 'xlsx'

const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const { inst_id } = req.query
  const inst = INSTALLATIONS.find(i => i.id === inst_id)
  if (!inst) return res.status(400).json({ error: 'Неверный inst_id' })

  const { data: positions } = await supa.from('positions').select('*').eq('inst_id', inst_id).order('reg_number')
  const ids = (positions || []).map(p => p.id)
  let statusMap = {}
  if (ids.length) {
    const { data: stRows } = await supa.from('position_status').select('*').in('position_id', ids)
    ;(stRows || []).forEach(s => { statusMap[s.position_id] = s })
  }

  const rows = (positions || []).map(p => {
    const st = statusMap[p.id]
    const sObj = STATUSES.find(s => s.id === st?.status_id)
    let label = sObj?.label || 'Не начато'
    if (st?.status_id === 'nk_prep' && st?.nk_percent != null) label = `Подготовка к НК на ${st.nk_percent}%`
    return {
      'Установка':     inst.name,
      'Рег. номер':    p.reg_number,
      'inst_id':       inst_id,
      'status_id':     st?.status_id || 'pending',
      'Статус':        label,
      'nk_percent':    st?.nk_percent ?? '',
      'Заблокировано': st?.blocked ? 'Да' : '',
      'Причина':       st?.block_reason || '',
      'Примечание':    st?.note || '',
      'Обновлено':     st?.updated_at ? new Date(st.updated_at).toLocaleString('ru-RU') : '',
      'Кем':           st?.updated_by || '',
    }
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, inst.name)
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(inst.name)}.xlsx"`)
  res.send(Buffer.from(buf))
}
