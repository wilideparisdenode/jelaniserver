import { matchedData } from 'express-validator'
import { supabase } from '../config/supabase.js'
import { sanitizeFields } from '../middlewares/sanitize.js'
import { unwrap } from '../utils/dbError.js'

// Public "Post Job" submission from employers. Held as 'pending' until an admin approves.
export async function submitJob(req, res) {
  const input = sanitizeFields(matchedData(req, { locations: ['body'] }))
  unwrap(await supabase.from('jobs').insert({ ...input, status: 'pending' }))
  return res.status(201).json({ message: 'Thanks! Your job is pending review.' })
}

export async function listApprovedJobs(req, res) {
  const rows = unwrap(await supabase.from('jobs').select('id, title, company, location, description, apply_email, created_at').eq('status', 'approved').order('created_at', { ascending: false }))
  return res.json({ items: rows })
}

export async function listAllJobs(req, res) {
  return res.json({ items: unwrap(await supabase.from('jobs').select('*').order('created_at', { ascending: false })) })
}

export async function setJobStatus(req, res) {
  const { id } = matchedData(req, { locations: ['params'] })
  const { status } = matchedData(req, { locations: ['body'] })
  return res.json({ item: unwrap(await supabase.from('jobs').update({ status }).eq('id', id).select('*').single(), 'Job not found.') })
}
