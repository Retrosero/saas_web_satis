import { useState } from 'react';
import { Activity, Filter, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { useLogs } from '@/features/notifications/api';
import { NotificationTriggerTypeLabel, NotificationChannelTypeLabel, NotificationLogStatusLabel, formatDateTime, type NotificationLog } from '@saas/shared';

export function NotificationLogsPage() {
  const [status, setStatus] = useState(''); const [triggerType, setTriggerType] = useState(''); const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useLogs({ status: status || undefined, triggerType: triggerType || undefined, page, pageSize: 50 });

  const columns: DataTableColumn<NotificationLog>[] = [
    { key: 'createdAt', label: 'Tarih', width: '150px', render: (l) => formatDateTime(l.createdAt) },
    { key: 'triggerType', label: 'Tetik', width: '150px', render: (l) => <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{NotificationTriggerTypeLabel[l.triggerType]}</span> },
    { key: 'ruleName', label: 'Kural', hideOnMobile: true, render: (l) => l.ruleName ?? '—' },
    { key: 'channelName', label: 'Kanal', width: '130px', hideOnMobile: true, render: (l) => l.channelName ? `${l.channelType ? NotificationChannelTypeLabel[l.channelType] : ''} • ${l.channelName}` : '—' },
    { key: 'recipientName', label: 'Alıcı', render: (l) => <div><p className="text-sm">{l.recipientName ?? l.recipientId ?? '—'}</p>{l.recipientContact && <p className="text-xs text-on-surface-variant">{l.recipientContact}</p>}</div> },
    { key: 'subject', label: 'Konu/İçerik', hideOnMobile: true, render: (l) => <div className="max-w-[200px] truncate"><p className="font-semibold text-sm">{l.subject ?? '—'}</p><p className="text-xs text-on-surface-variant truncate">{l.body}</p></div> },
    { key: 'status', label: 'Durum', width: '110px', render: (l) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${l.status === 'SENT' ? 'bg-green-100 text-green-800' : l.status === 'FAILED' ? 'bg-red-100 text-red-800' : l.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-700'}`}>{NotificationLogStatusLabel[l.status]}</span> },
    { key: 'durationMs', label: 'Süre', width: '70px', align: 'right', hideOnMobile: true, render: (l) => l.durationMs ? `${l.durationMs}ms` : '—' },
  ];

  if (error) return <ErrorState message="Loglar yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader title="Bildirim Logları" description="Tüm gönderim denemeleri ve durumları" actions={<button onClick={() => refetch()} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><RefreshCw className="h-4 w-4" /> Yenile</button>} />

      <div className="flex flex-wrap gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm">
          <option value="">Tüm Durumlar</option>
          {Object.entries(NotificationLogStatusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={triggerType} onChange={(e) => setTriggerType(e.target.value)} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm">
          <option value="">Tüm Tetikler</option>
          {Object.entries(NotificationTriggerTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {isLoading ? <LoadingState /> : !data || data.items.length === 0 ? (
        <EmptyState icon={<Activity className="h-12 w-12" />} title="Log kaydı yok" description="Filtreleri değiştir veya kural tetikleyin" />
      ) : (
        <>
          <DataTable<NotificationLog> columns={columns} data={data.items} rowKey={(l) => l.id} />
          <MobileCardList<NotificationLog> data={data.items} keyFn={(l) => l.id} header={(l) => l.subject ?? NotificationTriggerTypeLabel[l.triggerType]} subtitle={(l) => `${l.recipientName ?? l.recipientId ?? '—'} • ${l.ruleName ?? 'Manuel'}`} rightBadge={(_l) => <span className={`rounded-full px-2 py-0.5 text-xs ${_l.status === 'SENT' ? 'bg-green-100 text-green-800' : _l.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{NotificationLogStatusLabel[_l.status]}</span>} footer={(l) => <span className="text-xs text-on-surface-variant">{formatDateTime(l.createdAt)} {l.durationMs ? `• ${l.durationMs}ms` : ''}</span>} />
          <div className="flex items-center justify-between rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm">
            <p>Toplam: {data.total} kayıt</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded border border-outline px-2 py-1 disabled:opacity-40">Önceki</button>
              <span className="px-2 py-1">Sayfa {page} / {Math.max(1, Math.ceil(data.total / data.pageSize))}</span>
              <button onClick={() => setPage(page + 1)} disabled={page * data.pageSize >= data.total} className="rounded border border-outline px-2 py-1 disabled:opacity-40">Sonraki</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
