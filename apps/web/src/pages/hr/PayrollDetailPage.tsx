import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Download, Lock, Plus, Trash2, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { PayrollPeriodStatusLabels, PayrollPeriodStatusColors, SupplementTypeLabels } from '@saas/shared';
import {
  usePayrollPeriod,
  usePayrollRecords,
  useUpsertPayrollRecord,
  useInitializePayrollRecords,
  useConfirmPayrollPeriod,
  useExportPayrollPeriod,
  useClosePayrollPeriod,
  usePayrollSupplements,
  useAddPayrollSupplement,
  useDeletePayrollSupplement,
  useEmployees,
} from '@/features/hr/api';

interface RecordRow {
  id: string;
  employeeId: string;
  employee: { id: string; fullName: string; employeeNo: string };
  workingDays: number;
  absentDays: number;
  overtimeHours: number;
  baseSalary: number;
  grossPay: number;
  sgkEmployee: number;
  incomeTax: number;
  netPay: number;
  status: string;
}

export function PayrollDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: period, isLoading: periodLoading } = usePayrollPeriod(id!);
  const { data: records, isLoading: recordsLoading } = usePayrollRecords(id!);
  const { data: supplements } = usePayrollSupplements(id!);
  const { data: employeesData } = useEmployees({ status: 'ACTIVE' } as any);

  const initMut = useInitializePayrollRecords();
  const confirmMut = useConfirmPayrollPeriod();
  const exportMut = useExportPayrollPeriod();
  const closeMut = useClosePayrollPeriod();
  const upsertMut = useUpsertPayrollRecord();
  const addSuppMut = useAddPayrollSupplement();
  const delSuppMut = useDeletePayrollSupplement();

  const [editingRecord, setEditingRecord] = useState<RecordRow | null>(null);
  const [showSuppForm, setShowSuppForm] = useState(false);
  const [suppForm, setSuppForm] = useState({ employeeId: '', type: 'BONUS', name: '', amount: 0, isDeduction: false });
  const [editValues, setEditValues] = useState<any>({});

  if (periodLoading) return <LoadingState />;
  const p = period as any;
  if (!p) return null;

  const rows: RecordRow[] = (records as any[]) ?? [];
  const emps = (employeesData as any)?.data ?? [];

  const statusColors = PayrollPeriodStatusColors;
  const statusLabels = PayrollPeriodStatusLabels;
  const isDeletable = p.status === 'DRAFT' || p.status === 'REVIEW';
  const isConfirmable = p.status === 'DRAFT' || p.status === 'REVIEW';
  const isExportable = p.status === 'CONFIRMED' || p.status === 'DRAFT';
  const isClosable = p.status === 'EXPORTED';

  const columns: DataTableColumn<RecordRow>[] = [
    {
      key: 'employee',
      label: 'Personel',
      render: (r) => (
        <div>
          <p className="font-semibold">{r.employee?.fullName ?? '—'}</p>
          <p className="font-mono text-xs text-fg-muted">{r.employee?.employeeNo ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'days',
      label: 'Gün',
      render: (r) => (
        <div className="text-xs">
          <p>{r.workingDays} çalışma</p>
          {r.absentDays > 0 && <p className="text-red-600">{r.absentDays} devamsız</p>}
          {r.overtimeHours > 0 && <p className="text-blue-600">{r.overtimeHours} saat mesai</p>}
        </div>
      ),
    },
    {
      key: 'baseSalary',
      label: 'Brüt Ücret',
      render: (r) => <span className="font-medium">{Number(r.baseSalary).toLocaleString('tr-TR')} ₺</span>,
    },
    {
      key: 'grossPay',
      label: 'Brüt Toplam',
      render: (r) => <span className="font-semibold">{Number(r.grossPay).toLocaleString('tr-TR')} ₺</span>,
    },
    {
      key: 'deductions',
      label: 'Kesintiler',
      render: (r) => (
        <div className="text-xs">
          <p>SGK: {Number(r.sgkEmployee).toLocaleString('tr-TR')} ₺</p>
          <p>Vergi: {Number(r.incomeTax).toLocaleString('tr-TR')} ₺</p>
        </div>
      ),
    },
    {
      key: 'netPay',
      label: 'Net',
      render: (r) => <span className="font-bold">{Number(r.netPay).toLocaleString('tr-TR')} ₺</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={`${p.periodType === 'MONTHLY' ? ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'][p.period - 1] : `${p.period}. Hafta`} ${p.year} — Bordro Hazırlık`}
        description={`${new Date(p.startDate).toLocaleDateString('tr-TR')} — ${new Date(p.endDate).toLocaleDateString('tr-TR')}`}
        actions={
          <button onClick={() => navigate('/hr/payroll')} className="flex items-center gap-1 rounded-md border border-outline bg-surface px-3 py-2 text-sm hover:bg-bg-subtle">
            <ArrowLeft className="h-4 w-4" /> Geri
          </button>
        }
      />

      {/* Durum + Aksiyonlar */}
      <div className="rounded-lg border border-outline bg-surface p-4">
        <div className="flex items-center gap-3">
          <span className={'rounded-full px-3 py-1 text-sm font-medium ' + (statusColors[p.status as keyof typeof statusColors] ?? 'bg-zinc-100')}>
            {statusLabels[p.status as keyof typeof statusLabels]}
          </span>
          <div className="flex gap-2">
            {isDeletable && (
              <button
                onClick={() => {
                  if (confirm('Tüm personeller için bordro satırı oluşturulsun mu?')) {
                    initMut.mutate(p.id);
                  }
                }}
                disabled={initMut.isPending}
                className="flex items-center gap-1 rounded-md border border-outline bg-surface px-3 py-1.5 text-sm hover:bg-bg-subtle disabled:opacity-50"
              >
                <RefreshCw className="h-3 w-3" /> Personel Ekle
              </button>
            )}
            {isConfirmable && (
              <button
                onClick={() => confirmMut.mutate(p.id)}
                disabled={confirmMut.isPending}
                className="flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3 w-3" /> Onayla
              </button>
            )}
            {isExportable && (
              <button
                onClick={() => exportMut.mutate(p.id)}
                disabled={exportMut.isPending || rows.length === 0}
                className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Download className="h-3 w-3" /> Dışa Aktar
              </button>
            )}
            {isClosable && (
              <button
                onClick={() => closeMut.mutate(p.id)}
                disabled={closeMut.isPending}
                className="flex items-center gap-1 rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                <Lock className="h-3 w-3" /> Kapat
              </button>
            )}
          </div>
        </div>

        {/* Özet kartları */}
        <div className="mt-3 grid grid-cols-4 gap-3">
          {[
            { label: 'Personel', value: p.employeeCount ?? rows.length },
            { label: 'Toplam Brüt', value: p.totalGross ? `${Number(p.totalGross).toLocaleString('tr-TR')} ₺` : '—' },
            { label: 'Toplam Net', value: p.totalNet ? `${Number(p.totalNet).toLocaleString('tr-TR')} ₺` : '—' },
            { label: 'Ek Kalem', value: ((supplements as any[]) ?? []).length },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-md bg-bg-subtle p-2 text-center">
              <p className="text-xs text-fg-muted">{label}</p>
              <p className="font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bordro satırları */}
      <div className="rounded-lg border border-outline bg-surface">
        <div className="flex items-center justify-between border-b border-outline px-4 py-3">
          <h3 className="font-semibold">Personel Bordro Satırları</h3>
          {isDeletable && rows.length === 0 && (
            <button
              onClick={() => {
                if (confirm('Tüm personeller için bordro satırı oluşturulsun mu?')) {
                  initMut.mutate(p.id);
                }
              }}
              className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-on-primary hover:bg-primary-hover"
            >
              <Plus className="h-3 w-3" /> Personelleri Ekle
            </button>
          )}
        </div>
        {recordsLoading ? (
          <div className="p-8 text-center text-fg-muted">Yükleniyor...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-fg-muted">Henüz bordro satırı yok. Yukarıdan personel ekleyin.</div>
        ) : (
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={rows}
              rowKey={(r) => r.id}
              onRowClick={(r) => { setEditingRecord(r); setEditValues({ workingDays: r.workingDays, absentDays: r.absentDays, overtimeHours: r.overtimeHours, baseSalary: r.baseSalary, grossPay: r.grossPay, sgkEmployee: r.sgkEmployee, incomeTax: r.incomeTax, netPay: r.netPay }); }}
            />
          </div>
        )}
      </div>

      {/* Düzenleme modalı */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-lg bg-surface p-4 shadow-lg">
            <h3 className="mb-3 font-semibold">Bordro Düzenle — {editingRecord.employee?.fullName}</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'workingDays', label: 'Çalışma Günü', type: 'number' },
                { key: 'absentDays', label: 'Devamsız Gün', type: 'number' },
                { key: 'overtimeHours', label: 'Fazla Mesai (saat)', type: 'number' },
                { key: 'baseSalary', label: 'Brüt Ücret (₺)', type: 'number' },
                { key: 'grossPay', label: 'Brüt Toplam (₺)', type: 'number' },
                { key: 'sgkEmployee', label: 'SGK Çalışan (₺)', type: 'number' },
                { key: 'incomeTax', label: 'Gelir Vergisi (₺)', type: 'number' },
                { key: 'netPay', label: 'Net Ücret (₺)', type: 'number' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="text-xs">{label}</label>
                  <input
                    type={type}
                    value={(editValues as any)[key] ?? 0}
                    onChange={(e) => setEditValues({ ...editValues, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
                    className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditingRecord(null)} className="rounded-md border border-outline bg-surface px-3 py-1.5 text-sm hover:bg-bg-subtle">İptal</button>
              <button
                onClick={async () => {
                  await upsertMut.mutateAsync({ periodId: p.id, employeeId: editingRecord.employeeId, ...editValues });
                  setEditingRecord(null);
                }}
                disabled={upsertMut.isPending}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}