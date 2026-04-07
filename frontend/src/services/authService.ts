import type { AuthResponse, ForgotPasswordPayload, LoginPayload, RegisterPayload, ResetPasswordPayload } from '../types/auth'
import { api } from '../utils/api'
import { getApiErrorMessage } from '../utils/apiError'

export const authService = {
  async login(payload: LoginPayload) {
    try {
      const response = await api.post<AuthResponse>('/auth/login', payload)
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Login gagal'))
    }
  },
  async register(payload: RegisterPayload) {
    try {
      const response = await api.post<AuthResponse>('/auth/register', payload)
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Register gagal'))
    }
  },
  async forgotPassword(payload: ForgotPasswordPayload) {
    try {
      const response = await api.post<{ message: string }>('/auth/forgot-password', payload)
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Gagal mengirim permintaan reset password'))
    }
  },
  async resetPassword(payload: ResetPasswordPayload) {
    try {
      const response = await api.post<{ message: string }>('/auth/reset-password', payload)
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Gagal mereset password'))
    }
  },
}
