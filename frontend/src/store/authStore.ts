import { create } from 'zustand'
import { authService } from '../services/authService'
import type { LoginPayload, RegisterPayload } from '../types/auth'
import type { User, UserRole } from '../types/user'
import { storage } from '../utils/storage'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isHydrated: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  setAuth: (user: User, token: string) => void
  setUser: (user: User) => void
  hydrate: () => void
  hasRole: (role: UserRole) => boolean
  isCustomer: () => boolean
  isOrganizer: () => boolean
  isGuest: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false,
  async login(payload) {
    const data = await authService.login(payload)
    get().setAuth(data.user, data.token)
  },
  async register(payload) {
    const data = await authService.register(payload)
    get().setAuth(data.user, data.token)
  },
  logout() {
    storage.clearToken()
    storage.clearUser()
    set({ user: null, token: null, isAuthenticated: false, isHydrated: true })
  },
  setAuth(user, token) {
    storage.setToken(token)
    storage.setUser(user)
    set({ user, token, isAuthenticated: true, isHydrated: true })
  },
  setUser(user) {
    storage.setUser(user)
    set({ user, isAuthenticated: true, isHydrated: true })
  },
  hydrate() {
    const token = storage.getToken()
    const user = storage.getUser() as User | null
    set({ token, user, isAuthenticated: Boolean(token && user), isHydrated: true })
  },
  hasRole(role) {
    return get().user?.role === role
  },
  isCustomer() {
    return get().user?.role === 'customer'
  },
  isOrganizer() {
    return get().user?.role === 'organizer'
  },
  isGuest() {
    return !get().isAuthenticated
  },
}))
