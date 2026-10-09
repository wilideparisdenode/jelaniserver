import { Router } from 'express'
import { listAlumni, listBranches, listCategories, listPartners, listStaff, listTestimonials } from '../controllers/catalogController.js'

// Public marketing content for the home page.
const router = Router()
router.get('/categories', listCategories)
router.get('/branches', listBranches)
router.get('/partners', listPartners)
router.get('/alumni', listAlumni)
router.get('/testimonials', listTestimonials)
router.get('/staff', listStaff)

export default router
