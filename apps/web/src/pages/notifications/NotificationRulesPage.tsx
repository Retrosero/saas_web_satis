import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Layers, Pencil, Trash2, Power, Plus, Play, Bell, Activity } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useRules, useDeleteRule, useToggleRule, useTrigger } from '@/features/notifications/api';
import { NotificationTriggerTypeLabel, formatDateTime, type NotificationRule } from '@saas/shared';

export function NotificationRulesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState(''); const [filterType, setFilterType] = useState(''); const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<NotificationRule | null>(null);
  const [testResult, setTestResult] = useState<{ rule: NotificationRule; result: any } | null>(null);
  const { data: rules = [], isLoading, error, refetch } = useRules({ search, triggerType: filterType || undefined, isActive: filterActive });
  const delMut = useDeleteRule();
  const toggleMut = useToggleRule();
  const triggerMut = useTrigger();

  const columns: DataTableColumn<NotificationRule>[] = [
    { key: 'name', label: 'Kural Adı', render: (r) => <div><p className="font-semibold text-sm">{r.name}</p>{r.description && <p className="text-xs text-on-surface-variant truncate max-w-[280px]">{r.description}</p>}</div> },
    { key: 'triggerType', label: 'Tetik Tipi', width: '170px', render: (r) => <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{NotificationTriggerTypeLabel[r.triggerType]}</span> },
    { key: 'priority', label: 'Öncelik', width: '80px', align: 'right', render: (r) => r.priority },
    { key: 'triggerCount', label: 'Tetik', width: '70px', align: 'right', hideOnMobile: true, render: (r) => r.triggerCount },
    { key: 'lastTriggeredAt', label: 'Son Tetik', width: '140px', hideOnMobile: true, render: (r) => r.lastTriggeredAt ? formatDateTime(r.lastTriggeredAt) : '—' },
    { key: 'isActive', label: 'Durum', width: '80px', render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{r.isActive ? 'Aktif' : 'Pasif'}</span> },
    {
      key: 'actions', label: '', width: '170px', render: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={async () => {
            const result = await triggerMut.mutateAsync({ type: r.triggerType, payload: {}, sample: { test: true, customer: { name: 'Test Müşteri' }, amount: 1500, date: new Date().toISOString() } });
            setTestResult({ rule: r, result });
          }} className="rounded-md p-1.5 text-green-600 hover:bg-green-50" title="Test Tetikle"><Play className="h-4 w-4" /></button>
          <button onClick={() => navigate(`/notifications/rules/${r.id}/edit`)} className="rounded-md p-1.5 text-primary hover:bg-primary-container/40" title="Düzenle"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => toggleMut.mutate(r.id)} className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50" title="Aktif/Pasif"><Power className="h-4 w-4" /></button>
          <button onClick={() => setConfirmDelete(r)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50" title="Sil"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message="Kurallar yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bildirim Kuralları"
        description="Tetikleyiciler ve aksiyonlarla kural tanımla"
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate('/notifications/channels')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><Bell className="h-4 w-4" /> Kanallar</button>
            <button onClick={() => navigate('/notifications/logs')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><Activity className="h-4 w-4" /> Loglar</button>
            <button onClick={() => navigate('/notifications/rules/new')} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Plus className="h-4 w-4" /> Yeni Kural</button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kural adı..." className="rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm">
          <option value="">Tüm Tetikler</option>
          {Object.entries(NotificationTriggerTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterActive === undefined ? '' : String(filterActive)} onChange={(e) => setFilterActive(e.target.value === '' ? undefined : e.target.value === 'true')} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm">
          <option value="">Tüm Durumlar</option>
          <option value="true">Aktif</option>
          <option value="false">Pasif</option>
        </select>
      </div>

      {isLoading ? <LoadingState /> : rules.length === 0 ? (
        <EmptyState icon={<Layers className="h-12 w-12" />} title="Henüz kural yok" description="İlk bildirim kuralını oluştur" action={<button onClick={() => navigate('/notifications/rules/new')} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">Yeni Kural</button>} />
      ) : (
        <>
          <DataTable<NotificationRule> columns={columns} data={rules} rowKey={(r) => r.id} onRowClick={(r) => navigate(`/notifications/rules/${r.id}/edit`)} />
          <MobileCardList<NotificationRule> data={rules} keyFn={(r) => r.id} onItemClick={(r) => navigate(`/notifications/rules/${r.id}/edit`)} header={(r) => r.name} subtitle={(r) => `${NotificationTriggerTypeLabel[r.triggerType]} • Öncelik ${r.priority}`} rightBadge={(_r) => _r.isActive ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">Aktif</span> : <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">Pasif</span>} footer={(r) => <span className="text-xs text-on-surface-variant">{r.triggerCount} tetik • {r.lastTriggeredAt ? `Son: ${formatDateTime(r.lastTriggeredAt)}` : 'Hiç tetiklenmedi'}</span>} />
        </>
      )}

      <ConfirmModal open={!!confirmDelete} title="Kural Silinsin mi?" description={`${confirmDelete?.name} kuralı silinecek.`} confirmText="Sil" variant="danger" onClose={() => setConfirmDelete(null)} onConfirm={async () => { if (confirmDelete) { await delMut.mutateAsync(confirmDelete.id); setConfirmDelete(null); } }} />

      {testResult && (
        <div className="rounded-lg border-2 border-primary bg-surface p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Test Sonucu: {testResult.rule.name}</h3>
            <button onClick={() => setTestResult(null)} className="text-on-surface-variant">×</button>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">Eşleşen Kural: {testResult.result.matchedRules}, Gönderilen: {testResult.result.dispatched?.length ?? 0}</p>
          {testResult.result.dispatched?.length > 0 && (
            <ul className="mt-2 text-xs space-y-1">
              {testResult.result.dispatched.map((d: any, i: number) => (
                <li key={i} className="rounded bg-surface-variant/30 p-1.5">
                  <span className={d.status === 'SENT' ? 'text-green-600' : 'text-red-600'}>{d.status}</span> — Log ID: {d.logId}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
