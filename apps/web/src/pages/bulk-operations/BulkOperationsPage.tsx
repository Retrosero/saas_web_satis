import { useState } from 'react';
import { ListChecks, Play, Undo2, Trash2, Plus, Eye } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useBulkOperations, useExecuteBulk, useRollbackBulk, useBulkPreview, useCreateBulkOperation } from '@/features/ux-bulk/api';
import { BulkOperationType, BulkOperationStatus, BulkOperationTypeLabel, BulkOperationStatusLabel, formatDate } from '@saas/shared';

export function BulkOperationsPage() {
  const { data, isLoading } = useBulkOperations({ pageSize: 30 });
  const execute = useExecuteBulk();
  const rollback = useRollbackBulk();
  const preview = useBulkPreview();
  const create = useCreateBulkOperation();
  const [confirmExec, setConfirmExec] = useState<string | null>(null);
  const [confirmRollback, setConfirmRollback] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<{ name: string; type: BulkOperationType; update: any; filters: any }>({ name: '', type: BulkOperationType.PRICE_UPDATE, update: { percentage: 10 }, filters: {} });
  const [previewResult, setPreviewResult] = useState<any>(null);

  const onPreview = async () => {
    const r = await preview.mutateAsync({ type: form.type, filters: form.filters, update: form.update });
    setPreviewResult(r);
  };
  const onCreate = async () => {
    await create.mutateAsync({ ...form, totalMatched: previewResult?.totalMatched ?? 0 });
    setShowNew(false);
    setPreviewResult(null);
  };

  const columns: DataTableColumn<any>[] = [
    { key: 'name', label: 'İşlem', render: (o) => <div><p className="font-semibold">{o.name}</p><p className="text-xs text-on-surface-variant">{formatDate(o.createdAt)}</p></div> },
    { key: 'type', label: 'Tip', render: (o) => <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{BulkOperationTypeLabel[o.type as keyof typeof BulkOperationTypeLabel]}</span> },
    { key: 'matched', label: 'Eşleşen', align: 'right', render: (o) => <span className="font-semibold">{o.totalMatched}</span> },
    { key: 'status', label: 'Durum', render: (o) => <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{BulkOperationStatusLabel[o.status as keyof typeof BulkOperationStatusLabel]}</span> },
    { key: 'actions', label: '', width: '160px', render: (o) => (
      <div className="flex gap-1">
        {o.status === BulkOperationStatus.DRAFT && <button onClick={(e) => { e.stopPropagation(); setConfirmExec(o.id); }} className="flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-xs text-white"><Play className="h-3 w-3" /> Çalıştır</button>}
        {o.status === BulkOperationStatus.COMPLETED && <button onClick={(e) => { e.stopPropagation(); setConfirmRollback(o.id); }} className="flex items-center gap-1 rounded bg-amber-600 px-2 py-1 text-xs text-white"><Undo2 className="h-3 w-3" /> Geri Al</button>}
      </div>
    ) },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Toplu İşlemler" description="Ürün/cari üzerinde toplu güncelleme yap"
        actions={<button onClick={() => setShowNew(true)} className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Plus className="h-4 w-4" /> Yeni Toplu İşlem</button>}
      />

      {isLoading ? <LoadingState /> : !data || data.items.length === 0 ? (
        <EmptyState icon={<ListChecks className="h-12 w-12" />} title="Henüz toplu işlem yok" action={<button onClick={() => setShowNew(true)} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">İlk İşlemi Oluştur</button>} />
      ) : <DataTable columns={columns} data={data.items} rowKey={(o) => o.id} />}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-xl rounded-lg border border-outline bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-3 text-lg font-semibold">Yeni Toplu İşlem</h2>
            <div className="space-y-2 text-sm">
              <div><label className="text-xs">İşlem Adı</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded border px-2 py-1.5" /></div>
              <div><label className="text-xs">Tip</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as BulkOperationType })} className="mt-1 w-full rounded border px-2 py-1.5">{Object.values(BulkOperationType).map((t) => <option key={t} value={t}>{BulkOperationTypeLabel[t]}</option>)}</select></div>
              {form.type === BulkOperationType.PRICE_UPDATE && <div><label className="text-xs">Yüzdelik Artış (%)</label><input type="number" value={form.update.percentage ?? 0} onChange={(e) => setForm({ ...form, update: { ...form.update, percentage: Number(e.target.value) } })} className="mt-1 w-full rounded border px-2 py-1.5" /></div>}
              <button onClick={onPreview} disabled={preview.isPending} className="flex items-center gap-1 rounded border border-blue-500 px-3 py-1.5 text-blue-600"><Eye className="h-3 w-3" /> Önizle</button>
              {previewResult && <div className="rounded border border-blue-200 bg-blue-50 p-2 text-xs"><p><b>{previewResult.totalMatched}</b> kayıt eşleşti</p>{previewResult.sample?.length > 0 && <ul className="mt-1">{previewResult.sample.map((s: any) => <li key={s.id}>{s.code} - {s.name}</li>)}</ul>}</div>}
            </div>
            <div className="mt-3 flex justify-end gap-2"><button onClick={() => setShowNew(false)} className="rounded border px-3 py-1.5 text-sm">İptal</button><button onClick={onCreate} disabled={!form.name || !previewResult || create.isPending} className="rounded bg-primary px-3 py-1.5 text-sm text-on-primary">Oluştur</button></div>
          </div>
        </div>
      )}

      <ConfirmModal open={!!confirmExec} title="İşlemi Çalıştır" description={`${previewResult?.totalMatched ?? '?'} kayıt güncellenecek. Bu işlem geri alınabilir.`} confirmText="Çalıştır" variant="warning" onClose={() => setConfirmExec(null)} onConfirm={async () => { if (confirmExec) { await execute.mutateAsync(confirmExec); setConfirmExec(null); } }} />
      <ConfirmModal open={!!confirmRollback} title="İşlemi Geri Al" description="Tüm değişiklikler önceki hallerine döndürülecek." confirmText="Geri Al" variant="danger" onClose={() => setConfirmRollback(null)} onConfirm={async () => { if (confirmRollback) { await rollback.mutateAsync(confirmRollback); setConfirmRollback(null); } }} />
    </div>
  );
}
