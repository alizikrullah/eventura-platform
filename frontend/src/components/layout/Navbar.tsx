import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, User, LayoutDashboard, Plus, Ticket } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `text-sm font-medium transition-colors duration-200 ${
      isActive(path)
        ? 'text-primary-900 border-b-2 border-secondary-400 pb-0.5'
        : 'text-gray-600 hover:text-primary-900'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-3xl font-black tracking-tight text-primary-900">
              Even<span className="text-secondary-400">tura</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/about" className={navLinkClass('/about')}>
              About
            </Link>
            <Link to="/events" className={navLinkClass('/events')}>
              Events
            </Link>
            {isAuthenticated && user?.role === 'organizer' && (
              <>
                <Link to="/organizer/events" className={navLinkClass('/organizer/events')}>
                  My Events
                </Link>
                <Link to="/organizer/events/create" className={navLinkClass('/organizer/events/create')}>
                  Create Event
                </Link>
              </>
            )}
            {isAuthenticated && user?.role === 'customer' && (
              <Link to="/transactions" className={navLinkClass('/transactions')}>
                My Tickets
              </Link>
            )}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-primary-900 hover:text-primary-800 transition-colors px-4 py-2 rounded-lg hover:bg-primary-50"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold bg-primary-900 text-white px-4 py-2 rounded-lg hover:bg-primary-800 transition-colors shadow-sm"
                >
                  Daftar
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-8 h-8 bg-primary-900 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800 leading-none">{user?.name}</p>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">{user?.role}</p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-xs text-gray-400">Login sebagai</p>
                        <p className="text-sm font-semibold text-gray-800 truncate">{user?.email}</p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        Profile
                      </Link>

                      {user?.role === 'organizer' && (
                        <Link
                          to="/organizer/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-gray-400" />
                          Dashboard
                        </Link>
                      )}

                      {user?.role === 'customer' && (
                        <Link
                          to="/transactions"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Ticket className="w-4 h-4 text-gray-400" />
                          My Tickets
                        </Link>
                      )}

                      <div className="border-t border-gray-50 mt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-1">
            <Link
              to="/events"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Browse Events
            </Link>

            {isAuthenticated && user?.role === 'organizer' && (
              <>
                <Link
                  to="/organizer/events"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-gray-400" />
                  My Events
                </Link>
                <Link
                  to="/organizer/events/create"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4 text-gray-400" />
                  Create Event
                </Link>
              </>
            )}

            {isAuthenticated && user?.role === 'customer' && (
              <Link
                to="/transactions"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Ticket className="w-4 h-4 text-gray-400" />
                My Tickets
              </Link>
            )}

            <div className="border-t border-gray-100 pt-3 mt-3">
              {!isAuthenticated ? (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="text-center text-sm font-medium text-primary-900 border border-primary-900 px-4 py-2.5 rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="text-center text-sm font-semibold bg-primary-900 text-white px-4 py-2.5 rounded-lg hover:bg-primary-800 transition-colors"
                  >
                    Daftar
                  </Link>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <div className="w-9 h-9 bg-primary-900 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
