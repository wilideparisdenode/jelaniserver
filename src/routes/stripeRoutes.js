import { Router } from 'express'
import { body, query } from 'express-validator'
import { rateLimit } from 'express-rate-limit'
import { createCheckoutSession, feeBreakdown } from '../controllers/stripeController.js'
import { requireUser } from '../middlewares/auth.js'
import { validateRequest } from '../middlewares/validation.js'

const router = Router()
const checkoutLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-8', legacyHeaders: false })
const courseId = (location) => location('courseId').isString().matches(/^[a-z0-9-]{2,80}$/)
// UUID-shaped, not strict RFC-4122 (seeded branch ids like 11111111-... are valid to Postgres).
const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

router.get('/fee-breakdown', courseId(query), validateRequest, feeBreakdown)

router.post('/checkout-session', checkoutLimit, requireUser,
  courseId(body),
  body('branchId').optional({ values: 'falsy' }).isString().matches(uuidLike),
  body('name').isString().trim().isLength({ min: 2, max: 100 }),
  body('phone').optional({ values: 'falsy' }).isString().trim().isLength({ min: 7, max: 30 }),
  validateRequest,
  createCheckoutSession,
)

export default router
