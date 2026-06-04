import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, X, Eye, FileText, CheckCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useResults, useAcknowledgeResult, useFixResult, useIgnoreResult, useBulkAction } from '@/features/audit/api';
import { DataCheckTypeLabel, DataCheckTypeIcon, DataCheckSeverityLabel, DataCheckSeverityColor, DataCheckResultStatusLabel, DataCheckResultStatusColor, formatDateTime, type DataCheckResult } from '@saas/shared';

const COLOR_BG: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800', gray: 'bg-gray-200 text-gray-700', amber: 'bg-amber-100 text-amber-800',
  orange: 'bg-orange-100 text-orange-800', red: 'bg-red-100 text-red-800', green: 'bg-green-100 text-green-800', purple: 'bg-purple-100 text-purple-800',
};

export function AuditResultsPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState(''); const [severity, setSeverity] = useState(''); const [checkType, setCheckType] = useState(''); const [page, setPage] = useState(1);
  const [ignoreTarget, setIgnoreTarget] = useState<DataCheckResult | null>(null);
  const [ignoreReason, setIgnoreReason] = useState('');
  const { data, isLoading, error, refetch } = useResults({ status: status || undefined, severity: severity || undefined, checkType: checkType || undefined, page, pageSize: 30 });
  const ackMut = useAcknowledgeResult();
  const fixMut = useFixResult();
  const ignoreMut = useIgnoreResult();
  const bulkMut = useBulkAction();

  const toggleSelect = (id: string) => {
    const n = new Set(selected);
    if (n.has(id)) n.delete(id); else n.add(id);
    setSelected(n);
  };

  const columns: DataTableColumn<DataCheckResult>[] = [
    {
      key: 'select', label: '', width: '40px', render: (r) => (
        <input type="checkbox" checked={selected.has(r.id)} onChange={(e) => { e.stopPropagation(); toggleSelect(r.id); }} />
      ),
    },
    { key: 'severity', label: 'Ciddiyet', width: '90px', render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_BG[DataCheckSeverityColor[r.severity]]}`}>{DataCheckSeverityLabel[r.severity]}</span> },
    { key: 'checkType', label: 'Kontrol', width: '150px', render: (r) => <span className="flex items-center gap-1 text-xs">{DataCheckTypeIcon[r.checkType]} {DataCheckTypeLabel[r.checkType]}</span> },
    { key: 'entityLabel', label: 'Konu', render: (r) => <div><p className="font-semibold text-sm">{r.entityLabel}</p><p className="text-xs text-on-surface-variant">{r.description}</p></div> },
    { key: 'createdAt', label: 'Tarih', width: '140px', hideOnMobile: true, render: (r) => formatDateTime(r.createdAt) },
    { key: 'status', label: 'Durum', width: '130px', render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_BG[DataCheckResultStatusColor[r.status]]}`}>{DataCheckResultStatusLabel[r.status]}</span> },
    {
      key: 'actions', label: '', width: '160px', render: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {r.status === 'OPEN' && <button onClick={() => ackMut.mutate(r.id)} className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50" title="İnceleniyor"><CheckCheck className="h-4 w-4" /></button>}
          <button onClick={async () => { await fixMut.mutateAsync({ id: r.id }); }} className="rounded-md p-1.5 text-green-600 hover:bg-green-50" title="Çözüldü"><CheckCircle2 className="h-4 w-4" /></button>
          <button onClick={() => setIgnoreTarget(r)} className="rounded-md p-1.5 text-gray-600 hover:bg-gray-50" title="Yok Say"><X className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message="Bulgular yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader title="Bulgular" description="Tüm kontrol bulguları"
        actions={
          <div className="flex gap-2">
            {selected.size > 0 && (
              <>
                <button onClick={async () => { await bulkMut.mutateAsync({ ids: Array.from(selected), action: 'acknowledge' }); setSelected(new Set()); }} className="rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white">{selected.size} İnceleniyor</button>
                <button onClick={async () => { await bulkMut.mutateAsync({ ids: Array.from(selected), action: 'fix' }); setSelected(new Set()); }} className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white">{selected.size} Çözüldü</button>
                <button onClick={async () => { await bulkMut.mutateAsync({ ids: Array.from(selected), action: 'ignore', note: 'Toplu yok sayma' }); setSelected(new Set()); }} className="rounded-md bg-gray-600 px-3 py-2 text-sm font-medium text-white">{selected.size} Yok Say</button>
              </>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm">
          <option value="">Tüm Durumlar</option>
          {Object.entries(DataCheckResultStatusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm">
          <option value="">Tüm Ciddiyetler</option>
          {Object.entries(DataCheckSeverityLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={checkType} onChange={(e) => setCheckType(e.target.value)} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm">
          <option value="">Tüm Kontroller</option>
          {Object.entries(DataCheckTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {isLoading ? <LoadingState /> : !data || data.items.length === 0 ? (
        <EmptyState icon={<FileText className="h-12 w-12" />} title="Bulgu yok" description="Filtreleri değiştirin veya yeni kontrol çalıştırın" />
      ) : (
        <>
          <DataTable<DataCheckResult> columns={columns} data={data.items} rowKey={(r) => r.id} onRowClick={(r) => navigate(`/audit/results/${r.id}`)} />
          <MobileCardList<DataCheckResult> data={data.items} keyFn={(r) => r.id} onItemClick={(r) => navigate(`/audit/results/${r.id}`)} header={(r) => r.entityLabel} subtitle={(r) => r.description} rightBadge={(_r) => <span className={`rounded-full px-2 py-0.5 text-[10px] ${COLOR_BG[DataCheckSeverityColor[_r.severity]]}`}>{_r.severity}</span>} footer={(r) => <span className="text-xs text-on-surface-variant">{formatDateTime(r.createdAt)}</span>} />
          <div className="flex items-center justify-between rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm">
            <p>Toplam: {data.total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded border border-outline px-2 py-1 disabled:opacity-40">Önceki</button>
              <span className="px-2 py-1">{page} / {Math.max(1, Math.ceil(data.total / data.pageSize))}</span>
              <button onClick={() => setPage(page + 1)} disabled={page * data.pageSize >= data.total} className="rounded border border-outline px-2 py-1 disabled:opacity-40">Sonraki</button>
            </div>
          </div>
        </>
      )}

      <ConfirmModal open={!!ignoreTarget} title="Yok Sayılsın mı?" description={`${ignoreTarget?.entityLabel ?? ''} — sebep girin:`} confirmText="Yok Say" variant="warning" onClose={() => { setIgnoreTarget(null); setIgnoreReason(''); }} onConfirm={async () => { if (ignoreTarget && ignoreReason) { await ignoreMut.mutateAsync({ id: ignoreTarget.id, reason: ignoreReason }); setIgnoreTarget(null); setIgnoreReason(''); } }} />
    </div>
  );
}
