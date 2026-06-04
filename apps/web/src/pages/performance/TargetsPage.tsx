import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Plus, RefreshCw, Trash2, ChevronRight, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useTargets, useDeleteTarget, useSnapshotAll, usePerformanceDashboard } from '@/features/performance/api';
import { TargetTypeLabel, TargetStatusLabel, TargetStatusColor, TargetPeriodLabel, formatDate } from '@saas/shared';
const COLOR_BG: Record<string, string> = { blue: 'bg-blue-100 text-blue-800', green: 'bg-green-100 text-green-800', red: 'bg-red-100 text-red-800', amber: 'bg-amber-100 text-amber-800', gray: 'bg-gray-200 text-gray-700' };

export function TargetsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useTargets();
  const { data: dashboard } = usePerformanceDashboard();
  const delMut = useDeleteTarget();
  const snapshotMut = useSnapshotAll();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const columns: DataTableColumn<any>[] = [
    { key: 'name', label: 'Hedef', render: (t) => <div><p className="font-semibold text-sm">{t.name}</p><p className="text-xs text-on-surface-variant">{t.assigneeName ?? t.assigneeId}</p></div> },
    { key: 'type', label: 'Tip', width: '140px', render: (t) => <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{TargetTypeLabel[t.type as keyof typeof TargetTypeLabel]}</span> },
    { key: 'period', label: 'Dönem', width: '90px', hideOnMobile: true, render: (t) => TargetPeriodLabel[t.period as keyof typeof TargetPeriodLabel] },
    { key: 'progress', label: 'Gerçekleşme', width: '180px', render: (t) => (
      <div>
        <div className="flex items-center justify-between text-xs"><span>{Number(t.achievedValue).toLocaleString('tr-TR')} / {Number(t.targetValue).toLocaleString('tr-TR')} {t.currency}</span><span className="font-bold">{t.achievementRate.toFixed(0)}%</span></div>
        <div className="mt-1 h-1.5 rounded-full bg-surface-variant"><div className={`h-full rounded-full ${t.achievementRate >= 100 ? 'bg-green-500' : t.achievementRate >= 50 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, t.achievementRate)}%` }} /></div>
      </div>
    ) },
    { key: 'status', label: 'Durum', width: '100px', render: (t) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_BG[TargetStatusColor[t.status as keyof typeof TargetStatusColor]]}`}>{TargetStatusLabel[t.status as keyof typeof TargetStatusLabel]}</span> },
    {
      key: 'actions', label: '', width: '70px', render: (t) => (
        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(t.id); }} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Hedefler & Performans" description="Personel, ekip ve şube hedefleri"
        actions={
          <div className="flex gap-2">
            <button onClick={() => snapshotMut.mutate()} disabled={snapshotMut.isPending} className="flex items-center gap-1 rounded-md border border-outline px-3 py-2 text-sm"><RefreshCw className={`h-4 w-4 ${snapshotMut.isPending ? 'animate-spin' : ''}`} /> Snapshot Al</button>
            <button onClick={() => navigate('/performance/commissions')} className="flex items-center gap-1 rounded-md border border-outline px-3 py-2 text-sm"><DollarSign className="h-4 w-4" /> Prim Kuralları</button>
            <button onClick={() => navigate('/performance/targets/new')} className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Plus className="h-4 w-4" /> Yeni Hedef</button>
          </div>
        }
      />

      {dashboard && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-outline-variant bg-surface p-3"><p className="text-xs text-on-surface-variant">Toplam Hedef</p><p className="text-2xl font-bold">{dashboard.total}</p></div>
          <div className="rounded-lg border border-blue-300 bg-blue-50 p-3"><p className="text-xs text-on-surface-variant">Aktif</p><p className="text-2xl font-bold text-blue-600">{dashboard.active}</p></div>
          <div className="rounded-lg border border-green-300 bg-green-50 p-3"><p className="text-xs text-on-surface-variant">Tamamlanan</p><p className="text-2xl font-bold text-green-600">{dashboard.completed}</p></div>
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3"><p className="text-xs text-on-surface-variant">Ort. Gerçekleşme</p><p className="text-2xl font-bold text-amber-600">{dashboard.avgAchievement.toFixed(0)}%</p></div>
        </div>
      )}

      {isLoading ? <LoadingState /> : !data || data.items.length === 0 ? (
        <EmptyState icon={<Target className="h-12 w-12" />} title="Henüz hedef yok" action={<button onClick={() => navigate('/performance/targets/new')} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">İlk Hedef</button>} />
      ) : <DataTable columns={columns} data={data.items} rowKey={(t) => t.id} />}

      <ConfirmModal open={!!confirmDelete} title="Hedef Silinsin mi?" confirmText="Sil" variant="danger" onClose={() => setConfirmDelete(null)} onConfirm={async () => { if (confirmDelete) { await delMut.mutateAsync(confirmDelete); setConfirmDelete(null); } }} />
    </div>
  );
}
