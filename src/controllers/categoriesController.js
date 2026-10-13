import { matchedData } from 'express-validator'
import { supabase } from '../config/supabase.js'
import { sanitizeFields } from '../middlewares/sanitize.js'
import { unwrap } from '../utils/dbError.js'
import { slugify } from '../utils/slug.js'

const ORDER = ['sort_order', { ascending: true }]

// Category slugs are generated from the name (admin never types one).
async function uniqueSlug(name) {
  let root = slugify(name)
  if (root.length < 2) root = 'category'
  const rows = unwrap(await supabase.from('categories').select('slug'))
  const taken = new Set(rows.map((row) => row.slug))
  if (!taken.has(root)) return root
  let suffix = 2
  while (taken.has(`${root}-${suffix}`)) suffix += 1
  return `${root}-${suffix}`
}

export async function listCategories(req, res) {
  return res.json({ items: unwrap(await supabase.from('categories').select('*').order(...ORDER)) })
}

export async function createCategory(req, res) {
  const input = sanitizeFields(matchedData(req, { locations: ['body'] }))
  const slug = input.slug || await uniqueSlug(input.name)
  const row = unwrap(await supabase.from('categories').insert({
    slug,
    name: input.name,
    description: input.description || null,
    sort_order: input.sort_order ?? 0,
  }).select('*').single())
  return res.status(201).json({ item: row })
}

export async function updateCategory(req, res) {
  const { id } = matchedData(req, { locations: ['params'] })
  const input = sanitizeFields(matchedData(req, { locations: ['body'] }))
  const patch = {}
  if (input.name !== undefined) patch.name = input.name
  if (input.description !== undefined) patch.description = input.description || null
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order
  // The slug is intentionally not regenerated, so existing links keep working.
  return res.json({ item: unwrap(await supabase.from('categories').update(patch).eq('id', id).select('*').single(), 'Not found.') })
}

export async function deleteCategory(req, res) {
  const { id } = matchedData(req, { locations: ['params'] })
  unwrap(await supabase.from('categories').delete().eq('id', id))
  return res.status(204).end()
}
