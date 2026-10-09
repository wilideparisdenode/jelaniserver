import 'dotenv/config'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Creates a course (with an uploaded image), reads it back, then deletes it.
// Run: node scripts/test-course.js   (optionally VERIFY_BASE=... )

dotenv.config({ path: '../client/.env' })
const base = process.env.VERIFY_BASE || 'http://localhost:4000/api'
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

const { data, error } = await supabase.auth.signInWithPassword({ email: 'mgm@jelani.consulting', password: 'ChandeJac20720' })
if (error) { console.error('Admin sign-in failed:', error.message); process.exit(1) }
const headers = { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' }

const categories = await (await fetch(`${base}/admin/categories`, { headers })).json()
const categoryId = categories.items?.[0]?.id
const slug = `smoke-course-${Date.now()}`

const payload = {
  id: slug,
  title: 'Smoke Test Course',
  description: 'Temporary course created by the smoke test to verify course creation.',
  duration: '1 week', level: 'Beginner', priceCents: 0, categoryId,
  image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80',
  syllabus: ['One', 'Two'], published: true,
}

const created = await fetch(`${base}/courses/admin`, { method: 'POST', headers, body: JSON.stringify(payload) })
const body = await created.json()
console.log(`create course -> HTTP ${created.status}${created.status === 201 ? '' : ' ' + JSON.stringify(body)}`)
if (created.status !== 201) process.exit(1)
console.log('created id:', body.course.id, 'image:', body.course.image)

const fetched = await (await fetch(`${base}/courses/${slug}`)).json()
console.log('public read image matches:', fetched.course?.image === payload.image)

const del = await fetch(`${base}/courses/admin/${slug}`, { method: 'DELETE', headers })
console.log(`cleanup delete -> HTTP ${del.status}`)
console.log('COURSE OK')
