export type OrganizerTransactionStatus = 'waiting_payment' | 'paid' | 'expired' | 'canceled'

export interface OrganizerTransactionItem {
  id: number
  invoice_number: string
  status: OrganizerTransactionStatus
  final_price: number
  created_at: string
  paid_at: string | null
  customer: {
    id: number
    name: string
    email: string
  }
  event: {
    id: number
    name: string
    start_date: string
  }
}

export interface OrganizerTransactionsResponse {
  success: boolean
  data: {
    transactions: OrganizerTransactionItem[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export interface OrganizerTransactionActionResponse {
  success: boolean
  message: string
  data: {
    transactionId: number
    status: OrganizerTransactionStatus
    rollback?: {
      seats_restored: number
      points_restored: boolean
      coupon_restored: boolean
      voucher_usage_decremented: boolean
    }
  }
}