export type OrganizerChartPeriod = 'year' | 'month' | 'day'

export interface OrganizerDashboardSummary {
  totalEvents: number
  activeEvents: number
  totalPaidTransactions: number
  totalRevenue: number
  totalAttendees: number
}

export interface OrganizerDashboardSummaryResponse {
  success: boolean
  data: {
    summary: OrganizerDashboardSummary
  }
}

export interface OrganizerChartPoint {
  label: string
  value: number
}

export interface OrganizerChartsResponse {
  success: boolean
  data: {
    period: OrganizerChartPeriod
    filters: {
      year: number
      month?: number
      day?: number
    }
    revenue: OrganizerChartPoint[]
    attendees: OrganizerChartPoint[]
  }
}

export interface OrganizerAttendeeItem {
  transactionId: number
  invoiceNumber: string
  eventId: number
  eventName: string
  attendeeName: string
  ticketQuantity: number
  totalPricePaid: number
  paidAt: string
}

export interface OrganizerAttendeesResponse {
  success: boolean
  data: {
    items: OrganizerAttendeeItem[]
    meta: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    filters: {
      eventId?: number
      search?: string
    }
    eventOptions: Array<{
      id: number
      name: string
    }>
  }
}

export interface OrganizerAttendeeQuery {
  page?: number
  limit?: number
  eventId?: number
  search?: string
}

export interface OrganizerChartsQuery {
  period: OrganizerChartPeriod
  year?: number
  month?: number
  day?: number
}