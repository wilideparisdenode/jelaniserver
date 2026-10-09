import { matchedData } from 'express-validator'
import { supabase } from '../config/supabase.js'
import { unwrap } from '../utils/dbError.js'
import { mapOrder } from '../utils/mappers.js'

const SELECT = '*, course:courses(id, title)'

// Admin: every order.
export async function listOrders(req, res) {
  const rows = unwrap(await supabase.from('orders').select(SELECT).order('created_at', { ascending: false }))
  return res.json({ orders: rows.map(mapOrder) })
}

// Admin: confirmed students only ("Student Roster").
export async function listRoster(req, res) {
  const rows = unwrap(await supabase.from('orders').select(SELECT).eq('status', 'confirmed').order('student_name', { ascending: true }))
  return res.json({ students: rows.map(mapOrder) })
}

// Student: own orders.
export async function listMyOrders(req, res) {
  const rows = unwrap(await supabase.from('orders').select(SELECT).eq('user_id', req.user.id).order('created_at', { ascending: false }))
  return res.json({ orders: rows.map(mapOrder) })
}

// Shared helper: course ids the user has a confirmed order for.
export async function confirmedCourseIds(userId) {
  const rows = unwrap(await supabase.from('orders').select('course_id').eq('user_id', userId).eq('status', 'confirmed'))
  return rows.map((row) => row.course_id)
}

export async function orderStatusBySession(req, res) {
  const { sessionId } = matchedData(req, { locations: ['params'] })
  const row = unwrap(await supabase.from('orders').select(SELECT).eq('stripe_checkout_session_id', sessionId).eq('user_id', req.user.id).maybeSingle(), 'Order not found.')
  return res.json({ order: mapOrder(row) })
}
