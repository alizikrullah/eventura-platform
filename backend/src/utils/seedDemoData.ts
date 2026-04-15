import bcrypt from 'bcrypt'
import { addDays, addHours, subDays, subHours } from 'date-fns'

import { DiscountType, Role, TransactionStatus } from '@prisma/client'

import prisma from '../config/prisma'

interface SeedUserInput {
  email: string
  password: string
  name: string
  role: Role
  referral_code: string
  phone?: string
}

interface SeedEventInput {
  organizer_id: number
  category_id: number
  name: string
  description: string
  location: string
  venue: string
  total_seats: number
  available_seats: number
  start_date: Date
  end_date: Date
  is_active?: boolean
  image_url?: string | null
}

interface SeedTicketTypeInput {
  event_id: number
  name: string
  price: number
  quantity: number
  available_quantity: number
  description?: string
}

async function upsertDemoUser(input: SeedUserInput) {
  const hashedPassword = await bcrypt.hash(input.password, 10)

  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      password: hashedPassword,
      role: input.role,
      referral_code: input.referral_code,
      phone: input.phone ?? null,
    },
    create: {
      email: input.email,
      password: hashedPassword,
      name: input.name,
      role: input.role,
      referral_code: input.referral_code,
      phone: input.phone ?? null,
      is_verified: true,
    },
  })
}

async function upsertDemoEvent(input: SeedEventInput) {
  const existingEvent = await prisma.event.findFirst({
    where: {
      organizer_id: input.organizer_id,
      name: input.name,
    },
  })

  if (existingEvent) {
    return prisma.event.update({
      where: { id: existingEvent.id },
      data: input,
    })
  }

  return prisma.event.create({
    data: input,
  })
}

async function upsertDemoTicketType(input: SeedTicketTypeInput) {
  const existingTicketType = await prisma.ticketType.findFirst({
    where: {
      event_id: input.event_id,
      name: input.name,
    },
  })

  if (existingTicketType) {
    return prisma.ticketType.update({
      where: { id: existingTicketType.id },
      data: input,
    })
  }

  return prisma.ticketType.create({
    data: input,
  })
}

