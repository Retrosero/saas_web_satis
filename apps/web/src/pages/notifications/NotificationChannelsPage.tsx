import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Plus, Pencil, Trash2, Bell, Send } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useChannels, useDeleteChannel, useTestChannel } from '@/features/notifications/api';
import { NotificationChannelTypeLabel, NotificationChannelTypeIcon, type NotificationChannel } from '@saas/shared';

export function NotificationChannelsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState(''); const [filterType, setFilterType] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<NotificationChannel | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; status: string; message: string } | null>(null);
  const { data: channels = [], isLoading, error, refetch } = useChannels({ search, type: filterType || undefined });
  const delMut = useDeleteChannel();
  const testMut = useTestChannel();

  const columns: DataTableColumn<NotificationChannel>[] = [
    { key: 'name', label: 'Kanal', render: (c) => <div className="flex items-center gap-2"><span className="text-xl">{NotificationChannelTypeIcon[c.type]}</span><div><p className="font-semibold text-sm">{c.name}</p>{c.description && <p className="text-xs text-on-surface-variant">{c.description}</p>}</div></div> },
    { key: 'type', label: 'Tip', width: '160px', render: (c) => NotificationChannelTypeLabel[c.type] },
    { key: 'isDefault', label: 'Varsayılan', width: '110px', render: (c) => c.isDefault ? <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">Varsayılan</span> : '—' },
    { key: 'isActive', label: 'Durum', width: '90px', render: (c) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{c.isActive ? 'Aktif' : 'Pasif'}</span> },
    { key: 'testStatus', label: 'Son Test', width: '120px', render: (c) => c.testStatus ? <span className={c.testStatus === 'OK' ? 'text-green-600' : 'text-red-600'}>{c.testStatus}</span> : '—' },
    {
      key: 'actions', label: '', width: '160px', render: (c) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={async () => { const r = await testMut.mutateAsync(c.id); setTestResult({ id: c.id, status: r.status, message: r.message }); }} className="rounded-md p-1.5 text-green-600 hover:bg-green-50" title="Test Et"><Send className="h-4 w-4" /></button>
          <button onClick={() => navigate(`/notifications/channels/${c.id}/edit`)} className="rounded-md p-1.5 text-primary hover:bg-primary-container/40" title="Düzenle"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setConfirmDelete(c)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50" title="Sil"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message="Kanallar yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bildirim Kanalları"
        description="E-posta / SMS / Webhook kanal yapılandırması"
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate('/notifications/inbox')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><Bell className="h-4 w-4" /> Gelen Kutusu</button>
            <button onClick={() => navigate('/notifications/channels/new')} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Plus className="h-4 w-4" /> Yeni Kanal</button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kanal adı..." className="rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm">
          <option value="">Tüm Tipler</option>
          {Object.entries(NotificationChannelTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {isLoading ? <LoadingState /> : channels.length === 0 ? (
        <EmptyState icon={<Bell className="h-12 w-12" />} title="Henüz kanal yok" description="İlk bildirim kanalını oluştur" action={<button onClick={() => navigate('/notifications/channels/new')} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">Yeni Kanal</button>} />
      ) : <DataTable<NotificationChannel> columns={columns} data={channels} rowKey={(c) => c.id} />}

      <ConfirmModal open={!!confirmDelete} title="Kanal Silinsin mi?" description={`${confirmDelete?.name} kanalı silinecek.`} confirmText="Sil" variant="danger" onClose={() => setConfirmDelete(null)} onConfirm={async () => { if (confirmDelete) { await delMut.mutateAsync(confirmDelete.id); setConfirmDelete(null); } }} />

      {testResult && (
        <div className="rounded-lg border-2 border-primary bg-surface p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Test Sonucu: <span className={testResult.status === 'OK' ? 'text-green-600' : 'text-red-600'}>{testResult.status}</span></h3>
            <button onClick={() => setTestResult(null)}>×</button>
          </div>
          <p className="mt-1 text-sm">{testResult.message}</p>
        </div>
      )}
    </div>
  );
}
