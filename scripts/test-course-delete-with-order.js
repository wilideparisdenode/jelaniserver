import 'dotenv/config'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Regression test for course deletion: a course that has an order attached previously
// could not be deleted (orders.course_id uses ON DELETE RESTRICT). This creates a course,
// attaches a pending order, then deletes the course through the API and asserts both the
// course and its order are gone.
//
// Run: node scripts/test-course-delete-with-order.js   (server must be running)

dotenv.config({ path: '../client/.env' })
const base = process.env.VERIFY_BASE || 'http://localhost:4000/api'

const service = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const anon = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

const { data: auth, error: authError } = await anon.auth.signInWithPassword({ email: 'mgm@jelani.consulting', password: 'ChandeJac20720' })
if (authError) { console.error('Admin sign-in failed:', authError.message); process.exit(1) }
const headers = { Authorization: `Bearer ${auth.session.access_token}`, 'Content-Type': 'application/json' }

const slug = `delete-order-test-${Date.now()}`
const payload = {
  id: slug,
  title: 'Delete With Order Test',
  description: 'Temporary course used to verify deletion works when orders reference it.',
  duration: '1 week', level: 'Beginner', priceCents: 5000, syllabus: ['One'], published: true,
}

const created = await fetch(`${base}/courses/admin`, { method: 'POST', headers, body: JSON.stringify(payload) })
if (created.status !== 201) { console.error('create failed:', created.status, await created.text()); process.exit(1) }
console.log('created course:', slug)

const { error: orderError } = await service.from('orders').insert({
  user_id: auth.session.user.id,
  course_id: slug,
  student_name: 'Test Student',
  email: 'test@example.com',
  status: 'pending',
  subtotal_cents: 5000,
  fee_cents: 180,
  total_cents: 5180,
})
if (orderError) { console.error('order insert failed:', orderError.message); process.exit(1) }
console.log('attached a pending order to the course')

const del = await fetch(`${base}/courses/admin/${slug}`, { method: 'DELETE', headers })
console.log(`delete course -> HTTP ${del.status}`)
if (del.status !== 204) { console.error('FAILED: delete returned', del.status, await del.text()); process.exit(1) }

const { data: course } = await service.from('courses').select('id').eq('id', slug).maybeSingle()
const { data: order } = await service.from('orders').select('id').eq('course_id', slug).maybeSingle()
console.log('course gone:', !course, '| order gone:', !order)
if (course || order) { console.error('FAILED: rows still present'); process.exit(1) }
console.log('COURSE DELETE WITH ORDER OK')
