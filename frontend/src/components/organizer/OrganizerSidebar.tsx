import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Plus, CreditCard } from 'lucide-react';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/organizer/dashboard/overview' },
  { icon: Calendar, label: 'My Events', path: '/organizer/dashboard/events' },
  { icon: Plus, label: 'Create Event', path: '/organizer/dashboard/events/create' },
  { icon: CreditCard, label: 'Transactions', path: '/organizer/dashboard/transactions' },
];

export default function OrganizerSidebar() {
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
    <aside className="w-64 bg-primary-900 min-h-screen fixed left-0 top-16 bottom-0 flex flex-col">
      {/* Header */}
      <div className="px-6 py-6 border-b border-primary-800">
        <h2 className="text-white font-bold text-lg">Organizer Panel</h2>
        <p className="text-primary-200 text-xs mt-1">Kelola event & transaksi</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${active 
                  ? 'bg-secondary-400 text-white shadow-lg' 
                  : 'text-primary-100 hover:bg-primary-800 hover:text-white'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-primary-300'}`} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Help */}
      <div className="px-6 py-4 border-t border-primary-800">
        <div className="bg-primary-800 rounded-lg p-4">
          <p className="text-white text-xs font-semibold mb-1">Butuh bantuan?</p>
          <p className="text-primary-200 text-xs mb-3">Hubungi support kami</p>
          <a
            href="mailto:support@eventura.com"
            className="block text-center bg-secondary-400 hover:bg-secondary-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </aside>
  );
}