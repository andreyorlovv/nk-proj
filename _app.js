import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Проверяем что вызывающий — admin
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (token) {
    const { data } = await supabaseAdmin.auth.getUser(token)
    const role = data.user?.user_metadata?.role
    if (!data.user || role !== 'admin') return res.status(403).json({ error: 'Нет доступа' })
  }

  const { email, password, role = 'master' } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Нужны email и пароль' })

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email, password,
    email_confirm: true,
    user_metadata: { role },
  })

  if (error) return res.status(400).json({ error: error.message })
  return res.status(200).json({ user: data.user })
}
