import { Router } from 'express'
import { body, query } from 'express-validator'
import { rateLimit } from 'express-rate-limit'
import { createCheckoutSession, feeBreakdown } from '../controllers/stripeController.js'
import { requireUser } from '../middlewares/auth.js'
import { validateRequest } from '../middlewares/validation.js'

const router = Router()
const checkoutLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-8', legacyHeaders: false })
const courseId = (location) => location('courseId').isString().matches(/^[a-z0-9-]{2,80}$/)

router.get('/fee-breakdown', courseId(query), validateRequest, feeBreakdown)

router.post('/checkout-session', checkoutLimit, requireUser,
  courseId(body),
  body('branchId').optional({ values: 'falsy' }).isUUID(),
  body('name').isString().trim().isLength({ min: 2, max: 100 }),
  body('phone').optional({ values: 'falsy' }).isString().trim().isLength({ min: 7, max: 30 }),
  validateRequest,
  createCheckoutSession,
)

export default router
