import { Router } from 'express'
import { body, param } from 'express-validator'
import { createCourse, deleteCourse, getCourse, listAdminCourses, listCourses, updateCourse } from '../controllers/coursesController.js'
import { requireAdmin } from '../middlewares/auth.js'
import { validateRequest } from '../middlewares/validation.js'

const router = Router()
const idParam = param('id').isString().matches(/^[a-z0-9-]{2,80}$/)
const courseFields = [
  body('title').isString().trim().isLength({ min: 3, max: 120 }),
  body('categoryId').optional({ values: 'falsy' }).isUUID(),
  body('description').isString().trim().isLength({ min: 10, max: 5000 }),
  body('duration').isString().trim().isLength({ min: 2, max: 120 }),
  body('priceCents').isInt({ min: 0, max: 10000000 }).toInt(),
  body('currency').optional().isIn(['usd', 'cad', 'gbp', 'eur']),
  body('level').isString().trim().isLength({ min: 2, max: 60 }),
  body('registrationStart').optional({ values: 'falsy' }).isISO8601({ strict: true }),
  body('syllabus').isArray({ min: 1, max: 20 }),
  body('syllabus.*').isString().trim().isLength({ min: 2, max: 200 }),
  body('careerPathways').optional().isArray({ max: 12 }),
  body('careerPathways.*.title').isString().trim().isLength({ min: 2, max: 120 }),
  body('careerPathways.*.description').optional().isString().trim().isLength({ max: 400 }),
  body('branchIds').optional().isArray({ max: 50 }),
  body('branchIds.*').isUUID(),
  body('image').optional({ values: 'falsy' }).isURL({ protocols: ['https'], require_protocol: true }),
  body('published').optional().isBoolean().toBoolean(),
]

router.get('/', listCourses)
router.get('/admin', requireAdmin, listAdminCourses)
router.post('/admin', requireAdmin, body('id').isString().matches(/^[a-z0-9-]{2,80}$/), ...courseFields, validateRequest, createCourse)
router.patch('/admin/:id', requireAdmin, idParam, ...courseFields.map((validator) => validator.optional()), validateRequest, updateCourse)
router.delete('/admin/:id', requireAdmin, idParam, validateRequest, deleteCourse)
router.get('/:id', idParam, validateRequest, getCourse)

export default router
