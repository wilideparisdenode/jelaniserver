import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

// Removes every account (and the data they own) EXCEPT admin accounts, so testers can
// start fresh. Courses, categories, branches, partners, quizzes and other shared
// catalogue content are left untouched.
//
// Usage:
//   node scripts/reset-users.js            # dry run: prints what would be deleted
//   node scripts/reset-users.js --execute  # actually deletes

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in server/.env.')
  process.exit(1)
}

const execute = process.argv.includes('--execute')
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const chunk = (list, size) => list.reduce((acc, _value, index) => (index % size ? acc : [...acc, list.slice(index, index + size)]), [])

// --- 1. Every auth user -----------------------------------------------------
const users = []
for (let page = 1; page <= 50; page += 1) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
  if (error) throw error
  users.push(...data.users)
  if (data.users.length < 1000) break
}

// --- 2. Profiles decide who is an admin ------------------------------------
const { data: profiles, error: profileError } = await supabase.from('profiles').select('id, role, full_name')
if (profileError) throw profileError
const roleById = new Map(profiles.map((profile) => [profile.id, profile.role]))

const admins = users.filter((user) => roleById.get(user.id) === 'admin')
const keepIds = admins.map((user) => user.id)
const deleteIds = users.filter((user) => !keepIds.includes(user.id)).map((user) => user.id)

if (!keepIds.length) {
  console.error('No admin account found (profiles.role = \'admin\'). Aborting so nothing is deleted.')
  process.exit(1)
}

console.log(`Accounts total : ${users.length}`)
console.log(`Keeping admins : ${admins.map((user) => `${user.email} (${user.id})`).join(', ')}`)
console.log(`To delete      : ${deleteIds.length} account(s)`)

if (!deleteIds.length) {
  console.log('Nothing to do.')
  process.exit(0)
}

// --- 3. Count related data --------------------------------------------------
const countRows = async (table, column) => {
  let total = 0
  for (const ids of chunk(deleteIds, 100)) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true }).in(column, ids)
    if (error) throw error
    total += count ?? 0
  }
  return total
}

const summary = {
  orders: await countRows('orders', 'user_id'),
  posts: await countRows('posts', 'created_by'),
  events: await countRows('events', 'created_by'),
  announcements: await countRows('announcements', 'created_by'),
}
console.log('Related rows to delete:', JSON.stringify(summary))

if (!execute) {
  console.log('\nDry run only. Re-run with --execute to delete.')
  process.exit(0)
}

// --- 4. Delete --------------------------------------------------------------
// Orders reference auth.users with ON DELETE RESTRICT, so remove them first.
for (const ids of chunk(deleteIds, 100)) {
  const { error } = await supabase.from('orders').delete().in('user_id', ids)
  if (error) throw error
}
// Content authored by the removed users.
for (const ids of chunk(deleteIds, 100)) {
  for (const table of ['posts', 'events', 'announcements']) {
    const { error } = await supabase.from(table).delete().in('created_by', ids)
    if (error) throw error
  }
}

// Deleting the auth user cascades profiles, comments, quiz_attempts and qa_questions.
let removed = 0
for (const id of deleteIds) {
  const { error } = await supabase.auth.admin.deleteUser(id)
  if (error) console.error(`Failed to delete ${id}: ${error.message}`)
  else removed += 1
}

console.log(`\nDeleted ${removed}/${deleteIds.length} account(s). Admins and catalogue content were kept.`)
