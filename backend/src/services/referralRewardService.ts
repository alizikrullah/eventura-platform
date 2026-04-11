import prisma from '../config/prisma';
import { addMonths } from 'date-fns';

/**
 * Referral Reward Service - FIXED for new Point schema
 */

const REFERRAL_POINT_REWARD = 10000; // 10k points for referrer
const REWARD_EXPIRY_MONTHS = 3; // 3 months expiry

/**
 * Award referral rewards when new user registers with referral code
 * 
 * @param referrerId - User who gave the referral code
 * @param refereeId - User who used the referral code
 */
export const awardReferralRewards = async (
  referrerId: number,
  refereeId: number
) => {
  const expiryDate = addMonths(new Date(), REWARD_EXPIRY_MONTHS);

  // Create referral record
  const referral = await prisma.referral.create({
    data: {
      referrer_id: referrerId,
      referee_id: refereeId,
      points_awarded: false,
      coupon_awarded: false
    }
  });

  // Award points to referrer (10,000 points)
  await prisma.point.create({
    data: {
      user_id: referrerId,
      amount: REFERRAL_POINT_REWARD,
      amount_remaining: REFERRAL_POINT_REWARD,
      source: 'referral_reward',
      reference_id: refereeId,
      expired_at: expiryDate
      // is_used = false (default)
      // used_at = null (default)
    }
  });

  // Get or create default referral coupon (10% discount)
  let coupon = await prisma.coupon.findUnique({
    where: { code: 'REFERRAL10' }
  });

  if (!coupon) {
    coupon = await prisma.coupon.create({
      data: {
        code: 'REFERRAL10',
        discount_type: 'percentage',
        discount_value: 10
      }
    });
  }

  // Award coupon to referee (new user)
  await prisma.userCoupon.create({
    data: {
      user_id: refereeId,
      coupon_id: coupon.id,
      expired_at: expiryDate
      // is_used = false (default)
      // used_at = null (default)
    }
  });

  // Mark rewards as awarded
  await prisma.referral.update({
    where: { id: referral.id },
    data: {
      points_awarded: true,
      coupon_awarded: true
    }
  });

  console.log(`Referral rewards awarded: ${REFERRAL_POINT_REWARD} points to user ${referrerId}, coupon to user ${refereeId}`);
};