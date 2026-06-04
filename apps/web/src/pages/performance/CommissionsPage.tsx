import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Plus, Trash2, Play } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useCommissionRules, useDeleteCommissionRule, useCalculateCommission, useCommissionLogs, useTargets } from '@/features/performance/api';
import { TargetTypeLabel, CommissionTypeLabel, formatDateTime } from '@saas/shared';

export function CommissionsPage() {
  const navigate = useNavigate();
  const { data: rules = [], refetch } = useCommissionRules();
  const { data: logs = [] } = useCommissionLogs({ pageSize: 30 });
  const { data: targets = [] } = useTargets();
  const delMut = useDeleteCommissionRule();
  const calcMut = useCalculateCommission();
  const [tab, setTab] = useState<'rules' | 'logs'>('rules');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const ruleCols: DataTableColumn<any>[] = [
    { key: 'name', label: 'Kural', render: (r) => <span className="font-semibold text-sm">{r.name}</span> },
    { key: 'type', label: 'Tip', width: '140px', render: (r) => (TargetTypeLabel as any)[r.targetType] },
    { key: 'commissionType', label: 'Prim Tipi', width: '120px', render: (r) => (CommissionTypeLabel as any)[r.commissionType] },
    { key: 'min', label: 'Min. Gerçekleşme', width: '150px', align: 'right', render: (r) => `%${r.minAchievementRate}` },
    { key: 'isActive', label: 'Durum', width: '90px', render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs ${r.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{r.isActive ? 'Aktif' : 'Pasif'}</span> },
    { key: 'actions', label: '', width: '70px', render: (r) => (
      <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(r.id); }} className="rounded p-1 text-red-600"><Trash2 className="h-4 w-4" /></button>
    ) },
  ];

  const logCols: DataTableColumn<any>[] = [
    { key: 'user', label: 'Kullanıcı', render: (l) => l.userName ?? l.userId },
    { key: 'period', label: 'Dönem', width: '120px' },
    { key: 'rate', label: 'Gerçekleşme', width: '120px', align: 'right', render: (l) => `%${l.achievementRate.toFixed(0)}` },
    { key: 'base', label: 'Taban', width: '110px', align: 'right', render: (l) => `${Number(l.baseAmount).toLocaleString('tr-TR')}` },
    { key: 'final', label: 'Prim', width: '110px', align: 'right', render: (l) => <span className="font-semibold text-green-600">{Number(l.finalAmount).toLocaleString('tr-TR')} TL</span> },
    { key: 'status', label: 'Durum', width: '110px', render: (l) => <span className={`rounded-full px-2 py-0.5 text-xs ${l.status === 'PAID' ? 'bg-green-100 text-green-800' : l.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{l.status}</span> },
    { key: 'date', label: 'Tarih', width: '140px', hideOnMobile: true, render: (l) => formatDateTime(l.calculatedAt) },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Prim Hesaplama" description="Kurallar, hesaplamalar ve ödemeler"
        actions={
          <div className="flex gap-2">
            <button onClick={() => setTab('rules')} className={`rounded-md px-3 py-1.5 text-sm ${tab === 'rules' ? 'bg-primary text-on-primary' : 'border border-outline'}`}>Kurallar ({rules.length})</button>
            <button onClick={() => setTab('logs')} className={`rounded-md px-3 py-1.5 text-sm ${tab === 'logs' ? 'bg-primary text-on-primary' : 'border border-outline'}`}>Hesaplamalar ({logs.total ?? 0})</button>
          </div>
        }
      />

      {tab === 'rules' ? (
        rules.length === 0 ? <EmptyState icon={<DollarSign className="h-12 w-12" />} title="Prim kuralı yok" /> : <DataTable columns={ruleCols} data={rules} rowKey={(r) => r.id} />
      ) : (
        logs.items?.length === 0 ? <EmptyState title="Hesaplama yok" /> : <DataTable columns={logCols} data={logs.items ?? []} rowKey={(l) => l.id} />
      )}

      <ConfirmModal open={!!confirmDelete} title="Kural Silinsin mi?" confirmText="Sil" variant="danger" onClose={() => setConfirmDelete(null)} onConfirm={async () => { if (confirmDelete) { await delMut.mutateAsync(confirmDelete); setConfirmDelete(null); refetch(); } }} />
    </div>
  );
}
