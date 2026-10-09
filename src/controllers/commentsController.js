import { matchedData } from 'express-validator'
import { supabase } from '../config/supabase.js'
import { sanitizeFields } from '../middlewares/sanitize.js'
import { unwrap } from '../utils/dbError.js'

// Signed-in user comments on a published post. Held unapproved until an admin moderates.
export async function createComment(req, res) {
  const { id } = matchedData(req, { locations: ['params'] })
  const { body } = sanitizeFields(matchedData(req, { locations: ['body'] }))
  const post = unwrap(await supabase.from('posts').select('id').eq('id', id).eq('published', true).maybeSingle(), 'Post not found.')
  const row = unwrap(await supabase.from('comments').insert({
    post_id: post.id,
    user_id: req.user.id,
    author: req.user.fullName || req.user.email,
    body,
    approved: false,
  }).select('id, author, body, approved, created_at').single())
  return res.status(201).json({ comment: row, pending: true })
}

// Admin moderation queue.
export async function listComments(req, res) {
  let query = supabase.from('comments').select('*, post:posts(id, title)').order('created_at', { ascending: false })
  if (req.query.status === 'pending') query = query.eq('approved', false)
  if (req.query.status === 'approved') query = query.eq('approved', true)
  return res.json({ items: unwrap(await query) })
}

export async function setCommentApproval(req, res) {
  const { id } = matchedData(req, { locations: ['params'] })
  const { approved } = matchedData(req, { locations: ['body'] })
  return res.json({ item: unwrap(await supabase.from('comments').update({ approved }).eq('id', id).select('*, post:posts(id, title)').single(), 'Comment not found.') })
}

export async function deleteComment(req, res) {
  const { id } = matchedData(req, { locations: ['params'] })
  unwrap(await supabase.from('comments').delete().eq('id', id))
  return res.status(204).end()
}
