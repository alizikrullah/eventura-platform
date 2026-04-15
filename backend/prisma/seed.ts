import prisma from '../src/config/prisma'
import { seedCategories } from '../src/utils/seedCategories'
import { seedDemoData } from '../src/utils/seedDemoData'

async function main() {
  await seedCategories()
  await seedDemoData()
}

main()
  .catch((error) => {
    console.error('❌ Prisma seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })