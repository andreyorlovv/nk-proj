import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import { IncomingForm } from 'formidable'
import fs from 'fs'

export const config = { api: { bodyParser: false } }

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const form = new IncomingForm({ uploadDir: '/tmp', keepExtensions: true })
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Ошибка загрузки файла' })

    const inst_id = Array.isArray(fields.inst_id) ? fields.inst_id[0] : fields.inst_id
    const file = Array.isArray(files.file) ? files.file[0] : files.file
    if (!file) return res.status(400).json({ error: 'Файл не найден' })

    try {
      const buf = fs.readFileSync(file.filepath)
      const wb = XLSX.read(buf, { type: 'buffer' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws)

      let imported = 0, updated = 0

      for (const row of rows) {
        const reg = String(row['reg_number'] || row['Рег. номер'] || '').trim()
        if (!reg) continue

        const rowInstId = row['inst_id'] || inst_id

        // Upsert позиции
        const { data: posData } = await supabaseAdmin
          .from('positions')
          .upsert({ inst_id: rowInstId, reg_number: reg }, { onConflict: 'inst_id,reg_number' })
          .select('id')
          .single()

        if (!posData?.id) { imported++; continue }

        // Если в Excel есть status_id — обновить статус
        const statusId = row['status_id'] || ''
        if (statusId) {
          const pct = row['nk_percent'] ? parseInt(row['nk_percent']) : null
          await supabaseAdmin.from('position_status').upsert({
            position_id: posData.id,
            status_id: statusId,
            nk_percent: pct,
            updated_at: new Date().toISOString(),
            updated_by: 'excel-import',
          }, { onConflict: 'position_id' })
          updated++
        } else {
          imported++
        }
      }

      fs.unlinkSync(file.filepath)
      return res.status(200).json({ imported, updated })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  })
}
