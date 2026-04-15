import prisma from '../config/prisma';
import { addHours, format } from 'date-fns';
import { createSnapTransaction } from '../config/midtrans';
import { getAvailablePoints, usePoints } from './pointService';
import { sendTransactionAcceptedEmail, sendTransactionRejectedEmail } from './mailService';
import { applyRollbackOperations, getRollbackTransactionSnapshot } from './rollbackService';
import type {
  CreateTransactionPayload,
  TransactionResponse,
  TransactionDetail,
  AvailableDiscounts,
  OrganizerTransactionActionResult,
  OrganizerTransactionsResult,
  TransactionStatus,
} from '../types/transaction';

/**
 * Transaction Service
 * 
 * Business logic for transaction creation, retrieval, and management
 * Integrates with Midtrans Snap API for payment processing
 */

/**
 * Generate unique invoice number
 * 
 * Format: INV-YYYYMMDD-XXXX
 * Example: INV-20260408-1234
 * 
 * Pattern: Same as voucher code generation (see voucherService.ts)
 */
const generateInvoiceNumber = async (): Promise<string> => {
  const prefix = 'INV';
  const date = format(new Date(), 'yyyyMMdd');

  for (let i = 0; i < 5; i++) {
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    const invoice = `${prefix}-${date}-${random}`;

    const exists = await prisma.transaction.findUnique({
      where: { invoice_number: invoice }
    });

    if (!exists) return invoice;
  }

  throw new Error('Cannot generate unique invoice number after 5 attempts');
};

/**
 * Calculate discount amount
 */
const calculateDiscount = (
  price: number,
  discountType: string,
  discountValue: number
): number => {
  if (discountType === 'percentage') {
    return Math.floor((price * discountValue) / 100);
  } else {
    return discountValue;
  }
};

/**
 * Get user's available coupons
 */
export const getAvailableCoupons = async (userId: number) => {
  return await prisma.userCoupon.findMany({
    where: {
      user_id: userId,
      is_used: false,
      expired_at: {
        gt: new Date()
      }
    },
    include: {
      coupon: {
        select: {
          id: true,
          code: true,
          discount_type: true,
          discount_value: true
        }
      }
    }
  });
};

/**
 * Get user's available discounts (points + coupons)
 */
export const getUserAvailableDiscounts = async (
  userId: number
): Promise<AvailableDiscounts> => {
  const points = await prisma.point.findMany({
    where: {
      user_id: userId,
      amount_remaining: { gt: 0 },
      expired_at: {
        gt: new Date()
      }
    },
    select: {
      id: true,
      amount: true,
      amount_remaining: true,
      expired_at: true
    },
    orderBy: {
      created_at: 'asc'
    }
  });

  const totalPoints = points.reduce((sum, p) => sum + p.amount_remaining, 0);

  const coupons = await getAvailableCoupons(userId);

  return {
    points: {
      total_points: totalPoints,
      point_records: points.map(p => ({
        id: p.id,
        amount: p.amount_remaining,
        expired_at: p.expired_at
      }))
    },
    coupons: coupons.map((uc) => ({
      id: uc.id,
      coupon: uc.coupon,
      expired_at: uc.expired_at
    }))
  };
};

/**
 * Create transaction with Midtrans integration
 */
