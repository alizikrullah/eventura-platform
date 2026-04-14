import { Link } from 'react-router-dom';
import { Calendar, Instagram, Twitter, Mail } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { user, isAuthenticated } = useAuthStore();

  return (
    <footer className="bg-primary-950 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center w-fit">
              <span className="text-3xl font-bold tracking-tight text-white">
                Even<span className="text-secondary-400">tura</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Platform marketplace tiket event terpercaya. Temukan dan hadiri event terbaik di kotamu.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="#"
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-secondary-400 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-secondary-400 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="mailto:hello@eventura.com"
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-secondary-400 transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Jelajahi
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/about"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/events"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Events
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Akun
            </h4>
            <ul className="space-y-2.5">
              {!isAuthenticated ? (
                <>
                  {/* Mode 1: Belum Login */}
                  <li>
                    <Link
                      to="/register"
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Register
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/login"
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/profile"
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/transactions"
                      className="text-sm text-gray-400 hover:text-white transition-colors"
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
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/transactions"
                      className="text-sm text-gray-400 hover:text-white transition-colors"
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
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/organizer/dashboard/overview"
                      className="text-sm text-gray-400 hover:text-white transition-colors"
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
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
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