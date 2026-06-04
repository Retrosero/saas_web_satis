import { useState } from 'react';
import { Wrench, Plus, Pencil, Trash2, Code, Power, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useAssistantTools, useCreateTool, useDeleteTool, useUpdateTool } from '@/features/assistant/api';
import { formatDateTime, type AssistantTool } from '@saas/shared';

export function AssistantToolsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AssistantTool | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AssistantTool | null>(null);
  const [code, setCode] = useState(''); const [name, setName] = useState(''); const [description, setDescription] = useState('');
  const [module, setModule] = useState(''); const [requiredPermission, setReqPerm] = useState(''); const [apiEndpoint, setEndpoint] = useState('');

  const { data: tools = [], isLoading, error, refetch } = useAssistantTools();
  const createMut = useCreateTool();
  const updateMut = useUpdateTool('');
  const delMut = useDeleteTool();

  const reset = () => { setShowForm(false); setEditing(null); setCode(''); setName(''); setDescription(''); setModule(''); setReqPerm(''); setEndpoint(''); };

  const startEdit = (t: AssistantTool) => { setEditing(t); setCode(t.code); setName(t.name); setDescription(t.description); setModule(t.module); setReqPerm(t.requiredPermission); setEndpoint(t.apiEndpoint); setShowForm(true); };

  const submit = async () => {
    if (!code || !name || !module || !requiredPermission || !apiEndpoint) return;
    const payload = { code, name, description, module, requiredPermission, apiEndpoint };
    if (editing) await updateMut.mutateAsync(payload);
    else await createMut.mutateAsync(payload);
    reset();
    refetch();
  };

  const columns: DataTableColumn<AssistantTool>[] = [
    { key: 'code', label: 'Tool Kodu', width: '200px', render: (t) => <code className="text-xs font-semibold">{t.code}</code> },
    { key: 'name', label: 'Tool Adı', render: (t) => <span className="font-semibold">{t.name}</span> },
    { key: 'module', label: 'Modül', width: '120px', hideOnMobile: true, render: (t) => <code className="text-xs">{t.module}</code> },
    { key: 'requiredPermission', label: 'Gerekli Yetki', width: '150px', hideOnMobile: true, render: (t) => <code className="text-xs">{t.requiredPermission}</code> },
    { key: 'apiEndpoint', label: 'API Endpoint', hideOnMobile: true, render: (t) => <code className="text-xs">{t.apiEndpoint}</code> },
    { key: 'status', label: 'Durum', width: '90px', render: (t) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{t.status}</span> },
    {
      key: 'actions', label: '', width: '100px', render: (t) => (
        <div className="flex items-center gap-1">
          <button onClick={() => startEdit(t)} className="rounded-md p-1.5 text-primary hover:bg-primary-container/40"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setConfirmDelete(t)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message="Tool'lar yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Asistan Tool Listesi"
        description="Asistanın kullanabileceği API tool'larını yönetin"
        actions={
          <button onClick={() => { reset(); setShowForm(true); }} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary">
            <Plus className="h-4 w-4" /> Yeni Tool
          </button>
        }
      />

      {showForm && (
        <div className="rounded-lg border-2 border-primary bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold">{editing ? 'Tool Düzenle' : 'Yeni Tool'}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div><label className="mb-1 block text-xs font-medium">Tool Kodu *</label><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="get_customer_balance" disabled={!!editing} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono disabled:opacity-50" /></div>
            <div><label className="mb-1 block text-xs font-medium">Tool Adı *</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div className="md:col-span-2"><label className="mb-1 block text-xs font-medium">Açıklama *</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Modül *</label><input value={module} onChange={(e) => setModule(e.target.value)} placeholder="cari" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" /></div>
            <div><label className="mb-1 block text-xs font-medium">Gerekli Yetki *</label><input value={requiredPermission} onChange={(e) => setReqPerm(e.target.value)} placeholder="customers:read" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" /></div>
            <div className="md:col-span-2"><label className="mb-1 block text-xs font-medium">API Endpoint *</label><input value={apiEndpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="/api/v1/customers/:id/balance" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" /></div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={reset} className="rounded-md border border-outline px-3 py-1.5 text-sm">İptal</button>
            <button onClick={submit} disabled={!code || !name || !module || !requiredPermission || !apiEndpoint} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-on-primary disabled:opacity-40">{editing ? 'Güncelle' : 'Kaydet'}</button>
          </div>
        </div>
      )}

      {isLoading ? <LoadingState /> : tools.length === 0 ? (
        <EmptyState icon={<Wrench className="h-12 w-12" />} title="Henüz tool yok" description="Asistan için ilk tool'unuzu ekleyin" />
      ) : (
        <>
          <DataTable<AssistantTool> columns={columns} data={tools} rowKey={(t) => t.id} />
          <MobileCardList<AssistantTool> data={tools} keyFn={(t) => t.id} header={(t) => t.name} subtitle={(t) => t.code} rightBadge={(t) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{t.status}</span>} footer={(t) => <code className="text-xs text-on-surface-variant">{t.apiEndpoint}</code>} />
        </>
      )}

      <ConfirmModal open={!!confirmDelete} title="Tool Silinsin mi?" description={`${confirmDelete?.name} silinecek.`} confirmText="Sil" variant="danger" onClose={() => setConfirmDelete(null)} onConfirm={async () => { if (confirmDelete) { await delMut.mutateAsync(confirmDelete.id); setConfirmDelete(null); } }} />
    </div>
  );
}
