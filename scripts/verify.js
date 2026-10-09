import 'dotenv/config'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Smoke-test the API end to end. Run: node scripts/verify.js
// (loads client/.env for the anon key so it can sign in)

dotenv.config({ path: '../client/.env' })

const base = process.env.VERIFY_BASE || 'http://localhost:4000/api'
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

function show(label, value) { console.log(`${label}: ${value}`) }

const { data, error } = await supabase.auth.signInWithPassword({ email: 'mgm@jelani.consulting', password: 'ChandeJac20720' })
if (error) { console.error('Admin sign-in failed:', error.message); process.exit(1) }
const headers = { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' }

const me = await (await fetch(`${base}/auth/me`, { headers })).json()
show('auth/me', `${me.user?.email} (role ${me.user?.role})`)

const free = await (await fetch(`${base}/stripe/fee-breakdown?courseId=intro-digital-skills`, { headers })).json()
show('free fee-breakdown', JSON.stringify(free))

const paid = await (await fetch(`${base}/stripe/fee-breakdown?courseId=full-stack-web`, { headers })).json()
show('paid fee-breakdown', JSON.stringify(paid))

const checkout = await fetch(`${base}/stripe/checkout-session`, { method: 'POST', headers, body: JSON.stringify({ courseId: 'intro-digital-skills', name: 'mgm' }) })
const checkoutBody = await checkout.json()
show('free checkout', `HTTP ${checkout.status} -> ${checkoutBody.url}`)

const orders = await (await fetch(`${base}/student/orders`, { headers })).json()
show('my orders', (orders.orders || []).map((o) => `${o.status}:${o.courseId}`).join(', '))

const comments = await (await fetch(`${base}/admin/comments`, { headers })).json()
show('admin comments', `${(comments.items || []).length} total`)

const roster = await (await fetch(`${base}/admin/roster`, { headers })).json()
show('admin roster', `${(roster.students || []).length} confirmed student(s)`)
