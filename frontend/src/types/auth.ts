import type { User, UserRole } from './user'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  role: UserRole
  referralCode?: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  newPassword: string
}

export interface UpdatePasswordPayload {
  currentPassword: string
  newPassword: string
}
