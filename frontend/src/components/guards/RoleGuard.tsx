import { Navigate, Outlet } from 'react-router-dom'
import type { UserRole } from '../../types/user'
import { useAuth } from '../../hooks/useAuth'

interface RoleGuardProps {
  allowedRoles: UserRole[]
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { user, isHydrated } = useAuth()

  if (!isHydrated) {
    return <div className="flex min-h-screen items-center justify-center text-slate-600">Loading...</div>
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />
  }

  return <Outlet />
}
