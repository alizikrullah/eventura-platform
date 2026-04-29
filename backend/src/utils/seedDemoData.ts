import bcrypt from "bcrypt";
import { addDays, addHours, subDays } from "date-fns";

import {
  DiscountType,
  PointSource,
  Role,
  TransactionStatus,
} from "@prisma/client";

import prisma from "../config/prisma";

interface SeedUserInput {
  email: string;
  password: string;
  name: string;
  role: Role;
  referral_code: string;
  phone?: string;
}

interface SeedEventInput {
  organizer_id: number;
  category_id: number;
  name: string;
  description: string;
  location: string;
  venue: string;
  total_seats: number;
  available_seats: number;
  start_date: Date;
  end_date: Date;
  is_active?: boolean;
  image_url?: string | null;
}

interface SeedTicketTypeInput {
  event_id: number;
  name: string;
  price: number;
  quantity: number;
  available_quantity: number;
  description?: string;
}

interface SeedEventBlueprint {
  key: string;
  organizerEmail: string;
  categorySlug: string;
  name: string;
  description: string;
  location: string;
  venue: string;
  total_seats: number;
  available_seats: number;
  startOffsetDays: number;
  endOffsetDays: number;
  is_active?: boolean;
  image_url?: string | null;
}

interface SeedTicketBlueprint {
  key: string;
  eventKey: string;
  name: string;
  price: number;
  quantity: number;
  available_quantity: number;
  description?: string;
}

interface SeedTransactionItemBlueprint {
  ticketKey: string;
  quantity: number;
}

interface SeedTransactionBlueprint {
  invoiceNumber: string;
  userEmail: string;
  eventKey: string;
  status: TransactionStatus;
  itemLines: SeedTransactionItemBlueprint[];
  voucherCode?: string;
  userCouponKey?: string;
  pointsUsed?: number;
  paidAtOffsetDays?: number;
  paymentExpiredOffsetHours?: number;
  snapToken?: string | null;
  review?: {
    rating: number;
    comment: string;
  };
}

interface SeedPointInput {
  user_id: number;
  amount: number;
  amount_remaining: number;
  source: PointSource;
  reference_id: number;
  expired_at: Date;
}

async function upsertDemoUser(input: SeedUserInput) {
  const hashedPassword = await bcrypt.hash(input.password, 10);

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
  });
}

async function upsertDemoEvent(input: SeedEventInput) {
  const existingEvent = await prisma.event.findFirst({
    where: {
      organizer_id: input.organizer_id,
      name: input.name,
    },
  });

  if (existingEvent) {
    return prisma.event.update({
      where: { id: existingEvent.id },
      data: input,
    });
  }

  return prisma.event.create({
    data: input,
  });
}

async function upsertDemoTicketType(input: SeedTicketTypeInput) {
  const existingTicketType = await prisma.ticketType.findFirst({
    where: {
      event_id: input.event_id,
      name: input.name,
    },
  });

  if (existingTicketType) {
    return prisma.ticketType.update({
      where: { id: existingTicketType.id },
      data: input,
    });
  }

  return prisma.ticketType.create({
    data: input,
  });
}

async function upsertUserCoupon(
  userId: number,
  couponId: number,
  expiredAt: Date,
) {
  const existingUserCoupon = await prisma.userCoupon.findFirst({
    where: {
      user_id: userId,
      coupon_id: couponId,
    },
  });

  if (existingUserCoupon) {
    return prisma.userCoupon.update({
      where: { id: existingUserCoupon.id },
      data: {
        is_used: false,
        used_at: null,
        expired_at: expiredAt,
      },
    });
  }

  return prisma.userCoupon.create({
    data: {
      user_id: userId,
      coupon_id: couponId,
      expired_at: expiredAt,
    },
  });
}

async function upsertPoint(input: SeedPointInput) {
  const existingPoint = await prisma.point.findFirst({
    where: {
      user_id: input.user_id,
      source: input.source,
      reference_id: input.reference_id,
    },
  });

  if (existingPoint) {
    return prisma.point.update({
      where: { id: existingPoint.id },
      data: {
        amount: input.amount,
        amount_remaining: input.amount_remaining,
        expired_at: input.expired_at,
      },
    });
  }

  return prisma.point.create({ data: input });
}

