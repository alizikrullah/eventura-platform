import { Router } from 'express'
import * as eventController from '../controllers/eventController'
import { auth } from '../middlewares/auth'
import { roleCheck } from '../middlewares/role'
import { uploadEventImage } from '../middlewares/upload'
import {
  validateCreateEvent,
  validateUpdateEvent,
  validateEventFilters,
} from '../validators/eventValidator'

const router = Router()

/**
 * GET /api/events
 * Browse events with filters (public)
 */
router.get('/', validateEventFilters, eventController.getAllEvents)

/**
 * GET /api/events/:id
 * Get event detail (public)
 */
router.get('/my-events', auth, roleCheck(['organizer']), eventController.getOrganizerEvents)
router.get('/past', eventController.getPastEvents)
router.get('/organizer/:id/profile', eventController.getOrganizerProfile)
router.get('/:id', eventController.getEventById)

/**
 * POST /api/events
 * Create event (organizer only)
 */
router.post(
  '/',
  auth,
  roleCheck(['organizer']),
  uploadEventImage,
  validateCreateEvent,
  eventController.createEvent,
)

/**
 * PUT /api/events/:id
 * Update event (organizer only)
 */
router.put(
  '/:id',
  auth,
  roleCheck(['organizer']),
  uploadEventImage,
  validateUpdateEvent,
  eventController.updateEvent,
)

/**
 * DELETE /api/events/:id
 * Delete event (organizer only)
 */
router.delete('/:id', auth, roleCheck(['organizer']), eventController.deleteEvent)

export default router