import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

// Safely change a single account's role (student | tutor | admin).
// Only an existing admin should do this in the running app; this script exists for
// bootstrapping and for fixing accounts that were assigned a role by mistake.
//
// Usage:
//   node scripts/set-role.js someone@example.com student
//   node scripts/set-role.js someone@example.com admin

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in server/.env')
  process.exit(1)
}

const [email, role] = process.argv.slice(2)
const allowed = ['student', 'tutor', 'admin']
if (!email || !role || !allowed.includes(role)) {
  console.error('Usage: node scripts/set-role.js <email> <student|tutor|admin>')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

let user
for (let page = 1; page <= 20 && !user; page += 1) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
  if (error) { console.error('auth.listUsers:', error.message); process.exit(1) }
  user = data.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase())
  if (data.users.length < 1000) break
}

if (!user) { console.error(`No account found for ${email}`); process.exit(1) }

const { error } = await supabase.from('profiles').update({ role }).eq('id', user.id)
if (error) { console.error(`Could not update role: ${error.message}`); process.exit(1) }
console.log(`${email} is now "${role}".`)
