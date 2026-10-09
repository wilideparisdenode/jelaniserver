import { Router } from 'express'
import { body } from 'express-validator'
import { me, updateProfile } from '../controllers/authController.js'
import { requireUser } from '../middlewares/auth.js'
import { validateRequest } from '../middlewares/validation.js'

const router = Router()

router.get('/me', requireUser, me)
router.patch('/me', requireUser,
  body('fullName').optional().isString().trim().isLength({ min: 2, max: 100 }),
  body('phone').optional({ values: 'falsy' }).isString().trim().isLength({ min: 7, max: 30 }),
  validateRequest,
  updateProfile,
)

export default router
