import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

// Diagnostics: lists every account with its role and whether its email is confirmed, so we
// can spot accounts that may have been granted admin unintentionally.
//
// Usage: node scripts/audit-users.js

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in server/.env')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

const { data: profiles, error } = await supabase.from('profiles').select('id, full_name, role, created_at').order('created_at', { ascending: true })
if (error) { console.error('profiles:', error.message); process.exit(1) }

const emails = new Map()
for (let page = 1; page <= 20; page += 1) {
  const { data, error: listError } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
  if (listError) { console.error('auth.listUsers:', listError.message); break }
  for (const user of data.users) emails.set(user.id, { email: user.email, confirmed: Boolean(user.email_confirmed_at) })
  if (data.users.length < 1000) break
}

console.log(`Accounts: ${profiles.length}\n`)
console.log('ROLE'.padEnd(9), 'CONFIRMED'.padEnd(10), 'EMAIL'.padEnd(34), 'NAME')
for (const profile of profiles) {
  const info = emails.get(profile.id) ?? {}
  console.log(
    String(profile.role).padEnd(9),
    String(info.confirmed ?? '?').padEnd(10),
    String(info.email ?? '(no auth user)').padEnd(34),
    profile.full_name ?? '—',
  )
}

const admins = profiles.filter((profile) => profile.role === 'admin')
console.log(`\nAdmins (${admins.length}): ${admins.map((profile) => emails.get(profile.id)?.email ?? profile.id).join(', ') || 'none'}`)
