import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

// One-off repair: un-escapes HTML entities that the old sanitizer wrote into the DB
// (e.g. `&amp;` in image URLs and `&amp;`/`&#39;` in text). Run: node scripts/fix-entities.js

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const ENTITIES = [['&amp;', '&'], ['&lt;', '<'], ['&gt;', '>'], ['&#39;', "'"], ['&#x27;', "'"], ['&quot;', '"'], ['&apos;', "'"]]
const unescape = (value) => {
  if (typeof value !== 'string' || !value.includes('&')) return value
  let out = value
  for (const [encoded, plain] of ENTITIES) out = out.split(encoded).join(plain)
  return out
}

const TARGETS = [
  ['courses', ['title', 'description', 'duration', 'level', 'image']],
  ['posts', ['title', 'excerpt', 'body', 'cover_image']],
  ['announcements', ['title', 'body']],
  ['categories', ['name', 'description']],
  ['branches', ['name', 'address', 'city', 'description']],
  ['staff', ['name', 'title', 'bio']],
  ['alumni', ['name', 'role_title', 'company', 'story']],
  ['testimonials', ['author', 'quote']],
  ['partners', ['name']],
  ['profiles', ['full_name', 'phone']],
  ['orders', ['student_name', 'phone']],
]

for (const [table, columns] of TARGETS) {
  const { data, error } = await supabase.from(table).select(['id', ...columns].join(', '))
  if (error) { console.warn(`${table}: ${error.message}`); continue }
  let fixed = 0
  for (const row of data) {
    const patch = {}
    for (const column of columns) {
      const next = unescape(row[column])
      if (next !== row[column]) patch[column] = next
    }
    if (Object.keys(patch).length) {
      const { error: updateError } = await supabase.from(table).update(patch).eq('id', row.id)
      if (updateError) console.warn(`${table} ${row.id}: ${updateError.message}`)
      else fixed += 1
    }
  }
  console.log(`${table}: repaired ${fixed} of ${data.length}`)
}
console.log('Entity repair complete.')
