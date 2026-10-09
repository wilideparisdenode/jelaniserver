import Stripe from 'stripe'

let client
export function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) throw Object.assign(new Error('Payments are not configured.'), { status: 503 })
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY)
  return client
}
