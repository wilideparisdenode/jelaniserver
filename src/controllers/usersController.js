import { matchedData } from 'express-validator'
import { supabase } from '../config/supabase.js'
import { unwrap } from '../utils/dbError.js'

// Admin: every account with its email (emails live in auth.users, profiles hold the role).
export async function listUsers(req, res) {
  const profiles = unwrap(await supabase.from('profiles').select('id, full_name, phone, role, created_at').order('created_at', { ascending: false }))

  // Page through Supabase Auth to build an id -> email map (perPage max is 1000).
  const emails = new Map()
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !data?.users?.length) break
    for (const user of data.users) emails.set(user.id, user.email)
    if (data.users.length < 1000) break
  }

  return res.json({ items: profiles.map((profile) => ({ ...profile, email: emails.get(profile.id) ?? null })) })
}

// Admin: change a user's role between student, tutor and admin.
export async function updateUserRole(req, res) {
  const { id } = matchedData(req, { locations: ['params'] })
  const { role } = matchedData(req, { locations: ['body'] })
  if (id === req.user.id && role !== 'admin') {
    return res.status(400).json({ error: { message: 'You cannot change your own admin role.' } })
  }
  const row = unwrap(await supabase.from('profiles').update({ role }).eq('id', id).select('id, full_name, phone, role, created_at').maybeSingle(), 'User not found.')
  return res.json({ item: row })
}
