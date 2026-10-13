import { matchedData } from 'express-validator'
import { supabase } from '../config/supabase.js'
import { unwrap } from '../utils/dbError.js'
import { mapOrder } from '../utils/mappers.js'
import { stripeClient } from '../services/stripe.js'
import { settleOrderBySession } from '../services/orders.js'

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
  let row = unwrap(await supabase.from('orders').select(SELECT).eq('stripe_checkout_session_id', sessionId).eq('user_id', req.user.id).maybeSingle(), 'Order not found.')

  // Reconcile against Stripe when the student returns from checkout. This confirms the
  // order from the paid session directly, so it does not depend solely on the webhook
  // (which may be delayed or not configured). Only pending Stripe-backed orders are checked.
  if (row.status === 'pending' && row.stripe_checkout_session_id?.startsWith('cs_')) {
    try {
      const session = await stripeClient().checkout.sessions.retrieve(row.stripe_checkout_session_id)
      const intentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
      if (session.payment_status === 'paid') {
        await settleOrderBySession(row.stripe_checkout_session_id, intentId, true)
        row = unwrap(await supabase.from('orders').select(SELECT).eq('id', row.id).single())
      } else if (session.status === 'expired') {
        await settleOrderBySession(row.stripe_checkout_session_id, intentId, false)
        row = unwrap(await supabase.from('orders').select(SELECT).eq('id', row.id).single())
      }
    } catch {
      // Swallow Stripe/network errors here; the webhook remains the source of truth.
    }
  }

  return res.json({ order: mapOrder(row) })
}
