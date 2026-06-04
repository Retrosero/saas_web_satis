import { useState } from 'react';
import { Clock, Plus, Power, Trash2, Mail, Bell, Edit } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useSchedules, useToggleSchedule, useDeleteSchedule, useCreateSchedule, useReportTemplates } from '@/features/reports/api';
import { formatDateTime, type ReportTemplate } from '@saas/shared';

const FREQ_LABEL: Record<string, string> = { DAILY: 'Günlük', WEEKLY: 'Haftalık', MONTHLY: 'Aylık' };

export function ScheduledReportsPage() {
  const [showForm, setShowForm] = useState(false);
  const [templateId, setTemplateId] = useState(''); const [frequency, setFrequency] = useState('WEEKLY');
  const [dayOfWeek, setDayOfWeek] = useState(1); const [dayOfMonth, setDayOfMonth] = useState(1); const [hour, setHour] = useState(9);
  const [sendEmail, setSendEmail] = useState(true); const [sendNotification, setSendNotification] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { data: schedules = [], isLoading, error, refetch } = useSchedules();
  const { data: templates = [] } = useReportTemplates();
  const createMut = useCreateSchedule();
  const toggleMut = useToggleSchedule();
  const delMut = useDeleteSchedule();

  const submit = async () => {
    if (!templateId) return;
    await createMut.mutateAsync({ templateId, frequency, dayOfWeek: frequency === 'WEEKLY' ? dayOfWeek : null, dayOfMonth: frequency === 'MONTHLY' ? dayOfMonth : null, hour, sendEmail, sendNotification, isActive: true });
    setShowForm(false); setTemplateId('');
    refetch();
  };

  const columns: DataTableColumn<any>[] = [
    { key: 'template', label: 'Rapor', render: (s) => <span className="font-semibold">{templates.find((t) => t.id === s.templateId)?.name ?? '—'}</span> },
    { key: 'frequency', label: 'Sıklık', width: '120px', render: (s) => `${FREQ_LABEL[s.frequency] ?? s.frequency}${s.dayOfWeek !== null ? ` (Pzt=1..Pzr=0)` : ''}${s.dayOfMonth !== null ? ` (Ayın ${s.dayOfMonth}. günü)` : ''}` },
    { key: 'hour', label: 'Saat', width: '80px', render: (s) => `${String(s.hour).padStart(2, '0')}:00` },
    { key: 'channels', label: 'Kanallar', width: '120px', render: (s) => <div className="flex gap-1">{s.sendEmail && <Mail className="h-3 w-3" />}{s.sendNotification && <Bell className="h-3 w-3" />}</div> },
    { key: 'lastRunAt', label: 'Son Çalışma', width: '160px', render: (s) => s.lastRunAt ? formatDateTime(s.lastRunAt) : '—' },
    { key: 'isActive', label: 'Durum', width: '90px', render: (s) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{s.isActive ? 'Aktif' : 'Pasif'}</span> },
    {
      key: 'actions', label: '', width: '110px', render: (s) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => toggleMut.mutate(s.id)} className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50"><Power className="h-4 w-4" /></button>
          <button onClick={() => setConfirmDelete(s.id)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message="Zamanlamalar yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Zamanlanmış Raporlar"
        description="Otomatik rapor çalıştırma zamanlamaları"
        actions={<button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Plus className="h-4 w-4" /> Yeni Zamanlama</button>}
      />

      {showForm && (
        <div className="rounded-lg border-2 border-primary bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold">Yeni Zamanlanmış Rapor</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2"><label className="mb-1 block text-xs font-medium">Rapor Şablonu *</label>
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
                <option value="">Seçiniz...</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div><label className="mb-1 block text-xs font-medium">Sıklık</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
                <option value="DAILY">Günlük</option>
                <option value="WEEKLY">Haftalık</option>
                <option value="MONTHLY">Aylık</option>
              </select>
            </div>
            <div><label className="mb-1 block text-xs font-medium">Saat</label><input type="number" min="0" max="23" value={hour} onChange={(e) => setHour(Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            {frequency === 'WEEKLY' && <div><label className="mb-1 block text-xs font-medium">Haftanın Günü (0=Pzr, 1=Pzt)</label><input type="number" min="0" max="6" value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>}
            {frequency === 'MONTHLY' && <div><label className="mb-1 block text-xs font-medium">Ayın Günü (1-31)</label><input type="number" min="1" max="31" value={dayOfMonth} onChange={(e) => setDayOfMonth(Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>}
            <label className="flex items-center gap-2 text-sm self-end"><input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} /> E-posta gönder</label>
            <label className="flex items-center gap-2 text-sm self-end"><input type="checkbox" checked={sendNotification} onChange={(e) => setSendNotification(e.target.checked)} /> Bildirim gönder</label>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="rounded-md border border-outline px-3 py-1.5 text-sm">İptal</button>
            <button onClick={submit} disabled={!templateId} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-on-primary disabled:opacity-40">Kaydet</button>
          </div>
        </div>
      )}

      {isLoading ? <LoadingState /> : schedules.length === 0 ? (
        <EmptyState icon={<Clock className="h-12 w-12" />} title="Henüz zamanlama yok" description="Raporları otomatik çalıştırmak için zamanlama oluşturun" />
      ) : <DataTable columns={columns} data={schedules} rowKey={(s) => s.id} />}

      <ConfirmModal open={!!confirmDelete} title="Zamanlama Silinsin mi?" description="Zamanlama iptal edilecek." confirmText="Sil" variant="danger" onClose={() => setConfirmDelete(null)} onConfirm={async () => { if (confirmDelete) { await delMut.mutateAsync(confirmDelete); setConfirmDelete(null); refetch(); } }} />
    </div>
  );
}
