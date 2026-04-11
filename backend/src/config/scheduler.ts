import cron from 'node-cron'
import prisma from './prisma'

export function startSchedulers() {
  cron.schedule('0 1 * * *', async () => {
    const now = new Date()
    const [expiredPoints, expiredCoupons] = await Promise.all([
      prisma.point.count({ where: { expired_at: { lt: now }, amount_remaining: { gt: 0 } } }),
      prisma.userCoupon.count({ where: { expired_at: { lt: now }, is_used: false } }),
    ])

    console.log(`[scheduler] expired points=${expiredPoints}, expired coupons=${expiredCoupons}`)
  })
}