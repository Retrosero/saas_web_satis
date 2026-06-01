import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Trash2, Filter, Info, AlertCircle, AlertTriangle, XCircle, CheckCircle2, Megaphone } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { EmptyState } from '@/components/data/EmptyState';
import { SystemWarningBanner } from '@/components/notifications/SystemWarningBanner';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '@/features/notifications/hooks';
import type { NotificationItem, NotificationType } from '@/features/notifications/api';
import { cn } from '@/lib/cn';
import { formatRelative } from '@saas/shared';

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

const CATEGORY_LABEL: Record<string, string> = {
  SYSTEM: 'Sistem',
  SECURITY: 'Güvenlik',
  TENANT: 'Firma',
  PLAN: 'Paket',
  MODULE: 'Modül',
  USER: 'Kullanıcı',
  SALE: 'Satış',
  COLLECTION: 'Tahsilat',
  STOCK: 'Stok',
  ORDER: 'Sipariş',
  INVOICE: 'Fatura',
  REPORT: 'Rapor',
};

export function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [category, setCategory] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useNotifications({
    page,
    pageSize: 25,
    isRead: filter === 'unread' ? false : undefined,
    category,
  });
  const { data: unread } = useUnreadCount();
  const markRead = useMarkAsRead();
  const markAllRead = useMarkAllAsRead();
  const remove = useDeleteNotification();

  // İlk yüklemede veya filter değiştiğinde 1. sayfaya dön
  useEffect(() => setPage(1), [filter, category]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Bildirimler"
        description={`${unread?.count ?? 0} okunmamış bildirim`}
        actions={
          <button
            onClick={() => markAllRead.mutate()}
            disabled={!unread?.count || markAllRead.isPending}
            className="btn-secondary"
          >
            <CheckCheck className="h-4 w-4" />
            Tümünü Okundu İşaretle
          </button>
        }
      />

      <SystemWarningBanner
        title="Bildirim Sistemi"
        message="Bu ekran sistem, paket, modül, satış, tahsilat ve diğer modüllerden gelen bildirimleri gösterir. Bildirimler 30 saniyede bir otomatik yenilenir."
        variant="info"
      />

      {/* Filtre çubuğu */}
      <div className="card p-3 flex flex-col sm:flex-row gap-2">
        <div className="flex gap-1 flex-1">
          <button
            onClick={() => setFilter('all')}
            className={cn('px-3 h-9 rounded-md text-sm font-medium transition-colors', filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-surface-container text-foreground hover:bg-surface-container-high')}
          >
            Tümü
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={cn('px-3 h-9 rounded-md text-sm font-medium transition-colors flex items-center gap-1', filter === 'unread' ? 'bg-primary text-primary-foreground' : 'bg-surface-container text-foreground hover:bg-surface-container-high')}
          >
            Okunmamış
            {unread?.count ? <span className="rounded-full bg-error text-error-foreground px-1.5 py-0.5 text-[10px] font-mono">{unread.count}</span> : null}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-on-surface-variant" />
          <select
            value={category ?? ''}
            onChange={(e) => setCategory(e.target.value || undefined)}
            className="h-9 px-3 rounded-md bg-surface-container text-sm border border-outline-variant"
          >
            <option value="">Tüm kategoriler</option>
            {Object.entries(CATEGORY_LABEL).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && <LoadingState size="lg" />}
      {isError && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {data && data.data.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<Bell className="h-8 w-8" />}
            title={filter === 'unread' ? 'Okunmamış bildirim yok' : 'Henüz bildirim yok'}
            description={filter === 'unread' ? 'Tüm bildirimleriniz okunmuş durumda.' : 'Sistem, paket, modül ve diğer olaylardan gelen bildirimler burada görünecek.'}
          />
        </div>
      )}

      {data && data.data.length > 0 && (
        <div className="card divide-y divide-outline-variant">
          {data.data.map((n) => (
            <NotificationRow
              key={n.id}
              n={n}
              onRead={() => !n.isRead && markRead.mutate(n.id)}
              onDelete={() => remove.mutate(n.id)}
            />
          ))}
        </div>
      )}

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-on-surface-variant">
          <span>Toplam {data.pagination.total} bildirim</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!data.pagination.hasPrev}
              className="btn-ghost text-xs"
            >
              Önceki
            </button>
            <span>Sayfa {data.pagination.page} / {data.pagination.totalPages}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data.pagination.hasNext}
              className="btn-ghost text-xs"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({ n, onRead, onDelete }: { n: NotificationItem; onRead: () => void; onDelete: () => void }) {
  const Icon = TYPE_ICON[n.type];
  const color = TYPE_COLOR[n.type];
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 hover:bg-surface-container transition-colors group',
        !n.isRead && 'bg-primary-container/20',
      )}
    >
      <div className={cn('h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={cn('text-sm truncate', !n.isRead ? 'font-bold text-foreground' : 'font-medium text-foreground')}>
            {n.title}
          </h3>
          {!n.isRead && (
            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" title="Okunmamış" />
          )}
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-semibold flex-shrink-0">
            {CATEGORY_LABEL[n.category] ?? n.category}
          </span>
        </div>
        <p className="text-sm text-on-surface-variant line-clamp-2">{n.message}</p>
        <div className="text-xs text-on-surface-variant mt-1.5">{formatRelative(n.createdAt)}</div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!n.isRead && (
          <button
            onClick={onRead}
            className="p-2 text-on-surface-variant hover:text-primary rounded-md hover:bg-surface"
            title="Okundu olarak işaretle"
          >
            <Check className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onDelete}
          className="p-2 text-on-surface-variant hover:text-error rounded-md hover:bg-surface"
          title="Sil"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
