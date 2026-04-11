import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Review Validators
 * 
 * Use express-validator for request validation
 * Pattern: Same as transactionValidator and eventValidator
 */

// ========================================
// CREATE REVIEW VALIDATOR
// ========================================
export const createReviewValidator = [
  param('eventId')
    .isInt({ min: 1 })
    .withMessage('Event ID must be a positive integer'),
  
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .optional()
    .isString()
    .withMessage('Comment must be a string')
    .isLength({ max: 1000 })
    .withMessage('Comment must be less than 1000 characters'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }
    return next();
  }
];

// ========================================
// UPDATE REVIEW VALIDATOR
// ========================================
export const updateReviewValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Review ID must be a positive integer'),
  
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .optional()
    .isString()
    .withMessage('Comment must be a string')
    .isLength({ max: 1000 })
    .withMessage('Comment must be less than 1000 characters'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }
    
    // Check at least one field provided
    if (!req.body.rating && !req.body.comment) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (rating or comment) must be provided'
      });
    }
    
    return next();
  }
];

// ========================================
// GET REVIEWS QUERY VALIDATOR
// ========================================
export const getReviewsQueryValidator = [
  param('eventId')
    .isInt({ min: 1 })
    .withMessage('Event ID must be a positive integer'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }
    return next();
  }
];