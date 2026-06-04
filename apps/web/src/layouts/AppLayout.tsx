import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ChatPanel, ChatFloatingButton } from '@/components/chat/ChatPanel';

export function AppLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-x-hidden">
          {children ?? <Outlet />}
        </main>
        <MobileBottomNav />
      </div>
      <ChatFloatingButton />
      <ChatPanel />
    </div>
  );
}
