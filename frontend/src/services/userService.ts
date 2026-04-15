import type { UpdatePasswordPayload } from '../types/auth'
import type { User } from '../types/user'
import { api } from '../utils/api'
import { getApiErrorMessage } from '../utils/apiError'

interface AvailableDiscountsResponse {
  success: boolean
  data: {
    points: {
      total_points: number
    }
  }
}

export const userService = {
  async getMe() {
    try {
      const response = await api.get<{ user: User }>('/users/me')
      return response.data.user
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Gagal memuat profil'))
    }
  },
  async updateProfile(payload: { name: string; phone?: string }) {
    try {
      const response = await api.patch<{ user: User }>('/users/me', payload)
      return response.data.user
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Gagal memperbarui profil'))
    }
  },
  async updatePassword(payload: UpdatePasswordPayload) {
    try {
      const response = await api.patch<{ message: string }>('/users/me/password', payload)
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Gagal memperbarui password'))
    }
  },
  async updateProfilePhoto(formData: FormData) {
    try {
      const response = await api.patch<{ user: User }>('/users/me/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data.user
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Gagal memperbarui foto profil'))
    }
  },
  async getAvailablePoints() {
    try {
      const response = await api.get<AvailableDiscountsResponse>('/transactions/discounts')
      return response.data.data.points.total_points
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Gagal memuat poin pengguna'))
    }
  },
}
