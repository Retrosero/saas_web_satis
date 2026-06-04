import { useState } from 'react';
import { Tag, Printer, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useLabelTemplates, useCreateLabelTemplate, useDeleteLabelTemplate, usePrintLabels } from '@/features/ux-bulk/api';
import { LabelType, LabelTypeLabel, LabelPageSize, LabelPageSizeLabel } from '@saas/shared';

export function LabelsPage() {
  const { data: templates, isLoading } = useLabelTemplates();
  const createMut = useCreateLabelTemplate();
  const delMut = useDeleteLabelTemplate();
  const printMut = usePrintLabels();
  const [showNew, setShowNew] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; type: LabelType; pageSize: LabelPageSize; widthMm: number; heightMm: number }>({ name: '', type: LabelType.BARCODE, pageSize: LabelPageSize.SIZE_58MM, widthMm: 50, heightMm: 25 });

  const onCreate = async () => { await createMut.mutateAsync({ ...draft, isGlobal: false, layout: { fields: [] } }); setShowNew(false); setDraft({ name: '', type: LabelType.BARCODE, pageSize: LabelPageSize.SIZE_58MM, widthMm: 50, heightMm: 25 }); };
  const onPrint = async (id: string) => { const r = await printMut.mutateAsync({ templateId: id, productIds: ['demo-product-id'], copies: 1 }); alert(`${r.totalLabels} etiket yazdırıldı (job: ${r.jobId})`); };

  const columns: DataTableColumn<any>[] = [
    { key: 'name', label: 'Şablon', render: (t) => <div><p className="font-semibold">{t.name}</p><p className="text-xs text-on-surface-variant">{t.widthMm}x{t.heightMm} mm</p></div> },
    { key: 'type', label: 'Tip', render: (t) => <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{LabelTypeLabel[t.type as keyof typeof LabelTypeLabel]}</span> },
    { key: 'pageSize', label: 'Sayfa', hideOnMobile: true, render: (t) => LabelPageSizeLabel[t.pageSize as keyof typeof LabelPageSizeLabel] },
    { key: 'global', label: 'Kapsam', hideOnMobile: true, render: (t) => t.isGlobal ? <span className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">Global</span> : <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">Tenant</span> },
    { key: 'actions', label: '', width: '140px', render: (t) => (
      <div className="flex gap-1">
        <button onClick={(e) => { e.stopPropagation(); onPrint(t.id); }} className="rounded p-1 text-blue-600 hover:bg-blue-50" title="Yazdır"><Printer className="h-4 w-4" /></button>
        {!t.isGlobal && <button onClick={(e) => { e.stopPropagation(); setConfirmDel(t.id); }} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>}
      </div>
    ) },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Etiket Şablonları" description="Barkod, raf ve fiyat etiketleri" actions={<button onClick={() => setShowNew(true)} className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Plus className="h-4 w-4" /> Yeni Şablon</button>} />

      {isLoading ? <LoadingState /> : !templates || templates.length === 0 ? <EmptyState icon={<Tag className="h-12 w-12" />} title="Şablon yok" /> : <DataTable columns={columns} data={templates} rowKey={(t) => t.id} />}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-md rounded-lg border border-outline bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-3 text-lg font-semibold">Yeni Etiket Şablonu</h2>
            <div className="space-y-2 text-sm">
              <div><label className="text-xs">Ad</label><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="mt-1 w-full rounded border px-2 py-1.5" /></div>
              <div><label className="text-xs">Tip</label><select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as LabelType })} className="mt-1 w-full rounded border px-2 py-1.5">{Object.values(LabelType).map((t) => <option key={t} value={t}>{LabelTypeLabel[t]}</option>)}</select></div>
              <div><label className="text-xs">Sayfa Boyutu</label><select value={draft.pageSize} onChange={(e) => setDraft({ ...draft, pageSize: e.target.value as LabelPageSize })} className="mt-1 w-full rounded border px-2 py-1.5">{Object.values(LabelPageSize).map((p) => <option key={p} value={p}>{LabelPageSizeLabel[p]}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-2"><div><label className="text-xs">Genişlik (mm)</label><input type="number" value={draft.widthMm} onChange={(e) => setDraft({ ...draft, widthMm: Number(e.target.value) })} className="mt-1 w-full rounded border px-2 py-1.5" /></div><div><label className="text-xs">Yükseklik (mm)</label><input type="number" value={draft.heightMm} onChange={(e) => setDraft({ ...draft, heightMm: Number(e.target.value) })} className="mt-1 w-full rounded border px-2 py-1.5" /></div></div>
            </div>
            <div className="mt-3 flex justify-end gap-2"><button onClick={() => setShowNew(false)} className="rounded border px-3 py-1.5 text-sm">İptal</button><button onClick={onCreate} disabled={!draft.name || createMut.isPending} className="rounded bg-primary px-3 py-1.5 text-sm text-on-primary">Oluştur</button></div>
          </div>
        </div>
      )}

      <ConfirmModal open={!!confirmDel} title="Şablon Silinsin mi?" confirmText="Sil" variant="danger" onClose={() => setConfirmDel(null)} onConfirm={async () => { if (confirmDel) { await delMut.mutateAsync(confirmDel); setConfirmDel(null); } }} />
    </div>
  );
}
