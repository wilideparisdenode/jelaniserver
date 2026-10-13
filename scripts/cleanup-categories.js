import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

// Removes stray/leftover category rows (e.g. a test category named "Whatever") that
// otherwise show up as filter buttons on the public courses page.
//
// Usage:
//   node scripts/cleanup-categories.js            # default: removes "Whatever"
//   node scripts/cleanup-categories.js "Some Name" # removes a specific name

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in server/.env')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
const target = (process.argv[2] || 'Whatever').trim()

const { data: rows, error } = await supabase.from('categories').select('id, slug, name').order('sort_order', { ascending: true })
if (error) {
  console.error('Could not read categories:', error.message)
  process.exit(1)
}

console.log(`Categories before (${rows.length}):`)
for (const row of rows) console.log(`  - ${row.name} (${row.slug})`)

const matches = rows.filter((row) => row.name.trim().toLowerCase() === target.toLowerCase())
if (!matches.length) {
  console.log(`\nNo category named "${target}" found. Nothing to delete.`)
  process.exit(0)
}

for (const row of matches) {
  const { error: delError } = await supabase.from('categories').delete().eq('id', row.id)
  if (delError) console.error(`Failed to delete ${row.name}: ${delError.message}`)
  else console.log(`Deleted category "${row.name}" (${row.slug}). Courses in it are now uncategorised.`)
}

const { data: after } = await supabase.from('categories').select('id, slug, name').order('sort_order', { ascending: true })
console.log(`\nCategories after (${after.length}):`)
for (const row of after) console.log(`  - ${row.name} (${row.slug})`)
