import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../config/prisma'

function generateReferralCode(len = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < len; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

async function createUniqueReferralCode(prismaClient: typeof prisma) {
  for (let i = 0; i < 6; i++) {
    const code = generateReferralCode()
    const exists = await prismaClient.user.findUnique({ where: { referral_code: code } })
    if (!exists) return code
  }
  throw new Error('Cannot generate unique referral code')
}

export async function register(payload: any) {
  const { name, email, password, role = 'customer', referralCode } = payload
  if (!name || !email || !password) throw new Error('name, email, password are required')

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error('Email already registered')

  const hashed = await bcrypt.hash(password, 10)
  const referral_code = await createUniqueReferralCode(prisma)

  const user = await prisma.user.create({ data: { name, email, password: hashed, role, referral_code } })

  if (referralCode) {
    const referrer = await prisma.user.findUnique({ where: { referral_code: referralCode } })
    if (referrer) {
      try {
        await prisma.referral.create({ data: { referrer_id: referrer.id, referee_id: user.id } })
      } catch (e) {
        // ignore unique constraint errors for now
      }
    }
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' })
  return { user: { id: user.id, email: user.email, name: user.name, role: user.role, referral_code: user.referral_code }, token }
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error('Invalid credentials')
  const ok = await bcrypt.compare(password, user.password)
  if (!ok) throw new Error('Invalid credentials')
  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' })
  return { user: { id: user.id, email: user.email, name: user.name, role: user.role, referral_code: user.referral_code }, token }
}
