import bcrypt from 'bcrypt'
import prisma from '../config/prisma'
import cloudinary from '../config/cloudinary'

function extractCloudinaryPublicId(imageUrl?: string | null) {
  if (!imageUrl || !imageUrl.includes('res.cloudinary.com')) {
    return null
  }

  const uploadMarker = '/upload/'
  const uploadIndex = imageUrl.indexOf(uploadMarker)
  if (uploadIndex === -1) {
    return null
  }

  let assetPath = imageUrl.slice(uploadIndex + uploadMarker.length)
  assetPath = assetPath.replace(/^v\d+\//, '')
  const lastDotIndex = assetPath.lastIndexOf('.')
  return lastDotIndex > -1 ? assetPath.slice(0, lastDotIndex) : assetPath
}

function sanitizeUser(user: {
  id: number
  email: string
  name: string
  role: 'customer' | 'organizer'
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

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')
  return sanitizeUser(user)
}

export async function updateMe(userId: number, payload: { name?: string; phone?: string; referral_code?: string }) {
  if (payload.referral_code) throw new Error('referral_code cannot be changed')

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: payload.name,
      phone: payload.phone,
    },
  })

  return sanitizeUser(user)
}

export async function updateMyPassword(userId: number, currentPassword: string, newPassword: string) {
  if (!currentPassword || !newPassword) throw new Error('currentPassword and newPassword are required')

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  const isMatch = await bcrypt.compare(currentPassword, user.password)
  if (!isMatch) throw new Error('Current password is incorrect')

  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } })
  return { message: 'Password updated successfully' }
}

export async function updateMyPhoto(userId: number, file?: Express.Multer.File) {
  if (!file?.buffer) throw new Error('Photo file is required')
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials are not configured')
  }

  const existingUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!existingUser) throw new Error('User not found')

  const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'eventura/profile-pictures',
        resource_type: 'image',
        public_id: `user-${userId}-${Date.now()}`,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'))
          return
        }
        resolve({ secure_url: result.secure_url, public_id: result.public_id })
      },
    )

    stream.end(file.buffer)
  })

  const previousPublicId = extractCloudinaryPublicId(existingUser.profile_picture)
  if (previousPublicId) {
    await cloudinary.uploader.destroy(previousPublicId, { resource_type: 'image' })
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { profile_picture: uploadResult.secure_url },
  })

  return sanitizeUser(user)
}
