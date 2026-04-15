/**
 * Transaction Types
 * 
 * These interfaces define the structure for transaction-related data.
 * Used across services, controllers, and validators.
 */

/**
 * Transaction status enum
 * 
 * Flow: waiting_payment → paid/expired/canceled
 * - waiting_payment: Initial state, waiting for Midtrans payment
 * - paid: Payment successful (Midtrans settlement)
 * - expired: Payment timeout (2 hours) or Midtrans expired
 * - canceled: Transaction canceled by user or Midtrans
 */
export type TransactionStatus = 'waiting_payment' | 'paid' | 'expired' | 'canceled';

/**
 * Ticket item in checkout request
 * 
 * Example: { ticket_type_id: 1, quantity: 2 }
 */
export interface TicketItem {
  ticket_type_id: number;
  quantity: number;
}

/**
 * Create transaction payload from frontend
 * 
 * Example:
 * {
 *   event_id: 1,
 *   items: [{ ticket_type_id: 1, quantity: 2 }],
 *   voucher_code: "VC-ABC12345", // optional
 *   user_coupon_id: 1, // optional
 *   points_to_use: 5000 // optional
 * }
 */
export interface CreateTransactionPayload {
  event_id: number;
  items: TicketItem[];
  voucher_code?: string; // Optional voucher code
  user_coupon_id?: number; // Optional user coupon ID
  points_to_use?: number; // Optional points amount (max: user's available points)
}

/**
 * Transaction service response
 * 
 * Returned after creating transaction
 * Contains transaction details and Midtrans snap token
 */
export interface TransactionResponse {
  transaction: {
    id: number;
    invoice_number: string;
    event_id: number;
    total_ticket_price: number;
    voucher_discount: number;
    coupon_discount: number;
    points_used: number;
    final_price: number;
    status: TransactionStatus;
    payment_expired_at: Date;
    created_at: Date;
  };
  snap_token: string; // For frontend Midtrans Snap popup
  snap_redirect_url: string; // Alternative redirect URL
}

/**
 * Midtrans webhook notification payload
 * 
 * Received from Midtrans after payment status change
 * 
 * Docs: https://docs.midtrans.com/en/after-payment/http-notification
 */
export interface MidtransNotification {
  transaction_time: string;
  transaction_status: string; // settlement, pending, expire, cancel, deny
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  order_id: string; // Our invoice_number
  merchant_id: string;
  gross_amount: string;
  fraud_status: string; // accept, challenge, deny
  currency: string;
}

/**
 * Get available points/coupons response
 * 
 * Used in checkout to show user's available discounts
 */
export interface AvailableDiscounts {
  points: {
    total_points: number;
    point_records: Array<{
      id: number;
      amount: number;
      expired_at: Date;
    }>;
  };
  coupons: Array<{
    id: number;
    coupon: {
      code: string;
      discount_type: string;
      discount_value: number;
    };
    expired_at: Date;
  }>;
}

/**
 * Transaction detail with relations
 * 
 * Used for GET /api/transactions/:id response
 */
export interface TransactionDetail {
  id: number;
  invoice_number: string;
  event: {
    id: number;
    name: string;
    location: string;
    venue: string | null;
    start_date: Date;
    image_url: string | null;
  };
  items: Array<{
    id: number;
    ticket_name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  total_ticket_price: number;
  voucher_discount: number;
  coupon_discount: number;
  points_used: number;
  final_price: number;
  status: TransactionStatus;
  payment_expired_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Rollback result
 * 
 * Used internally to track what was restored
 */
export interface RollbackResult {
  seats_restored: number;
  points_restored: boolean;
  coupon_restored: boolean;
  voucher_usage_decremented: boolean;
}

export interface OrganizerTransactionListItem {
  id: number;
  invoice_number: string;
  status: TransactionStatus;
  final_price: number;
  created_at: Date;
  paid_at: Date | null;
  customer: {
    id: number;
    name: string;
    email: string;
  };
  event: {
    id: number;
    name: string;
    start_date: Date;
  };
}

export interface OrganizerTransactionsResult {
  transactions: OrganizerTransactionListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrganizerTransactionActionResult {
  transactionId: number;
  status: TransactionStatus;
  rollback?: RollbackResult;
}
