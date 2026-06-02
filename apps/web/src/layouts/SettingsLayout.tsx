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
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Settings sidebar */}
      <aside className="lg:w-64 lg:flex-shrink-0">
        <div className="card sticky top-20 p-2">
          <nav className="flex gap-0.5 overflow-x-auto lg:flex-col lg:overflow-visible">
            {ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-container text-primary'
                        : 'text-foreground hover:bg-surface-container',
                    )
                  }
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight className="hidden h-4 w-4 text-on-surface-variant lg:block" />
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
