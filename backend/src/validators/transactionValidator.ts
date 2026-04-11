import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Transaction Validators
 * 
 * Use express-validator for request validation
 * Pattern: Same as eventValidator and voucherValidator
 */

/**
 * Validate create transaction request
 * 
 * POST /api/transactions
 * 
 * Required: event_id, items (array)
 * Optional: voucher_code, user_coupon_id, points_to_use
 */
export const createTransactionValidator = [
  body('event_id')
    .isInt({ min: 1 })
    .withMessage('event_id must be a valid positive integer'),

  body('items')
    .isArray({ min: 1 })
    .withMessage('items must be a non-empty array'),

  body('items.*.ticket_type_id')
    .isInt({ min: 1 })
    .withMessage('Each item must have a valid ticket_type_id'),

  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Each item must have a quantity of at least 1'),

  body('voucher_code')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('voucher_code must be a string between 3-50 characters'),

  body('user_coupon_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('user_coupon_id must be a valid positive integer'),

  body('points_to_use')
    .optional()
    .isInt({ min: 0 })
    .withMessage('points_to_use must be a non-negative integer'),

  // Validation result handler
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }
    return next();
  }
];

/**
 * Validate get transactions query params
 * 
 * GET /api/transactions?status=paid&page=1&limit=10
 */
export const getTransactionsValidator = [
  // Status filter (optional)
  body('status')
    .optional()
    .isIn(['waiting_payment', 'paid', 'expired', 'canceled'])
    .withMessage('status must be one of: waiting_payment, paid, expired, canceled'),

  // Pagination
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer'),

  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }
    return next();
  }
];

/**
 * NO VALIDATOR for webhook
 * 
 * Webhook payload is validated via signature verification
 * in the controller, not through express-validator
 */
