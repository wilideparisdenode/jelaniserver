import { Router } from 'express'
import { body, param } from 'express-validator'
import { getPost, listPublishedPosts } from '../controllers/postsController.js'
import { createComment } from '../controllers/commentsController.js'
import { requireUser } from '../middlewares/auth.js'
import { validateRequest } from '../middlewares/validation.js'

// Public posts: anyone can read published posts; signed-in users can comment (moderated).
const router = Router()
router.get('/', listPublishedPosts)
router.get('/:id', param('id').isUUID(), validateRequest, getPost)
router.post('/:id/comments', requireUser, param('id').isUUID(), body('body').isString().trim().isLength({ min: 2, max: 2000 }), validateRequest, createComment)

export default router
