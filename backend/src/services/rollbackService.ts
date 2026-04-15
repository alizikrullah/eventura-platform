import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import { restorePoints } from './pointService';
import type { RollbackResult } from '../types/transaction';

type RollbackReader = Pick<Prisma.TransactionClient, 'transaction'>;

export type RollbackTransactionSnapshot = Prisma.TransactionGetPayload<{
  include: {
    transaction_items: {
      include: {
        ticket_type: true
      }
    }
    event: true
    voucher: true
    user_coupon: true
  }
}>;

export const getRollbackTransactionSnapshot = async (
  dbClient: RollbackReader,
  transactionId: number
): Promise<RollbackTransactionSnapshot | null> => {
  return dbClient.transaction.findUnique({
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
};

export const applyRollbackOperations = async (
  tx: Prisma.TransactionClient,
  transaction: RollbackTransactionSnapshot
): Promise<RollbackResult> => {
  const result: RollbackResult = {
    seats_restored: 0,
    points_restored: false,
    coupon_restored: false,
    voucher_usage_decremented: false
  };

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

  if (transaction.points_used > 0) {
    await restorePoints(
      transaction.user_id,
      transaction.points_used,
      'transaction_refund',
      transaction.id,
      tx
    );

    result.points_restored = true;
  }

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

  return result;
};

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
  const transaction = await getRollbackTransactionSnapshot(prisma, transactionId);

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

  const result = await prisma.$transaction(async (tx) => applyRollbackOperations(tx, transaction));

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
  const transaction = await getRollbackTransactionSnapshot(prisma, transactionId);

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'expired',
        updated_at: new Date(),
        payment_expired_at: null,
        snap_token: null,
      }
    });

    await applyRollbackOperations(tx, transaction);
  });

  console.log(`Transaction ${transactionId} expired and rolled back`);
};