export const createTransaction = async (
  userId: number,
  payload: CreateTransactionPayload
): Promise<TransactionResponse> => {
  const {
    event_id,
    items,
    voucher_code,
    user_coupon_id,
    points_to_use = 0
  } = payload;

  // 1. VALIDATE EVENT
  const event = await prisma.event.findUnique({
    where: { id: event_id, is_active: true },
    include: {
      ticket_types: true,
      organizer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!event) {
    throw new Error('Event not found or inactive');
  }

  if (new Date() > event.end_date) {
    throw new Error('Event has already ended');
  }

  // 2. VALIDATE TICKETS & CALCULATE TOTAL
  let totalTicketPrice = 0;
  let totalQuantity = 0;
  const ticketItems: Array<{
    ticket_type_id: number;
    ticket_name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }> = [];

  for (const item of items) {
    const ticketType = event.ticket_types.find(
      (tt) => tt.id === item.ticket_type_id
    );

    if (!ticketType) {
      throw new Error(
        `Ticket type ID ${item.ticket_type_id} not found for this event`
      );
    }

    if (ticketType.available_quantity < item.quantity) {
      throw new Error(
        `Not enough ${ticketType.name} tickets available. Requested: ${item.quantity}, Available: ${ticketType.available_quantity}`
      );
    }

    const subtotal = ticketType.price * item.quantity;
    totalTicketPrice += subtotal;
    totalQuantity += item.quantity;

    ticketItems.push({
      ticket_type_id: ticketType.id,
      ticket_name: ticketType.name,
      quantity: item.quantity,
      price: ticketType.price,
      subtotal
    });
  }

  if (event.available_seats < totalQuantity) {
    throw new Error(
      `Not enough seats available. Requested: ${totalQuantity}, Available: ${event.available_seats}`
    );
  }

  // 3. VALIDATE & CALCULATE VOUCHER DISCOUNT
  let voucherDiscount = 0;
  let voucherId: number | null = null;

  if (voucher_code) {
    const voucher = await prisma.voucher.findUnique({
      where: { code: voucher_code }
    });

    if (!voucher) {
      throw new Error('Voucher code not found');
    }

    if (!voucher.is_active) {
      throw new Error('Voucher is inactive');
    }

    if (voucher.event_id !== event_id) {
      throw new Error('Voucher is not valid for this event');
    }

    const now = new Date();
    if (now < voucher.start_date || now > voucher.end_date) {
      throw new Error('Voucher is not active at this time');
    }

    if (
      voucher.max_usage !== null &&
      voucher.current_usage >= voucher.max_usage
    ) {
      throw new Error('Voucher usage limit reached');
    }

    voucherDiscount = calculateDiscount(
      totalTicketPrice,
      voucher.discount_type,
      voucher.discount_value
    );
    voucherId = voucher.id;
  }

  // 4. VALIDATE & CALCULATE COUPON DISCOUNT
  let couponDiscount = 0;
  let userCouponIdUsed: number | null = null;

  if (user_coupon_id) {
    const userCoupon = await prisma.userCoupon.findUnique({
      where: { id: user_coupon_id },
      include: { coupon: true }
    });

    if (!userCoupon) {
      throw new Error('Coupon not found');
    }

    if (userCoupon.user_id !== userId) {
      throw new Error('This coupon does not belong to you');
    }

    if (userCoupon.is_used) {
      throw new Error('Coupon has already been used');
    }

    if (new Date() > userCoupon.expired_at) {
      throw new Error('Coupon has expired');
    }

    const priceAfterVoucher = totalTicketPrice - voucherDiscount;
    couponDiscount = calculateDiscount(
      priceAfterVoucher,
      userCoupon.coupon.discount_type,
      userCoupon.coupon.discount_value
    );
    userCouponIdUsed = user_coupon_id;
  }

  // 5. VALIDATE POINTS
  const availablePoints = await getAvailablePoints(userId);

  if (points_to_use > availablePoints) {
    throw new Error(
      `Not enough points. Requested: ${points_to_use}, Available: ${availablePoints}`
    );
  }

  // 6. CALCULATE FINAL PRICE
  let finalPrice = totalTicketPrice - voucherDiscount - couponDiscount - points_to_use;

  if (finalPrice < 0) {
    finalPrice = 0;
  }

  // 7. GENERATE INVOICE NUMBER
  const invoiceNumber = await generateInvoiceNumber();

  // 8. CREATE TRANSACTION + MIDTRANS SNAP
  const paymentExpiredAt = addHours(new Date(), 2);

  const result = await prisma.$transaction(async (tx) => {
    // 8.1. Decrement event seats
    await tx.event.update({
      where: { id: event_id },
      data: {
        available_seats: {
          decrement: totalQuantity
        }
      }
    });

    // 8.2. Decrement ticket type quantities
    for (const item of ticketItems) {
      await tx.ticketType.update({
        where: { id: item.ticket_type_id },
        data: {
          available_quantity: {
            decrement: item.quantity
          }
        }
      });
    }

    // 8.3. Deduct points (if any)
    if (points_to_use > 0) {
      await usePoints(userId, points_to_use, tx);
    }

    // 8.4. Mark coupon as used (if any)
    if (userCouponIdUsed) {
      await tx.userCoupon.update({
        where: { id: userCouponIdUsed },
        data: {
          is_used: true,
          used_at: new Date()
        }
      });
    }

    // 8.5. Increment voucher usage (if any)
    if (voucherId) {
      await tx.voucher.update({
        where: { id: voucherId },
        data: {
          current_usage: {
            increment: 1
          }
        }
      });
    }

    // 8.6. Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        user_id: userId,
        event_id: event_id,
        voucher_id: voucherId,
        user_coupon_id: userCouponIdUsed,
        invoice_number: invoiceNumber,
        total_ticket_price: totalTicketPrice,
        voucher_discount: voucherDiscount,
        coupon_discount: couponDiscount,
        points_used: points_to_use,
        final_price: finalPrice,
        midtrans_order_id: invoiceNumber,
        status: 'waiting_payment',
        payment_expired_at: paymentExpiredAt
      }
    });

    // 8.7. Create transaction items
    for (const item of ticketItems) {
      await tx.transactionItem.create({
        data: {
          transaction_id: transaction.id,
          ticket_type_id: item.ticket_type_id,
          ticket_name: item.ticket_name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal
        }
      });
    }

    return transaction;
  });

  // 9. CALL MIDTRANS SNAP API
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, phone: true }
  });

  const itemDetails = [
    ...ticketItems.map((item) => ({
      id: item.ticket_type_id.toString(),
      name: item.ticket_name,
      price: item.price,
      quantity: item.quantity
    }))
  ];

  if (voucherDiscount > 0) {
    itemDetails.push({
      id: 'voucher_discount',
      name: `Voucher Discount (${voucher_code})`,
      price: -voucherDiscount,
      quantity: 1
    });
  }

  if (couponDiscount > 0) {
    itemDetails.push({
      id: 'coupon_discount',
      name: 'Coupon Discount',
      price: -couponDiscount,
      quantity: 1
    });
  }

  if (points_to_use > 0) {
    itemDetails.push({
      id: 'points_discount',
      name: 'Points Discount',
      price: -points_to_use,
      quantity: 1
    });
  }

  const snapParameter = {
    orderId: invoiceNumber,
    amount: finalPrice,
    customerDetails: {
      firstName: user!.name,
      email: user!.email,
      phone: user!.phone || ''
    },
    itemDetails
  };

  let midtransResult: Awaited<ReturnType<typeof createSnapTransaction>>;

  try {
    midtransResult = await createSnapTransaction(snapParameter);
  } catch (error: any) {
    await transitionTransactionToStatus(result.id, 'canceled', { sendEmail: false });
    throw new Error(`Failed to initialize payment gateway: ${error.message}`);
  }

  // 10. UPDATE TRANSACTION WITH SNAP TOKEN
  const updatedTransaction = await prisma.transaction.update({
    where: { id: result.id },
    data: {
      snap_token: midtransResult.token,
      midtrans_order_id: invoiceNumber
    }
  });

  // 11. RETURN RESPONSE
  return {
    transaction: {
      id: updatedTransaction.id,
      invoice_number: updatedTransaction.invoice_number,
      event_id: updatedTransaction.event_id,
      total_ticket_price: updatedTransaction.total_ticket_price,
      voucher_discount: updatedTransaction.voucher_discount,
      coupon_discount: updatedTransaction.coupon_discount,
      points_used: updatedTransaction.points_used,
      final_price: updatedTransaction.final_price,
      status: updatedTransaction.status as any,
      payment_expired_at: updatedTransaction.payment_expired_at!,
      created_at: updatedTransaction.created_at
    },
    snap_token: midtransResult.token,
    snap_redirect_url: midtransResult.redirect_url
  };
};

