import { Link, useLocation } from 'react-router-dom';
import { Calendar, ChevronLeft, LayoutDashboard, Plus, X } from 'lucide-react';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

interface OrganizerSidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/organizer/dashboard/overview' },
  { icon: Calendar, label: 'My Events', path: '/organizer/dashboard/events' },
  { icon: Plus, label: 'Create Event', path: '/organizer/dashboard/events/create' },
];

export default function OrganizerSidebar({
  isCollapsed,
  isMobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: OrganizerSidebarProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    // Exact match untuk path utama
    if (location.pathname === path) return true;
    
    // Partial match untuk nested routes
    // Contoh: /organizer/dashboard/events/123/edit akan aktif di "My Events"
    if (path === '/organizer/dashboard/events' && location.pathname.startsWith('/organizer/dashboard/events')) {
      return !location.pathname.includes('/create');
    }
    
    return false;
  };

  return (
        <>
          <div
            onClick={onCloseMobile}
            className={`fixed inset-0 z-30 bg-slate-950/45 transition-opacity lg:hidden ${
              isMobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          />

          <aside
            className={`fixed left-0 top-16 bottom-0 z-40 flex flex-col bg-primary-900 border-r border-primary-800 shadow-xl transition-all duration-300 ${
              isCollapsed ? 'w-20' : 'w-64'
            } ${
              isMobileOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0`}
          >
            <div className={`border-b border-primary-800 ${isCollapsed ? 'px-3 py-5' : 'px-6 py-6'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
                  <h2 className="text-lg font-bold text-white">Organizer Panel</h2>
                  <p className="mt-1 text-xs text-primary-200">Kelola event & transaksi</p>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={onToggleCollapse}
                    className="items-center justify-center hidden transition-colors border rounded-lg lg:inline-flex w-9 h-9 border-primary-700 text-primary-100 hover:bg-primary-800"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  >
                    <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={onCloseMobile}
                    className="inline-flex items-center justify-center transition-colors border rounded-lg lg:hidden w-9 h-9 border-primary-700 text-primary-100 hover:bg-primary-800"
                    aria-label="Close sidebar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isCollapsed ? (
                <div className="items-center justify-center hidden pt-1 lg:flex">
                  <span className="inline-flex items-center justify-center w-10 h-10 text-lg font-bold text-white rounded-xl bg-primary-800">
                    O
                  </span>
                </div>
              ) : null}
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center rounded-lg transition-all duration-200 ${
                      isCollapsed ? 'justify-center px-3 py-3.5' : 'gap-3 px-4 py-3'
                    } ${
                      active
                        ? 'bg-secondary-400 text-white shadow-lg'
                        : 'text-primary-100 hover:bg-primary-800 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-white' : 'text-primary-300'}`} />
                    {!isCollapsed ? <span className="text-sm font-medium">{item.label}</span> : null}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </>
  );
}