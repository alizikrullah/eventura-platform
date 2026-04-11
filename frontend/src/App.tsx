import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './components/guards/AuthGuard';
import { GuestOnlyGuard } from './components/guards/GuestOnlyGuard';
import { RoleGuard } from './components/guards/RoleGuard';
import { ForbiddenPage } from './pages/ForbiddenPage';
import ScrollToTop from '@/components/ScrollToTop';
import Layout from '@/components/layout/Layout';
import LandingPage from '@/pages/LandingPage';
import EventsPage from '@/pages/EventsPage';
import AboutPage from '@/pages/AboutPage';
import EventDetailPage from '@/pages/EventDetailPage';
import CreateEventPage from '@/pages/CreateEventPage';
import EditEventPage from '@/pages/EditEventPage';
import MyEventsPage from '@/pages/MyEventsPage';
import VoucherManagementPage from '@/pages/VoucherManagementPage';
import CheckoutPage from '@/pages/CheckoutPage';
import TransactionsPage from '@/pages/TransactionsPage';
import TransactionDetailPage from '@/pages/TransactionDetailPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { CustomerDashboardPage } from '@/pages/CustomerDashboardPage';
import { OrganizerDashboardPage } from '@/pages/OrganizerDashboardPage';
import { useAuthStore } from '@/store/authStore';

export default function App() {
  const hydrate = useAuthStore(state => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>

        {/* Auth pages - pakai AuthShell, guest only */}
        <Route element={<GuestOnlyGuard />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Main pages - pakai Navbar + Footer */}
        <Route element={<Layout />}>

          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/403" element={<ForbiddenPage />} />

          {/* Protected routes - semua role */}
          <Route element={<AuthGuard />}>
            <Route path="/profile" element={<ProfilePage />} />

            {/* Customer only */}
            <Route element={<RoleGuard allowedRoles={['customer']} />}>
              <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/transactions/:id" element={<TransactionDetailPage />} />
              <Route path="/checkout/:eventId" element={<CheckoutPage />} />
            </Route>

            {/* Organizer only */}
            <Route element={<RoleGuard allowedRoles={['organizer']} />}>
              <Route path="/organizer/dashboard" element={<OrganizerDashboardPage />} />
              <Route path="/organizer/events" element={<MyEventsPage />} />
              <Route path="/organizer/events/create" element={<CreateEventPage />} />
              <Route path="/organizer/events/:id/edit" element={<EditEventPage />} />
              <Route path="/organizer/events/:id/vouchers" element={<VoucherManagementPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}