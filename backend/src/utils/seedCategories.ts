import prisma from '../config/prisma'

export const categories = [
  { name: 'Music', slug: 'music' },
  { name: 'Sports', slug: 'sports' },
  { name: 'Technology', slug: 'technology' },
  { name: 'Food & Drink', slug: 'food-drink' },
  { name: 'Art & Culture', slug: 'art-culture' },
  { name: 'Education', slug: 'education' },
  { name: 'Business', slug: 'business' },
  { name: 'Health & Wellness', slug: 'health-wellness' },
]

export async function seedCategories() {
  console.log('🌱 Seeding categories...')

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
  }

  console.log('✅ Categories seeded successfully!')
}

if (require.main === module) {
  seedCategories()
    .catch((error) => {
      console.error('❌ Seed error:', error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
