import { Router } from 'express'
import * as categoryController from '../controllers/categoryController'

const router = Router()

/**
 * GET /api/categories
 * Get all categories (public)
 */
router.get('/', categoryController.getAllCategories)

export default router
