import cron from 'node-cron';
import prisma from '../config/prisma';
import { transitionTransactionToStatus } from '../services/transactionService';

/**
 * Transaction Cron Jobs
 * 
 * Scheduled tasks for transaction management
 * 
 * Jobs:
 * 1. Check expired transactions (every minute)
 * 2. Check expired points & coupons (daily at midnight)
 */

/**
 * Job 1: Check and expire transactions
 * 
 * Schedule: Every minute (* * * * *)
 * 
 * Purpose:
 * - Find transactions in 'waiting_payment' status
 * - Check if payment_expired_at has passed (2 hours timeout)
 * - Update status to 'expired'
 * - Trigger rollback (restore seats, points, vouchers, coupons)
 */
export const checkExpiredTransactions = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Find expired transactions
      const expiredTransactions = await prisma.transaction.findMany({
        where: {
          status: 'waiting_payment',
          payment_expired_at: {
            lte: now // Less than or equal to now (expired)
          }
        },
        select: {
          id: true,
          invoice_number: true,
          payment_expired_at: true
        }
      });

      if (expiredTransactions.length > 0) {
        console.log(
          `[Cron] Found ${expiredTransactions.length} expired transactions`
        );

        // Expire and rollback each transaction
        for (const tx of expiredTransactions) {
          try {
            await transitionTransactionToStatus(tx.id, 'expired');
            console.log(
              `[Cron] Expired and rolled back: ${tx.invoice_number}`
            );
          } catch (error: any) {
            console.error(
              `[Cron] Failed to expire transaction ${tx.invoice_number}:`,
              error.message
            );
          }
        }
      }
    } catch (error: any) {
      console.error('[Cron] Error in checkExpiredTransactions:', error.message);
    }
  });

  console.log('[Cron] checkExpiredTransactions scheduled (runs every minute)');
};

/**
 * Job 2: Check expired coupons
 * 
 * Schedule: Daily at midnight (0 0 * * *)
 * 
 * Purpose:
 * - Mark expired coupons as used (is_used = true)
 * - Cleanup for data consistency
 * 
 * Note: Coupons are already filtered by expired_at in queries,
 * but this job ensures data consistency in the database.
 * 
 * Points: No longer need cleanup - using amount_remaining now
 */
export const checkExpiredPointsAndCoupons = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      const now = new Date();

      // Mark expired coupons only (points no longer need cleanup)
      const expiredCoupons = await prisma.userCoupon.updateMany({
        where: {
          expired_at: {
            lte: now
          },
          is_used: false
        },
        data: {
          is_used: true
        }
      });

      console.log(
        `[Cron] Marked ${expiredCoupons.count} expired coupons as used`
      );
    } catch (error: any) {
      console.error(
        '[Cron] Error in checkExpiredPointsAndCoupons:',
        error.message
      );
    }
  });

  console.log(
    '[Cron] checkExpiredPointsAndCoupons scheduled (runs daily at midnight)'
  );
};

/**
 * Helper: Deactivate events that have ended
 * Dipanggil saat startup dan oleh cron job setiap jam
 */
const deactivateExpiredEvents = async () => {
  const now = new Date();
  const result = await prisma.event.updateMany({
    where: {
      is_active: true,
      end_date: { lte: now },
    },
    data: { is_active: false },
  });
  if (result.count > 0) {
    console.log(`[Cron] Deactivated ${result.count} expired events`);
  }
};

/**
 * Job 3: Auto-deactivate events that have ended
 * 
 * Schedule: Every hour (0 * * * *)
 * Also runs once immediately on startup.
 */
export const checkExpiredEvents = () => {
  // Jalankan sekali saat startup
  deactivateExpiredEvents().catch((e: any) =>
    console.error('[Cron] Startup deactivateExpiredEvents error:', e.message)
  );

  // Lanjut jadwal tiap jam
  cron.schedule('0 * * * *', async () => {
    try {
      await deactivateExpiredEvents();
    } catch (error: any) {
      console.error('[Cron] Error in checkExpiredEvents:', error.message);
    }
  });

  console.log('[Cron] checkExpiredEvents scheduled (runs every hour + on startup)');
};

/**
 * Start all cron jobs
 * 
 * Call this function in server.ts after database connection
 */
export const startCronJobs = () => {
  checkExpiredTransactions();
  checkExpiredPointsAndCoupons();
  checkExpiredEvents();
  console.log('[Cron] All transaction jobs started');
};