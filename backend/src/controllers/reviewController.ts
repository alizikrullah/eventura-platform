/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import * as reviewService from '../services/reviewService';

/**
 * Review Controller
 * 
 * Handles HTTP requests for reviews
 * Pattern: Try-catch → Service → Response
 */

// ========================================
// CREATE REVIEW
// ========================================
export const createReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const eventId = parseInt(req.params.eventId as string);
    const { rating, comment } = req.body;

    const review = await reviewService.createReview(userId, eventId, {
      rating,
      comment
    });

    return res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review }
    });
  } catch (error: any) {
    console.error('Create review error:', error);
    
    // Handle specific errors
    if (
      error.message === 'Event not found' ||
      error.message === 'Review not found'
    ) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (
      error.message === 'You must attend the event before writing a review' ||
      error.message === 'You have already reviewed this event' ||
      error.message === 'You can only review after the event has ended'
    ) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error.message
    });
  }
};

// ========================================
// GET EVENT REVIEWS
// ========================================
export const getEventReviews = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId as string);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await reviewService.getEventReviews(eventId, page, limit);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Get event reviews error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to get reviews',
      error: error.message
    });
  }
};

// ========================================
// GET REVIEW BY ID
// ========================================
export const getReviewById = async (req: Request, res: Response) => {
  try {
    const reviewId = parseInt(req.params.id as string);

    const review = await reviewService.getReviewById(reviewId);

    return res.status(200).json({
      success: true,
      data: { review }
    });
  } catch (error: any) {
    console.error('Get review error:', error);

    if (error.message === 'Review not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to get review',
      error: error.message
    });
  }
};

// ========================================
// UPDATE REVIEW
// ========================================
export const updateReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const reviewId = parseInt(req.params.id as string);
    const { rating, comment } = req.body;

    const review = await reviewService.updateReview(reviewId, userId, {
      rating,
      comment
    });

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: { review }
    });
  } catch (error: any) {
    console.error('Update review error:', error);

    if (error.message === 'Review not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message === 'You can only update your own reviews') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message
    });
  }
};

// ========================================
// DELETE REVIEW
// ========================================
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const reviewId = parseInt(req.params.id as string);

    const result = await reviewService.deleteReview(reviewId, userId);

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error: any) {
    console.error('Delete review error:', error);

    if (error.message === 'Review not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message === 'You can only delete your own reviews') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
};