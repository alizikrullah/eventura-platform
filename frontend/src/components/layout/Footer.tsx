import { Link } from 'react-router-dom';
import { Instagram, Twitter, Mail } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { user, isAuthenticated } = useAuthStore();

  return (
    <footer className="mt-auto text-white bg-primary-950">
      <div className="px-4 py-12 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">

          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center w-fit">
              <span className="text-3xl font-bold tracking-tight text-white">
                Even<span className="text-secondary-400">tura</span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-gray-400">
              Platform marketplace tiket event terpercaya. Temukan dan hadiri event terbaik di kotamu.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="#"
                className="flex items-center justify-center w-8 h-8 transition-colors rounded-lg bg-white/10 hover:bg-secondary-400"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="flex items-center justify-center w-8 h-8 transition-colors rounded-lg bg-white/10 hover:bg-secondary-400"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="mailto:hello@eventura.com"
                className="flex items-center justify-center w-8 h-8 transition-colors rounded-lg bg-white/10 hover:bg-secondary-400"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-wider text-gray-300 uppercase">
              Jelajahi
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/about"
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/events"
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  Events
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-wider text-gray-300 uppercase">
              Akun
            </h4>
            <ul className="space-y-2.5">
              {!isAuthenticated ? (
                <>
                  {/* Mode 1: Belum Login */}
                  <li>
                    <Link
                      to="/register"
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      Register
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/login"
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/profile"
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/transactions"
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      My Ticket
                    </Link>
                  </li>
                </>
              ) : user?.role === 'customer' ? (
                <>
                  {/* Mode 2: Login (Customer) */}
                  <li>
                    <Link
                      to="/profile"
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/transactions"
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      My Ticket
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  {/* Mode 3: Login (Organizer) */}
                  <li>
                    <Link
                      to="/profile"
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/organizer/dashboard/overview"
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      Dashboard
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 pt-6 mt-10 border-t border-white/10 sm:flex-row">
          <p className="text-xs text-gray-500">
            &copy; {currentYear} Eventura. All rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            Made for Purwadhika Mini Project
          </p>
        </div>
      </div>
    </footer>
  );
}