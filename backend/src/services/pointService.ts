import prisma from '../config/prisma';
import { PointSource } from '@prisma/client';

/**
 * Get total available points balance for a user
 * Only counts non-expired points with remaining balance
 */
export const getAvailablePoints = async (userId: number): Promise<number> => {
  const points = await prisma.point.findMany({
    where: {
      user_id: userId,
      amount_remaining: { gt: 0 },
      expired_at: { gt: new Date() },
    },
    select: {
      amount_remaining: true,
    },
  });

  const totalBalance = points.reduce((sum, point) => sum + point.amount_remaining, 0);
  return totalBalance;
};

/**
 * Use points from user's balance (FIFO - oldest first)
 * Deducts from multiple point records if needed
 * 
 * @throws Error if insufficient balance
 */
export const usePoints = async (
  userId: number,
  amountToUse: number
): Promise<void> => {
  if (amountToUse <= 0) {
    throw new Error('Amount to use must be greater than 0');
  }

  // Check available balance first
  const availableBalance = await getAvailablePoints(userId);
  if (amountToUse > availableBalance) {
    throw new Error(`Insufficient points. Available: ${availableBalance}, Requested: ${amountToUse}`);
  }

  // Get point records ordered by created_at (FIFO)
  const pointRecords = await prisma.point.findMany({
    where: {
      user_id: userId,
      amount_remaining: { gt: 0 },
      expired_at: { gt: new Date() },
    },
    orderBy: {
      created_at: 'asc', // FIFO - use oldest first
    },
  });

  let remainingToUse = amountToUse;

  // Deduct from point records
  for (const record of pointRecords) {
    if (remainingToUse <= 0) break;

    const deductAmount = Math.min(record.amount_remaining, remainingToUse);

    await prisma.point.update({
      where: { id: record.id },
      data: {
        amount_remaining: record.amount_remaining - deductAmount,
      },
    });

    remainingToUse -= deductAmount;
  }

  if (remainingToUse > 0) {
    throw new Error('Failed to deduct points completely');
  }
};

/**
 * Restore points back to user (used in rollback scenarios)
 * Creates new point record with 3-month expiration
 */
export const restorePoints = async (
  userId: number,
  amount: number,
  source: PointSource = 'referral_reward', // Default source, can be customized
  referenceId?: number
): Promise<void> => {
  if (amount <= 0) {
    throw new Error('Amount to restore must be greater than 0');
  }

  const expiredAt = new Date();
  expiredAt.setMonth(expiredAt.getMonth() + 3); // 3 months from now

  await prisma.point.create({
    data: {
      user_id: userId,
      amount: amount,
      amount_remaining: amount,
      source: source,
      reference_id: referenceId,
      expired_at: expiredAt,
    },
  });
};

/**
 * Get point transaction history for a user
 */
export const getPointHistory = async (userId: number) => {
  const points = await prisma.point.findMany({
    where: {
      user_id: userId,
    },
    orderBy: {
      created_at: 'desc',
    },
    select: {
      id: true,
      amount: true,
      amount_remaining: true,
      source: true,
      reference_id: true,
      expired_at: true,
      created_at: true,
    },
  });

  return points;
};