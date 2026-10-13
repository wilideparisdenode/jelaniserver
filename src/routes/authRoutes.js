import { Router } from 'express'
import { body } from 'express-validator'
import multer from 'multer'
import { me, updateProfile } from '../controllers/authController.js'
import { removeAvatar, uploadAvatar } from '../controllers/uploadsController.js'
import { requireUser } from '../middlewares/auth.js'
import { validateRequest } from '../middlewares/validation.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

router.get('/me', requireUser, me)
router.patch('/me', requireUser,
  body('fullName').optional().isString().trim().isLength({ min: 2, max: 100 }),
  body('phone').optional({ values: 'falsy' }).isString().trim().isLength({ min: 7, max: 30 }),
  validateRequest,
  updateProfile,
)

// Profile picture: upload (multipart) or remove.
router.post('/me/avatar', requireUser, upload.single('file'), uploadAvatar)
router.delete('/me/avatar', requireUser, removeAvatar)

export default router
