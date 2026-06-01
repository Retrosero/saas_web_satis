import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Package, ShoppingCart, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth-store';

const ITEMS = [
  { to: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { to: '/customers', label: 'Cari', icon: Users, module: 'cari' },
  { to: '/products', label: 'Stok', icon: Package, module: 'stok' },
  { to: '/sales', label: 'Satış', icon: ShoppingCart, module: 'satis' },
  { to: '/reports', label: 'Rapor', icon: BarChart3, module: 'raporlar' },
];

export function MobileBottomNav() {
  const user = useAuthStore((s) => s.user);
  const visible = ITEMS.filter((i) => !i.module || user?.activeModules.includes(i.module));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface-container-lowest border-t border-outline-variant">
      <div className="grid grid-cols-5 h-16">
        {visible.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-on-surface-variant',
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
