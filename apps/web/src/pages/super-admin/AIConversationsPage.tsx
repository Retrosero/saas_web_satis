import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MessageSquare, Filter, Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { useAllConversations } from '@/features/ai-observability/api';
import { AssistantConversationStatusLabel, formatRelative } from '@saas/shared';

export function AIConversationsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTenant = searchParams.get('tenantId') ?? '';
  const initialUser = searchParams.get('userId') ?? '';
  const [tenantId, setTenantId] = useState(initialTenant); const [userId, setUserId] = useState(initialUser);
  const [status, setStatus] = useState(''); const [minCost, setMinCost] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useAllConversations({ tenantId: tenantId || undefined, userId: userId || undefined, status: status || undefined, minCost, page, pageSize: 30 });

  const columns: DataTableColumn<any>[] = [
    { key: 'title', label: 'Konuşma', render: (c) => <div><p className="font-semibold text-sm">{c.title}</p>{c.lastMessageAt && <p className="text-xs text-on-surface-variant">Son: {formatRelative(c.lastMessageAt)}</p>}</div> },
    { key: 'tenantName', label: 'Tenant', width: '160px', hideOnMobile: true, render: (c) => <span className="text-xs">{c.tenantName ?? '—'}</span> },
    { key: 'userName', label: 'Kullanıcı', width: '140px', hideOnMobile: true, render: (c) => c.userName ?? c.userId?.substring(0, 8) },
    { key: 'messageCount', label: 'Mesaj', width: '80px', align: 'right', render: (c) => c.messageCount },
    { key: 'totalTokens', label: 'Token', width: '90px', align: 'right', hideOnMobile: true, render: (c) => c.totalTokens.toLocaleString('tr-TR') },
    { key: 'totalCostUSD', label: 'Maliyet', width: '110px', align: 'right', render: (c) => <span className="font-semibold text-green-600">${c.totalCostUSD.toFixed(4)}</span> },
    { key: 'status', label: 'Durum', width: '110px', render: (c) => <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">{AssistantConversationStatusLabel[c.status as keyof typeof AssistantConversationStatusLabel]}</span> },
  ];

  if (error) return <ErrorState message="Konuşmalar yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader title="Tüm Konuşmalar (Süper Admin)" description="Tüm tenantlardan AI konuşmaları" />

      <div className="flex flex-wrap gap-2">
        <input value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="Tenant ID" className="rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" />
        <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID" className="rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm">
          <option value="">Tüm Durumlar</option>
          {Object.entries(AssistantConversationStatusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="number" min="0" step="0.01" value={minCost ?? ''} onChange={(e) => setMinCost(e.target.value ? Number(e.target.value) : undefined)} placeholder="Min. maliyet $" className="rounded-md border border-outline bg-surface px-3 py-2 text-sm w-32" />
      </div>

      {isLoading ? <LoadingState /> : !data || data.items.length === 0 ? (
        <EmptyState icon={<MessageSquare className="h-12 w-12" />} title="Konuşma bulunamadı" />
      ) : (
        <>
          <DataTable columns={columns} data={data.items} rowKey={(c) => c.id} onRowClick={(c) => navigate(`/super-admin/ai/conversations/${c.id}`)} />
          <MobileCardList data={data.items} keyFn={(c) => c.id} onItemClick={(c) => navigate(`/super-admin/ai/conversations/${c.id}`)} header={(c) => c.title} subtitle={(c) => `${c.tenantName} • ${c.userName ?? '?'}`} rightBadge={(_c) => <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 font-semibold">${_c.totalCostUSD.toFixed(3)}</span>} footer={(c) => <span className="text-xs text-on-surface-variant">{c.messageCount} mesaj • {formatRelative(c.lastMessageAt)}</span>} />
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
    </div>
  );
}
