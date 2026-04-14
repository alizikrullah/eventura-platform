import { Outlet } from 'react-router-dom';
import OrganizerSidebar from '@/components/organizer/OrganizerSidebar';

export default function OrganizerLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar - fixed position */}
      <OrganizerSidebar />
      
      {/* Main content area - margin left untuk kasih space buat sidebar */}
      <main className="flex-1 ml-64 bg-gray-50">
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}