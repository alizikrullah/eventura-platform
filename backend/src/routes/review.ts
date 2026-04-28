import { Router } from 'express';
import * as reviewController from '../controllers/reviewController';
import { auth } from '../middlewares/auth';
import {
  createReviewValidator,
  updateReviewValidator,
  getReviewsQueryValidator
} from '../validators/reviewValidator';

/**
 * Review Routes
 * 
 * Pattern:
 * - GET /api/events/:eventId/reviews - Public, no auth
 * - POST /api/events/:eventId/reviews - Customer only, must have attended
 * - PUT /api/reviews/:id - Owner only
 * - DELETE /api/reviews/:id - Owner only
 */

const router = Router();

// ========================================
// PUBLIC ROUTES
// ========================================

/**
 * GET /api/events/:eventId/reviews
 * 
 * Get all reviews for an event
 * 
 * Query params:
 * - page (optional, default: 1)
 * - limit (optional, default: 10)
 */
router.get(
  '/events/:eventId/reviews',
  getReviewsQueryValidator,
  reviewController.getEventReviews
);

/**
 * GET /api/reviews/:id
 * 
 * Get single review by ID
 */
router.get('/reviews/:id', reviewController.getReviewById);

// ========================================
// PROTECTED ROUTES (CUSTOMER ONLY)
// ========================================

/**
 * GET /api/events/:eventId/my-review
 * Check if authenticated user has reviewed this event
 */
router.get('/events/:eventId/my-review', auth, reviewController.getMyReview);

/**
 * POST /api/events/:eventId/reviews
 * 
 * Create a review for an event
 * 
 * Requirements:
 * - Must be authenticated
 * - Must have attended event (transaction status = 'paid')
 * - Can only create one review per event
 * 
 * Body:
 * - rating: number (1-5)
 * - comment: string (optional)
 */
router.post(
  '/events/:eventId/reviews',
  auth,
  createReviewValidator,
  reviewController.createReview
);

/**
 * PUT /api/reviews/:id
 * 
 * Update own review
 * 
 * Requirements:
 * - Must be authenticated
 * - Must be the review owner
 * 
 * Body:
 * - rating: number (1-5, optional)
 * - comment: string (optional)
 */
router.put(
  '/reviews/:id',
  auth,
  updateReviewValidator,
  reviewController.updateReview
);

/**
 * DELETE /api/reviews/:id
 * 
 * Delete own review
 * 
 * Requirements:
 * - Must be authenticated
 * - Must be the review owner
 */
router.delete('/reviews/:id', auth, reviewController.deleteReview);

export default router;