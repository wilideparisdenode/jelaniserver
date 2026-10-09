import { matchedData } from 'express-validator'
import { supabase } from '../config/supabase.js'
import { sanitizeFields } from '../middlewares/sanitize.js'
import { unwrap } from '../utils/dbError.js'
import { confirmedCourseIds } from './ordersController.js'

const SELECT = '*, course:courses(id, title)'

export async function listAllQuestions(req, res) {
  return res.json({ items: unwrap(await supabase.from('qa_questions').select(SELECT).order('created_at', { ascending: false })) })
}

// Student: questions in courses they are enrolled in.
export async function listMyQuestions(req, res) {
  const ids = await confirmedCourseIds(req.user.id)
  if (!ids.length) return res.json({ items: [] })
  return res.json({ items: unwrap(await supabase.from('qa_questions').select(SELECT).in('course_id', ids).order('created_at', { ascending: false })) })
}

export async function askQuestion(req, res) {
  const { courseId, question } = sanitizeFields(matchedData(req, { locations: ['body'] }))
  const enrolled = await confirmedCourseIds(req.user.id)
  if (!enrolled.includes(courseId)) return res.status(403).json({ error: { message: 'Enroll in this course to ask a question.' } })
  const row = unwrap(await supabase.from('qa_questions').insert({ course_id: courseId, user_id: req.user.id, author: req.user.fullName || req.user.email, question }).select(SELECT).single())
  return res.status(201).json({ item: row })
}

export async function answerQuestion(req, res) {
  const { id } = matchedData(req, { locations: ['params'] })
  const { answer } = sanitizeFields(matchedData(req, { locations: ['body'] }))
  const row = unwrap(await supabase.from('qa_questions').update({ answer, answered_by: req.user.id, answered_at: new Date().toISOString() }).eq('id', id).select(SELECT).single(), 'Question not found.')
  return res.json({ item: row })
}

export async function deleteQuestion(req, res) {
  const { id } = matchedData(req, { locations: ['params'] })
  unwrap(await supabase.from('qa_questions').delete().eq('id', id))
  return res.status(204).end()
}
