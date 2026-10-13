import { matchedData } from 'express-validator'
import { supabase } from '../config/supabase.js'
import { sanitizeFields } from '../middlewares/sanitize.js'
import { unwrap } from '../utils/dbError.js'

const PUBLIC = 'id, title, excerpt, body, cover_image, author_name, created_at, updated_at, expires_at'
const nullable = (value) => (value === '' || value === undefined ? null : value)
const isLive = (row) => !row?.expires_at || new Date(row.expires_at).getTime() > Date.now()

// Public: published, unexpired posts only, newest first.
export async function listPublishedPosts(req, res) {
  const rows = unwrap(await supabase.from('posts').select('id, title, excerpt, cover_image, author_name, created_at, expires_at')
    .eq('published', true)
    .or('expires_at.is.null,expires_at.gt.now()')
    .order('created_at', { ascending: false }))
  return res.json({ posts: rows })
}

// Public: one published post plus its approved comments.
export async function getPost(req, res) {
  const { id } = matchedData(req, { locations: ['params'] })
  const post = unwrap(await supabase.from('posts').select(PUBLIC).eq('id', id).eq('published', true).maybeSingle(), 'Post not found.')
  if (!isLive(post)) return res.status(404).json({ error: { message: 'Post not found.' } })
  const comments = unwrap(await supabase.from('comments').select('id, author, body, created_at').eq('post_id', id).eq('approved', true).order('created_at', { ascending: true }))
  return res.json({ post, comments })
}

// Admin CRUD.
export async function listAllPosts(req, res) {
  return res.json({ items: unwrap(await supabase.from('posts').select('*').order('created_at', { ascending: false })) })
}

export async function createPost(req, res) {
  const input = sanitizeFields(matchedData(req, { locations: ['body'] }))
  const row = unwrap(await supabase.from('posts').insert({
    ...input,
    excerpt: input.excerpt || null,
    cover_image: input.cover_image || null,
    expires_at: nullable(input.expires_at),
    author_name: req.user.fullName || 'Jelani Consulting',
    created_by: req.user.id,
  }).select('*').single())
  return res.status(201).json({ item: row })
}

export async function updatePost(req, res) {
  const { id } = matchedData(req, { locations: ['params'] })
  const patch = sanitizeFields(matchedData(req, { locations: ['body'] }))
  if (patch.excerpt === '') patch.excerpt = null
  if (patch.cover_image === '') patch.cover_image = null
  if ('expires_at' in patch) patch.expires_at = nullable(patch.expires_at)
  return res.json({ item: unwrap(await supabase.from('posts').update(patch).eq('id', id).select('*').single(), 'Post not found.') })
}

export async function deletePost(req, res) {
  const { id } = matchedData(req, { locations: ['params'] })
  unwrap(await supabase.from('posts').delete().eq('id', id))
  return res.status(204).end()
}
