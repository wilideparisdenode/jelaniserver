import { matchedData } from 'express-validator'
import { supabase } from '../config/supabase.js'
import { unwrap } from '../utils/dbError.js'

// Sign-in / sign-up happen in the browser against Supabase Auth.
// The API only exposes the verified identity.
export async function me(req, res) {
  return res.json({ user: req.user })
}

export async function updateProfile(req, res) {
  const { fullName, phone } = matchedData(req, { locations: ['body'] })
  const patch = {}
  if (fullName !== undefined) patch.full_name = fullName
  if (phone !== undefined) patch.phone = phone || null
  unwrap(await supabase.from('profiles').update(patch).eq('id', req.user.id))
  return res.json({ user: { ...req.user, fullName: fullName ?? req.user.fullName, phone: phone ?? req.user.phone } })
}
