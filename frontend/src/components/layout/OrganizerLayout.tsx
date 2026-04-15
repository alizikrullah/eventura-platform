import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import OrganizerSidebar from '@/components/organizer/OrganizerSidebar';

export default function OrganizerLayout() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleOpenSidebar = () => {
      setIsMobileOpen(true);
    };

    window.addEventListener('organizer-sidebar:open', handleOpenSidebar);

    return () => {
      window.removeEventListener('organizer-sidebar:open', handleOpenSidebar);
    };
  }, []);

  return (
    <div className="flex min-h-screen">
      <OrganizerSidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onToggleCollapse={() => setIsCollapsed((current) => !current)}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <main
        className={`flex-1 bg-gray-50 transition-[margin] duration-300 ${
          isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}