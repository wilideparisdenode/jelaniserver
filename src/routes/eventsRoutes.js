import { Router } from 'express'
import { listPublicEvents } from '../controllers/eventsController.js'

// Public events feed for the Events page.
const router = Router()
router.get('/', listPublicEvents)

export default router