export async function seedDemoData() {
  console.log('🌱 Seeding demo project data...')

  const organizer = await upsertDemoUser({
    email: 'organizer.demo@eventura.test',
    password: 'Organizer123!',
    name: 'Eventura Organizer Demo',
    role: Role.organizer,
    referral_code: 'ORGDEMO1',
    phone: '081111111111',
  })

  const customer = await upsertDemoUser({
    email: 'customer.demo@eventura.test',
    password: 'Customer123!',
    name: 'Eventura Customer Demo',
    role: Role.customer,
    referral_code: 'CUSDEMO1',
    phone: '082222222222',
  })

  const categories = await prisma.category.findMany({
    where: {
      slug: {
        in: ['music', 'technology', 'education'],
      },
    },
  })

  const musicCategory = categories.find((category) => category.slug === 'music')
  const technologyCategory = categories.find((category) => category.slug === 'technology')
  const educationCategory = categories.find((category) => category.slug === 'education')

  if (!musicCategory || !technologyCategory || !educationCategory) {
    throw new Error('Required categories are missing. Run category seed first.')
  }

  const now = new Date()

  const futureConcert = await upsertDemoEvent({
    organizer_id: organizer.id,
    category_id: musicCategory.id,
    name: 'Eventura Jazz Night 2026',
    description: 'Konser jazz santai untuk demo customer checkout dan organizer dashboard.',
    location: 'Jakarta',
    venue: 'Balai Sarbini',
    total_seats: 200,
    available_seats: 198,
    start_date: addDays(now, 14),
    end_date: addDays(now, 14),
    is_active: true,
  })

  const futureWorkshop = await upsertDemoEvent({
    organizer_id: organizer.id,
    category_id: technologyCategory.id,
    name: 'Build Fast with TypeScript',
    description: 'Workshop teknologi untuk menguji halaman event organizer dan voucher management.',
    location: 'Bandung',
    venue: 'Tech Hub Dago',
    total_seats: 60,
    available_seats: 60,
    start_date: addDays(now, 7),
    end_date: addDays(now, 7),
    is_active: true,
  })

  const pastSeminar = await upsertDemoEvent({
    organizer_id: organizer.id,
    category_id: educationCategory.id,
    name: 'Career Growth Seminar 2026',
    description: 'Event lampau untuk demo transaksi paid dan review customer.',
    location: 'Surabaya',
    venue: 'Grand City Hall',
    total_seats: 120,
    available_seats: 117,
    start_date: subDays(now, 10),
    end_date: subDays(now, 9),
    is_active: true,
  })

  const concertRegular = await upsertDemoTicketType({
    event_id: futureConcert.id,
    name: 'Regular Pass',
    price: 250000,
    quantity: 150,
    available_quantity: 148,
    description: 'Akses area konser reguler',
  })

  await upsertDemoTicketType({
    event_id: futureConcert.id,
    name: 'VIP Pass',
    price: 500000,
    quantity: 50,
    available_quantity: 50,
    description: 'Akses VIP dengan merchandise eksklusif',
  })

  const workshopSeat = await upsertDemoTicketType({
    event_id: futureWorkshop.id,
    name: 'Workshop Seat',
    price: 175000,
    quantity: 60,
    available_quantity: 60,
    description: 'Kursi workshop dan materi digital',
  })

  const seminarRegular = await upsertDemoTicketType({
    event_id: pastSeminar.id,
    name: 'Seminar Pass',
    price: 150000,
    quantity: 80,
    available_quantity: 78,
    description: 'Akses seminar utama',
  })

  const seminarVip = await upsertDemoTicketType({
    event_id: pastSeminar.id,
    name: 'VIP Networking Pass',
    price: 275000,
    quantity: 40,
    available_quantity: 39,
    description: 'Akses seminar dan sesi networking VIP',
  })

  const demoVoucher = await prisma.voucher.upsert({
    where: { code: 'JAZZDEMO20' },
    update: {
      event_id: futureConcert.id,
      discount_type: DiscountType.percentage,
      discount_value: 20,
      max_usage: 100,
      current_usage: 0,
      start_date: subDays(now, 1),
      end_date: addDays(now, 20),
      is_active: true,
    },
    create: {
      event_id: futureConcert.id,
      code: 'JAZZDEMO20',
      discount_type: DiscountType.percentage,
      discount_value: 20,
      max_usage: 100,
      current_usage: 0,
      start_date: subDays(now, 1),
      end_date: addDays(now, 20),
      is_active: true,
    },
  })

  const demoCoupon = await prisma.coupon.upsert({
    where: { code: 'DEMOREF10' },
    update: {
      discount_type: DiscountType.percentage,
      discount_value: 10,
    },
    create: {
      code: 'DEMOREF10',
      discount_type: DiscountType.percentage,
      discount_value: 10,
    },
  })

  const existingUserCoupon = await prisma.userCoupon.findFirst({
    where: {
      user_id: customer.id,
      coupon_id: demoCoupon.id,
    },
  })

  if (existingUserCoupon) {
    await prisma.userCoupon.update({
      where: { id: existingUserCoupon.id },
      data: {
        is_used: false,
        used_at: null,
        expired_at: addDays(now, 30),
      },
    })
  } else {
    await prisma.userCoupon.create({
      data: {
        user_id: customer.id,
        coupon_id: demoCoupon.id,
        expired_at: addDays(now, 30),
      },
    })
  }

  const existingPoint = await prisma.point.findFirst({
    where: {
      user_id: customer.id,
      source: 'referral_reward',
      reference_id: 91001,
    },
  })

  if (existingPoint) {
    await prisma.point.update({
      where: { id: existingPoint.id },
      data: {
        amount: 15000,
        amount_remaining: 15000,
        expired_at: addDays(now, 45),
      },
    })
  } else {
    await prisma.point.create({
      data: {
        user_id: customer.id,
        amount: 15000,
        amount_remaining: 15000,
        source: 'referral_reward',
        reference_id: 91001,
        expired_at: addDays(now, 45),
      },
    })
  }

  const paidTransaction = await prisma.transaction.upsert({
    where: { invoice_number: 'DEMO-PAID-001' },
    update: {
      user_id: customer.id,
      event_id: pastSeminar.id,
      invoice_number: 'DEMO-PAID-001',
      total_ticket_price: 425000,
      voucher_discount: 0,
      coupon_discount: 0,
      points_used: 0,
      final_price: 425000,
      status: TransactionStatus.paid,
      paid_at: subDays(now, 11),
      payment_expired_at: null,
      midtrans_order_id: 'DEMO-PAID-001',
      snap_token: null,
    },
    create: {
      user_id: customer.id,
      event_id: pastSeminar.id,
      invoice_number: 'DEMO-PAID-001',
      total_ticket_price: 425000,
      voucher_discount: 0,
      coupon_discount: 0,
      points_used: 0,
      final_price: 425000,
      status: TransactionStatus.paid,
      paid_at: subDays(now, 11),
      payment_expired_at: null,
      midtrans_order_id: 'DEMO-PAID-001',
      snap_token: null,
    },
  })

  const waitingTransaction = await prisma.transaction.upsert({
    where: { invoice_number: 'DEMO-WAIT-001' },
    update: {
      user_id: customer.id,
      event_id: futureConcert.id,
      voucher_id: demoVoucher.id,
      invoice_number: 'DEMO-WAIT-001',
      total_ticket_price: 500000,
      voucher_discount: 100000,
      coupon_discount: 0,
      points_used: 0,
      final_price: 400000,
      status: TransactionStatus.waiting_payment,
      paid_at: null,
      payment_expired_at: addHours(now, 2),
      midtrans_order_id: 'DEMO-WAIT-001',
      snap_token: 'demo-snap-token',
    },
    create: {
      user_id: customer.id,
      event_id: futureConcert.id,
      voucher_id: demoVoucher.id,
      invoice_number: 'DEMO-WAIT-001',
      total_ticket_price: 500000,
      voucher_discount: 100000,
      coupon_discount: 0,
      points_used: 0,
      final_price: 400000,
      status: TransactionStatus.waiting_payment,
      paid_at: null,
      payment_expired_at: addHours(now, 2),
      midtrans_order_id: 'DEMO-WAIT-001',
      snap_token: 'demo-snap-token',
    },
  })

  const canceledTransaction = await prisma.transaction.upsert({
    where: { invoice_number: 'DEMO-CANCELED-001' },
    update: {
      user_id: customer.id,
      event_id: futureWorkshop.id,
      invoice_number: 'DEMO-CANCELED-001',
      total_ticket_price: 175000,
      voucher_discount: 0,
      coupon_discount: 0,
      points_used: 0,
      final_price: 175000,
      status: TransactionStatus.canceled,
      paid_at: null,
      payment_expired_at: subHours(now, 4),
      midtrans_order_id: 'DEMO-CANCELED-001',
      snap_token: null,
    },
    create: {
      user_id: customer.id,
      event_id: futureWorkshop.id,
      invoice_number: 'DEMO-CANCELED-001',
      total_ticket_price: 175000,
      voucher_discount: 0,
      coupon_discount: 0,
      points_used: 0,
      final_price: 175000,
      status: TransactionStatus.canceled,
      paid_at: null,
      payment_expired_at: subHours(now, 4),
      midtrans_order_id: 'DEMO-CANCELED-001',
      snap_token: null,
    },
  })

  await prisma.transactionItem.deleteMany({
    where: {
      transaction_id: {
        in: [paidTransaction.id, waitingTransaction.id, canceledTransaction.id],
      },
    },
  })

  await prisma.transactionItem.createMany({
    data: [
      {
        transaction_id: paidTransaction.id,
        ticket_type_id: seminarRegular.id,
        ticket_name: seminarRegular.name,
        quantity: 2,
        price: seminarRegular.price,
        subtotal: seminarRegular.price * 2,
      },
      {
        transaction_id: paidTransaction.id,
        ticket_type_id: seminarVip.id,
        ticket_name: seminarVip.name,
        quantity: 1,
        price: seminarVip.price,
        subtotal: seminarVip.price,
      },
      {
        transaction_id: waitingTransaction.id,
        ticket_type_id: concertRegular.id,
        ticket_name: concertRegular.name,
        quantity: 2,
        price: concertRegular.price,
        subtotal: concertRegular.price * 2,
      },
      {
        transaction_id: canceledTransaction.id,
        ticket_type_id: workshopSeat.id,
        ticket_name: workshopSeat.name,
        quantity: 1,
        price: workshopSeat.price,
        subtotal: workshopSeat.price,
      },
    ],
  })

  await prisma.review.upsert({
    where: { transaction_id: paidTransaction.id },
    update: {
      event_id: pastSeminar.id,
      user_id: customer.id,
      rating: 5,
      comment: 'Materi seminar rapi dan venue nyaman. Cocok untuk demo flow review.',
    },
    create: {
      event_id: pastSeminar.id,
      user_id: customer.id,
      transaction_id: paidTransaction.id,
      rating: 5,
      comment: 'Materi seminar rapi dan venue nyaman. Cocok untuk demo flow review.',
    },
  })

  console.log('✅ Demo data seeded successfully!')
  console.log(`   Organizer login: ${organizer.email} / Organizer123!`)
  console.log(`   Customer login: ${customer.email} / Customer123!`)
  console.log(`   Demo voucher: ${demoVoucher.code}`)
}