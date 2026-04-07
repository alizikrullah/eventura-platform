import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthGuard } from './components/guards/AuthGuard'
import { GuestOnlyGuard } from './components/guards/GuestOnlyGuard'
import { RoleGuard } from './components/guards/RoleGuard'
import { useAuth } from './hooks/useAuth'
import { useAuthStore } from './store/authStore'
import { CustomerDashboardPage } from './pages/CustomerDashboardPage'
import { ForbiddenPage } from './pages/ForbiddenPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { LoginPage } from './pages/LoginPage'
import { OrganizerDashboardPage } from './pages/OrganizerDashboardPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'

function HomeRedirect() {
  const { user, isHydrated } = useAuthStore()

  if (!isHydrated) {
    return <div className="flex min-h-screen items-center justify-center text-slate-600">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={user.role === 'organizer' ? '/organizer/dashboard' : '/customer/dashboard'} replace />
}

function App() {
  useAuth()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route element={<GuestOnlyGuard />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
        <Route element={<AuthGuard />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route element={<RoleGuard allowedRoles={['organizer']} />}>
            <Route path="/organizer/dashboard" element={<OrganizerDashboardPage />} />
          </Route>
          <Route element={<RoleGuard allowedRoles={['customer']} />}>
            <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
          </Route>
        </Route>
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
