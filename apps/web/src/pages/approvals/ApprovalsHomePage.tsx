import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ClipboardCheck, ListChecks, FileText, Inbox, Plus, Filter, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { useMyPending, useRequests, useActOnRequest, useApprovalStats } from '@/features/approvals/api';
import { ApprovalRequestStatusLabel, ApprovalRequestStatusColor, ApprovalTriggerTypeLabel, ApprovalPriorityLabel, ApprovalPriorityColor, formatDateTime, type ApprovalRequest } from '@saas/shared';

const COLOR_BG: Record<string, string> = {
  amber: 'bg-amber-100 text-amber-800', green: 'bg-green-100 text-green-800', red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-200 text-gray-700', blue: 'bg-blue-100 text-blue-800',
};

export function ApprovalsHomePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'pending' | 'all' | 'mine'>('pending');
  const { data: pending = [], isLoading: pl } = useMyPending();
  const { data: allData } = useRequests({ pageSize: 20 });
  const { data: stats } = useApprovalStats();
  const actMut = useActOnRequest();

  const renderRow = (r: ApprovalRequest) => (
    <div key={r.id} className="rounded-lg border border-outline-variant bg-surface p-3 hover:shadow-sm cursor-pointer" onClick={() => navigate(`/approvals/requests/${r.id}`)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{r.entityLabel}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">{ApprovalTriggerTypeLabel[r.triggerType]} • {r.ruleName}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">Talep eden: {r.requesterName ?? r.requesterId} • {formatDateTime(r.createdAt)}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_BG[ApprovalRequestStatusColor[r.status]] ?? 'bg-gray-100'}`}>{ApprovalRequestStatusLabel[r.status]}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${COLOR_BG[ApprovalPriorityColor[r.priority]]}`}>{ApprovalPriorityLabel[r.priority]}</span>
        </div>
      </div>
      {r.amount !== undefined && <p className="mt-1 text-sm"><strong>Tutar:</strong> {r.amount.toLocaleString('tr-TR')} {r.amountCurrency ?? 'TRY'}</p>}
      <div className="mt-2 flex items-center gap-2 text-xs text-on-surface-variant">
        <span>Adım {r.currentStep}/{r.totalSteps}</span>
        {r.expiresAt && <span>• Süre: {new Date(r.expiresAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>}
      </div>
      {tab === 'pending' && r.status === 'PENDING' && (
        <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => actMut.mutate({ id: r.id, actionType: 'APPROVED' })} className="flex-1 rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white"><CheckCircle2 className="inline h-3 w-3" /> Onayla</button>
          <button onClick={() => { const c = prompt('Red sebebi:'); if (c) actMut.mutate({ id: r.id, actionType: 'REJECTED', comment: c }); }} className="flex-1 rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white"><XCircle className="inline h-3 w-3" /> Reddet</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Onay Merkezi"
        description="Bekleyen, tüm ve kişisel onay istekleri"
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate('/approvals/rules')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><ListChecks className="h-4 w-4" /> Kurallar</button>
            <button onClick={() => navigate('/approvals/requests')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><FileText className="h-4 w-4" /> Tüm İstekler</button>
            <button onClick={() => navigate('/approvals/rules/new')} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Plus className="h-4 w-4" /> Yeni Kural</button>
          </div>
        }
      />

      {stats && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-outline-variant bg-surface p-3"><p className="text-xs text-on-surface-variant">Bekleyen</p><p className="text-2xl font-bold text-amber-600">{stats.pending}</p></div>
          <div className="rounded-lg border border-outline-variant bg-surface p-3"><p className="text-xs text-on-surface-variant">Onaylanan</p><p className="text-2xl font-bold text-green-600">{stats.approved}</p></div>
          <div className="rounded-lg border border-outline-variant bg-surface p-3"><p className="text-xs text-on-surface-variant">Reddedilen</p><p className="text-2xl font-bold text-red-600">{stats.rejected}</p></div>
          <div className="rounded-lg border border-outline-variant bg-surface p-3"><p className="text-xs text-on-surface-variant">Ortalama Süre</p><p className="text-2xl font-bold">{stats.avgApprovalTimeMs ? `${(stats.avgApprovalTimeMs / 3600000).toFixed(1)}s` : '—'}</p></div>
        </div>
      )}

      <div className="flex gap-2 border-b border-outline-variant">
        <button onClick={() => setTab('pending')} className={`px-3 py-2 text-sm font-medium ${tab === 'pending' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant'}`}>
          <Inbox className="inline h-4 w-4" /> Bekleyen ({pending.length})
        </button>
        <button onClick={() => setTab('all')} className={`px-3 py-2 text-sm font-medium ${tab === 'all' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant'}`}>
          Tümü
        </button>
      </div>

      {pl ? <LoadingState /> : tab === 'pending' ? (
        pending.length === 0 ? (
          <EmptyState icon={<ClipboardCheck className="h-12 w-12" />} title="Bekleyen onayınız yok" description="Yeni istek geldiğinde burada görünecek" />
        ) : <div className="space-y-2">{pending.map(renderRow)}</div>
      ) : (
        !allData || allData.items.length === 0 ? <EmptyState title="İstek yok" /> : <div className="space-y-2">{allData.items.map(renderRow)}</div>
      )}
    </div>
  );
}
