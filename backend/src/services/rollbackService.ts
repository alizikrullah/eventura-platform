import prisma from '../config/prisma';
import { restorePoints } from './pointService';
import type { RollbackResult } from '../types/transaction';

/**
 * Rollback Service
 * 
 * Handles restoration of resources when transaction is expired or canceled
 * - Restore event seats
 * - Restore ticket type quantities
 * - Restore points (create new point record with 3-month expiration)
 * - Restore coupon (mark as unused)
 * - Decrement voucher usage
 */

/**
 * Rollback transaction
 */
export const rollbackTransaction = async (
  transactionId: number
): Promise<RollbackResult> => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      transaction_items: {
        include: {
          ticket_type: true
        }
      },
      event: true,
      voucher: true,
      user_coupon: true
    }
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  if (
    transaction.status !== 'expired' &&
    transaction.status !== 'canceled'
  ) {
    throw new Error(
      `Cannot rollback transaction with status: ${transaction.status}`
    );
  }

  const result: RollbackResult = {
    seats_restored: 0,
    points_restored: false,
    coupon_restored: false,
    voucher_usage_decremented: false
  };

  await prisma.$transaction(async (tx) => {
    // 1. RESTORE EVENT SEATS
    const totalQuantity = transaction.transaction_items.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0
    );

    await tx.event.update({
      where: { id: transaction.event_id },
      data: {
        available_seats: {
          increment: totalQuantity
        }
      }
    });

    result.seats_restored = totalQuantity;

    // 2. RESTORE TICKET TYPE QUANTITIES
    for (const item of transaction.transaction_items) {
      if (item.ticket_type_id) {
        await tx.ticketType.update({
          where: { id: item.ticket_type_id },
          data: {
            available_quantity: {
              increment: item.quantity
            }
          }
        });
      }
    }

    // 3. RESTORE POINTS
    if (transaction.points_used > 0) {
      await restorePoints(
        transaction.user_id,
        transaction.points_used,
        'referral_reward',
        transaction.id
      );
      
      result.points_restored = true;
    }

    // 4. RESTORE COUPON
    if (transaction.user_coupon_id) {
      await tx.userCoupon.update({
        where: { id: transaction.user_coupon_id },
        data: {
          is_used: false,
          used_at: null
        }
      });

      result.coupon_restored = true;
    }

    // 5. DECREMENT VOUCHER USAGE
    if (transaction.voucher_id) {
      await tx.voucher.update({
        where: { id: transaction.voucher_id },
        data: {
          current_usage: {
            decrement: 1
          }
        }
      });

      result.voucher_usage_decremented = true;
    }
  });

  console.log(
    `Rollback completed for transaction ${transaction.invoice_number}:`,
    result
  );

  return result;
};

/**
 * Check if transaction needs rollback
 */
export const needsRollback = (transaction: {
  status: string;
  payment_expired_at: Date | null;
}): boolean => {
  if (transaction.status === 'expired' || transaction.status === 'canceled') {
    return true;
  }

  if (
    transaction.status === 'waiting_payment' &&
    transaction.payment_expired_at &&
    new Date() > transaction.payment_expired_at
  ) {
    return true;
  }

  return false;
};

/**
 * Auto-expire transaction and rollback
 */
export const expireAndRollbackTransaction = async (
  transactionId: number
): Promise<void> => {
  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      status: 'expired',
      updated_at: new Date()
    }
  });

  await rollbackTransaction(transactionId);

  console.log(`Transaction ${transactionId} expired and rolled back`);
};