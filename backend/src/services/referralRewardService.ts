import { DiscountType, PointSource, Prisma } from '@prisma/client'
import { addMonths } from 'date-fns'

const REFERRAL_POINT_REWARD = 10000
const REFERRAL_COUPON_CODE = 'REFERRAL-WELCOME'
const REFERRAL_COUPON_DISCOUNT = 10000

export async function awardReferralBenefits(
  tx: Prisma.TransactionClient,
  referrerId: number,
  refereeId: number,
  referralId: number,
) {
  const now = new Date()
  const coupon = await tx.coupon.upsert({
    where: { code: REFERRAL_COUPON_CODE },
    update: {
      discount_type: DiscountType.fixed,
      discount_value: REFERRAL_COUPON_DISCOUNT,
    },
    create: {
      code: REFERRAL_COUPON_CODE,
      discount_type: DiscountType.fixed,
      discount_value: REFERRAL_COUPON_DISCOUNT,
    },
  })

  await tx.point.create({
    data: {
      user_id: referrerId,
      amount: REFERRAL_POINT_REWARD,
      amount_remaining: REFERRAL_POINT_REWARD,
      source: PointSource.referral_reward,
      reference_id: refereeId,
      expired_at: addMonths(now, 3),
    },
  })

  await tx.userCoupon.create({
    data: {
      user_id: refereeId,
      coupon_id: coupon.id,
      expired_at: addMonths(now, 3),
    },
  })

  await tx.referral.update({
    where: { id: referralId },
    data: { points_awarded: true, coupon_awarded: true },
  })
}
