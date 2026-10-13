import { matchedData } from 'express-validator'
import { supabase } from '../config/supabase.js'
import { sanitizeFields } from '../middlewares/sanitize.js'
import { unwrap } from '../utils/dbError.js'
import { confirmedCourseIds } from './ordersController.js'

const SELECT = '*, course:courses(id, title)'
const nullable = (value) => (value === '' || value === undefined ? null : value)
const isLive = (row) => !row?.expires_at || new Date(row.expires_at).getTime() > Date.now()

export async function listAllAnnouncements(req, res) {
  return res.json({ items: unwrap(await supabase.from('announcements').select(SELECT).order('created_at', { ascending: false })) })
}

// Student: site-wide announcements plus those for courses they are enrolled in,
// excluding anything past its expiry.
export async function listMyAnnouncements(req, res) {
  const ids = await confirmedCourseIds(req.user.id)
  const filter = ids.length ? `course_id.is.null,course_id.in.(${ids.join(',')})` : 'course_id.is.null'
  const items = unwrap(await supabase.from('announcements').select(SELECT).or(filter).order('created_at', { ascending: false }))
  return res.json({ items: items.filter(isLive) })
}

export async function createAnnouncement(req, res) {
  const input = sanitizeFields(matchedData(req, { locations: ['body'] }))
  const row = unwrap(await supabase.from('announcements').insert({ ...input, course_id: input.course_id || null, expires_at: nullable(input.expires_at), created_by: req.user.id }).select(SELECT).single())
  return res.status(201).json({ item: row })
}

export async function deleteAnnouncement(req, res) {
  const { id } = matchedData(req, { locations: ['params'] })
  unwrap(await supabase.from('announcements').delete().eq('id', id))
  return res.status(204).end()
}
