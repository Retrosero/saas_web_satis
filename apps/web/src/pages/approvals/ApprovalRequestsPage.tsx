import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Filter, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { useRequests } from '@/features/approvals/api';
import { ApprovalRequestStatusLabel, ApprovalRequestStatusColor, ApprovalTriggerTypeLabel, ApprovalPriorityLabel, ApprovalPriorityColor, formatDateTime, type ApprovalRequest } from '@saas/shared';

const COLOR_BG: Record<string, string> = {
  amber: 'bg-amber-100 text-amber-800', green: 'bg-green-100 text-green-800', red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-200 text-gray-700', blue: 'bg-blue-100 text-blue-800',
};

export function ApprovalRequestsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(''); const [triggerType, setTriggerType] = useState(''); const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useRequests({ status: status || undefined, triggerType: triggerType || undefined, page, pageSize: 30 });

  const columns: DataTableColumn<ApprovalRequest>[] = [
    { key: 'createdAt', label: 'Tarih', width: '140px', render: (r) => formatDateTime(r.createdAt) },
    { key: 'entityLabel', label: 'Konu', render: (r) => <div><p className="font-semibold text-sm">{r.entityLabel}</p>{r.entityNumber && <p className="text-xs text-on-surface-variant">{r.entityNumber}</p>}</div> },
    { key: 'triggerType', label: 'Tetik', width: '150px', render: (r) => <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{ApprovalTriggerTypeLabel[r.triggerType]}</span> },
    { key: 'requester', label: 'Talep Eden', width: '130px', hideOnMobile: true, render: (r) => r.requesterName ?? r.requesterId },
    { key: 'amount', label: 'Tutar', width: '120px', align: 'right', hideOnMobile: true, render: (r) => r.amount ? `${r.amount.toLocaleString('tr-TR')} ${r.amountCurrency ?? 'TRY'}` : '—' },
    { key: 'step', label: 'Adım', width: '70px', align: 'right', render: (r) => `${r.currentStep}/${r.totalSteps}` },
    { key: 'priority', label: 'Öncelik', width: '90px', render: (r) => <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${COLOR_BG[ApprovalPriorityColor[r.priority]]}`}>{ApprovalPriorityLabel[r.priority]}</span> },
    { key: 'status', label: 'Durum', width: '110px', render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_BG[ApprovalRequestStatusColor[r.status]]}`}>{ApprovalRequestStatusLabel[r.status]}</span> },
  ];

  if (error) return <ErrorState message="İstekler yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader title="Tüm Onay İstekleri" description="Tüm kurallardan gelen istekler" actions={<button onClick={() => refetch()} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><RefreshCw className="h-4 w-4" /> Yenile</button>} />

      <div className="flex flex-wrap gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm">
          <option value="">Tüm Durumlar</option>
          {Object.entries(ApprovalRequestStatusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={triggerType} onChange={(e) => setTriggerType(e.target.value)} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm">
          <option value="">Tüm Tetikler</option>
          {Object.entries(ApprovalTriggerTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {isLoading ? <LoadingState /> : !data || data.items.length === 0 ? (
        <EmptyState icon={<FileText className="h-12 w-12" />} title="İstek bulunamadı" />
      ) : (
        <>
          <DataTable<ApprovalRequest> columns={columns} data={data.items} rowKey={(r) => r.id} onRowClick={(r) => navigate(`/approvals/requests/${r.id}`)} />
          <MobileCardList<ApprovalRequest> data={data.items} keyFn={(r) => r.id} onItemClick={(r) => navigate(`/approvals/requests/${r.id}`)} header={(r) => r.entityLabel} subtitle={(r) => `${ApprovalTriggerTypeLabel[r.triggerType]} • ${r.requesterName ?? r.requesterId}`} rightBadge={(_r) => <span className={`rounded-full px-2 py-0.5 text-xs ${COLOR_BG[ApprovalRequestStatusColor[_r.status]]}`}>{ApprovalRequestStatusLabel[_r.status]}</span>} footer={(r) => <span className="text-xs text-on-surface-variant">{formatDateTime(r.createdAt)} • Adım {r.currentStep}/{r.totalSteps}</span>} />
          <div className="flex items-center justify-between rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm">
            <p>Toplam: {data.total} istek</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded border border-outline px-2 py-1 disabled:opacity-40">Önceki</button>
              <span className="px-2 py-1">{page} / {Math.max(1, Math.ceil(data.total / data.pageSize))}</span>
              <button onClick={() => setPage(page + 1)} disabled={page * data.pageSize >= data.total} className="rounded border border-outline px-2 py-1 disabled:opacity-40">Sonraki</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
