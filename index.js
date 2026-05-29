import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'No token' })

  // Сначала получаем user id из токена
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Invalid token' })

  // Затем читаем свежие данные из БД через Admin API
  const { data: { user: freshUser } } = await supabaseAdmin.auth.admin.getUserById(user.id)

  const role = freshUser?.user_metadata?.role || 'master'
  return res.status(200).json({ role, email: freshUser?.email })
}
