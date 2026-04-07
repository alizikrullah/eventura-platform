const TOKEN_KEY = 'eventura.token'
const USER_KEY = 'eventura.user'

export const storage = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token)
  },
  clearToken() {
    localStorage.removeItem(TOKEN_KEY)
  },
  getUser() {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) {
      return null
    }

    try {
      return JSON.parse(raw)
    } catch {
      localStorage.removeItem(USER_KEY)
      return null
    }
  },
  setUser(user: unknown) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  clearUser() {
    localStorage.removeItem(USER_KEY)
  },
}
