import { Router } from 'express'
import { body, param } from 'express-validator'
import { rateLimit } from 'express-rate-limit'
import { listAllJobs, listApprovedJobs, setJobStatus, submitJob } from '../controllers/jobsController.js'
import { requireAdmin } from '../middlewares/auth.js'
import { validateRequest } from '../middlewares/validation.js'

const router = Router()
const submitLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false })

router.get('/', listApprovedJobs)
router.post('/', submitLimit,
  body('title').isString().trim().isLength({ min: 3, max: 140 }),
  body('company').isString().trim().isLength({ min: 2, max: 120 }),
  body('location').optional({ values: 'falsy' }).isString().trim().isLength({ max: 120 }),
  body('description').isString().trim().isLength({ min: 20, max: 5000 }),
  body('apply_email').isEmail().normalizeEmail(),
  body('contact_name').optional({ values: 'falsy' }).isString().trim().isLength({ max: 100 }),
  validateRequest,
  submitJob,
)
router.get('/admin', requireAdmin, listAllJobs)
router.patch('/admin/:id', requireAdmin, param('id').isUUID(), body('status').isIn(['pending', 'approved', 'rejected']), validateRequest, setJobStatus)

export default router
