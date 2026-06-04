import { useState } from 'react';
import { Users, Plus, RefreshCw, Trash2, Edit, Filter, Zap } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useCustomerSegments, useCreateSegment, useDeleteSegment, useRefreshSegment } from '@/features/ux-bulk/api';
import { SegmentType, SegmentTypeLabel, formatDate } from '@saas/shared';

export function SegmentsPage() {
  const { data, isLoading } = useCustomerSegments();
  const createMut = useCreateSegment();
  const delMut = useDeleteSegment();
  const refreshMut = useRefreshSegment();
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState<{ name: string; description: string; type: SegmentType; color: string; icon: string }>({ name: '', description: '', type: SegmentType.MANUAL, color: 'blue', icon: '👥' });
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const onCreate = async () => { await createMut.mutateAsync({ ...draft, rules: [] }); setShowNew(false); setDraft({ name: '', description: '', type: SegmentType.MANUAL, color: 'blue', icon: '👥' }); };

  const columns: DataTableColumn<any>[] = [
    { key: 'name', label: 'Segment', render: (s) => <div className="flex items-center gap-2"><span className="text-xl">{s.icon}</span><div><p className="font-semibold">{s.name}</p><p className="text-xs text-on-surface-variant">{s.description}</p></div></div> },
    { key: 'type', label: 'Tip', render: (s) => <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${s.type === 'AUTOMATIC' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>{s.type === 'AUTOMATIC' ? <Zap className="h-3 w-3" /> : <Filter className="h-3 w-3" />} {SegmentTypeLabel[s.type as keyof typeof SegmentTypeLabel]}</span> },
    { key: 'members', label: 'Üye', align: 'right', render: (s) => <span className="font-semibold">{s.memberCount ?? 0}</span> },
    { key: 'refresh', label: 'Son Yenileme', hideOnMobile: true, render: (s) => s.lastRefreshAt ? formatDate(s.lastRefreshAt) : '—' },
    { key: 'actions', label: '', width: '140px', render: (s) => (
      <div className="flex gap-1">
        {s.type === 'AUTOMATIC' && <button onClick={(e) => { e.stopPropagation(); refreshMut.mutate(s.id); }} className="rounded p-1 text-blue-600 hover:bg-blue-50" title="Yenile"><RefreshCw className="h-4 w-4" /></button>}
        <button onClick={(e) => { e.stopPropagation(); setConfirmDel(s.id); }} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Müşteri Segmentleri" description="Manuel veya otomatik müşteri grupları" actions={<button onClick={() => setShowNew(true)} className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Plus className="h-4 w-4" /> Yeni Segment</button>} />

      {isLoading ? <LoadingState /> : !data || data.length === 0 ? <EmptyState icon={<Users className="h-12 w-12" />} title="Henüz segment yok" action={<button onClick={() => setShowNew(true)} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">İlk Segmenti Oluştur</button>} /> : <DataTable columns={columns} data={data} rowKey={(s) => s.id} />}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-md rounded-lg border border-outline bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-3 text-lg font-semibold">Yeni Segment</h2>
            <div className="space-y-2 text-sm">
              <div><label className="text-xs">Ad</label><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="mt-1 w-full rounded border px-2 py-1.5" /></div>
              <div><label className="text-xs">Açıklama</label><input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="mt-1 w-full rounded border px-2 py-1.5" /></div>
              <div><label className="text-xs">Tip</label><select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as SegmentType })} className="mt-1 w-full rounded border px-2 py-1.5">{Object.values(SegmentType).map((t) => <option key={t} value={t}>{SegmentTypeLabel[t]}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-2"><div><label className="text-xs">İkon (emoji)</label><input value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} className="mt-1 w-full rounded border px-2 py-1.5" /></div><div><label className="text-xs">Renk</label><input value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} className="mt-1 w-full rounded border px-2 py-1.5" /></div></div>
            </div>
            <div className="mt-3 flex justify-end gap-2"><button onClick={() => setShowNew(false)} className="rounded border px-3 py-1.5 text-sm">İptal</button><button onClick={onCreate} disabled={!draft.name || createMut.isPending} className="rounded bg-primary px-3 py-1.5 text-sm text-on-primary">Oluştur</button></div>
          </div>
        </div>
      )}

      <ConfirmModal open={!!confirmDel} title="Segment Silinsin mi?" confirmText="Sil" variant="danger" onClose={() => setConfirmDel(null)} onConfirm={async () => { if (confirmDel) { await delMut.mutateAsync(confirmDel); setConfirmDel(null); } }} />
    </div>
  );
}
