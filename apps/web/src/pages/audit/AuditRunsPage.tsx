import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, RefreshCw, Play, Filter } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { useRuns } from '@/features/audit/api';
import { DataCheckTypeLabel, DataCheckTypeIcon, DataCheckRunStatusLabel, formatDateTime, type DataCheckRun } from '@saas/shared';

const STATUS_BG: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-800', RUNNING: 'bg-blue-100 text-blue-800', FAILED: 'bg-red-100 text-red-800', CANCELLED: 'bg-gray-200 text-gray-700', DRAFT: 'bg-gray-200 text-gray-700',
};

export function AuditRunsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(''); const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useRuns({ status: status || undefined, page, pageSize: 30 });

  const columns: DataTableColumn<DataCheckRun>[] = [
    { key: 'startedAt', label: 'Başlangıç', width: '150px', render: (r) => formatDateTime(r.startedAt) },
    { key: 'ruleName', label: 'Kural', render: (r) => <div className="flex items-center gap-2"><span>{DataCheckTypeIcon[r.checkType]}</span><div><p className="text-sm font-semibold">{r.ruleName}</p><p className="text-xs text-on-surface-variant">{DataCheckTypeLabel[r.checkType]}</p></div></div> },
    { key: 'status', label: 'Durum', width: '110px', render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BG[r.status]}`}>{DataCheckRunStatusLabel[r.status]}</span> },
    { key: 'resultCount', label: 'Bulgu', width: '80px', align: 'right', render: (r) => r.resultCount },
    { key: 'durationMs', label: 'Süre', width: '90px', align: 'right', hideOnMobile: true, render: (r) => r.durationMs ? `${r.durationMs}ms` : '—' },
    { key: 'triggeredBy', label: 'Tetikleyen', width: '120px', hideOnMobile: true, render: (r) => r.triggeredBy ?? '—' },
  ];

  if (error) return <ErrorState message="Çalıştırmalar yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader title="Çalıştırma Geçmişi" description="Tüm kontrol çalıştırmaları" actions={<button onClick={() => refetch()} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><RefreshCw className="h-4 w-4" /> Yenile</button>} />

      <div className="flex gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm">
          <option value="">Tüm Durumlar</option>
          {Object.entries(DataCheckRunStatusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {isLoading ? <LoadingState /> : !data || data.items.length === 0 ? (
        <EmptyState icon={<Activity className="h-12 w-12" />} title="Çalıştırma yok" />
      ) : (
        <>
          <DataTable<DataCheckRun> columns={columns} data={data.items} rowKey={(r) => r.id} onRowClick={(r) => navigate(`/audit/runs/${r.id}`)} />
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