export async function seedDemoData() {
  console.log("🌱 Seeding demo project data...");

  const organizerOne = await upsertDemoUser({
    email: "organizer.ali@eventura.test",
    password: "Organizer123!",
    name: "Ali Organizer",
    role: Role.organizer,
    referral_code: "ORGALI01",
    phone: "081111111111",
  });

  const organizerTwo = await upsertDemoUser({
    email: "organizer.michael@eventura.test",
    password: "Organizer123!",
    name: "Michael Organizer",
    role: Role.organizer,
    referral_code: "ORGMIC02",
    phone: "081111111112",
  });

  const customerOne = await upsertDemoUser({
    email: "customer.rina@eventura.test",
    password: "Customer123!",
    name: "Rina Customer",
    role: Role.customer,
    referral_code: "CUSRIN01",
    phone: "082222222222",
  });

  const customerTwo = await upsertDemoUser({
    email: "customer.budi@eventura.test",
    password: "Customer123!",
    name: "Budi Customer",
    role: Role.customer,
    referral_code: "CUSBUD02",
    phone: "082222222223",
  });

  const customerThree = await upsertDemoUser({
    email: "customer.sari@eventura.test",
    password: "Customer123!",
    name: "Sari Customer",
    role: Role.customer,
    referral_code: "CUSSAR03",
    phone: "082222222224",
  });

  const usersByEmail: Record<string, typeof customerOne> = {
    [organizerOne.email]: organizerOne,
    [organizerTwo.email]: organizerTwo,
    [customerOne.email]: customerOne,
    [customerTwo.email]: customerTwo,
    [customerThree.email]: customerThree,
  };

  const categories = await prisma.category.findMany({
    where: {
      slug: {
        in: [
          "music",
          "sports",
          "technology",
          "food-drink",
          "art-culture",
          "education",
          "business",
          "health-wellness",
        ],
      },
    },
  });

  const categoryBySlug: Record<string, (typeof categories)[number]> = {};
  for (const category of categories) {
    categoryBySlug[category.slug] = category;
  }

  const now = new Date();
  const eventBlueprints: SeedEventBlueprint[] = [
    {
      key: "jazz-night",
      organizerEmail: organizerOne.email,
      categorySlug: "music",
      name: "Eventura Jazz Night 2026",
      description: "Konser jazz untuk skenario transaksi waiting dan paid.",
      location: "Jakarta",
      venue: "Balai Sarbini",
      total_seats: 220,
      available_seats: 188,
      startOffsetDays: 14,
      endOffsetDays: 14,
      is_active: true,
    },
    {
      key: "rock-festival",
      organizerEmail: organizerOne.email,
      categorySlug: "music",
      name: "Rock Festival Senayan",
      description: "Festival musik skala besar dengan dua tier tiket.",
      location: "Jakarta",
      venue: "Stadion Madya",
      total_seats: 500,
      available_seats: 420,
      startOffsetDays: 25,
      endOffsetDays: 25,
      is_active: true,
    },
    {
      key: "tech-conference",
      organizerEmail: organizerOne.email,
      categorySlug: "technology",
      name: "Tech Leaders Conference",
      description:
        "Konferensi teknologi untuk skenario voucher fixed dan coupon.",
      location: "Bandung",
      venue: "Sasana Budaya Ganesha",
      total_seats: 300,
      available_seats: 255,
      startOffsetDays: 18,
      endOffsetDays: 19,
      is_active: true,
    },
    {
      key: "startup-workshop",
      organizerEmail: organizerOne.email,
      categorySlug: "business",
      name: "Startup Fundraising Workshop",
      description: "Workshop bisnis untuk simulasi transaksi canceled.",
      location: "Yogyakarta",
      venue: "Jogja Digital Valley",
      total_seats: 120,
      available_seats: 90,
      startOffsetDays: 9,
      endOffsetDays: 9,
      is_active: true,
    },
    {
      key: "city-marathon",
      organizerEmail: organizerOne.email,
      categorySlug: "sports",
      name: "City Marathon 10K",
      description: "Event olahraga dengan skenario transaksi group checkout.",
      location: "Surabaya",
      venue: "Tunjungan Loop",
      total_seats: 1000,
      available_seats: 900,
      startOffsetDays: 30,
      endOffsetDays: 30,
      is_active: true,
    },
    {
      key: "food-fair",
      organizerEmail: organizerTwo.email,
      categorySlug: "food-drink",
      name: "Nusantara Food Fair",
      description: "Festival kuliner untuk skenario transaksi expired.",
      location: "Semarang",
      venue: "Marina Convention Hall",
      total_seats: 350,
      available_seats: 280,
      startOffsetDays: 12,
      endOffsetDays: 13,
      is_active: true,
    },
    {
      key: "wellness-retreat",
      organizerEmail: organizerTwo.email,
      categorySlug: "health-wellness",
      name: "Weekend Wellness Retreat",
      description: "Event kesehatan untuk skenario points usage tinggi.",
      location: "Bali",
      venue: "Ubud Green Park",
      total_seats: 80,
      available_seats: 58,
      startOffsetDays: 21,
      endOffsetDays: 22,
      is_active: true,
    },
    {
      key: "design-exhibition",
      organizerEmail: organizerTwo.email,
      categorySlug: "art-culture",
      name: "Design & Culture Exhibition",
      description: "Pameran kreatif untuk skenario transaksi tanpa diskon.",
      location: "Malang",
      venue: "Ngalam Creative Space",
      total_seats: 200,
      available_seats: 175,
      startOffsetDays: 16,
      endOffsetDays: 17,
      is_active: true,
    },
    {
      key: "career-seminar-past",
      organizerEmail: organizerTwo.email,
      categorySlug: "education",
      name: "Career Growth Seminar 2026",
      description: "Event lampau untuk skenario paid + review.",
      location: "Surabaya",
      venue: "Grand City Hall",
      total_seats: 150,
      available_seats: 110,
      startOffsetDays: -15,
      endOffsetDays: -14,
      is_active: true,
    },
    {
      key: "legacy-business-forum",
      organizerEmail: organizerTwo.email,
      categorySlug: "business",
      name: "Legacy Business Forum 2025",
      description: "Event nonaktif untuk skenario data historis organizer.",
      location: "Jakarta",
      venue: "Kuningan City Hall",
      total_seats: 180,
      available_seats: 180,
      startOffsetDays: -60,
      endOffsetDays: -59,
      is_active: false,
    },
  ];

  const eventsByKey: Record<
    string,
    Awaited<ReturnType<typeof upsertDemoEvent>>
  > = {};

  for (const eventBlueprint of eventBlueprints) {
    const organizer = usersByEmail[eventBlueprint.organizerEmail];
    const category = categoryBySlug[eventBlueprint.categorySlug];

    if (!organizer) {
      throw new Error(
        `Organizer not found for ${eventBlueprint.organizerEmail}`,
      );
    }

    if (!category) {
      throw new Error(
        `Category not found for slug ${eventBlueprint.categorySlug}`,
      );
    }

    const seededEvent = await upsertDemoEvent({
      organizer_id: organizer.id,
      category_id: category.id,
      name: eventBlueprint.name,
      description: eventBlueprint.description,
      location: eventBlueprint.location,
      venue: eventBlueprint.venue,
      total_seats: eventBlueprint.total_seats,
      available_seats: eventBlueprint.available_seats,
      start_date: addDays(now, eventBlueprint.startOffsetDays),
      end_date: addDays(now, eventBlueprint.endOffsetDays),
      is_active: eventBlueprint.is_active,
      image_url: eventBlueprint.image_url,
    });

    eventsByKey[eventBlueprint.key] = seededEvent;
  }

  const ticketBlueprints: SeedTicketBlueprint[] = [
    {
      key: "jazz-regular",
      eventKey: "jazz-night",
      name: "Regular Pass",
      price: 250000,
      quantity: 160,
      available_quantity: 140,
      description: "Akses area konser reguler",
    },
    {
      key: "jazz-vip",
      eventKey: "jazz-night",
      name: "VIP Pass",
      price: 525000,
      quantity: 60,
      available_quantity: 48,
      description: "Akses VIP + lounge",
    },
    {
      key: "rock-festival",
      eventKey: "rock-festival",
      name: "Festival Pass",
      price: 300000,
      quantity: 400,
      available_quantity: 350,
      description: "Akses semua panggung",
    },
    {
      key: "rock-backstage",
      eventKey: "rock-festival",
      name: "Backstage Pass",
      price: 750000,
      quantity: 100,
      available_quantity: 70,
      description: "Akses backstage terbatas",
    },
    {
      key: "tech-standard",
      eventKey: "tech-conference",
      name: "Standard Seat",
      price: 450000,
      quantity: 220,
      available_quantity: 180,
      description: "Sesi utama konferensi",
    },
    {
      key: "tech-premium",
      eventKey: "tech-conference",
      name: "Premium Seat",
      price: 800000,
      quantity: 80,
      available_quantity: 75,
      description: "Sesi utama + networking dinner",
    },
    {
      key: "startup-bootcamp",
      eventKey: "startup-workshop",
      name: "Bootcamp Pass",
      price: 275000,
      quantity: 90,
      available_quantity: 65,
      description: "Workshop intensif startup",
    },
    {
      key: "startup-mentor",
      eventKey: "startup-workshop",
      name: "Mentor Circle Pass",
      price: 500000,
      quantity: 30,
      available_quantity: 25,
      description: "Workshop + sesi mentor",
    },
    {
      key: "marathon-regular",
      eventKey: "city-marathon",
      name: "10K Bib",
      price: 175000,
      quantity: 800,
      available_quantity: 730,
      description: "Nomor lari 10K",
    },
    {
      key: "marathon-premium",
      eventKey: "city-marathon",
      name: "10K Premium Kit",
      price: 320000,
      quantity: 200,
      available_quantity: 170,
      description: "Bib + race kit premium",
    },
    {
      key: "food-general",
      eventKey: "food-fair",
      name: "General Entry",
      price: 90000,
      quantity: 280,
      available_quantity: 230,
      description: "Akses area festival kuliner",
    },
    {
      key: "food-tasting",
      eventKey: "food-fair",
      name: "Tasting Pass",
      price: 175000,
      quantity: 70,
      available_quantity: 50,
      description: "Akses tasting area spesial",
    },
    {
      key: "wellness-daypass",
      eventKey: "wellness-retreat",
      name: "Day Pass",
      price: 350000,
      quantity: 55,
      available_quantity: 35,
      description: "Akses sesi yoga dan meditasi",
    },
    {
      key: "wellness-full",
      eventKey: "wellness-retreat",
      name: "Full Retreat",
      price: 900000,
      quantity: 25,
      available_quantity: 23,
      description: "Akses full weekend retreat",
    },
    {
      key: "design-general",
      eventKey: "design-exhibition",
      name: "Exhibition Pass",
      price: 120000,
      quantity: 160,
      available_quantity: 140,
      description: "Akses area pameran",
    },
    {
      key: "design-talk",
      eventKey: "design-exhibition",
      name: "Talk Session Pass",
      price: 220000,
      quantity: 40,
      available_quantity: 35,
      description: "Akses pameran + talk session",
    },
    {
      key: "career-regular",
      eventKey: "career-seminar-past",
      name: "Seminar Pass",
      price: 175000,
      quantity: 100,
      available_quantity: 70,
      description: "Akses seminar utama",
    },
    {
      key: "career-vip",
      eventKey: "career-seminar-past",
      name: "VIP Networking Pass",
      price: 300000,
      quantity: 50,
      available_quantity: 40,
      description: "Seminar + networking VIP",
    },
    {
      key: "legacy-standard",
      eventKey: "legacy-business-forum",
      name: "Standard Badge",
      price: 200000,
      quantity: 140,
      available_quantity: 140,
      description: "Data historis forum bisnis",
    },
    {
      key: "legacy-speaker",
      eventKey: "legacy-business-forum",
      name: "Speaker Lounge Pass",
      price: 500000,
      quantity: 40,
      available_quantity: 40,
      description: "Data historis speaker lounge",
    },
  ];

  const ticketTypesByKey: Record<
    string,
    Awaited<ReturnType<typeof upsertDemoTicketType>>
  > = {};

  for (const ticketBlueprint of ticketBlueprints) {
    const event = eventsByKey[ticketBlueprint.eventKey];

    if (!event) {
      throw new Error(`Event not found for ticket key ${ticketBlueprint.key}`);
    }

    const seededTicketType = await upsertDemoTicketType({
      event_id: event.id,
      name: ticketBlueprint.name,
      price: ticketBlueprint.price,
      quantity: ticketBlueprint.quantity,
      available_quantity: ticketBlueprint.available_quantity,
      description: ticketBlueprint.description,
    });

    ticketTypesByKey[ticketBlueprint.key] = seededTicketType;
  }

  const vouchers = await Promise.all([
    prisma.voucher.upsert({
      where: { code: "JAZZDEMO20" },
      update: {
        event_id: eventsByKey["jazz-night"].id,
        discount_type: DiscountType.percentage,
        discount_value: 20,
        max_usage: 200,
        current_usage: 0,
        start_date: subDays(now, 2),
        end_date: addDays(now, 25),
        is_active: true,
      },
      create: {
        event_id: eventsByKey["jazz-night"].id,
        code: "JAZZDEMO20",
        discount_type: DiscountType.percentage,
        discount_value: 20,
        max_usage: 200,
        current_usage: 0,
        start_date: subDays(now, 2),
        end_date: addDays(now, 25),
        is_active: true,
      },
    }),
    prisma.voucher.upsert({
      where: { code: "TECHFLAT50" },
      update: {
        event_id: eventsByKey["tech-conference"].id,
        discount_type: DiscountType.fixed,
        discount_value: 50000,
        max_usage: 150,
        current_usage: 0,
        start_date: subDays(now, 1),
        end_date: addDays(now, 30),
        is_active: true,
      },
      create: {
        event_id: eventsByKey["tech-conference"].id,
        code: "TECHFLAT50",
        discount_type: DiscountType.fixed,
        discount_value: 50000,
        max_usage: 150,
        current_usage: 0,
        start_date: subDays(now, 1),
        end_date: addDays(now, 30),
        is_active: true,
      },
    }),
    prisma.voucher.upsert({
      where: { code: "RETREAT15" },
      update: {
        event_id: eventsByKey["wellness-retreat"].id,
        discount_type: DiscountType.percentage,
        discount_value: 15,
        max_usage: 50,
        current_usage: 0,
        start_date: subDays(now, 5),
        end_date: addDays(now, 35),
        is_active: true,
      },
      create: {
        event_id: eventsByKey["wellness-retreat"].id,
        code: "RETREAT15",
        discount_type: DiscountType.percentage,
        discount_value: 15,
        max_usage: 50,
        current_usage: 0,
        start_date: subDays(now, 5),
        end_date: addDays(now, 35),
        is_active: true,
      },
    }),
  ]);

  const vouchersByCode: Record<string, (typeof vouchers)[number]> = {};
  for (const voucher of vouchers) vouchersByCode[voucher.code] = voucher;

  const coupons = await Promise.all([
    prisma.coupon.upsert({
      where: { code: "DEMOREF10" },
      update: {
        discount_type: DiscountType.percentage,
        discount_value: 10,
      },
      create: {
        code: "DEMOREF10",
        discount_type: DiscountType.percentage,
        discount_value: 10,
      },
    }),
    prisma.coupon.upsert({
      where: { code: "NEWUSER25K" },
      update: {
        discount_type: DiscountType.fixed,
        discount_value: 25000,
      },
      create: {
        code: "NEWUSER25K",
        discount_type: DiscountType.fixed,
        discount_value: 25000,
      },
    }),
  ]);

  const couponsByCode: Record<string, (typeof coupons)[number]> = {};
  for (const coupon of coupons) couponsByCode[coupon.code] = coupon;

  const userCouponsByKey = {
    rinaDemoRef: await upsertUserCoupon(
      customerOne.id,
      couponsByCode.DEMOREF10.id,
      addDays(now, 35),
    ),
    budiNewUser: await upsertUserCoupon(
      customerTwo.id,
      couponsByCode.NEWUSER25K.id,
      addDays(now, 45),
    ),
    sariDemoRef: await upsertUserCoupon(
      customerThree.id,
      couponsByCode.DEMOREF10.id,
      addDays(now, 40),
    ),
  };

  await upsertPoint({
    user_id: customerOne.id,
    amount: 20000,
    amount_remaining: 20000,
    source: PointSource.referral_reward,
    reference_id: 92001,
    expired_at: addDays(now, 60),
  });
  await upsertPoint({
    user_id: customerTwo.id,
    amount: 35000,
    amount_remaining: 35000,
    source: PointSource.referral_reward,
    reference_id: 92002,
    expired_at: addDays(now, 60),
  });
  await upsertPoint({
    user_id: customerThree.id,
    amount: 50000,
    amount_remaining: 50000,
    source: PointSource.referral_reward,
    reference_id: 92003,
    expired_at: addDays(now, 60),
  });

  const transactionBlueprints: SeedTransactionBlueprint[] = [
    {
      invoiceNumber: "DEMO-PAID-001",
      userEmail: customerOne.email,
      eventKey: "career-seminar-past",
      status: TransactionStatus.paid,
      itemLines: [
        { ticketKey: "career-regular", quantity: 2 },
        { ticketKey: "career-vip", quantity: 1 },
      ],
      paidAtOffsetDays: -13,
      review: {
        rating: 5,
        comment: "Materi bagus dan networking session sangat membantu.",
      },
    },
    {
      invoiceNumber: "DEMO-PAID-002",
      userEmail: customerTwo.email,
      eventKey: "jazz-night",
      status: TransactionStatus.paid,
      itemLines: [{ ticketKey: "jazz-vip", quantity: 1 }],
      voucherCode: "JAZZDEMO20",
      userCouponKey: "budiNewUser",
      pointsUsed: 10000,
      paidAtOffsetDays: -1,
    },
    {
      invoiceNumber: "DEMO-PAID-003",
      userEmail: customerThree.email,
      eventKey: "design-exhibition",
      status: TransactionStatus.paid,
      itemLines: [{ ticketKey: "design-talk", quantity: 2 }],
      paidAtOffsetDays: -2,
    },
    {
      invoiceNumber: "DEMO-WAIT-001",
      userEmail: customerOne.email,
      eventKey: "jazz-night",
      status: TransactionStatus.waiting_payment,
      itemLines: [{ ticketKey: "jazz-regular", quantity: 2 }],
      voucherCode: "JAZZDEMO20",
      paymentExpiredOffsetHours: 2,
      snapToken: "demo-snap-token-001",
    },
    {
      invoiceNumber: "DEMO-WAIT-002",
      userEmail: customerThree.email,
      eventKey: "wellness-retreat",
      status: TransactionStatus.waiting_payment,
      itemLines: [{ ticketKey: "wellness-full", quantity: 1 }],
      voucherCode: "RETREAT15",
      userCouponKey: "sariDemoRef",
      pointsUsed: 15000,
      paymentExpiredOffsetHours: 3,
      snapToken: "demo-snap-token-002",
    },
    {
      invoiceNumber: "DEMO-WAIT-003",
      userEmail: customerTwo.email,
      eventKey: "city-marathon",
      status: TransactionStatus.waiting_payment,
      itemLines: [
        { ticketKey: "marathon-regular", quantity: 3 },
        { ticketKey: "marathon-premium", quantity: 1 },
      ],
      paymentExpiredOffsetHours: 4,
      snapToken: "demo-snap-token-003",
    },
    {
      invoiceNumber: "DEMO-EXPIRED-001",
      userEmail: customerTwo.email,
      eventKey: "food-fair",
      status: TransactionStatus.expired,
      itemLines: [{ ticketKey: "food-tasting", quantity: 2 }],
      paymentExpiredOffsetHours: -3,
    },
    {
      invoiceNumber: "DEMO-EXPIRED-002",
      userEmail: customerThree.email,
      eventKey: "startup-workshop",
      status: TransactionStatus.expired,
      itemLines: [{ ticketKey: "startup-bootcamp", quantity: 1 }],
      userCouponKey: "sariDemoRef",
      paymentExpiredOffsetHours: -5,
    },
    {
      invoiceNumber: "DEMO-CANCELED-001",
      userEmail: customerOne.email,
      eventKey: "tech-conference",
      status: TransactionStatus.canceled,
      itemLines: [{ ticketKey: "tech-standard", quantity: 1 }],
      voucherCode: "TECHFLAT50",
      paymentExpiredOffsetHours: -2,
    },
    {
      invoiceNumber: "DEMO-CANCELED-002",
      userEmail: customerTwo.email,
      eventKey: "rock-festival",
      status: TransactionStatus.canceled,
      itemLines: [{ ticketKey: "rock-festival", quantity: 2 }],
      paymentExpiredOffsetHours: -8,
    },
  ];

  const transactionIds: number[] = [];
  const itemsByTransactionId: Record<number, SeedTransactionItemBlueprint[]> =
    {};
  const usedUserCouponIds = new Set<number>();

  for (const transactionBlueprint of transactionBlueprints) {
    const user = usersByEmail[transactionBlueprint.userEmail];
    const event = eventsByKey[transactionBlueprint.eventKey];
    const voucher = transactionBlueprint.voucherCode
      ? vouchersByCode[transactionBlueprint.voucherCode]
      : null;
    const userCoupon = transactionBlueprint.userCouponKey
      ? userCouponsByKey[
          transactionBlueprint.userCouponKey as keyof typeof userCouponsByKey
        ]
      : null;

    if (!user) {
      throw new Error(
        `Customer not found for ${transactionBlueprint.userEmail}`,
      );
    }

    if (!event) {
      throw new Error(`Event not found for ${transactionBlueprint.eventKey}`);
    }

    const detailedItemLines = transactionBlueprint.itemLines.map((line) => {
      const ticketType = ticketTypesByKey[line.ticketKey];
      if (!ticketType) {
        throw new Error(`Ticket type not found for ${line.ticketKey}`);
      }

      return {
        ...line,
        ticketType,
        subtotal: line.quantity * ticketType.price,
      };
    });

    const totalTicketPrice = detailedItemLines.reduce(
      (total, item) => total + item.subtotal,
      0,
    );

    let voucherDiscount = 0;
    if (voucher) {
      voucherDiscount =
        voucher.discount_type === DiscountType.percentage
          ? Math.floor((totalTicketPrice * voucher.discount_value) / 100)
          : voucher.discount_value;
      voucherDiscount = Math.min(voucherDiscount, totalTicketPrice);
    }

    let couponDiscount = 0;
    if (userCoupon) {
      const coupon = coupons.find((entry) => entry.id === userCoupon.coupon_id);
      if (coupon) {
        couponDiscount =
          coupon.discount_type === DiscountType.percentage
            ? Math.floor((totalTicketPrice * coupon.discount_value) / 100)
            : coupon.discount_value;
      }
      couponDiscount = Math.min(
        couponDiscount,
        totalTicketPrice - voucherDiscount,
      );
    }

    const pointsUsed = transactionBlueprint.pointsUsed ?? 0;
    const finalPrice = Math.max(
      0,
      totalTicketPrice - voucherDiscount - couponDiscount - pointsUsed,
    );

    const paidAt =
      transactionBlueprint.status === TransactionStatus.paid
        ? addDays(now, transactionBlueprint.paidAtOffsetDays ?? -1)
        : null;

    let paymentExpiredAt: Date | null = null;
    if (transactionBlueprint.status !== TransactionStatus.paid) {
      paymentExpiredAt = addHours(
        now,
        transactionBlueprint.paymentExpiredOffsetHours ?? 2,
      );
    }

    const seededTransaction = await prisma.transaction.upsert({
      where: { invoice_number: transactionBlueprint.invoiceNumber },
      update: {
        user_id: user.id,
        event_id: event.id,
        voucher_id: voucher?.id ?? null,
        user_coupon_id: userCoupon?.id ?? null,
        invoice_number: transactionBlueprint.invoiceNumber,
        total_ticket_price: totalTicketPrice,
        voucher_discount: voucherDiscount,
        coupon_discount: couponDiscount,
        points_used: pointsUsed,
        final_price: finalPrice,
        status: transactionBlueprint.status,
        paid_at: paidAt,
        payment_expired_at: paymentExpiredAt,
        midtrans_order_id: transactionBlueprint.invoiceNumber,
        snap_token: transactionBlueprint.snapToken ?? null,
      },
      create: {
        user_id: user.id,
        event_id: event.id,
        voucher_id: voucher?.id ?? null,
        user_coupon_id: userCoupon?.id ?? null,
        invoice_number: transactionBlueprint.invoiceNumber,
        total_ticket_price: totalTicketPrice,
        voucher_discount: voucherDiscount,
        coupon_discount: couponDiscount,
        points_used: pointsUsed,
        final_price: finalPrice,
        status: transactionBlueprint.status,
        paid_at: paidAt,
        payment_expired_at: paymentExpiredAt,
        midtrans_order_id: transactionBlueprint.invoiceNumber,
        snap_token: transactionBlueprint.snapToken ?? null,
      },
    });

    transactionIds.push(seededTransaction.id);
    itemsByTransactionId[seededTransaction.id] = transactionBlueprint.itemLines;

    if (
      userCoupon?.id &&
      transactionBlueprint.status !== TransactionStatus.expired
    ) {
      usedUserCouponIds.add(userCoupon.id);
    }

    if (
      transactionBlueprint.review &&
      transactionBlueprint.status === TransactionStatus.paid
    ) {
      await prisma.review.upsert({
        where: { transaction_id: seededTransaction.id },
        update: {
          event_id: event.id,
          user_id: user.id,
          rating: transactionBlueprint.review.rating,
          comment: transactionBlueprint.review.comment,
        },
        create: {
          event_id: event.id,
          user_id: user.id,
          transaction_id: seededTransaction.id,
          rating: transactionBlueprint.review.rating,
          comment: transactionBlueprint.review.comment,
        },
      });
    }
  }

  await prisma.transactionItem.deleteMany({
    where: {
      transaction_id: { in: transactionIds },
    },
  });

  for (const transactionId of transactionIds) {
    const seededLines = itemsByTransactionId[transactionId];

    await prisma.transactionItem.createMany({
      data: seededLines.map((line) => {
        const ticketType = ticketTypesByKey[line.ticketKey];
        return {
          transaction_id: transactionId,
          ticket_type_id: ticketType.id,
          ticket_name: ticketType.name,
          quantity: line.quantity,
          price: ticketType.price,
          subtotal: line.quantity * ticketType.price,
        };
      }),
    });
  }

  const allUserCoupons = Object.values(userCouponsByKey);
  for (const userCoupon of allUserCoupons) {
    await prisma.userCoupon.update({
      where: { id: userCoupon.id },
      data: {
        is_used: usedUserCouponIds.has(userCoupon.id),
        used_at: usedUserCouponIds.has(userCoupon.id) ? now : null,
      },
    });
  }

  console.log("✅ Demo data seeded successfully!");
  console.log(`   Organizers: ${organizerOne.email}, ${organizerTwo.email}`);
  console.log(
    `   Customers: ${customerOne.email}, ${customerTwo.email}, ${customerThree.email}`,
  );
  console.log(`   Seeded events: ${eventBlueprints.length}`);
  console.log(`   Seeded transactions: ${transactionBlueprints.length}`);
  console.log(`   Demo vouchers: ${Object.keys(vouchersByCode).join(", ")}`);
}
