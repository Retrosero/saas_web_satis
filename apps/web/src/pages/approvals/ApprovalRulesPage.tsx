import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Plus, Pencil, Trash2, Power, ListChecks, Play, Settings } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useRules, useDeleteRule, useToggleRule } from '@/features/approvals/api';
import { ApprovalTriggerTypeLabel, ApprovalModeLabel, formatDateTime, type ApprovalRule } from '@saas/shared';

export function ApprovalRulesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState(''); const [filterType, setFilterType] = useState(''); const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<ApprovalRule | null>(null);
  const { data: rules = [], isLoading, error, refetch } = useRules({ search, triggerType: filterType || undefined, isActive: filterActive });
  const delMut = useDeleteRule();
  const toggleMut = useToggleRule();

  const columns: DataTableColumn<ApprovalRule>[] = [
    { key: 'name', label: 'Kural', render: (r) => <div><p className="font-semibold text-sm">{r.name}</p>{r.description && <p className="text-xs text-on-surface-variant truncate max-w-[280px]">{r.description}</p>}</div> },
    { key: 'triggerType', label: 'Tetik', width: '160px', render: (r) => <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{ApprovalTriggerTypeLabel[r.triggerType]}</span> },
    { key: 'mode', label: 'Mod', width: '90px', hideOnMobile: true, render: (r) => ApprovalModeLabel[r.mode] },
    { key: 'steps', label: 'Adım', width: '70px', align: 'right', render: (r) => r.steps.length },
    { key: 'amountThreshold', label: 'Eşik', width: '110px', hideOnMobile: true, render: (r) => r.amountThreshold ? `${r.amountThreshold.toLocaleString('tr-TR')} TRY` : '—' },
    { key: 'triggerCount', label: 'Tetik', width: '70px', align: 'right', hideOnMobile: true, render: (r) => r.triggerCount },
    { key: 'isActive', label: 'Durum', width: '80px', render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{r.isActive ? 'Aktif' : 'Pasif'}</span> },
    {
      key: 'actions', label: '', width: '140px', render: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => navigate(`/approvals/rules/${r.id}/edit`)} className="rounded-md p-1.5 text-primary hover:bg-primary-container/40"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => toggleMut.mutate(r.id)} className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50"><Power className="h-4 w-4" /></button>
          <button onClick={() => setConfirmDelete(r)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message="Kurallar yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader title="Onay Kuralları" description="Tetik ve adım tanımları"
        actions={<button onClick={() => navigate('/approvals/rules/new')} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Plus className="h-4 w-4" /> Yeni Kural</button>}
      />

      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kural adı..." className="rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm">
          <option value="">Tüm Tetikler</option>
          {Object.entries(ApprovalTriggerTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterActive === undefined ? '' : String(filterActive)} onChange={(e) => setFilterActive(e.target.value === '' ? undefined : e.target.value === 'true')} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm">
          <option value="">Tüm Durumlar</option><option value="true">Aktif</option><option value="false">Pasif</option>
        </select>
      </div>

      {isLoading ? <LoadingState /> : rules.length === 0 ? (
        <EmptyState icon={<ListChecks className="h-12 w-12" />} title="Henüz kural yok" action={<button onClick={() => navigate('/approvals/rules/new')} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">Yeni Kural</button>} />
      ) : <DataTable<ApprovalRule> columns={columns} data={rules} rowKey={(r) => r.id} onRowClick={(r) => navigate(`/approvals/rules/${r.id}/edit`)} />}

      <ConfirmModal open={!!confirmDelete} title="Kural Silinsin mi?" description={`${confirmDelete?.name} silinecek.`} confirmText="Sil" variant="danger" onClose={() => setConfirmDelete(null)} onConfirm={async () => { if (confirmDelete) { await delMut.mutateAsync(confirmDelete.id); setConfirmDelete(null); } }} />
    </div>
  );
}
