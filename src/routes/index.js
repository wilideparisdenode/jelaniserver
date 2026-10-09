import { Router } from 'express'
import authRoutes from './authRoutes.js'
import courseRoutes from './courseRoutes.js'
import catalogRoutes from './catalogRoutes.js'
import jobRoutes from './jobRoutes.js'
import postRoutes from './postRoutes.js'
import stripeRoutes from './stripeRoutes.js'
import studentRoutes from './studentRoutes.js'
import adminRoutes from './adminRoutes.js'

const router = Router()
router.get('/health', (req, res) => res.json({ ok: true }))
router.use('/auth', authRoutes)
router.use('/courses', courseRoutes)
router.use('/catalog', catalogRoutes)
router.use('/jobs', jobRoutes)
router.use('/posts', postRoutes)
router.use('/stripe', stripeRoutes)
router.use('/student', studentRoutes)
router.use('/admin', adminRoutes)

export default router
