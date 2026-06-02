import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  Check,
  X,
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Megaphone,
} from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { useMe } from '@/features/auth/hooks';
import {
  useRecentNotifications,
  useUnreadCount,
  useMarkAsRead,
} from '@/features/notifications/hooks';
import { formatRelative, type NotificationType } from '@saas/shared';

const TYPE_ICON: Record<NotificationType, typeof Info> = {
  INFO: Info,
  SUCCESS: CheckCircle2,
  WARNING: AlertTriangle,
  ERROR: XCircle,
  SYSTEM: Megaphone,
};

const TYPE_COLOR: Record<NotificationType, string> = {
  INFO: 'text-primary bg-primary-container',
  SUCCESS: 'text-secondary bg-secondary-container',
  WARNING: 'text-tertiary bg-tertiary/10',
  ERROR: 'text-error bg-error-container',
  SYSTEM: 'text-foreground bg-surface-variant',
};

export function Topbar() {
  const toggle = useUIStore((s) => s.toggleSidebar);
  const { data: user } = useMe();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: recent = [] } = useRecentNotifications(5);
  const { data: unread } = useUnreadCount();
  const markRead = useMarkAsRead();

  // Dropdown dışına tıklayınca kapat
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleClick = (id: string, link: string | null, isRead: boolean) => {
    if (!isRead) markRead.mutate(id);
    if (link) {
      setOpen(false);
      navigate(link);
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-outline-variant bg-surface-container-lowest">
      <div className="flex h-16 items-center gap-3 px-4">
        <button
          onClick={() => toggle()}
          className="-ml-2 p-2 text-on-surface-variant hover:text-foreground md:hidden"
          aria-label="Menüyü aç/kapat"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative max-w-xl flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="search"
            placeholder="Cari, ürün, fatura ara…"
            className="h-10 w-full rounded-md border border-outline-variant bg-surface-container pl-10 pr-4 text-sm text-foreground placeholder:text-on-surface-variant focus:border-primary focus:outline-none focus:ring-0"
            style={{ boxShadow: 'none' }}
          />
        </div>

        {/* Bildirim Dropdown */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="relative rounded-md p-2 text-on-surface-variant hover:bg-surface-container hover:text-foreground"
            aria-label="Bildirimler"
            aria-expanded={open}
          >
            <Bell className="h-5 w-5" />
            {unread && unread.count > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-error-foreground">
                {unread.count > 9 ? '9+' : unread.count}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-full z-30 mt-2 w-96 max-w-[calc(100vw-2rem)] animate-fade-in rounded-md border border-outline-variant bg-surface-container-lowest shadow-m3-3">
              <div className="flex items-center justify-between border-b border-outline-variant p-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Bildirimler</h3>
                  <p className="text-xs text-on-surface-variant">{unread?.count ?? 0} okunmamış</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1 text-on-surface-variant hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-96 divide-y divide-outline-variant overflow-y-auto">
                {recent.length === 0 && (
                  <div className="p-8 text-center text-sm text-on-surface-variant">
                    Bildirim yok
                  </div>
                )}
                {recent.map((n) => {
                  const Icon = TYPE_ICON[n.type];
                  const color = TYPE_COLOR[n.type];
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n.id, n.link, n.isRead)}
                      className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-surface-container"
                    >
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${color}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4
                            className={`truncate text-sm ${!n.isRead ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}
                          >
                            {n.title}
                          </h4>
                          {!n.isRead && (
                            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="line-clamp-2 text-xs text-on-surface-variant">{n.message}</p>
                        <p className="mt-0.5 text-[10px] text-on-surface-variant">
                          {formatRelative(n.createdAt)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-outline-variant p-2">
                <Link
                  to="/notifications"
                  onClick={() => setOpen(false)}
                  className="block w-full rounded-md px-3 py-2 text-center text-sm font-medium text-primary hover:bg-surface-container"
                >
                  Tüm Bildirimleri Gör
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-sm font-semibold text-primary">
          {user?.fullName?.[0]?.toUpperCase() ?? '?'}
        </div>
      </div>
    </header>
  );
}
