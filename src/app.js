import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import apiRoutes from './routes/index.js'
import { notFound, errorHandler } from './middlewares/errors.js'
import { stripeWebhook } from './controllers/stripeController.js'

const app = express()
const publicApiLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false })

app.disable('x-powered-by')
app.use(helmet())
// Comma-separated list of allowed frontend origins (CLIENT_URL). Local dev and the
// deployed frontend are always allowed so production works even if CLIENT_URL is stale.
const allowedOrigins = new Set(
  ['http://localhost:5173', 'https://jelaniclient.vercel.app', ...(process.env.CLIENT_URL || '').split(',')]
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean),
)

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser callers (curl, Stripe, health checks) that send no Origin header.
      if (!origin || allowedOrigins.has(origin.replace(/\/+$/, ''))) return callback(null, true)
      return callback(null, false)
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
// Stripe needs the raw body for signature verification, so mount before express.json().
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhook)
app.use(express.json({ limit: '64kb', type: 'application/json' }))
app.use('/api', publicApiLimit, apiRoutes)
app.use(notFound)
app.use(errorHandler)

export default app
