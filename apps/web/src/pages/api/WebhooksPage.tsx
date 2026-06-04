import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Plus, Send, Power, Trash2, Eye, Copy, Check, Globe } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useWebhooks, useCreateWebhook, useUpdateWebhookStatus, useDeleteWebhook, useTestWebhook } from '@/features/api/api';
import { WebhookEventTypeLabel, WebhookStatusLabel, formatDateTime, type Webhook, type WebhookEventType, type WebhookStatus } from '@saas/shared';

const STATUS_COLOR: Record<WebhookStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800', PAUSED: 'bg-amber-100 text-amber-800', FAILED: 'bg-red-100 text-red-800', REVOKED: 'bg-gray-300 text-gray-700',
};

export function WebhooksPage() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Webhook | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; statusCode?: number; errorMessage?: string; duration: number } | null>(null);
  const [createdSecret, setCreatedSecret] = useState<{ webhook: Webhook; secret: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<WebhookEventType[]>([]);

  const { data: hooks = [], isLoading, error, refetch } = useWebhooks();
  const createMut = useCreateWebhook();
  const updateMut = useUpdateWebhookStatus('');
  const delMut = useDeleteWebhook();
  const testMut = useTestWebhook();

  const toggleEvent = (e: WebhookEventType) => setEvents((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]);

  const submit = async () => {
    if (!name || !url || events.length === 0) return;
    const r = await createMut.mutateAsync({ name, url, events });
    setCreatedSecret(r);
    setShowForm(false);
    setName(''); setUrl(''); setEvents([]);
    refetch();
  };

  const testOne = async (id: string) => {
    const r = await testMut.mutateAsync({ id, payload: { test: true, message: 'Test webhook' } });
    setTestResult({ id, ...r });
    setTimeout(() => setTestResult(null), 5000);
  };

  const columns: DataTableColumn<Webhook>[] = [
    { key: 'name', label: 'Webhook Adı', render: (w) => <span className="font-semibold">{w.name}</span> },
    { key: 'url', label: 'URL', hideOnMobile: true, render: (w) => <code className="text-xs">{w.url}</code> },
    { key: 'events', label: 'Olaylar', hideOnMobile: true, render: (w) => <span className="text-xs">{w.events.length} olay</span> },
    {
      key: 'stats', label: 'İstatistik', width: '160px', render: (w) => (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-green-700">✓ {w.successCount}</span>
          <span className="text-red-700">✗ {w.failureCount}</span>
        </div>
      ),
    },
    { key: 'status', label: 'Durum', width: '120px', render: (w) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[w.status]}`}>{WebhookStatusLabel[w.status]}</span> },
    {
      key: 'actions', label: '', width: '160px', render: (w) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => navigate(`/api/webhooks/${w.id}/deliveries`)} className="rounded-md p-1.5 text-primary hover:bg-primary-container/40" title="Teslimat Logları"><Eye className="h-4 w-4" /></button>
          <button onClick={() => testOne(w.id)} className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50" title="Test Gönder"><Send className="h-4 w-4" /></button>
          <button onClick={() => updateMut.mutateAsync(w.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')} className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50" title={w.status === 'ACTIVE' ? 'Duraklat' : 'Aktifleştir'}><Power className="h-4 w-4" /></button>
          <button onClick={() => setConfirmDelete(w)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50" title="Sil"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message="Webhook'lar yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Webhook'lar"
        description="3rd party sistemlere olay bildirimi gönderin"
        actions={
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary">
            <Plus className="h-4 w-4" /> Yeni Webhook
          </button>
        }
      />

      {showForm && (
        <div className="rounded-lg border-2 border-primary bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold">Yeni Webhook</h3>
          <div className="space-y-3">
            <div><label className="mb-1 block text-xs font-medium">Webhook Adı *</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">URL * (https://)</label><input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/webhook" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" /></div>
            <div>
              <label className="mb-2 block text-xs font-medium">Olay Tipleri * (en az 1)</label>
              <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                {Object.entries(WebhookEventTypeLabel).map(([k, v]) => (
                  <label key={k} className="flex items-center gap-1.5 rounded border border-outline-variant p-2 text-xs">
                    <input type="checkbox" checked={events.includes(k as WebhookEventType)} onChange={() => toggleEvent(k as WebhookEventType)} />
                    <span>{v}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
              ⚠️ Secret sadece oluşturulduğunda gösterilecek. İmza doğrulama için saklayın.
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="rounded-md border border-outline px-3 py-1.5 text-sm">İptal</button>
              <button onClick={submit} disabled={!name || !url || events.length === 0 || createMut.isPending} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-on-primary disabled:opacity-40">Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {createdSecret && (
        <div className="rounded-lg border-2 border-green-500 bg-green-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-green-800">✓ Webhook Oluşturuldu</h3>
          <p className="mb-2 text-xs text-green-700">İmza doğrulama için bu secret'ı saklayın:</p>
          <div className="flex items-center gap-2 rounded-md border border-green-300 bg-surface p-2 font-mono text-xs">
            <span className="flex-1 truncate">{createdSecret.secret}</span>
            <button onClick={() => { navigator.clipboard.writeText(createdSecret.secret); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="rounded p-1 hover:bg-surface-variant">{copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}</button>
          </div>
          <button onClick={() => setCreatedSecret(null)} className="mt-2 text-xs text-green-700 hover:underline">Kapat</button>
        </div>
      )}

      {testResult && (
        <div className={`rounded-md border p-3 ${testResult.success ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
          <p className={`text-sm font-semibold ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
            {testResult.success ? '✓ Test başarılı' : '✗ Test başarısız'} — HTTP {testResult.statusCode ?? '???'} — {testResult.duration}ms
          </p>
          {testResult.errorMessage && <p className="mt-1 text-xs text-red-700">{testResult.errorMessage}</p>}
        </div>
      )}

      {isLoading ? <LoadingState /> : hooks.length === 0 ? (
        <EmptyState icon={<Zap className="h-12 w-12" />} title="Henüz webhook yok" description="İlk webhook'unuzu oluşturarak başlayın" />
      ) : (
        <>
          <DataTable<Webhook> columns={columns} data={hooks} rowKey={(w) => w.id} />
          <MobileCardList<Webhook>
            data={hooks}
            keyFn={(w) => w.id}
            header={(w) => w.name}
            subtitle={(w) => w.url}
            rightBadge={(w) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[w.status]}`}>{WebhookStatusLabel[w.status]}</span>}
            footer={(w) => <div className="flex justify-between text-xs"><span className="text-on-surface-variant">{w.events.length} olay</span><span><span className="text-green-700">{w.successCount}✓</span> / <span className="text-red-700">{w.failureCount}✗</span></span></div>}
          />
        </>
      )}

      <ConfirmModal open={!!confirmDelete} title="Webhook Silinsin mi?" description={`${confirmDelete?.name} silinecek.`} confirmText="Sil" variant="danger" onClose={() => setConfirmDelete(null)} onConfirm={async () => { if (confirmDelete) { await delMut.mutateAsync(confirmDelete.id); setConfirmDelete(null); } }} />
    </div>
  );
}
