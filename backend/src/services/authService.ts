import bcrypt from 'bcrypt'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { Role } from '@prisma/client'
import prisma from '../config/prisma'
import { sendResetPasswordEmail } from './mailService'
import { awardReferralRewards } from './referralRewardService'

interface RegisterPayload {
  name: string
  email: string
  password: string
  role?: Role
  referralCode?: string
}

function sanitizeUser(user: {
  id: number
  email: string
  name: string
  role: Role
  referral_code: string
  profile_picture?: string | null
  phone?: string | null
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    referral_code: user.referral_code,
    profile_picture: user.profile_picture ?? null,
    phone: user.phone ?? null,
  }
}

function signAuthToken(userId: number, role: Role) {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn']
  return jwt.sign({ userId, role }, process.env.JWT_SECRET || 'dev', { expiresIn })
}

function signResetToken(email: string) {
  return jwt.sign({ email, type: 'password-reset' }, process.env.JWT_SECRET || 'dev', { expiresIn: '30m' as SignOptions['expiresIn'] })
}

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

export async function register(payload: RegisterPayload) {
  const { name, email, password, role = 'customer', referralCode } = payload
  if (!name || !email || !password) throw new Error('name, email, password are required')
  if (![Role.customer, Role.organizer].includes(role)) throw new Error('Invalid role')

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error('Email already registered')

  const hashed = await bcrypt.hash(password, 10)
  const referral_code = await createUniqueReferralCode(prisma)

  const user = await prisma.$transaction(async (tx) => {
    let referrerId: number | null = null

    if (referralCode && role === Role.customer) {
      const referrer = await tx.user.findUnique({ where: { referral_code: referralCode } })
      if (!referrer) throw new Error('Referral code is invalid')
      referrerId = referrer.id
    }

    const createdUser = await tx.user.create({
      data: { name, email, password: hashed, role, referral_code },
    })

    if (referrerId) {
      await tx.referral.create({
        data: {
          referrer_id: referrerId,
          referee_id: createdUser.id,
        },
      })

      await awardReferralRewards(referrerId, createdUser.id)
    }

    return createdUser
  })

  const token = signAuthToken(user.id, user.role)
  return { user: sanitizeUser(user), token }
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error('Invalid credentials')
  const ok = await bcrypt.compare(password, user.password)
  if (!ok) throw new Error('Invalid credentials')
  const token = signAuthToken(user.id, user.role)
  return { user: sanitizeUser(user), token }
}

export async function forgotPassword(email: string) {
  if (!email) throw new Error('Email is required')

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new Error('Email tidak ditemukan')
  }

  const resetToken = signResetToken(user.email)
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`

  await sendResetPasswordEmail({
    to: user.email,
    userName: user.name,
    resetUrl,
  })

  return {
    message: 'Email ditemukan. Silakan cek inbox Anda untuk reset password.',
    ...(process.env.NODE_ENV !== 'production' ? { resetToken } : {}),
  }
}

export async function resetPassword(token: string, newPassword: string) {
  if (!token || !newPassword) throw new Error('token and newPassword are required')
  if (newPassword.length < 6) throw new Error('New password must be at least 6 characters')

  const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev') as { email?: string; type?: string }
  if (payload.type !== 'password-reset' || !payload.email) throw new Error('Invalid reset token')

  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { email: payload.email }, data: { password: hashed } })
  return { message: 'Password berhasil direset' }
}

