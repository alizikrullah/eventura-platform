export type OrganizerChartPeriod = 'year' | 'month' | 'day'

export interface OrganizerChartFilters {
  period: OrganizerChartPeriod
  year?: number
  month?: number
  day?: number
}

export interface OrganizerDashboardSummary {
  totalEvents: number
  activeEvents: number
  totalPaidTransactions: number
  totalRevenue: number
  totalAttendees: number
}

export interface OrganizerChartPoint {
  label: string
  value: number
}

export interface OrganizerChartDataResponse {
  period: OrganizerChartPeriod
  filters: {
    year: number
    month?: number
    day?: number
  }
  revenue: OrganizerChartPoint[]
  attendees: OrganizerChartPoint[]
}

export interface OrganizerAttendeeFilters {
  page?: number
  limit?: number
  eventId?: number
  search?: string
}

export interface OrganizerAttendeeItem {
  transactionId: number
  invoiceNumber: string
  eventId: number
  eventName: string
  attendeeName: string
  ticketQuantity: number
  totalPricePaid: number
  paidAt: Date
}

export interface OrganizerAttendeesResponse {
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