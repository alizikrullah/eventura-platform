import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './components/guards/AuthGuard';
import { GuestOnlyGuard } from './components/guards/GuestOnlyGuard';
import { RoleGuard } from './components/guards/RoleGuard';
import { ForbiddenPage } from './pages/ForbiddenPage';
import ScrollToTop from '@/components/ScrollToTop';
import Layout from '@/components/layout/Layout';
import OrganizerLayout from '@/components/layout/OrganizerLayout';
import LandingPage from '@/pages/LandingPage';
import EventsPage from '@/pages/EventsPage';
import AboutPage from '@/pages/AboutPage';
import EventDetailPage from '@/pages/EventDetailPage';
import CheckoutPage from '@/pages/CheckoutPage';
import TransactionsPage from '@/pages/TransactionsPage';
import TransactionDetailPage from '@/pages/TransactionDetailPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { CustomerDashboardPage } from '@/pages/CustomerDashboardPage';

// Organizer pages
import DashboardOverviewPage from '@/pages/organizer/DashboardOverviewPage';
import MyEventsPage from '@/pages/organizer/MyEventsPage';
import CreateEventPage from '@/pages/organizer/CreateEventPage';
import EditEventPage from '@/pages/organizer/EditEventPage';
import VoucherManagementPage from '@/pages/organizer/VoucherManagementPage';
import TransactionsManagementPage from '@/pages/organizer/TransactionsManagementPage';
import OrganizerProfilePage from '@/pages/OrganizerProfilePage';

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

        {/* Public reset password page - must stay accessible from email links */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Main pages - pakai Navbar + Footer */}
        <Route element={<Layout />}>

          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/organizers/:id" element={<OrganizerProfilePage />} />
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

            {/* Organizer only - NESTED ROUTES dengan Sidebar Layout */}
            <Route element={<RoleGuard allowedRoles={['organizer']} />}>
              <Route path="/organizer/dashboard" element={<OrganizerLayout />}>
                {/* Default redirect ke overview */}
                <Route index element={<Navigate to="overview" replace />} />
                
                {/* Nested routes - render di dalam OrganizerLayout Outlet */}
                <Route path="overview" element={<DashboardOverviewPage />} />
                <Route path="events" element={<MyEventsPage />} />
                <Route path="events/create" element={<CreateEventPage />} />
                <Route path="events/:id/edit" element={<EditEventPage />} />
                <Route path="events/:id/vouchers" element={<VoucherManagementPage />} />
                <Route path="transactions" element={<TransactionsManagementPage />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}