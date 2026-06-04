import { useState } from 'react';
import { ListChecks, Filter } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { useErrorLogs } from '@/features/monitoring/api';
import { formatDateTime } from '@saas/shared';

export function ErrorLogsPage() {
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data, isLoading, error, refetch } = useErrorLogs({ page, pageSize: 50, from: from || undefined, to: to || undefined });
  const rows: any[] = data?.data ?? [];
  const pagination = data?.pagination;

  const columns: DataTableColumn<any>[] = [
    { key: 'createdAt', label: 'Zaman', width: '170px', render: (r) => formatDateTime(r.createdAt) },
    { key: 'tenantId', label: 'Tenant', width: '120px', render: (r) => r.tenantId ? <code className="text-xs">{r.tenantId.slice(0, 8)}</code> : '—' },
    { key: 'code', label: 'Kod', width: '180px', render: (r) => <code className="text-xs">{r.code}</code> },
    { key: 'message', label: 'Mesaj', render: (r) => <span className="truncate max-w-md inline-block">{r.message}</span> },
    { key: 'path', label: 'Path', width: '200px', hideOnMobile: true, render: (r) => r.path ? <code className="text-xs">{r.path}</code> : '—' },
    { key: 'method', label: 'Method', width: '80px', hideOnMobile: true, render: (r) => r.method ? <span className="font-mono text-xs">{r.method}</span> : '—' },
  ];

  if (error) return <ErrorState message="Hata logları yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader title="Hata Logları" description="Tüm hata kayıtları" />
      <div className="flex items-end gap-3 rounded-lg border border-outline-variant bg-surface p-4">
        <div className="w-[170px]"><label className="mb-1 block text-xs font-medium">Başlangıç</label><input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <div className="w-[170px]"><label className="mb-1 block text-xs font-medium">Bitiş</label><input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
      </div>
      {isLoading ? <LoadingState /> : rows.length === 0 ? (
        <EmptyState icon={<ListChecks className="h-12 w-12" />} title="Hata logu yok" description="Sistem tertemiz 🎉" />
      ) : (
        <>
          <DataTable columns={columns} data={rows} rowKey={(r) => r.id} />
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button disabled={!pagination.hasPrev} onClick={() => setPage(page - 1)} className="rounded-md border border-outline px-3 py-1.5 text-sm disabled:opacity-40">Önceki</button>
              <span className="px-3 py-1.5 text-sm">{page}/{pagination.totalPages}</span>
              <button disabled={!pagination.hasNext} onClick={() => setPage(page + 1)} className="rounded-md border border-outline px-3 py-1.5 text-sm disabled:opacity-40">Sonraki</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
