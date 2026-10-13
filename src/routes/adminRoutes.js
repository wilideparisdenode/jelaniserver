import { Router } from 'express'
import { body, param } from 'express-validator'
import multer from 'multer'
import { listOrders, listRoster } from '../controllers/ordersController.js'
import { createAnnouncement, deleteAnnouncement, listAllAnnouncements } from '../controllers/announcementsController.js'
import { createQuiz, deleteQuiz, listAllQuizzes, updateQuiz } from '../controllers/quizzesController.js'
import { answerQuestion, deleteQuestion, listAllQuestions } from '../controllers/qaController.js'
import { createPost, deletePost, listAllPosts, updatePost } from '../controllers/postsController.js'
import { deleteComment, listComments, setCommentApproval } from '../controllers/commentsController.js'
import { uploadImage } from '../controllers/uploadsController.js'
import { listUsers, updateUserRole } from '../controllers/usersController.js'
import { createEvent, deleteEvent, listAllEvents, updateEvent } from '../controllers/eventsController.js'
import { createCategory, deleteCategory, listCategories, updateCategory } from '../controllers/categoriesController.js'
import { requireAdmin, requireStaff } from '../middlewares/auth.js'
import { validateRequest } from '../middlewares/validation.js'

// Admin LMS scope. Content authoring is shared with tutors (requireStaff); account,
// order and moderation management stays admin-only (requireAdmin).
const router = Router()

const uuid = param('id').isUUID()
const expiresAt = body('expires_at').optional({ values: 'falsy' }).isISO8601()

// Image uploads (device -> Supabase Storage). Returns { url } to store on a record.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })
router.post('/uploads', requireStaff, upload.single('file'), uploadImage)

// Categories — read is shared with tutors (course form); writes are admin-only.
// Slugs are generated from the name by the controller.
const categoryFields = [
  body('slug').optional({ values: 'falsy' }).isSlug().isLength({ min: 2, max: 80 }),
  body('name').isString().trim().isLength({ min: 2, max: 80 }),
  body('description').optional({ values: 'falsy' }).isString().trim().isLength({ max: 300 }),
  body('sort_order').optional().isInt({ min: 0, max: 1000 }).toInt(),
]
router.get('/categories', requireStaff, listCategories)
router.post('/categories', requireAdmin, ...categoryFields, validateRequest, createCategory)
router.patch('/categories/:id', requireAdmin, uuid, ...categoryFields.map((v) => v.optional()), validateRequest, updateCategory)
router.delete('/categories/:id', requireAdmin, uuid, validateRequest, deleteCategory)

// Orders & roster (admin).
router.get('/orders', requireAdmin, listOrders)
router.get('/roster', requireAdmin, listRoster)

// Users & roles (admin).
router.get('/users', requireAdmin, listUsers)
router.patch('/users/:id/role', requireAdmin, uuid, body('role').isIn(['student', 'tutor', 'admin']), validateRequest, updateUserRole)

// Announcements (staff).
router.get('/announcements', requireStaff, listAllAnnouncements)
router.post('/announcements', requireStaff, body('title').isString().trim().isLength({ min: 3, max: 140 }), body('body').isString().trim().isLength({ min: 3, max: 4000 }), body('course_id').optional({ values: 'falsy' }).isString().matches(/^[a-z0-9-]{2,80}$/), expiresAt, validateRequest, createAnnouncement)
router.delete('/announcements/:id', requireStaff, uuid, validateRequest, deleteAnnouncement)

// Quizzes (staff).
const quizFields = [
  body('course_id').isString().matches(/^[a-z0-9-]{2,80}$/),
  body('title').isString().trim().isLength({ min: 3, max: 140 }),
  body('questions').isArray({ min: 1, max: 50 }),
  body('questions.*.prompt').isString().trim().isLength({ min: 3, max: 500 }),
  body('questions.*.options').isArray({ min: 2, max: 6 }),
  body('questions.*.options.*').isString().trim().isLength({ min: 1, max: 200 }),
  body('questions.*.answerIndex').isInt({ min: 0, max: 5 }).toInt(),
  body('published').optional().isBoolean().toBoolean(),
]
router.get('/quizzes', requireStaff, listAllQuizzes)
router.post('/quizzes', requireStaff, ...quizFields, validateRequest, createQuiz)
router.patch('/quizzes/:id', requireStaff, uuid, ...quizFields.map((v) => v.optional()), validateRequest, updateQuiz)
router.delete('/quizzes/:id', requireStaff, uuid, validateRequest, deleteQuiz)

// Q&A (staff can answer).
router.get('/qa', requireStaff, listAllQuestions)
router.patch('/qa/:id', requireStaff, uuid, body('answer').isString().trim().isLength({ min: 1, max: 4000 }), validateRequest, answerQuestion)
router.delete('/qa/:id', requireStaff, uuid, validateRequest, deleteQuestion)

// Posts (public, commentable news/blog) (staff).
const postFields = [
  body('title').isString().trim().isLength({ min: 3, max: 160 }),
  body('excerpt').optional({ values: 'falsy' }).isString().trim().isLength({ max: 300 }),
  body('body').isString().trim().isLength({ min: 10, max: 20000 }),
  body('cover_image').optional({ values: 'falsy' }).isURL({ protocols: ['https'], require_protocol: true }),
  body('published').optional().isBoolean().toBoolean(),
  expiresAt,
]
router.get('/posts', requireStaff, listAllPosts)
router.post('/posts', requireStaff, ...postFields, validateRequest, createPost)
router.patch('/posts/:id', requireStaff, uuid, ...postFields.map((v) => v.optional()), validateRequest, updatePost)
router.delete('/posts/:id', requireStaff, uuid, validateRequest, deletePost)

// Events (staff).
const eventFields = [
  body('title').isString().trim().isLength({ min: 3, max: 160 }),
  body('description').isString().trim().isLength({ min: 10, max: 8000 }),
  body('cover_image').optional({ values: 'falsy' }).isURL({ protocols: ['https'], require_protocol: true }),
  body('video_url').optional({ values: 'falsy' }).isURL({ protocols: ['https'], require_protocol: true }),
  body('location').optional({ values: 'falsy' }).isString().trim().isLength({ max: 160 }),
  body('event_date').optional({ values: 'falsy' }).isISO8601(),
  body('published').optional().isBoolean().toBoolean(),
]
router.get('/events', requireStaff, listAllEvents)
router.post('/events', requireStaff, ...eventFields, validateRequest, createEvent)
router.patch('/events/:id', requireStaff, uuid, ...eventFields.map((v) => v.optional()), validateRequest, updateEvent)
router.delete('/events/:id', requireStaff, uuid, validateRequest, deleteEvent)

// Comment moderation (admin).
router.get('/comments', requireAdmin, listComments)
router.patch('/comments/:id', requireAdmin, uuid, body('approved').isBoolean().toBoolean(), validateRequest, setCommentApproval)
router.delete('/comments/:id', requireAdmin, uuid, validateRequest, deleteComment)

export default router
