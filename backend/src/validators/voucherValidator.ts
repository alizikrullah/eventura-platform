// backend/src/validators/voucherValidator.ts

import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Create voucher validator
export const createVoucherValidator = [
  body('event_id')
    .isInt({ min: 1 })
    .withMessage('Event ID must be a positive integer'),
  
  body('code')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 4, max: 20 })
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Code must be uppercase alphanumeric (4-20 characters)'),
  
  body('discount_type')
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be "percentage" or "fixed"'),
  
  body('discount_value')
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a positive number')
    .custom((value, { req }) => {
      if (req.body.discount_type === 'percentage' && value > 100) {
        throw new Error('Percentage discount cannot exceed 100');
      }
      return true;
    }),
  
  body('max_usage')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null) return true;
      if (typeof value === 'number' && value > 0) return true;
      throw new Error('Max usage must be a positive integer or null');
    }),
  
  body('start_date')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 datetime'),
  
  body('end_date')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 datetime')
    .custom((value, { req }) => {
      const startDate = new Date(req.body.start_date);
      const endDate = new Date(value);
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

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

// Update voucher validator
export const updateVoucherValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Voucher ID must be a positive integer'),
  
  body('discount_type')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be "percentage" or "fixed"'),
  
  body('discount_value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a positive number')
    .custom((value, { req }) => {
      if (req.body.discount_type === 'percentage' && value > 100) {
        throw new Error('Percentage discount cannot exceed 100');
      }
      return true;
    }),
  
  body('max_usage')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null) return true;
      if (typeof value === 'number' && value > 0) return true;
      throw new Error('Max usage must be a positive integer or null');
    }),
  
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 datetime'),
  
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 datetime'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),

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

// Validate voucher code validator
export const validateVoucherValidator = [
  param('code')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Voucher code is required'),
  
  query('event_id')
    .isInt({ min: 1 })
    .withMessage('Event ID must be a positive integer'),

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

// Get vouchers filters validator
export const getVouchersValidator = [
  query('event_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Event ID must be a positive integer'),
  
  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
  
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
      return res.status(422).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }
    return next();
  }
];

// Delete voucher validator
export const deleteVoucherValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Voucher ID must be a positive integer'),

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
