import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { useActionLogs } from '@/features/audit/api';
import { formatDateTime, type DataCheckActionLog } from '@saas/shared';

const ACTION_BG: Record<string, string> = {
  FIXED: 'bg-green-100 text-green-800', IGNORED: 'bg-gray-200 text-gray-700', ACKNOWLEDGED: 'bg-amber-100 text-amber-800', FALSE_POSITIVE: 'bg-purple-100 text-purple-800', AUTO_FIXED: 'bg-blue-100 text-blue-800',
};

export function AuditLogsPage() {
  const [actionType, setActionType] = useState(''); const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useActionLogs({ actionType: actionType || undefined, page, pageSize: 50 });

  const columns: DataTableColumn<DataCheckActionLog>[] = [
    { key: 'createdAt', label: 'Tarih', width: '150px', render: (l) => formatDateTime(l.createdAt) },
    { key: 'actionType', label: 'Aksiyon', width: '140px', render: (l) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_BG[l.actionType] ?? 'bg-gray-100'}`}>{l.actionType}</span> },
    { key: 'actor', label: 'Aktör', width: '180px', render: (l) => l.actorName ?? l.actorId ?? 'Sistem' },
    { key: 'resultId', label: 'Bulgu ID', width: '180px', render: (l) => <code className="text-[10px]">{l.resultId.substring(0, 16)}...</code> },
    { key: 'note', label: 'Not', render: (l) => l.note ?? '—' },
  ];

  if (error) return <ErrorState message="Loglar yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader title="Aksiyon Logları" description="Denetim ile ilgili tüm işlemler" />
      <div className="flex gap-2">
        <select value={actionType} onChange={(e) => setActionType(e.target.value)} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm">
          <option value="">Tüm Aksiyonlar</option>
          <option value="FIXED">Çözüldü</option><option value="ACKNOWLEDGED">İnceleniyor</option><option value="IGNORED">Yok Sayıldı</option><option value="FALSE_POSITIVE">Yanlış Tespit</option><option value="AUTO_FIXED">Otomatik Çözüm</option>
        </select>
      </div>
      {isLoading ? <LoadingState /> : !data || data.items.length === 0 ? (
        <EmptyState icon={<BookOpen className="h-12 w-12" />} title="Log kaydı yok" />
      ) : (
        <>
          <DataTable<DataCheckActionLog> columns={columns} data={data.items} rowKey={(l) => l.id} />
          <div className="flex items-center justify-between rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm">
            <p>Toplam: {data.total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded border border-outline px-2 py-1 disabled:opacity-40">Önceki</button>
              <span className="px-2 py-1">{page} / {Math.max(1, Math.ceil(data.total / data.pageSize))}</span>
              <button onClick={() => setPage(page + 1)} disabled={page * data.pageSize >= data.total} className="rounded border border-outline px-2 py-1 disabled:opacity-40">Sonraki</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
