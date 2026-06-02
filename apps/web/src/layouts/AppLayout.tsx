import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export function AppLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-x-hidden p-4 pb-20 md:p-6 md:pb-6">
          {children ?? <Outlet />}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
