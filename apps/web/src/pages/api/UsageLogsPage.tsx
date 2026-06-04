import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, Filter, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { useUsageLogs } from '@/features/api/api';
import { formatDateTime, type ApiKeyUsageLog } from '@saas/shared';

export function UsageLogsPage() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const keyId = searchParams.get('keyId') ?? undefined;
  const { data, isLoading, error, refetch } = useUsageLogs({
    page, pageSize: 50, apiKeyId: keyId,
    statusCode: statusFilter !== 'all' ? Number(statusFilter) : undefined,
  });

  const rows: ApiKeyUsageLog[] = data?.data ?? [];
  const pagination = data?.pagination;

  const columns: DataTableColumn<ApiKeyUsageLog>[] = [
    { key: 'createdAt', label: 'Zaman', width: '170px', render: (l) => formatDateTime(l.createdAt) },
    { key: 'method', label: 'Method', width: '90px', render: (l) => <span className="font-mono text-xs font-semibold">{l.method}</span> },
    { key: 'endpoint', label: 'Endpoint', render: (l) => <code className="text-xs">{l.endpoint}</code> },
    { key: 'statusCode', label: 'Durum', width: '90px', render: (l) => <span className={`rounded px-2 py-0.5 text-xs font-mono font-semibold ${l.statusCode >= 500 ? 'bg-red-100 text-red-800' : l.statusCode >= 400 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>{l.statusCode}</span> },
    { key: 'duration', label: 'Süre', width: '90px', align: 'right', render: (l) => `${l.duration}ms` },
    { key: 'ip', label: 'IP', width: '130px', hideOnMobile: true, render: (l) => l.ip ?? '—' },
  ];

  if (error) return <ErrorState message="Kullanım logları yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="API Kullanım Logları"
        description="Tüm API isteklerinin detaylı logu"
        actions={keyId && <span className="text-xs text-on-surface-variant">Belirli bir anahtar için filtrelenmiş</span>}
      />

      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        <div className="flex items-end gap-3">
          <div className="w-[180px]">
            <label className="mb-1 block text-xs font-medium">HTTP Durumu</label>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
              <option value="all">Tümü</option>
              <option value="200">2xx (Başarılı)</option>
              <option value="400">4xx (İstemci Hatası)</option>
              <option value="500">5xx (Sunucu Hatası)</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? <LoadingState /> : rows.length === 0 ? (
        <EmptyState icon={<Activity className="h-12 w-12" />} title="Henüz log yok" description="API istekleri geldikçe burada görünecek" />
      ) : (
        <>
          <DataTable<ApiKeyUsageLog> columns={columns} data={rows} rowKey={(l) => l.id} />
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
