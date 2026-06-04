import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, FileText } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { MobileCardList } from '@/components/data/MobileCardList';
import {
  PayrollPeriodStatusLabels,
  PayrollPeriodStatusColors,
  PayrollPeriodType,
} from '@saas/shared';
import {
  usePayrollPeriods,
  useCreatePayrollPeriod,
} from '@/features/hr/api';

interface PeriodRow {
  id: string;
  year: number;
  period: number;
  periodType: string;
  startDate: string;
  endDate: string;
  status: string;
  totalGross: number | null;
  totalNet: number | null;
  employeeCount: number | null;
  confirmedAt: string | null;
  exportedAt: string | null;
}

const MONTH_NAMES = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export function PayrollPeriodsPage() {
  const navigate = useNavigate();
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const { data, isLoading } = usePayrollPeriods({ year: yearFilter });

  const createMut = useCreatePayrollPeriod();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    period: new Date().getMonth() + 1,
    periodType: 'MONTHLY',
    startDate: '',
    endDate: '',
    notes: '',
  });

  const rows: PeriodRow[] = (data as any[]) ?? [];

  const columns: DataTableColumn<PeriodRow>[] = [
    {
      key: 'period',
      label: 'Dönem',
      render: (r) => (
        <div>
          <p className="font-semibold">
            {r.periodType === 'MONTHLY'
              ? `${MONTH_NAMES[r.period - 1]} ${r.year}`
              : `${r.period}. Hafta ${r.year}`}
          </p>
          <p className="font-mono text-xs text-fg-muted">
            {new Date(r.startDate).toLocaleDateString('tr-TR')} — {new Date(r.endDate).toLocaleDateString('tr-TR')}
          </p>
        </div>
      ),
    },
    {
      key: 'employeeCount',
      label: 'Personel',
      render: (r) => (
        <span className="text-sm font-medium">{r.employeeCount ?? 0} kişi</span>
      ),
    },
    {
      key: 'totals',
      label: 'Toplam',
      render: (r) => r.totalGross ? (
        <div>
          <p className="text-sm font-semibold">{Number(r.totalGross).toLocaleString('tr-TR')} ₺ brüt</p>
          <p className="font-mono text-xs text-fg-muted">{Number(r.totalNet).toLocaleString('tr-TR')} ₺ net</p>
        </div>
      ) : <span className="text-xs text-fg-muted">—</span>,
    },
    {
      key: 'status',
      label: 'Durum',
      render: (r) => {
        const cls = PayrollPeriodStatusColors[r.status as keyof typeof PayrollPeriodStatusColors] ?? 'bg-zinc-100';
        return (
          <span className={'rounded-full px-2 py-0.5 text-xs font-medium ' + cls}>
            {PayrollPeriodStatusLabels[r.status as keyof typeof PayrollPeriodStatusLabels] ?? r.status}
          </span>
        );
      },
    },
  ];

  const handleCreate = async () => {
    if (!form.startDate || !form.endDate) return;
    await createMut.mutateAsync(form);
    setShowForm(false);
    setForm({ year: new Date().getFullYear(), period: new Date().getMonth() + 1, periodType: 'MONTHLY', startDate: '', endDate: '', notes: '' });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bordro Dönemleri"
        description="Bordro hazırlık ve muhasebeye gönderim"
        actions={
          <div className="flex gap-2">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(Number(e.target.value))}
              className="rounded-md border border-outline bg-surface px-3 py-2 text-sm"
            >
              {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover"
            >
              <Plus className="h-4 w-4" /> Yeni Dönem
            </button>
          </div>
        }
      />

      {isLoading ? <LoadingState /> : !rows.length ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="Bordro dönemi yok"
          description="Muhasebeye göndereceğiniz bordro dönemini tanımlayın"
        />
      ) : (
        <>
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={rows}
              rowKey={(r) => r.id}
              onRowClick={(r) => navigate(`/hr/payroll/${r.id}`)}
            />
          </div>
          <div className="md:hidden">
            <MobileCardList
              data={rows}
              keyFn={(r) => r.id}
              onItemClick={(r) => navigate(`/hr/payroll/${r.id}`)}
              header={(r) => (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {r.periodType === 'MONTHLY' ? `${MONTH_NAMES[r.period - 1]} ${r.year}` : `${r.period}. Hafta`}
                  </span>
                  <span className={'rounded-full px-1.5 py-0.5 text-xs ' + (PayrollPeriodStatusColors[r.status as keyof typeof PayrollPeriodStatusColors] ?? 'bg-zinc-100')}>
                    {PayrollPeriodStatusLabels[r.status as keyof typeof PayrollPeriodStatusLabels]}
                  </span>
                </div>
              )}
              subtitle={(r) => (
                <p className="text-sm text-fg-muted">
                  {r.employeeCount ?? 0} personel
                  {r.totalGross && ` • ${Number(r.totalGross).toLocaleString('tr-TR')} ₺`}
                </p>
              )}
            />
          </div>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-lg bg-surface p-4 shadow-lg">
            <h3 className="mb-3 text-base font-semibold">Yeni Bordro Dönemi</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs">Yıl *</label>
                  <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs">Dönem *</label>
                  <select value={form.period} onChange={(e) => setForm({ ...form, period: Number(e.target.value) })} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm">
                    {MONTH_NAMES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs">Başlangıç *</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs">Bitiş *</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs">Not</label>
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" placeholder="Dönem notu..." />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="rounded-md border border-outline bg-surface px-3 py-1.5 text-sm hover:bg-bg-subtle">İptal</button>
              <button onClick={handleCreate} disabled={!form.startDate || !form.endDate || createMut.isPending} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50">
                {createMut.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}