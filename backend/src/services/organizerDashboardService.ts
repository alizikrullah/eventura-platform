import prisma from '../config/prisma'
import type {
  OrganizerAttendeeFilters,
  OrganizerAttendeesResponse,
  OrganizerChartDataResponse,
  OrganizerChartFilters,
  OrganizerChartPoint,
  OrganizerDashboardSummary,
} from '../types/organizerDashboard'

const PAID_STATUS = 'paid' as const

const getMonthLabels = () => Array.from({ length: 12 }, (_, index) => `${String(index + 1).padStart(2, '0')}`)

const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate()

const getDayLabels = (year: number, month: number) =>
  Array.from({ length: getDaysInMonth(year, month) }, (_, index) => {
    const day = index + 1
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  })

const getHourLabels = () => Array.from({ length: 24 }, (_, index) => `${String(index).padStart(2, '0')}:00`)

const toChartPoints = (labels: string[], values: Map<string, number>): OrganizerChartPoint[] =>
  labels.map((label) => ({
    label,
    value: values.get(label) ?? 0,
  }))

const getTicketQuantity = (transaction: { transaction_items: Array<{ quantity: number }> }) =>
  transaction.transaction_items.reduce((total, item) => total + item.quantity, 0)

export const getOrganizerSummary = async (organizerId: number): Promise<OrganizerDashboardSummary> => {
  const paidTransactionWhere = {
    status: PAID_STATUS,
    event: { organizer_id: organizerId },
  }

  const [totalEvents, activeEvents, paidTransactionsCount, revenueAggregate, attendeeAggregate] = await Promise.all([
    prisma.event.count({ where: { organizer_id: organizerId } }),
    prisma.event.count({ where: { organizer_id: organizerId, is_active: true } }),
    prisma.transaction.count({
      where: paidTransactionWhere,
    }),
    prisma.transaction.aggregate({
      where: paidTransactionWhere,
      _sum: {
        final_price: true,
      },
    }),
    prisma.transactionItem.aggregate({
      where: {
        transaction: paidTransactionWhere,
      },
      _sum: {
        quantity: true,
      },
    }),
  ])

  return {
    totalEvents,
    activeEvents,
    totalPaidTransactions: paidTransactionsCount,
    totalRevenue: revenueAggregate._sum.final_price ?? 0,
    totalAttendees: attendeeAggregate._sum.quantity ?? 0,
  }
}

export const getOrganizerChartData = async (
  organizerId: number,
  filters: OrganizerChartFilters,
): Promise<OrganizerChartDataResponse> => {
  const now = new Date()
  const year = filters.year ?? now.getFullYear()
  const month = filters.month ?? now.getMonth() + 1
  const day = filters.day ?? now.getDate()

  const rangeStart =
    filters.period === 'year'
      ? new Date(year, 0, 1, 0, 0, 0, 0)
      : filters.period === 'month'
        ? new Date(year, month - 1, 1, 0, 0, 0, 0)
        : new Date(year, month - 1, day, 0, 0, 0, 0)

  const rangeEnd =
    filters.period === 'year'
      ? new Date(year + 1, 0, 1, 0, 0, 0, 0)
      : filters.period === 'month'
        ? new Date(year, month, 1, 0, 0, 0, 0)
        : new Date(year, month - 1, day + 1, 0, 0, 0, 0)

  const transactions = await prisma.transaction.findMany({
    where: {
      status: PAID_STATUS,
      paid_at: {
        gte: rangeStart,
        lt: rangeEnd,
      },
      event: {
        organizer_id: organizerId,
      },
    },
    select: {
      final_price: true,
      paid_at: true,
      transaction_items: {
        select: {
          quantity: true,
        },
      },
    },
  })

  const revenueValues = new Map<string, number>()
  const attendeeValues = new Map<string, number>()

  transactions.forEach((transaction) => {
    if (!transaction.paid_at) {
      return
    }

    const paidAt = new Date(transaction.paid_at)

    const label =
      filters.period === 'year'
        ? `${String(paidAt.getMonth() + 1).padStart(2, '0')}`
        : filters.period === 'month'
          ? `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, '0')}-${String(paidAt.getDate()).padStart(2, '0')}`
          : `${String(paidAt.getHours()).padStart(2, '0')}:00`

    revenueValues.set(label, (revenueValues.get(label) ?? 0) + transaction.final_price)
    attendeeValues.set(label, (attendeeValues.get(label) ?? 0) + getTicketQuantity(transaction))
  })

  const labels =
    filters.period === 'year'
      ? getMonthLabels()
      : filters.period === 'month'
        ? getDayLabels(year, month)
        : getHourLabels()

  return {
    period: filters.period,
    filters: {
      year,
      ...(filters.period !== 'year' ? { month } : {}),
      ...(filters.period === 'day' ? { day } : {}),
    },
    revenue: toChartPoints(labels, revenueValues),
    attendees: toChartPoints(labels, attendeeValues),
  }
}

export const getOrganizerAttendees = async (
  organizerId: number,
  filters: OrganizerAttendeeFilters,
): Promise<OrganizerAttendeesResponse> => {
  const page = filters.page && filters.page > 0 ? filters.page : 1
  const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 50) : 10
  const skip = (page - 1) * limit
  const search = filters.search?.trim()

  const where = {
    status: PAID_STATUS,
    event: {
      organizer_id: organizerId,
      ...(filters.eventId ? { id: filters.eventId } : {}),
    },
    ...(search
      ? {
          OR: [
            { invoice_number: { contains: search, mode: 'insensitive' as const } },
            { user: { name: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  }

  const [transactions, total, eventOptions] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        paid_at: 'desc',
      },
      select: {
        id: true,
        invoice_number: true,
        final_price: true,
        created_at: true,
        paid_at: true,
        user: {
          select: {
            name: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        transaction_items: {
          select: {
            quantity: true,
          },
        },
      },
    }),
    prisma.transaction.count({ where }),
    prisma.event.findMany({
      where: {
        organizer_id: organizerId,
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
      },
    }),
  ])

  return {
    items: transactions.map((transaction) => ({
      transactionId: transaction.id,
      invoiceNumber: transaction.invoice_number,
      eventId: transaction.event.id,
      eventName: transaction.event.name,
      attendeeName: transaction.user.name,
      ticketQuantity: getTicketQuantity(transaction),
      totalPricePaid: transaction.final_price,
      paidAt: transaction.paid_at ?? transaction.created_at,
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    filters: {
      ...(filters.eventId ? { eventId: filters.eventId } : {}),
      ...(search ? { search } : {}),
    },
    eventOptions,
  }
}