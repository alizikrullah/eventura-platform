import { Request, Response, NextFunction } from 'express'

/**
 * Validate create event payload
 */
export const validateCreateEvent = (req: Request, res: Response, next: NextFunction) => {
  const { name, location, total_seats, start_date, end_date, category_id } = req.body

  const errors: string[] = []

  // Required fields
  if (!name || name.trim().length === 0) {
    errors.push('Event name is required')
  }
  if (!location || location.trim().length === 0) {
    errors.push('Location is required')
  }
  if (!total_seats || total_seats <= 0) {
    errors.push('Total seats must be greater than 0')
  }
  if (!start_date) {
    errors.push('Start date is required')
  }
  if (!end_date) {
    errors.push('End date is required')
  }
  if (!category_id) {
    errors.push('Category is required')
  }

  // Validate dates
  if (start_date && end_date) {
    const startDate = new Date(start_date)
    const endDate = new Date(end_date)

    if (isNaN(startDate.getTime())) {
      errors.push('Invalid start date format')
    }
    if (isNaN(endDate.getTime())) {
      errors.push('Invalid end date format')
    }

    if (startDate >= endDate) {
      errors.push('End date must be after start date')
    }

    if (startDate < new Date()) {
      errors.push('Start date cannot be in the past')
    }
  }

  if (errors.length > 0) {
    return res.status(422).json({
      success: false,
      message: 'Validation error',
      errors,
    })
  }

  return next()
}

/**
 * Validate update event payload
 */
export const validateUpdateEvent = (req: Request, res: Response, next: NextFunction) => {
  const { name, total_seats, start_date, end_date } = req.body

  const errors: string[] = []

  // Optional fields but must be valid if provided
  if (name !== undefined && name.trim().length === 0) {
    errors.push('Event name cannot be empty')
  }

  if (total_seats !== undefined && total_seats <= 0) {
    errors.push('Total seats must be greater than 0')
  }

  // Validate dates if both provided
  if (start_date && end_date) {
    const startDate = new Date(start_date)
    const endDate = new Date(end_date)

    if (isNaN(startDate.getTime())) {
      errors.push('Invalid start date format')
    }
    if (isNaN(endDate.getTime())) {
      errors.push('Invalid end date format')
    }

    if (startDate >= endDate) {
      errors.push('End date must be after start date')
    }
  }

  if (errors.length > 0) {
    return res.status(422).json({
      success: false,
      message: 'Validation error',
      errors,
    })
  }

  return next()
}

/**
 * Validate query params for filtering events
 */
export const validateEventFilters = (req: Request, res: Response, next: NextFunction) => {
  const { page, limit, category, sort } = req.query

  const errors: string[] = []

  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    errors.push('Page must be a positive number')
  }

  if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    errors.push('Limit must be between 1 and 100')
  }

  if (category && isNaN(Number(category))) {
    errors.push('Category must be a valid number')
  }

  if (sort && !['newest', 'price_low', 'price_high', 'popular'].includes(sort as string)) {
    errors.push('Sort must be one of: newest, price_low, price_high, popular')
  }

  if (errors.length > 0) {
    return res.status(422).json({
      success: false,
      message: 'Validation error',
      errors,
    })
  }

  return next()
}