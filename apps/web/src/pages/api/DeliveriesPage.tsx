import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, Send, Filter } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { useDeliveries, useTestWebhook, useWebhooks } from '@/features/api/api';
import { WebhookDeliveryStatusLabel, formatDateTime, type WebhookDelivery, type WebhookDeliveryStatus } from '@saas/shared';

const STATUS_COLOR: Record<WebhookDeliveryStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800', SUCCESS: 'bg-green-100 text-green-800', FAILED: 'bg-red-100 text-red-800', RETRYING: 'bg-blue-100 text-blue-800', ABANDONED: 'bg-gray-300 text-gray-700',
};

export function DeliveriesPage() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<WebhookDeliveryStatus | 'all'>('all');
  const [testPayload, setTestPayload] = useState('{"test": true, "message": "Manuel test"}');
  const [testResult, setTestResult] = useState<{ success: boolean; statusCode?: number; duration: number; errorMessage?: string } | null>(null);
  const webhookId = searchParams.get('webhookId') ?? undefined;
  const { data: hooks = [] } = useWebhooks();
  const { data, isLoading, error, refetch } = useDeliveries({ webhookId, status: statusFilter !== 'all' ? statusFilter : undefined, page, pageSize: 50 });
  const testMut = useTestWebhook();

  const rows: WebhookDelivery[] = data?.data ?? [];
  const pagination = data?.pagination;

  const columns: DataTableColumn<WebhookDelivery>[] = [
    { key: 'deliveredAt', label: 'Zaman', width: '170px', render: (d) => formatDateTime(d.deliveredAt) },
    { key: 'eventType', label: 'Olay', width: '200px', render: (d) => <code className="text-xs">{d.eventType}</code> },
    { key: 'responseStatus', label: 'HTTP', width: '90px', render: (d) => d.responseStatus ? <span className={`rounded px-2 py-0.5 text-xs font-mono font-semibold ${d.responseStatus >= 400 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{d.responseStatus}</span> : <span className="text-on-surface-variant">—</span> },
    { key: 'duration', label: 'Süre', width: '90px', align: 'right', render: (d) => d.duration ? `${d.duration}ms` : '—' },
    { key: 'attempt', label: 'Deneme', width: '80px', align: 'right', render: (d) => `#${d.attempt}` },
    { key: 'status', label: 'Durum', width: '130px', render: (d) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[d.status]}`}>{WebhookDeliveryStatusLabel[d.status]}</span> },
    { key: 'errorMessage', label: 'Hata', hideOnMobile: true, render: (d) => d.errorMessage ? <span className="text-xs text-red-600 truncate max-w-[200px] inline-block">{d.errorMessage}</span> : '—' },
  ];

  const sendTest = async () => {
    if (!webhookId) return;
    let payload;
    try { payload = JSON.parse(testPayload); } catch { setTestResult({ success: false, duration: 0, errorMessage: 'Geçersiz JSON' }); return; }
    const r = await testMut.mutateAsync({ id: webhookId, payload });
    setTestResult(r);
  };

  if (error) return <ErrorState message="Teslimat logları yüklenemedi" onRetry={refetch} />;

  const currentHook = hooks.find((h) => h.id === webhookId);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Webhook Teslimat Logları"
        description={currentHook ? currentHook.name : 'Tüm webhook teslimat logları'}
      />

      {webhookId && (
        <div className="rounded-lg border border-outline-variant bg-surface p-4">
          <h3 className="mb-2 text-sm font-semibold flex items-center gap-2"><Send className="h-4 w-4" /> Test Gönderimi</h3>
          <textarea value={testPayload} onChange={(e) => setTestPayload(e.target.value)} rows={3} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" />
          <div className="mt-2 flex items-center justify-between">
            <button onClick={sendTest} disabled={testMut.isPending} className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-on-primary disabled:opacity-40">
              <Send className="h-4 w-4" /> {testMut.isPending ? 'Gönderiliyor...' : 'Test Gönder'}
            </button>
            {testResult && (
              <div className={`text-xs ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {testResult.success ? '✓' : '✗'} HTTP {testResult.statusCode ?? '???'} • {testResult.duration}ms
                {testResult.errorMessage && ` • ${testResult.errorMessage}`}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        <div className="w-[180px]">
          <label className="mb-1 block text-xs font-medium">Durum</label>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
            <option value="all">Tümü</option>
            {Object.entries(WebhookDeliveryStatusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? <LoadingState /> : rows.length === 0 ? (
        <EmptyState icon={<Activity className="h-12 w-12" />} title="Henüz teslimat yok" />
      ) : (
        <>
          <DataTable<WebhookDelivery> columns={columns} data={rows} rowKey={(d) => d.id} />
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