/**
 * Get user's transactions with pagination
 */
export const getUserTransactions = async (
  userId: number,
  filters: {
    status?: string;
    page?: number;
    limit?: number;
  }
) => {
  const { status, page = 1, limit = 10 } = filters;

  const where: any = {
    user_id: userId
  };

  if (status) {
    where.status = status;
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            start_date: true,
            image_url: true,
            location: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.transaction.count({ where })
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get transaction detail by ID
 */
export const getTransactionDetail = async (
  transactionId: number,
  userId: number
): Promise<TransactionDetail> => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      event: {
        select: {
          id: true,
          name: true,
          location: true,
          venue: true,
          start_date: true,
          image_url: true
        }
      },
      transaction_items: {
        select: {
          id: true,
          ticket_name: true,
          quantity: true,
          price: true,
          subtotal: true
        }
      }
    }
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  if (transaction.user_id !== userId) {
    throw new Error('Unauthorized access to this transaction');
  }

  return {
    id: transaction.id,
    invoice_number: transaction.invoice_number,
    event: transaction.event,
    items: transaction.transaction_items,
    total_ticket_price: transaction.total_ticket_price,
    voucher_discount: transaction.voucher_discount,
    coupon_discount: transaction.coupon_discount,
    points_used: transaction.points_used,
    final_price: transaction.final_price,
    status: transaction.status as any,
    payment_expired_at: transaction.payment_expired_at,
    created_at: transaction.created_at,
    updated_at: transaction.updated_at
  };
};

