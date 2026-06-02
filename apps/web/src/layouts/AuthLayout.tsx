import type { ReactNode } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';

export function AuthLayout({ children }: { children?: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">{children ?? <Outlet />}</div>
    </div>
  );
}
