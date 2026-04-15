import { Router } from 'express'
import * as organizerDashboardController from '../controllers/organizerDashboardController'
import { auth } from '../middlewares/auth'
import { roleCheck } from '../middlewares/role'

const router = Router()

router.use(auth, roleCheck(['organizer']))

router.get('/summary', organizerDashboardController.getSummary)
router.get('/charts', organizerDashboardController.getCharts)
router.get('/attendees', organizerDashboardController.getAttendees)

export default router