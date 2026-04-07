import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function GuestOnlyGuard() {
  const { user, isAuthenticated, isHydrated } = useAuth()

  if (!isHydrated) {
    return <div className="flex min-h-screen items-center justify-center text-slate-600">Loading...</div>
  }

  if (isAuthenticated && user) {
    return <Navigate to={user.role === 'organizer' ? '/organizer/dashboard' : '/customer/dashboard'} replace />
  }

  return <Outlet />
}
