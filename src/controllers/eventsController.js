import { matchedData } from 'express-validator'
import { supabase } from '../config/supabase.js'
import { sanitizeFields } from '../middlewares/sanitize.js'
import { unwrap } from '../utils/dbError.js'

const SELECT = '*, course:courses(id, title)'
const nullable = (value) => (value === '' || value === undefined ? null : value)

// Public: published events, soonest first (undated events last).
export async function listPublicEvents(req, res) {
  const rows = unwrap(await supabase.from('events').select('*').eq('published', true).order('event_date', { ascending: false, nullsFirst: false }))
  return res.json({ items: rows })
}

// Admin/tutor: every event including drafts.
export async function listAllEvents(req, res) {
  return res.json({ items: unwrap(await supabase.from('events').select(SELECT).order('created_at', { ascending: false })) })
}

export async function createEvent(req, res) {
  const input = sanitizeFields(matchedData(req, { locations: ['body'] }))
  const row = unwrap(await supabase.from('events').insert({
    ...input,
    cover_image: nullable(input.cover_image),
    video_url: nullable(input.video_url),
    event_date: nullable(input.event_date),
    location: nullable(input.location),
    created_by: req.user.id,
  }).select(SELECT).single())
  return res.status(201).json({ item: row })
}

export async function updateEvent(req, res) {
  const { id } = matchedData(req, { locations: ['params'] })
  const patch = sanitizeFields(matchedData(req, { locations: ['body'] }))
  for (const key of ['cover_image', 'video_url', 'event_date', 'location']) {
    if (key in patch) patch[key] = nullable(patch[key])
  }
  return res.json({ item: unwrap(await supabase.from('events').update(patch).eq('id', id).select(SELECT).single(), 'Event not found.') })
}

export async function deleteEvent(req, res) {
  const { id } = matchedData(req, { locations: ['params'] })
  unwrap(await supabase.from('events').delete().eq('id', id))
  return res.status(204).end()
}
