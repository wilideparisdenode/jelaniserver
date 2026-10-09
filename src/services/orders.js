import { supabase } from '../config/supabase.js'
import { unwrap } from '../utils/dbError.js'

// Marks an order paid/failed from a Stripe event. Idempotent: only pending orders transition.
export async function settleOrderBySession(sessionId, paymentIntentId, succeeded) {
  const patch = { status: succeeded ? 'confirmed' : 'cancelled' }
  if (paymentIntentId) patch.stripe_payment_intent_id = paymentIntentId
  unwrap(await supabase.from('orders').update(patch).eq('stripe_checkout_session_id', sessionId).eq('status', 'pending'))
}

export async function refundOrderByPaymentIntent(paymentIntentId) {
  unwrap(await supabase.from('orders').update({ status: 'refunded' }).eq('stripe_payment_intent_id', paymentIntentId))
}

// Remove an abandoned pending order so the student can retry.
export async function discardOrder(orderId) {
  await supabase.from('orders').delete().eq('id', orderId).eq('status', 'pending')
}
