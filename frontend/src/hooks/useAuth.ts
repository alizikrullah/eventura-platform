import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { subscribeToUnauthorizedEvent } from '../utils/authEvents'

export function useAuth() {
  const hydrate = useAuthStore((state) => state.hydrate)
  const isHydrated = useAuthStore((state) => state.isHydrated)
  const logout = useAuthStore((state) => state.logout)
  const store = useAuthStore()

  useEffect(() => {
    if (!isHydrated) {
      hydrate()
    }
  }, [hydrate, isHydrated])

  useEffect(() => {
    return subscribeToUnauthorizedEvent(() => {
      logout()
    })
  }, [logout])

  return store
}
