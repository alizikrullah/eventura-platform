import { Request, Response, NextFunction } from 'express'
import prisma from '../config/prisma'

/**
 * Validate create event payload
 */
export const validateCreateEvent = async (req: Request, res: Response, next: NextFunction) => {
  const { name, location, start_date, end_date, category_id } = req.body

  const errors: string[] = []

  // Required fields
  if (!name || name.trim().length === 0) {
    errors.push('Event name is required')
  }
  if (!location || location.trim().length === 0) {
    errors.push('Location is required')
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

  if (category_id) {
    const parsedCategoryId = Number(category_id)

    if (Number.isNaN(parsedCategoryId) || parsedCategoryId <= 0) {
      errors.push('Category must be a valid number')
    } else {
      const category = await prisma.category.findUnique({ where: { id: parsedCategoryId } })
      if (!category) {
        errors.push('Selected category does not exist')
      }
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
export const validateUpdateEvent = async (req: Request, res: Response, next: NextFunction) => {
  const { name, start_date, end_date, category_id } = req.body

  const errors: string[] = []

  // Optional fields but must be valid if provided
  if (name !== undefined && name.trim().length === 0) {
    errors.push('Event name cannot be empty')
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

  if (category_id !== undefined && category_id !== null && category_id !== '') {
    const parsedCategoryId = Number(category_id)

    if (Number.isNaN(parsedCategoryId) || parsedCategoryId <= 0) {
      errors.push('Category must be a valid number')
    } else {
      const category = await prisma.category.findUnique({ where: { id: parsedCategoryId } })
      if (!category) {
        errors.push('Selected category does not exist')
      }
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

  if (sort && !['newest', 'oldest', 'upcoming', 'price_low', 'price_high', 'popular'].includes(sort as string)) {
    errors.push('Sort must be one of: newest, oldest, upcoming, price_low, price_high, popular')
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