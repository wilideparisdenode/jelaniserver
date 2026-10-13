import 'dotenv/config'

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'CLIENT_URL']

export function assertEnv() {
  const missing = required.filter((key) => !process.env[key])
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
}

// The first CLIENT_URL entry is the canonical frontend origin used for redirects
// (Stripe success/cancel, free-course return). Any extra comma-separated entries are
// treated as additional allowed CORS origins, so a value like
// "https://app.example.com,http://localhost:5173" never leaks into a redirect URL.
export function frontendUrl() {
  return (process.env.CLIENT_URL || '').split(',')[0].trim().replace(/\/+$/, '')
}

// Origins allowed to call the API from a browser (CORS).
export function allowedOrigins() {
  const defaults = ['http://localhost:5173', 'https://jelaniclient.vercel.app']
  const sources = [process.env.CLIENT_URL, process.env.CORS_ORIGINS]
  return [...new Set(
    [...defaults, ...sources.flatMap((value) => (value || '').split(','))]
      .map((origin) => origin.trim().replace(/\/+$/, ''))
      .filter(Boolean),
  )]
}

// Fee model shown transparently to students at checkout.
// Processing fee mirrors Stripe's published card pricing (percent + fixed),
// grossed up so the school receives the full tuition amount.
export const fees = {
  percent: Number(process.env.STRIPE_FEE_PERCENT ?? 2.9),
  fixedCents: Number(process.env.STRIPE_FEE_FIXED_CENTS ?? 30),
}
