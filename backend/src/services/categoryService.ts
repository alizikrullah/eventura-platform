import prisma from '../config/prisma'

/**
 * Get all categories
 */
export const getAllCategories = async () => {
  const categories = await prisma.category.findMany({
    orderBy: {
      name: 'asc',
    },
  })

  return categories
}
