// backend/src/services/voucherService.ts

import prisma from '../config/prisma';
// @ts-ignore - Package doesn't have TypeScript definitions
import voucher_codes from 'voucher-code-generator';
import {
  CreateVoucherPayload,
  UpdateVoucherPayload,
  VoucherFilters,
  ValidateVoucherResponse
} from '../types/voucher';

/**
 * Generate unique voucher code
 */
const generateVoucherCode = async (): Promise<string> => {
  let isUnique = false;
  let code = '';

  while (!isUnique) {
    // Generate code: 8 characters, uppercase alphanumeric
    const codes = voucher_codes.generate({
      length: 8,
      count: 1,
      charset: voucher_codes.charset('alphanumeric'),
      prefix: 'VC-'
    });
    code = codes[0];

    // Check if code already exists
    const existing = await prisma.voucher.findUnique({
      where: { code }
    });

    if (!existing) {
      isUnique = true;
    }
  }

  return code;
};

/**
 * Create new voucher
 */
export const createVoucher = async (
  organizerId: number,
  payload: CreateVoucherPayload
) => {
  // Verify event exists and belongs to organizer
  const event = await prisma.event.findUnique({
    where: { id: payload.event_id }
  });

  if (!event) {
    throw new Error('Event not found');
  }

  if (event.organizer_id !== organizerId) {
    throw new Error('You can only create vouchers for your own events');
  }

  // Generate code if not provided
  const code = payload.code || await generateVoucherCode();

  // Check if custom code already exists
  if (payload.code) {
    const existing = await prisma.voucher.findUnique({
      where: { code: payload.code }
    });
    if (existing) {
      throw new Error('Voucher code already exists');
    }
  }

  // Create voucher
  const voucher = await prisma.voucher.create({
    data: {
      event_id: payload.event_id,
      code,
      discount_type: payload.discount_type,
      discount_value: payload.discount_value,
      max_usage: payload.max_usage,
      current_usage: 0,
      start_date: new Date(payload.start_date),
      end_date: new Date(payload.end_date),
      is_active: true
    },
    include: {
      event: {
        select: {
          id: true,
          name: true,
          organizer_id: true
        }
      }
    }
  });

  return voucher;
};

/**
 * Get vouchers for organizer's events
 */
export const getVouchers = async (
  organizerId: number,
  filters: VoucherFilters
) => {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    event: {
      organizer_id: organizerId
    }
  };

  if (filters.event_id) {
    where.event_id = filters.event_id;
  }

  if (filters.is_active !== undefined) {
    where.is_active = filters.is_active;
  }

  // Get vouchers with pagination
  const [vouchers, total] = await Promise.all([
    prisma.voucher.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        created_at: 'desc'
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            start_date: true
          }
        }
      }
    }),
    prisma.voucher.count({ where })
  ]);

  return {
    vouchers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get voucher by ID (with ownership check)
 */
export const getVoucherById = async (
  id: number,
  organizerId: number
) => {
  const voucher = await prisma.voucher.findUnique({
    where: { id },
    include: {
      event: {
        select: {
          id: true,
          name: true,
          organizer_id: true,
          start_date: true
        }
      }
    }
  });

  if (!voucher) {
    throw new Error('Voucher not found');
  }

  if (voucher.event.organizer_id !== organizerId) {
    throw new Error('Unauthorized access to this voucher');
  }

  return voucher;
};

/**
 * Validate voucher code for checkout
 */
export const validateVoucher = async (
  code: string,
  eventId: number
): Promise<ValidateVoucherResponse> => {
  const voucher = await prisma.voucher.findUnique({
    where: { code },
    include: {
      event: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  // Check if voucher exists
  if (!voucher) {
    return {
      valid: false,
      message: 'Voucher code not found'
    };
  }

  // Check if voucher is for this event
  if (voucher.event_id !== eventId) {
    return {
      valid: false,
      message: 'This voucher is not valid for this event'
    };
  }

  // Check if voucher is active
  if (!voucher.is_active) {
    return {
      valid: false,
      message: 'Voucher is no longer active'
    };
  }

  // Check date range
  const now = new Date();
  if (now < voucher.start_date) {
    return {
      valid: false,
      message: 'Voucher is not yet valid'
    };
  }
  if (now > voucher.end_date) {
    return {
      valid: false,
      message: 'Voucher has expired'
    };
  }

  // Check usage limit
  if (voucher.max_usage !== null && voucher.current_usage >= voucher.max_usage) {
    return {
      valid: false,
      message: 'Voucher usage limit reached'
    };
  }

  // Voucher is valid
  return {
    valid: true,
    voucher: {
      id: voucher.id,
      code: voucher.code,
      discount_type: voucher.discount_type as 'percentage' | 'fixed',
      discount_value: voucher.discount_value,
      event: voucher.event
    }
  };
};

/**
 * Update voucher
 */
export const updateVoucher = async (
  id: number,
  organizerId: number,
  payload: UpdateVoucherPayload
) => {
  // Verify ownership
  await getVoucherById(id, organizerId);

  // Update voucher
  const voucher = await prisma.voucher.update({
    where: { id },
    data: {
      ...(payload.discount_type && { discount_type: payload.discount_type }),
      ...(payload.discount_value !== undefined && { discount_value: payload.discount_value }),
      ...(payload.max_usage !== undefined && { max_usage: payload.max_usage }),
      ...(payload.start_date && { start_date: new Date(payload.start_date) }),
      ...(payload.end_date && { end_date: new Date(payload.end_date) }),
      ...(payload.is_active !== undefined && { is_active: payload.is_active })
    },
    include: {
      event: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  return voucher;
};

/**
 * Delete voucher (soft delete)
 */
export const deleteVoucher = async (
  id: number,
  organizerId: number
) => {
  // Verify ownership
  await getVoucherById(id, organizerId);

  // Check if voucher has been used
  const usageCount = await prisma.transaction.count({
    where: {
      voucher_id: id,
      status: {
        in: ['waiting_payment', 'paid']
      }
    }
  });

  if (usageCount > 0) {
    throw new Error('Cannot delete voucher that has been used in transactions');
  }

  // Soft delete
  const voucher = await prisma.voucher.update({
    where: { id },
    data: {
      is_active: false
    }
  });

  return voucher;
};
