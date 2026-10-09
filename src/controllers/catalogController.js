import { supabase } from '../config/supabase.js'
import { unwrap } from '../utils/dbError.js'

// Public, read-only marketing content for the home page.
const read = (table, order, select = '*', filter) => async (req, res) => {
  let query = supabase.from(table).select(select).order(...order)
  if (filter) query = query.match(filter)
  return res.json({ items: unwrap(await query) })
}

export const listCategories = read('categories', ['sort_order', { ascending: true }])
export const listBranches = read('branches', ['sort_order', { ascending: true }])
export const listPartners = read('partners', ['sort_order', { ascending: true }])
export const listStaff = read('staff', ['sort_order', { ascending: true }])
export const listAlumni = read('alumni', ['sort_order', { ascending: true }], '*, course:courses(id, title)')
export const listTestimonials = read('testimonials', ['created_at', { ascending: false }], '*, course:courses(id, title)', { published: true })
