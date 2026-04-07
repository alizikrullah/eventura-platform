export type UserRole = 'customer' | 'organizer'

export interface User {
  id: number
  email: string
  name: string
  role: UserRole
  referral_code: string
  profile_picture?: string | null
  phone?: string | null
}
