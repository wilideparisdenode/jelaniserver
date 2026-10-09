import { matchedData } from 'express-validator'
import { supabase } from '../config/supabase.js'
import { sanitizeFields } from '../middlewares/sanitize.js'
import { unwrap } from '../utils/dbError.js'
import { courseToRow, mapCourse } from '../utils/mappers.js'

const SELECT = '*, category:categories(id, slug, name), course_branches(branch:branches(id, name, mode, city, address))'

export async function listCourses(req, res) {
  let query = supabase.from('courses').select(SELECT).eq('published', true).order('created_at', { ascending: true })
  const { category } = req.query
  if (typeof category === 'string' && category) {
    const found = unwrap(await supabase.from('categories').select('id').eq('slug', category).maybeSingle())
    if (!found) return res.json({ courses: [] })
    query = query.eq('category_id', found.id)
  }
  return res.json({ courses: unwrap(await query).map(mapCourse) })
}

export async function getCourse(req, res) {
  const { id } = matchedData(req, { locations: ['params'] })
  const row = unwrap(await supabase.from('courses').select(SELECT).eq('id', id).eq('published', true).maybeSingle(), 'Course not found.')
  return res.json({ course: mapCourse(row) })
}

export async function listAdminCourses(req, res) {
  const rows = unwrap(await supabase.from('courses').select(SELECT).order('created_at', { ascending: true }))
  return res.json({ courses: rows.map(mapCourse) })
}

async function setBranches(courseId, branchIds) {
  if (!Array.isArray(branchIds)) return
  unwrap(await supabase.from('course_branches').delete().eq('course_id', courseId))
  if (branchIds.length) unwrap(await supabase.from('course_branches').insert(branchIds.map((branch_id) => ({ course_id: courseId, branch_id }))))
}

export async function createCourse(req, res) {
  const { branchIds, ...input } = sanitizeFields(matchedData(req, { locations: ['body'] }))
  const created = unwrap(await supabase.from('courses').insert(courseToRow(input)).select('id').single())
  await setBranches(created.id, branchIds)
  const row = unwrap(await supabase.from('courses').select(SELECT).eq('id', created.id).single())
  return res.status(201).json({ course: mapCourse(row) })
}

export async function updateCourse(req, res) {
  const { id } = matchedData(req, { locations: ['params'] })
  const { branchIds, id: _ignored, ...input } = sanitizeFields(matchedData(req, { locations: ['body'] }))
  const patch = courseToRow(input)
  if (Object.keys(patch).length) unwrap(await supabase.from('courses').update(patch).eq('id', id).select('id').single(), 'Course not found.')
  await setBranches(id, branchIds)
  const row = unwrap(await supabase.from('courses').select(SELECT).eq('id', id).single(), 'Course not found.')
  return res.json({ course: mapCourse(row) })
}

export async function deleteCourse(req, res) {
  const { id } = matchedData(req, { locations: ['params'] })
  unwrap(await supabase.from('courses').delete().eq('id', id))
  return res.status(204).end()
}
