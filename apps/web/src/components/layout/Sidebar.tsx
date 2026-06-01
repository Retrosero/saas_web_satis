import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Package, ShoppingCart, Receipt, BarChart3, Settings, LogOut, Bell, Shield, Building2, CreditCard } from 'lucide-react';
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
        'hidden md:flex flex-col bg-primary text-primary-foreground h-screen sticky top-0 z-30 transition-all duration-200',
        collapsed ? 'w-[72px]' : 'w-[260px]',
      )}
    >
      <div className="flex items-center gap-2 px-4 py-5 border-b border-white/10">
        <div className="h-9 w-9 rounded-md bg-secondary flex items-center justify-center text-secondary-foreground font-bold">
          {isSuperAdmin ? 'SA' : 'S'}
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-base">{isSuperAdmin ? 'Süper Admin' : 'SaaS Panel'}</span>
            <span className="text-[10px] uppercase tracking-wider text-white/60">
              {isSuperAdmin ? 'Sistem Yönetimi' : 'İşletme Yönetimi'}
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5">
        {isSuperAdmin && (
          <>
            {!collapsed && (
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/50 font-semibold">
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
                      isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white',
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
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/50 font-semibold">
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
                  isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white',
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

      <div className="border-t border-white/10 p-3 flex flex-col gap-2">
        {user && !collapsed && (
          <div className="px-2 py-1.5 text-xs text-white/60">
            <div className="font-semibold text-white truncate">{user.fullName}</div>
            <div className="truncate">{user.email}</div>
          </div>
        )}
        <button
          onClick={() => toggle()}
          className="text-xs text-white/60 hover:text-white text-left px-2"
        >
          {collapsed ? '»' : '« Kapat'}
        </button>
        <button
          onClick={() => logout.mutate()}
          className="flex items-center gap-2 text-sm text-white/70 hover:text-white px-2 py-1.5"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && 'Çıkış Yap'}
        </button>
      </div>
    </aside>
  );
}
