import { matchedData } from 'express-validator'
import { supabase } from '../config/supabase.js'
import { sanitizeFields } from '../middlewares/sanitize.js'
import { unwrap } from '../utils/dbError.js'
import { confirmedCourseIds } from './ordersController.js'

const SELECT = '*, course:courses(id, title)'

export async function listAllQuizzes(req, res) {
  return res.json({ items: unwrap(await supabase.from('quizzes').select(SELECT).order('created_at', { ascending: false })) })
}

// Strip answer keys before sending quizzes to students.
const hideAnswers = (quiz) => ({ ...quiz, questions: (quiz.questions ?? []).map(({ prompt, options }) => ({ prompt, options })) })

export async function listMyQuizzes(req, res) {
  const ids = await confirmedCourseIds(req.user.id)
  if (!ids.length) return res.json({ items: [] })
  const rows = unwrap(await supabase.from('quizzes').select(SELECT).in('course_id', ids).eq('published', true).order('created_at', { ascending: false }))
  return res.json({ items: rows.map(hideAnswers) })
}

export async function createQuiz(req, res) {
  const input = sanitizeFields(matchedData(req, { locations: ['body'] }))
  return res.status(201).json({ item: unwrap(await supabase.from('quizzes').insert(input).select(SELECT).single()) })
}

export async function updateQuiz(req, res) {
  const { id } = matchedData(req, { locations: ['params'] })
  const input = sanitizeFields(matchedData(req, { locations: ['body'] }))
  return res.json({ item: unwrap(await supabase.from('quizzes').update(input).eq('id', id).select(SELECT).single(), 'Quiz not found.') })
}

export async function deleteQuiz(req, res) {
  const { id } = matchedData(req, { locations: ['params'] })
  unwrap(await supabase.from('quizzes').delete().eq('id', id))
  return res.status(204).end()
}

// Student submits answers (array of selected option indexes); scored server-side.
export async function submitQuiz(req, res) {
  const { id } = matchedData(req, { locations: ['params'] })
  const { answers } = matchedData(req, { locations: ['body'] })
  const quiz = unwrap(await supabase.from('quizzes').select('*').eq('id', id).eq('published', true).maybeSingle(), 'Quiz not found.')
  const enrolled = await confirmedCourseIds(req.user.id)
  if (!enrolled.includes(quiz.course_id)) return res.status(403).json({ error: { message: 'Enroll in this course to take the quiz.' } })

  const questions = quiz.questions ?? []
  const score = questions.reduce((sum, question, index) => sum + (Number(answers[index]) === question.answerIndex ? 1 : 0), 0)
  unwrap(await supabase.from('quiz_attempts').insert({ quiz_id: id, user_id: req.user.id, score, total: questions.length }))
  return res.json({ score, total: questions.length })
}
