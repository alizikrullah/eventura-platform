import prisma from '../src/config/prisma'
import { seedCategories } from '../src/utils/seedCategories'

async function main() {
  await seedCategories()
}

main()
  .catch((error) => {
    console.error('❌ Prisma seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })