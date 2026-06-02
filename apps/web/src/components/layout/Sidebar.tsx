import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Shield,
  Building2,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth-store';
import { useLogout } from '@/features/auth/hooks';
import { useUIStore } from '@/stores/ui-store';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  module?: string;
}

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { to: '/customers', label: 'Cari Hesaplar', icon: Users, module: 'cari' },
  { to: '/products', label: 'Stok Yönetimi', icon: Package, module: 'stok' },
  { to: '/sales', label: 'Satış', icon: ShoppingCart, module: 'satis' },
  { to: '/orders', label: 'Siparişler', icon: Receipt, module: 'siparis' },
  { to: '/reports', label: 'Raporlar', icon: BarChart3, module: 'raporlar' },
  { to: '/notifications', label: 'Bildirimler', icon: Bell, module: 'bildirim' },
  { to: '/settings', label: 'Ayarlar', icon: Settings },
];

const SUPER_ADMIN_NAV: NavItem[] = [
  { to: '/super-admin/dashboard', label: 'Süper Admin', icon: Shield },
  { to: '/super-admin/tenants', label: 'Firmalar', icon: Building2 },
  { to: '/super-admin/users', label: 'Kullanıcılar', icon: Users },
  { to: '/super-admin/plans', label: 'Paketler', icon: CreditCard },
  { to: '/super-admin/modules', label: 'Modüller', icon: Package },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);
  const logout = useLogout();

  const isSuperAdmin = user?.roles?.some((r) => r.roleCode === 'super_admin') ?? false;

  const visible = NAV.filter((item) => {
    if (!item.module) return true;
    return user?.activeModules.includes(item.module) ?? true;
  });

  return (
    <aside
      className={cn(
        'sticky top-0 z-30 hidden h-screen flex-col bg-primary text-primary-foreground transition-all duration-200 md:flex',
        collapsed ? 'w-[72px]' : 'w-[260px]',
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary font-bold text-secondary-foreground">
          {isSuperAdmin ? 'SA' : 'S'}
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-base font-bold">
              {isSuperAdmin ? 'Süper Admin' : 'SaaS Panel'}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-white/60">
              {isSuperAdmin ? 'Sistem Yönetimi' : 'İşletme Yönetimi'}
            </span>
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
        {isSuperAdmin && (
          <>
            {!collapsed && (
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                Süper Admin
              </div>
            )}
            {SUPER_ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white',
                    )
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
            <div className="my-2 border-b border-white/10" />
          </>
        )}

        {!isSuperAdmin && !collapsed && (
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
            İşletme
          </div>
        )}
        {visible.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2 border-t border-white/10 p-3">
        {user && !collapsed && (
          <div className="px-2 py-1.5 text-xs text-white/60">
            <div className="truncate font-semibold text-white">{user.fullName}</div>
            <div className="truncate">{user.email}</div>
          </div>
        )}
        <button
          onClick={() => toggle()}
          className="px-2 text-left text-xs text-white/60 hover:text-white"
        >
          {collapsed ? '»' : '« Kapat'}
        </button>
        <button
          onClick={() => logout.mutate()}
          className="flex items-center gap-2 px-2 py-1.5 text-sm text-white/70 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && 'Çıkış Yap'}
        </button>
      </div>
    </aside>
  );
}
