// backend/src/types/voucher.ts

export interface CreateVoucherPayload {
  event_id: number;
  code?: string; // Optional, auto-generate if not provided
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_usage?: number | null; // null = unlimited
  start_date: string; // ISO datetime
  end_date: string; // ISO datetime
}

export interface UpdateVoucherPayload {
  code?: string;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  max_usage?: number | null;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export interface VoucherFilters {
  event_id?: number;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface ValidateVoucherPayload {
  event_id: number;
}

export interface ValidateVoucherResponse {
  valid: boolean;
  voucher?: {
    id: number;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    event: {
      id: number;
      name: string;
    };
  };
  message?: string;
}