export const getOrganizerTransactions = async (
  organizerId: number,
  filters: {
    status?: string;
    page?: number;
    limit?: number;
  }
): Promise<OrganizerTransactionsResult> => {
  const { status, page = 1, limit = 10 } = filters;

  const where: any = {
    event: {
      organizer_id: organizerId,
    },
  };

  if (status) {
    where.status = status;
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        invoice_number: true,
        status: true,
        final_price: true,
        created_at: true,
        paid_at: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            start_date: true,
          },
        },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  const mappedTransactions = transactions.map((transaction) => ({
    id: transaction.id,
    invoice_number: transaction.invoice_number,
    status: transaction.status,
    final_price: transaction.final_price,
    created_at: transaction.created_at,
    paid_at: transaction.paid_at,
    customer: transaction.user,
    event: transaction.event,
  }));

  return {
    transactions: mappedTransactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

const getTransactionNotificationContext = async (transactionId: number) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: {
      id: true,
      invoice_number: true,
      status: true,
      final_price: true,
      paid_at: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      event: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  return transaction;
};

export const transitionTransactionToStatus = async (
  transactionId: number,
  targetStatus: Extract<TransactionStatus, 'paid' | 'expired' | 'canceled'>,
  options: { sendEmail?: boolean } = {}
): Promise<{ transactionId: number; status: TransactionStatus; rollback?: OrganizerTransactionActionResult['rollback']; changed: boolean }> => {
  const existing = await getTransactionNotificationContext(transactionId);

  if (existing.status === targetStatus) {
    return {
      transactionId,
      status: existing.status,
      changed: false,
    };
  }

  if (existing.status !== 'waiting_payment') {
    return {
      transactionId,
      status: existing.status,
      changed: false,
    };
  }

  const updatedAt = new Date();
  let updated;
  let rollback: OrganizerTransactionActionResult['rollback'];

  if (targetStatus === 'paid') {
    updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: targetStatus,
        updated_at: updatedAt,
        payment_expired_at: null,
        ...(existing.paid_at ? {} : { paid_at: updatedAt }),
      },
    });
  } else {
    const result = await prisma.$transaction(async (tx) => {
      const snapshot = await getRollbackTransactionSnapshot(tx, transactionId);

      if (!snapshot) {
        throw new Error('Transaction not found');
      }

      const updatedTransaction = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: targetStatus,
          updated_at: updatedAt,
          payment_expired_at: null,
          snap_token: null,
        },
      });

      const rollbackResult = await applyRollbackOperations(tx, snapshot);

      return {
        updatedTransaction,
        rollbackResult,
      };
    });

    updated = result.updatedTransaction;
    rollback = result.rollbackResult;
  }

  if (options.sendEmail !== false) {
    if (targetStatus === 'paid') {
      await sendTransactionAcceptedEmail({
        to: existing.user.email,
        userName: existing.user.name,
        eventName: existing.event.name,
        invoiceNumber: existing.invoice_number,
        finalPrice: existing.final_price,
      });
    } else {
      await sendTransactionRejectedEmail({
        to: existing.user.email,
        userName: existing.user.name,
        eventName: existing.event.name,
        invoiceNumber: existing.invoice_number,
        finalPrice: existing.final_price,
        failureType: targetStatus === 'expired' ? 'expired' : 'canceled',
      });
    }
  }

  return {
    transactionId: updated.id,
    status: updated.status,
    rollback,
    changed: true,
  };
};

async function getOrganizerOwnedTransaction(transactionId: number, organizerId: number) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      event: {
        select: {
          id: true,
          name: true,
          organizer_id: true,
        },
      },
    },
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  if (transaction.event.organizer_id !== organizerId) {
    throw new Error('Unauthorized access to this transaction');
  }

  return transaction;
}

export const approveTransactionByOrganizer = async (
  transactionId: number,
  organizerId: number
): Promise<OrganizerTransactionActionResult> => {
  await getOrganizerOwnedTransaction(transactionId, organizerId);

  throw new Error('Midtrans transactions cannot be approved manually. Wait for Midtrans webhook confirmation');
};

export const rejectTransactionByOrganizer = async (
  transactionId: number,
  organizerId: number
): Promise<OrganizerTransactionActionResult> => {
  const transaction = await getOrganizerOwnedTransaction(transactionId, organizerId);

  if (transaction.status === 'expired') {
    throw new Error('Expired transaction cannot be rejected again');
  }

  if (transaction.status === 'canceled') {
    throw new Error('Transaction has already been rejected');
  }

  if (transaction.status === 'paid') {
    throw new Error('Paid transaction cannot be rejected');
  }

  const result = await transitionTransactionToStatus(transactionId, 'canceled');

  return {
    transactionId,
    status: result.status,
    rollback: result.rollback,
  };
};