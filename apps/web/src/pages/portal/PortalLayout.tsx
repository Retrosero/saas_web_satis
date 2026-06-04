import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, History, User as UserIcon, LogOut, ShoppingCart } from 'lucide-react';
import { portalAuth } from '@/lib/portal-client';
import { usePortalLogout } from '@/features/portal/api';

const NAV = [
  { to: '/portal', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/portal/catalog', icon: ShoppingBag, label: 'Ürün Kataloğu' },
  { to: '/portal/cart', icon: ShoppingCart, label: 'Sepetim' },
  { to: '/portal/orders', icon: History, label: 'Siparişlerim' },
  { to: '/portal/statement', icon: LayoutDashboard, label: 'Ekstre' },
  { to: '/portal/profile', icon: UserIcon, label: 'Profil' },
];

export function PortalLayout() {
  const navigate = useNavigate();
  const logout = usePortalLogout();
  const customer = portalAuth.getCustomer();

  if (!portalAuth.getToken()) {
    navigate('/portal/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-variant/30">
      {/* Topbar */}
      <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary p-2 text-on-primary">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold">Bayi Portalı</h1>
              {customer && <p className="text-xs text-on-surface-variant">{customer.name} ({customer.code})</p>}
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 rounded-md border border-outline px-3 py-1.5 text-sm hover:bg-surface-variant">
            <LogOut className="h-4 w-4" /> Çıkış
          </button>
        </div>
        <nav className="flex overflow-x-auto border-t border-outline-variant px-4">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => `flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium ${isActive ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-foreground'}`}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl p-4">
        <Outlet />
      </main>
    </div>
  );
}
