import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Bell, Check, Settings, Filter, Layers, FileText, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { useInbox, useMarkRead, useMarkAllRead } from '@/features/notifications/api';
import { formatDateTime } from '@saas/shared';

export function NotificationCenterPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { data, isLoading, error, refetch } = useInbox(filter === 'unread' ? { isRead: false } : {});
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bildirim Merkezi"
        description={data ? `${data.unread} okunmamış bildirim` : 'Yükleniyor...'}
        actions={
          <div className="flex gap-2">
            <button onClick={() => markAllRead.mutate()} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><Check className="h-4 w-4" /> Tümünü Okundu İşaretle</button>
            <button onClick={() => navigate('/notifications/channels')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><Settings className="h-4 w-4" /> Kanallar</button>
            <button onClick={() => navigate('/notifications/rules')} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Layers className="h-4 w-4" /> Kurallar</button>
          </div>
        }
      />

      <div className="flex gap-2 border-b border-outline-variant">
        <button onClick={() => setFilter('all')} className={`px-3 py-2 text-sm font-medium ${filter === 'all' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant'}`}>
          Tümü {data && `(${data.total})`}
        </button>
        <button onClick={() => setFilter('unread')} className={`px-3 py-2 text-sm font-medium ${filter === 'unread' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant'}`}>
          Okunmamış {data && `(${data.unread})`}
        </button>
      </div>

      {isLoading ? <LoadingState /> : error ? <ErrorState message="Bildirimler yüklenemedi" onRetry={refetch} /> : !data || data.items.length === 0 ? (
        <EmptyState icon={<Bell className="h-12 w-12" />} title={filter === 'unread' ? 'Okunmamış bildirim yok' : 'Bildirim kutusu boş'} description="Kurallar tetiklendiğinde burada görünecek" />
      ) : (
        <div className="space-y-1">
          {data.items.map((n) => (
            <div key={n.id} onClick={() => !n.isRead && markRead.mutate([n.id])} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:shadow-sm transition ${n.isRead ? 'bg-surface border-outline-variant' : 'bg-primary-container/20 border-primary'}`}>
              <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${n.isRead ? 'bg-gray-300' : 'bg-primary'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${n.isRead ? 'font-normal' : 'font-semibold'}`}>{n.title}</p>
                  <span className="text-xs text-on-surface-variant whitespace-nowrap">{formatDateTime(n.createdAt)}</span>
                </div>
                <p className="text-sm text-on-surface-variant mt-0.5">{n.message}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="rounded-full bg-surface-variant px-2 py-0.5 text-[10px] font-medium">{n.category}</span>
                  {n.link && <span className="text-xs text-primary">→ {n.link}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
