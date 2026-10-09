import { Router } from 'express'
import { body, param } from 'express-validator'
import { listMyOrders, orderStatusBySession } from '../controllers/ordersController.js'
import { listMyAnnouncements } from '../controllers/announcementsController.js'
import { listMyQuizzes, submitQuiz } from '../controllers/quizzesController.js'
import { askQuestion, listMyQuestions } from '../controllers/qaController.js'
import { requireUser } from '../middlewares/auth.js'
import { validateRequest } from '../middlewares/validation.js'

// Student dashboard: Courses (orders), Announcements, Quizzes, Q&A.
const router = Router()
router.use(requireUser)

router.get('/orders', listMyOrders)
router.get('/orders/session/:sessionId', param('sessionId').isString().isLength({ min: 10, max: 200 }), validateRequest, orderStatusBySession)
router.get('/announcements', listMyAnnouncements)
router.get('/quizzes', listMyQuizzes)
router.post('/quizzes/:id/submit', param('id').isUUID(), body('answers').isArray({ min: 1, max: 50 }), body('answers.*').isInt({ min: 0, max: 5 }).toInt(), validateRequest, submitQuiz)
router.get('/qa', listMyQuestions)
router.post('/qa', body('courseId').isString().matches(/^[a-z0-9-]{2,80}$/), body('question').isString().trim().isLength({ min: 5, max: 2000 }), validateRequest, askQuestion)

export default router
