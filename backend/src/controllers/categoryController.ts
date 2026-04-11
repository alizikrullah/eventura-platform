import { Request, Response } from 'express'
import * as categoryService from '../services/categoryService'

/**
 * GET /api/categories
 * Get all categories
 */
export const getAllCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await categoryService.getAllCategories()

    return res.status(200).json({
      success: true,
      data: { categories },
    })
  } catch (error) {
    console.error('Get categories error:', error)
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch categories',
    })
  }
}
