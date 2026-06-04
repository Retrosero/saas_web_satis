import { NavLink, Outlet } from 'react-router-dom';
import { Building2, CreditCard, Package, Users, Shield, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

const ITEMS = [
  { to: '/settings', label: 'Genel', icon: Building2, end: true },
  { to: '/settings/subscription', label: 'Paket & Kullanım', icon: CreditCard },
  { to: '/settings/modules', label: 'Modüller', icon: Package },
  { to: '/settings/users', label: 'Kullanıcılar', icon: Users },
  { to: '/settings/roles', label: 'Roller & Yetkiler', icon: Shield },
];

export function SettingsLayout() {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Settings sidebar */}
      <aside className="lg:w-64 lg:flex-shrink-0">
        <div className="card p-2 sticky top-20">
          <nav className="flex lg:flex-col gap-0.5 overflow-x-auto lg:overflow-visible">
            {ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                      isActive
                        ? 'bg-primary-container text-primary'
                        : 'text-foreground hover:bg-surface-container',
                    )
                  }
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-on-surface-variant hidden lg:block" />
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
