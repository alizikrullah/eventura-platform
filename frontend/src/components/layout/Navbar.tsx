import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, User, Ticket } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current route is organizer dashboard
  const isOrganizerDashboard = location.pathname.startsWith('/organizer/dashboard');

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleOrganizerMobileMenu = () => {
    window.dispatchEvent(new CustomEvent('organizer-sidebar:open'));
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `text-sm font-medium transition-colors duration-200 ${
      isActive(path)
        ? isOrganizerDashboard
          ? 'text-white border-b-2 border-secondary-400 pb-0.5'
          : 'text-primary-900 border-b-2 border-secondary-400 pb-0.5'
        : isOrganizerDashboard
        ? 'text-primary-100 hover:text-white'
        : 'text-gray-600 hover:text-primary-900'
    }`;

  return (
    <nav className={`sticky top-0 z-50 shadow-sm ${
      isOrganizerDashboard 
        ? 'bg-primary-900 border-b border-primary-800' 
        : 'bg-white/90 backdrop-blur-md border-b border-gray-100'
    }`}>
      <div className={isOrganizerDashboard ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        <div className={`flex items-center justify-between ${isOrganizerDashboard ? 'h-16 px-4 sm:px-6' : 'h-16'}`}>

          {isOrganizerDashboard ? (
            <>
              <div className="flex items-center min-w-0 gap-3">
                <button
                  type="button"
                  onClick={handleOrganizerMobileMenu}
                  className="inline-flex items-center justify-center w-10 h-10 text-white transition-colors border lg:hidden rounded-xl border-primary-700 hover:bg-primary-800 shrink-0"
                  aria-label="Open organizer menu"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <Link to="/" className="flex items-center min-w-0 gap-2">
                  <span className="truncate text-[2rem] leading-none font-black tracking-tight text-white sm:text-3xl">
                    Even<span className="text-secondary-400">tura</span>
                  </span>
                </Link>
              </div>

              <div className="pl-4 sm:pl-6">
                {!isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <Link
                      to="/login"
                      className="px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg hover:bg-primary-800"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="px-4 py-2 text-sm font-semibold text-white transition-colors rounded-lg shadow-sm bg-secondary-400 hover:bg-secondary-500"
                    >
                      Daftar
                    </Link>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex max-w-[12.5rem] items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-primary-800 transition-colors group sm:max-w-none sm:px-3"
                    >
                      <div className="flex items-center justify-center text-sm font-semibold text-white rounded-full w-9 h-9 bg-secondary-400 shrink-0">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="hidden min-w-0 text-left sm:block">
                        <p className="text-sm font-semibold leading-none text-white truncate">{user?.name}</p>
                        <p className="mt-0.5 text-xs text-primary-200 capitalize">{user?.role}</p>
                      </div>
                      <ChevronDown
                        className={`hidden w-4 h-4 text-primary-200 transition-transform duration-200 sm:block ${
                          dropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {dropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setDropdownOpen(false)}
                        />
                        <div className="absolute right-0 z-20 py-1 mt-2 overflow-hidden bg-white border border-gray-100 shadow-lg top-full w-52 rounded-xl">
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
                              to="/organizer/dashboard/overview"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <User className="w-4 h-4 text-gray-400" />
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

                          <div className="mt-1 border-t border-gray-50">
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
            </>
          ) : (
            <>
              {/* Public pages - original layout */}
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 group">
                <span className="text-3xl font-black tracking-tight text-primary-900">
                  Even<span className="text-secondary-400">tura</span>
                </span>
              </Link>

          {/* Desktop Nav Links */}
          <div className="items-center hidden gap-8 md:flex">
            <Link to="/about" className={navLinkClass('/about')}>
              About
            </Link>
            <Link to="/events" className={navLinkClass('/events')}>
              Events
            </Link>
          </div>

          {/* Desktop Auth */}
          <div className="items-center hidden gap-3 md:flex">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className={`text-sm font-medium transition-colors px-4 py-2 rounded-lg ${
                    isOrganizerDashboard
                      ? 'text-white hover:bg-primary-800'
                      : 'text-primary-900 hover:text-primary-800 hover:bg-primary-50'
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm ${
                    isOrganizerDashboard
                      ? 'bg-secondary-400 text-white hover:bg-secondary-500'
                      : 'bg-primary-900 text-white hover:bg-primary-800'
                  }`}
                >
                  Daftar
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors group ${
                    isOrganizerDashboard ? 'hover:bg-primary-800' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    isOrganizerDashboard ? 'bg-secondary-400 text-white' : 'bg-primary-900 text-white'
                  }`}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-semibold leading-none ${
                      isOrganizerDashboard ? 'text-white' : 'text-gray-800'
                    }`}>{user?.name}</p>
                    <p className={`text-xs capitalize mt-0.5 ${
                      isOrganizerDashboard ? 'text-primary-200' : 'text-gray-400'
                    }`}>{user?.role}</p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      dropdownOpen ? 'rotate-180' : ''
                    } ${isOrganizerDashboard ? 'text-primary-200' : 'text-gray-400'}`}
                  />
                </button>

                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 z-20 py-1 mt-2 overflow-hidden bg-white border border-gray-100 shadow-lg top-full w-52 rounded-xl">
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
                          to="/organizer/dashboard/overview"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-4 h-4 text-gray-400" />
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

                      <div className="mt-1 border-t border-gray-50">
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
            className="p-2 text-gray-600 transition-colors rounded-lg md:hidden hover:bg-gray-50"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {!isOrganizerDashboard && mobileOpen && (
        <div className={`md:hidden border-t ${
          isOrganizerDashboard 
            ? 'bg-primary-900 border-primary-800' 
            : 'bg-white border-gray-100'
        }`}>
          <div className="px-4 py-3 space-y-1">
            <Link
              to="/about"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isOrganizerDashboard
                  ? 'text-white hover:bg-primary-800'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              About
            </Link>
            <Link
              to="/events"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isOrganizerDashboard
                  ? 'text-white hover:bg-primary-800'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Events
            </Link>

            <div className={`border-t pt-3 mt-3 ${
              isOrganizerDashboard ? 'border-primary-800' : 'border-gray-100'
            }`}>
              {!isAuthenticated ? (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className={`text-center text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${
                      isOrganizerDashboard
                        ? 'text-white border border-primary-700 hover:bg-primary-800'
                        : 'text-primary-900 border border-primary-900 hover:bg-primary-50'
                    }`}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className={`text-center text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors ${
                      isOrganizerDashboard
                        ? 'bg-secondary-400 text-white hover:bg-secondary-500'
                        : 'bg-primary-900 text-white hover:bg-primary-800'
                    }`}
                  >
                    Daftar
                  </Link>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                      isOrganizerDashboard ? 'bg-secondary-400' : 'bg-primary-900'
                    }`}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${
                        isOrganizerDashboard ? 'text-white' : 'text-gray-800'
                      }`}>{user?.name}</p>
                      <p className={`text-xs ${
                        isOrganizerDashboard ? 'text-primary-200' : 'text-gray-400'
                      }`}>{user?.email}</p>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isOrganizerDashboard
                        ? 'text-white hover:bg-primary-800'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <User className={`w-4 h-4 ${
                      isOrganizerDashboard ? 'text-primary-200' : 'text-gray-400'
                    }`} />
                    Profile
                  </Link>

                  {user?.role === 'organizer' && (
                    <Link
                      to="/organizer/dashboard/overview"
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        isOrganizerDashboard
                          ? 'text-white hover:bg-primary-800'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <User className={`w-4 h-4 ${
                        isOrganizerDashboard ? 'text-primary-200' : 'text-gray-400'
                      }`} />
                      Dashboard
                    </Link>
                  )}

                  {user?.role === 'customer' && (
                    <Link
                      to="/transactions"
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        isOrganizerDashboard
                          ? 'text-white hover:bg-primary-800'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Ticket className={`w-4 h-4 ${
                        isOrganizerDashboard ? 'text-primary-200' : 'text-gray-400'
                      }`} />
                      My Tickets
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors w-full text-left ${
                      isOrganizerDashboard
                        ? 'text-red-400 hover:bg-primary-800'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
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