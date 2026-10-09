import { randomUUID } from 'node:crypto'
import { matchedData } from 'express-validator'
import { supabase } from '../config/supabase.js'
import { unwrap } from '../utils/dbError.js'
import { calculateBreakdown } from '../utils/fees.js'
import { stripeClient } from '../services/stripe.js'
import { discardOrder, refundOrderByPaymentIntent, settleOrderBySession } from '../services/orders.js'

async function loadCourse(courseId) {
  const course = unwrap(await supabase.from('courses').select('*').eq('id', courseId).eq('published', true).maybeSingle())
  if (!course) throw Object.assign(new Error('This course is no longer available.'), { status: 404 })
  return course
}

// Public: transparent price/fee preview shown before the student pays.
export async function feeBreakdown(req, res) {
  const { courseId } = matchedData(req, { locations: ['query'] })
  const course = await loadCourse(courseId)
  return res.json({ courseId: course.id, currency: course.currency, ...calculateBreakdown(course.price_cents) })
}

// Authenticated student: create a pending order and a Stripe Checkout session.
export async function createCheckoutSession(req, res) {
  const { courseId, branchId, name, phone } = matchedData(req, { locations: ['body'] })
  const course = await loadCourse(courseId)
  const breakdown = calculateBreakdown(course.price_cents)

  // Clear any stale pending order for the same course before creating a new one.
  await supabase.from('orders').delete().eq('user_id', req.user.id).eq('course_id', courseId).eq('status', 'pending')

  // Free courses skip Stripe entirely: the order is confirmed immediately, but we still
  // send the student through the checkout success page so the flow is identical.
  const isFree = breakdown.totalCents === 0
  const freeSessionId = isFree ? `free_${randomUUID()}` : null

  const order = unwrap(await supabase.from('orders').insert({
    user_id: req.user.id,
    course_id: courseId,
    branch_id: branchId || null,
    student_name: name,
    email: req.user.email,
    phone: phone || null,
    status: isFree ? 'confirmed' : 'pending',
    subtotal_cents: breakdown.subtotalCents,
    fee_cents: breakdown.feeCents,
    total_cents: breakdown.totalCents,
    currency: course.currency,
    stripe_checkout_session_id: freeSessionId,
  }).select('id').single())

  if (isFree) {
    return res.status(201).json({ url: `${process.env.CLIENT_URL}/checkout/success?session_id=${freeSessionId}` })
  }

  try {
    const session = await stripeClient().checkout.sessions.create({
      mode: 'payment',
      customer_email: req.user.email,
      line_items: [
        { quantity: 1, price_data: { currency: course.currency, unit_amount: breakdown.subtotalCents, product_data: { name: course.title, description: course.description.slice(0, 500) } } },
        { quantity: 1, price_data: { currency: course.currency, unit_amount: breakdown.feeCents, product_data: { name: 'Payment processing fee' } } },
      ],
      metadata: { orderId: order.id, userId: req.user.id },
      payment_intent_data: { metadata: { orderId: order.id } },
      success_url: `${process.env.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout/cancel`,
    })
    unwrap(await supabase.from('orders').update({ stripe_checkout_session_id: session.id }).eq('id', order.id))
    return res.status(201).json({ url: session.url })
  } catch (error) {
    await discardOrder(order.id)
    throw error
  }
}

export async function stripeWebhook(req, res) {
  let event
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: { message: 'Webhook is not configured.' } })
    event = stripeClient().webhooks.constructEvent(req.body, req.get('stripe-signature'), process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return res.status(400).json({ error: { message: 'Invalid Stripe signature.' } })
  }

  const object = event.data.object
  const intentId = typeof object.payment_intent === 'string' ? object.payment_intent : object.payment_intent?.id

  try {
    if ((event.type === 'checkout.session.completed' && object.payment_status === 'paid') || event.type === 'checkout.session.async_payment_succeeded') {
      await settleOrderBySession(object.id, intentId, true)
    } else if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
      await settleOrderBySession(object.id, intentId, false)
    } else if (event.type === 'charge.refunded') {
      const id = typeof object.payment_intent === 'string' ? object.payment_intent : object.payment_intent?.id
      if (id) await refundOrderByPaymentIntent(id)
    }
  } catch (error) {
    console.error('Stripe webhook handler failed', error)
    return res.status(500).json({ error: { message: 'Webhook processing failed.' } }) // Stripe will retry.
  }
  return res.json({ received: true })
}
