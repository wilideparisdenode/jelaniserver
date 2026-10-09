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
app.use(cors({ origin: process.env.CLIENT_URL, methods: ['GET', 'POST', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }))
// Stripe needs the raw body for signature verification, so mount before express.json().
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhook)
app.use(express.json({ limit: '64kb', type: 'application/json' }))
app.use('/api', publicApiLimit, apiRoutes)
app.use(notFound)
app.use(errorHandler)

export default app
