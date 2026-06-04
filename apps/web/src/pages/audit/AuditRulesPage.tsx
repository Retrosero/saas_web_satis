import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Plus, Pencil, Trash2, Power, Copy, Play, ListChecks } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useRules, useDeleteRule, useToggleRule, useCloneRule, useRunRule } from '@/features/audit/api';
import { DataCheckTypeLabel, DataCheckTypeIcon, DataCheckSeverityLabel, DataCheckSeverityColor, formatDateTime, type DataCheckRule } from '@saas/shared';

const COLOR_BG: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800', gray: 'bg-gray-200 text-gray-700', amber: 'bg-amber-100 text-amber-800',
  orange: 'bg-orange-100 text-orange-800', red: 'bg-red-100 text-red-800',
};

export function AuditRulesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState(''); const [filterType, setFilterType] = useState(''); const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<DataCheckRule | null>(null);
  const { data: rules = [], isLoading, error, refetch } = useRules({ search, checkType: filterType || undefined, isActive: filterActive });
  const delMut = useDeleteRule();
  const toggleMut = useToggleRule();
  const cloneMut = useCloneRule();
  const runMut = useRunRule();

  const columns: DataTableColumn<DataCheckRule>[] = [
    { key: 'name', label: 'Kural', render: (r) => <div className="flex items-center gap-2"><span className="text-xl">{DataCheckTypeIcon[r.checkType]}</span><div><p className="font-semibold text-sm">{r.name}</p>{r.description && <p className="text-xs text-on-surface-variant truncate max-w-[280px]">{r.description}</p>}</div></div> },
    { key: 'checkType', label: 'Kontrol Tipi', width: '170px', render: (r) => DataCheckTypeLabel[r.checkType] },
    { key: 'severity', label: 'Ciddiyet', width: '100px', render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_BG[DataCheckSeverityColor[r.severity]]}`}>{DataCheckSeverityLabel[r.severity]}</span> },
    { key: 'lastResultCount', label: 'Son Bulgu', width: '90px', align: 'right', hideOnMobile: true, render: (r) => r.lastResultCount },
    { key: 'runCount', label: 'Çalıştırma', width: '100px', align: 'right', hideOnMobile: true, render: (r) => r.runCount },
    { key: 'lastRunAt', label: 'Son', width: '140px', hideOnMobile: true, render: (r) => r.lastRunAt ? formatDateTime(r.lastRunAt) : '—' },
    { key: 'isActive', label: 'Durum', width: '80px', render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{r.isActive ? 'Aktif' : 'Pasif'}</span> },
    {
      key: 'actions', label: '', width: '200px', render: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => runMut.mutate(r.id)} className="rounded-md p-1.5 text-green-600 hover:bg-green-50" title="Çalıştır"><Play className="h-4 w-4" /></button>
          <button onClick={() => navigate(`/audit/rules/${r.id}/edit`)} className="rounded-md p-1.5 text-primary hover:bg-primary-container/40" title="Düzenle"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => cloneMut.mutate(r.id)} className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50" title="Klonla"><Copy className="h-4 w-4" /></button>
          <button onClick={() => toggleMut.mutate(r.id)} className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50" title="Aktif/Pasif"><Power className="h-4 w-4" /></button>
          <button onClick={() => setConfirmDelete(r)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50" title="Sil"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message="Kurallar yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader title="Denetim Kuralları" description="18 hazır kontrol tipi"
        actions={<button onClick={() => navigate('/audit/rules/new')} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Plus className="h-4 w-4" /> Yeni Kural</button>}
      />

      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kural adı..." className="rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm">
          <option value="">Tüm Kontroller</option>
          {Object.entries(DataCheckTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterActive === undefined ? '' : String(filterActive)} onChange={(e) => setFilterActive(e.target.value === '' ? undefined : e.target.value === 'true')} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm">
          <option value="">Tüm Durumlar</option><option value="true">Aktif</option><option value="false">Pasif</option>
        </select>
      </div>

      {isLoading ? <LoadingState /> : rules.length === 0 ? (
        <EmptyState icon={<ListChecks className="h-12 w-12" />} title="Henüz kural yok" action={<button onClick={() => navigate('/audit/rules/new')} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">Yeni Kural</button>} />
      ) : <DataTable<DataCheckRule> columns={columns} data={rules} rowKey={(r) => r.id} onRowClick={(r) => navigate(`/audit/rules/${r.id}/edit`)} />}

      <ConfirmModal open={!!confirmDelete} title="Kural Silinsin mi?" description={`${confirmDelete?.name} silinecek.`} confirmText="Sil" variant="danger" onClose={() => setConfirmDelete(null)} onConfirm={async () => { if (confirmDelete) { await delMut.mutateAsync(confirmDelete.id); setConfirmDelete(null); } }} />
    </div>
  );
}
