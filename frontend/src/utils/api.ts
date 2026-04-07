import axios from 'axios'
import { dispatchUnauthorizedEvent } from './authEvents'
import { storage } from './storage'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
})

api.interceptors.request.use((config) => {
  const token = storage.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      storage.clearToken()
      storage.clearUser()
      dispatchUnauthorizedEvent()
    }
    return Promise.reject(error)
  },
)
