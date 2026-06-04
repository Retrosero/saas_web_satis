import { useState } from 'react';
import { Calendar, Plus, Trash2, Power, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useSchedules, useRules, useCreateSchedule, useDeleteSchedule } from '@/features/audit/api';
import { DataCheckFrequencyLabel, formatDateTime, type DataCheckSchedule } from '@saas/shared';

export function AuditSchedulesPage() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(''); const [ruleIds, setRuleIds] = useState<string[]>([]); const [frequency, setFrequency] = useState('DAILY'); const [hour, setHour] = useState(2); const [dayOfWeek, setDayOfWeek] = useState(1); const [dayOfMonth, setDayOfMonth] = useState(1); const [notifyOnComplete, setNotifyOnComplete] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<DataCheckSchedule | null>(null);
  const { data: schedules = [], isLoading, error, refetch } = useSchedules();
  const { data: rules = [] } = useRules();
  const createMut = useCreateSchedule();
  const delMut = useDeleteSchedule();

  const submit = async () => {
    if (!name || ruleIds.length === 0) { alert('İsim ve en az 1 kural seçin'); return; }
    await createMut.mutateAsync({ name, ruleIds, schedule: frequency as any, hour, dayOfWeek: frequency === 'WEEKLY' ? dayOfWeek : undefined, dayOfMonth: frequency === 'MONTHLY' ? dayOfMonth : undefined, isActive: true, notifyOnComplete });
    setShowForm(false); setName(''); setRuleIds([]); refetch();
  };

  const columns: DataTableColumn<DataCheckSchedule>[] = [
    { key: 'name', label: 'Zamanlama', render: (s) => <span className="font-semibold text-sm">{s.name}</span> },
    { key: 'ruleCount', label: 'Kural', width: '80px', align: 'right', render: (s) => s.ruleIds.length },
    { key: 'schedule', label: 'Sıklık', width: '110px', render: (s) => DataCheckFrequencyLabel[s.schedule] },
    { key: 'hour', label: 'Saat', width: '80px', render: (s) => `${String(s.hour).padStart(2, '0')}:00` },
    { key: 'nextRunAt', label: 'Sonraki', width: '150px', hideOnMobile: true, render: (s) => s.nextRunAt ? formatDateTime(s.nextRunAt) : '—' },
    { key: 'lastRunAt', label: 'Son', width: '150px', hideOnMobile: true, render: (s) => s.lastRunAt ? formatDateTime(s.lastRunAt) : '—' },
    { key: 'isActive', label: 'Durum', width: '80px', render: (s) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{s.isActive ? 'Aktif' : 'Pasif'}</span> },
    {
      key: 'actions', label: '', width: '80px', render: (s) => (
        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(s); }} className="rounded-md p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
      ),
    },
  ];

  if (error) return <ErrorState message="Zamanlamalar yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader title="Otomatik Zamanlama" description="Kontrolleri otomatik çalıştır"
        actions={<button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Plus className="h-4 w-4" /> Yeni Zamanlama</button>}
      />

      {showForm && (
        <div className="rounded-lg border-2 border-primary bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold">Yeni Zamanlama</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2"><label className="mb-1 block text-xs font-medium">Zamanlama Adı *</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div className="md:col-span-2"><label className="mb-1 block text-xs font-medium">Kurallar *</label>
              <div className="rounded-md border border-outline bg-surface p-2 max-h-40 overflow-auto space-y-1">
                {rules.length === 0 ? <p className="text-xs text-on-surface-variant">Önce kural oluşturun</p> : rules.map((r) => (
                  <label key={r.id} className="flex items-center gap-2 text-sm hover:bg-surface-variant/30 p-1 rounded">
                    <input type="checkbox" checked={ruleIds.includes(r.id)} onChange={(e) => setRuleIds(e.target.checked ? [...ruleIds, r.id] : ruleIds.filter((x) => x !== r.id))} />
                    <span>{r.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div><label className="mb-1 block text-xs font-medium">Sıklık</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
                <option value="HOURLY">Saatlik</option><option value="DAILY">Günlük</option><option value="WEEKLY">Haftalık</option><option value="MONTHLY">Aylık</option>
              </select>
            </div>
            <div><label className="mb-1 block text-xs font-medium">Saat</label><input type="number" min="0" max="23" value={hour} onChange={(e) => setHour(Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            {frequency === 'WEEKLY' && <div><label className="mb-1 block text-xs font-medium">Haftanın Günü (0=Pzr)</label><input type="number" min="0" max="6" value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>}
            {frequency === 'MONTHLY' && <div><label className="mb-1 block text-xs font-medium">Ayın Günü</label><input type="number" min="1" max="31" value={dayOfMonth} onChange={(e) => setDayOfMonth(Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>}
            <label className="flex items-center gap-2 text-sm self-end"><input type="checkbox" checked={notifyOnComplete} onChange={(e) => setNotifyOnComplete(e.target.checked)} /> Tamamlanınca Bildir</label>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="rounded-md border border-outline px-3 py-1.5 text-sm">İptal</button>
            <button onClick={submit} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-on-primary">Kaydet</button>
          </div>
        </div>
      )}

      {isLoading ? <LoadingState /> : schedules.length === 0 ? (
        <EmptyState icon={<Calendar className="h-12 w-12" />} title="Henüz zamanlama yok" />
      ) : <DataTable<DataCheckSchedule> columns={columns} data={schedules} rowKey={(s) => s.id} />}

      <ConfirmModal open={!!confirmDelete} title="Zamanlama Silinsin mi?" description={confirmDelete?.name} confirmText="Sil" variant="danger" onClose={() => setConfirmDelete(null)} onConfirm={async () => { if (confirmDelete) { await delMut.mutateAsync(confirmDelete.id); setConfirmDelete(null); refetch(); } }} />
    </div>
  );
}
