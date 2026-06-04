import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Trash2, Play, CheckCircle2, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useVisitPlans, useDeletePlan, useUpdatePlanStatus, useCheckin } from '@/features/visits/api';
import { VisitPlanStatus, VisitPlanStatusLabel, VisitStatus, VisitStatusLabel, VisitStatusColor, formatDate } from '@saas/shared';
const STATUS_BG: Record<string, string> = { gray: 'bg-gray-200 text-gray-700', blue: 'bg-blue-100 text-blue-800', green: 'bg-green-100 text-green-800', amber: 'bg-amber-100 text-amber-800', red: 'bg-red-100 text-red-800' };
const PLAN_STATUS_BG: Record<string, string> = { DRAFT: 'bg-gray-200 text-gray-700', ACTIVE: 'bg-blue-100 text-blue-800', COMPLETED: 'bg-green-100 text-green-800', CANCELLED: 'bg-red-100 text-red-800' };

export function VisitsPlansPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useVisitPlans();
  const delMut = useDeletePlan();
  const toggleMut = useUpdatePlanStatus();
  const checkMut = useCheckin();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [checking, setChecking] = useState<string | null>(null);

  const doCheckIn = async (planId: string) => {
    if (!navigator.geolocation) { alert('Tarayıcı GPS desteklemiyor'); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        // İlk müşteriyi check-in
        const plan = ((data as any)?.items ?? []).find((p: any) => p.id === planId);
        const firstCustomer = plan?.customers?.[0];
        if (!firstCustomer) { alert('Planda müşteri yok'); return; }
        await checkMut.mutateAsync({ planId, customerId: firstCustomer.id, type: 'CHECK_IN', latitude: pos.coords.latitude, longitude: pos.coords.longitude, address: 'GPS konumu' });
        setChecking(null);
        alert('Check-in başarılı');
      },
      (err) => alert('GPS hatası: ' + err.message),
    );
  };

  const columns: DataTableColumn<any>[] = [
    { key: 'name', label: 'Plan', render: (p) => <div><p className="font-semibold text-sm">{p.name}</p>{p.region && <p className="text-xs text-on-surface-variant">{p.region}</p>}</div> },
    { key: 'date', label: 'Tarih', width: '110px', render: (p) => formatDate(p.planDate) },
    { key: 'progress', label: 'İlerleme', width: '130px', render: (p) => <div><p className="text-xs">{p.visitedCount}/{p.totalCustomers} ziyaret</p><div className="mt-1 h-1.5 w-20 rounded-full bg-surface-variant"><div className="h-full rounded-full bg-green-500" style={{ width: `${p.totalCustomers > 0 ? (p.visitedCount / p.totalCustomers) * 100 : 0}%` }} /></div></div> },
    { key: 'status', label: 'Durum', width: '110px', render: (p) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PLAN_STATUS_BG[p.status]}`}>{VisitPlanStatusLabel[p.status as keyof typeof VisitPlanStatusLabel]}</span> },
    {
      key: 'actions', label: '', width: '160px', render: (p) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {p.status === 'DRAFT' && <button onClick={() => toggleMut.mutate({ id: p.id, status: VisitPlanStatus.ACTIVE })} className="rounded p-1 text-green-600 hover:bg-green-50" title="Aktifleştir"><Play className="h-4 w-4" /></button>}
          {p.status === 'ACTIVE' && <button onClick={() => doCheckIn(p.id)} className="rounded p-1 text-blue-600 hover:bg-blue-50" title="Check-in"><MapPin className="h-4 w-4" /></button>}
          {p.status === 'ACTIVE' && <button onClick={() => toggleMut.mutate({ id: p.id, status: VisitPlanStatus.COMPLETED })} className="rounded p-1 text-green-600 hover:bg-green-50" title="Tamamla"><CheckCircle2 className="h-4 w-4" /></button>}
          <button onClick={() => setConfirmDelete(p.id)} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Ziyaret Planları" description="Saha satış rotaları"
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate('/visits/report')} className="rounded-md border border-outline px-3 py-2 text-sm">Performans Raporu</button>
            <button onClick={() => navigate('/visits/plans/new')} className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Plus className="h-4 w-4" /> Yeni Plan</button>
          </div>
        }
      />

      {isLoading ? <LoadingState /> : !data || data.items.length === 0 ? (
        <EmptyState icon={<MapPin className="h-12 w-12" />} title="Henüz plan yok" action={<button onClick={() => navigate('/visits/plans/new')} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">İlk Plan</button>} />
      ) : (
        <DataTable columns={columns} data={data.items} rowKey={(p) => p.id} onRowClick={(p) => navigate(`/visits/plans/${p.id}`)} />
      )}

      <ConfirmModal open={!!confirmDelete} title="Plan Silinsin mi?" confirmText="Sil" variant="danger" onClose={() => setConfirmDelete(null)} onConfirm={async () => { if (confirmDelete) { await delMut.mutateAsync(confirmDelete); setConfirmDelete(null); } }} />
    </div>
  );
}
