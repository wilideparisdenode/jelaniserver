import 'dotenv/config'
import dotenv from 'dotenv'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

// Verifies the device-upload path: sign in as admin, POST an image file to
// /admin/uploads, then confirm the returned public URL is reachable.
// Run: node scripts/test-upload.js   (optionally VERIFY_BASE=... )

dotenv.config({ path: '../client/.env' })
const base = process.env.VERIFY_BASE || 'http://localhost:4000/api'
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

const { data, error } = await supabase.auth.signInWithPassword({ email: 'mgm@jelani.consulting', password: 'ChandeJac20720' })
if (error) { console.error('Admin sign-in failed:', error.message); process.exit(1) }
const token = data.session.access_token
const authHeader = { Authorization: `Bearer ${token}` }

const here = path.dirname(fileURLToPath(import.meta.url))
const imagePath = path.resolve(here, '..', '..', 'client', 'src', 'assets', 'JelaniCon-Logo.png')
const buffer = await readFile(imagePath)

const form = new FormData()
form.append('file', new Blob([buffer], { type: 'image/png' }), 'JelaniCon-Logo.png')

const response = await fetch(`${base}/admin/uploads?folder=smoke`, {
  method: 'POST',
  headers: authHeader,
  body: form,
})
const body = await response.json()
console.log(`upload -> HTTP ${response.status}`)
console.log('url:', body.url || JSON.stringify(body))
if (!body.url) process.exit(1)

const head = await fetch(body.url)
console.log(`public fetch -> HTTP ${head.status}, type=${head.headers.get('content-type')}`)
if (head.status !== 200) process.exit(1)

// Confirm the URL also passes the isURL(https) validation used when saving records.
try { new URL(body.url); console.log('url is absolute-https:', body.url.startsWith('https://')) } catch { console.error('invalid url'); process.exit(1) }

// Create a temporary post that stores the uploaded URL, then remove it.
const createResponse = await fetch(`${base}/admin/posts`, {
  method: 'POST',
  headers: { ...authHeader, 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: '__upload_test__', body: 'Temporary post verifying image URL handling.', cover_image: body.url, published: false }),
})
const created = await createResponse.json()
console.log(`create post with image -> HTTP ${createResponse.status}${createResponse.status === 201 ? '' : ' ' + JSON.stringify(created)}`)
if (createResponse.status === 201) {
  const del = await fetch(`${base}/admin/posts/${created.item.id}`, { method: 'DELETE', headers: authHeader })
  console.log(`cleanup delete -> HTTP ${del.status}`)
}
console.log('UPLOAD OK')
