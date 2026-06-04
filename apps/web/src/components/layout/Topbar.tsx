import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, Check, X, Info, AlertTriangle, XCircle, CheckCircle2, Megaphone, Command } from 'lucide-react';
import { GlobalSearchBar } from '@/components/header/GlobalSearchBar';
import { CommandPalette } from '@/components/header/CommandPalette';
import { useUIStore } from '@/stores/ui-store';
import { useMe } from '@/features/auth/hooks';
import { useRecentNotifications, useUnreadCount, useMarkAsRead } from '@/features/notifications/hooks';
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
    <header className="sticky top-0 z-20 bg-surface-container-lowest border-b border-outline-variant">
      <div className="flex items-center gap-3 h-16 px-4">
        <button
          onClick={() => toggle()}
          className="md:hidden p-2 -ml-2 text-on-surface-variant hover:text-foreground"
          aria-label="Menüyü aç/kapat"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex-1 max-w-xl relative flex items-center gap-2">
          <GlobalSearchBar />
          <CommandPalette />
        </div>

        {/* Bildirim Dropdown */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="relative p-2 text-on-surface-variant hover:text-foreground hover:bg-surface-container rounded-md"
            aria-label="Bildirimler"
            aria-expanded={open}
          >
            <Bell className="h-5 w-5" />
            {unread && unread.count > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-error text-error-foreground text-[10px] font-bold flex items-center justify-center">
                {unread.count > 9 ? '9+' : unread.count}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-surface-container-lowest rounded-md border border-outline-variant shadow-m3-3 z-30 animate-fade-in">
              <div className="flex items-center justify-between p-3 border-b border-outline-variant">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Bildirimler</h3>
                  <p className="text-xs text-on-surface-variant">
                    {unread?.count ?? 0} okunmamış
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 text-on-surface-variant hover:text-foreground rounded-md"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto divide-y divide-outline-variant">
                {recent.length === 0 && (
                  <div className="p-8 text-center text-sm text-on-surface-variant">
                    Bildirim yok
                  </div>
                )}
                {recent.map((n: any) => {
                  const Icon = TYPE_ICON[n.type as NotificationType];
                  const color = TYPE_COLOR[n.type as NotificationType];
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n.id, n.link ?? null, n.isRead)}
                      className="flex items-start gap-3 p-3 hover:bg-surface-container text-left w-full transition-colors"
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className={`text-sm truncate ${!n.isRead ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>
                            {n.title}
                          </h4>
                          {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-on-surface-variant line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">{formatRelative(n.createdAt)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-2 border-t border-outline-variant">
                <Link
                  to="/notifications"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center px-3 py-2 rounded-md text-sm text-primary hover:bg-surface-container font-medium"
                >
                  Tüm Bildirimleri Gör
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="h-9 w-9 rounded-full bg-primary-container text-primary flex items-center justify-center text-sm font-semibold ml-1">
          {user?.fullName?.[0]?.toUpperCase() ?? '?'}
        </div>
      </div>
    </header>
  );
}
