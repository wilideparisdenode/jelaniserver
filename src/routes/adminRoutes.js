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
import { createCrud } from '../utils/crud.js'
import { requireAdmin } from '../middlewares/auth.js'
import { validateRequest } from '../middlewares/validation.js'

// Admin LMS scope only: Courses (courseRoutes), Categories, Orders, Student Roster,
// Announcements, Quizzes, Q&A.
const router = Router()
router.use(requireAdmin)

const uuid = param('id').isUUID()

// Image uploads (device -> Supabase Storage). Returns { url } to store on a record.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })
router.post('/uploads', upload.single('file'), uploadImage)

// Categories
const categories = createCrud('categories', { order: ['sort_order', { ascending: true }] })
const categoryFields = [
  body('slug').isSlug().isLength({ min: 2, max: 80 }),
  body('name').isString().trim().isLength({ min: 2, max: 80 }),
  body('description').optional({ values: 'falsy' }).isString().trim().isLength({ max: 300 }),
  body('sort_order').optional().isInt({ min: 0, max: 1000 }).toInt(),
]
router.get('/categories', categories.listAll)
router.post('/categories', ...categoryFields, validateRequest, categories.create)
router.patch('/categories/:id', uuid, ...categoryFields.map((v) => v.optional()), validateRequest, categories.update)
router.delete('/categories/:id', uuid, validateRequest, categories.remove)

// Orders & roster
router.get('/orders', listOrders)
router.get('/roster', listRoster)

// Announcements
router.get('/announcements', listAllAnnouncements)
router.post('/announcements', body('title').isString().trim().isLength({ min: 3, max: 140 }), body('body').isString().trim().isLength({ min: 3, max: 4000 }), body('course_id').optional({ values: 'falsy' }).isString().matches(/^[a-z0-9-]{2,80}$/), validateRequest, createAnnouncement)
router.delete('/announcements/:id', uuid, validateRequest, deleteAnnouncement)

// Quizzes
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
router.get('/quizzes', listAllQuizzes)
router.post('/quizzes', ...quizFields, validateRequest, createQuiz)
router.patch('/quizzes/:id', uuid, ...quizFields.map((v) => v.optional()), validateRequest, updateQuiz)
router.delete('/quizzes/:id', uuid, validateRequest, deleteQuiz)

// Q&A
router.get('/qa', listAllQuestions)
router.patch('/qa/:id', uuid, body('answer').isString().trim().isLength({ min: 1, max: 4000 }), validateRequest, answerQuestion)
router.delete('/qa/:id', uuid, validateRequest, deleteQuestion)

// Posts (public, commentable news/blog)
const postFields = [
  body('title').isString().trim().isLength({ min: 3, max: 160 }),
  body('excerpt').optional({ values: 'falsy' }).isString().trim().isLength({ max: 300 }),
  body('body').isString().trim().isLength({ min: 10, max: 20000 }),
  body('cover_image').optional({ values: 'falsy' }).isURL({ protocols: ['https'], require_protocol: true }),
  body('published').optional().isBoolean().toBoolean(),
]
router.get('/posts', listAllPosts)
router.post('/posts', ...postFields, validateRequest, createPost)
router.patch('/posts/:id', uuid, ...postFields.map((v) => v.optional()), validateRequest, updatePost)
router.delete('/posts/:id', uuid, validateRequest, deletePost)

// Comment moderation
router.get('/comments', listComments)
router.patch('/comments/:id', uuid, body('approved').isBoolean().toBoolean(), validateRequest, setCommentApproval)
router.delete('/comments/:id', uuid, validateRequest, deleteComment)

export default router
