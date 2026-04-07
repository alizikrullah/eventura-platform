import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function AuthGuard() {
  const location = useLocation()
  const { isAuthenticated, isHydrated } = useAuth()

  if (!isHydrated) {
    return <div className="flex min-h-screen items-center justify-center text-slate-600">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
