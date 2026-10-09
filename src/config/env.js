import 'dotenv/config'

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'CLIENT_URL']

export function assertEnv() {
  const missing = required.filter((key) => !process.env[key])
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
}

// Fee model shown transparently to students at checkout.
// Processing fee mirrors Stripe's published card pricing (percent + fixed),
// grossed up so the school receives the full tuition amount.
export const fees = {
  percent: Number(process.env.STRIPE_FEE_PERCENT ?? 2.9),
  fixedCents: Number(process.env.STRIPE_FEE_FIXED_CENTS ?? 30),
}
