import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { TextInput } from '@/components/forms/TextInput';
import { FileDown, Save, X, Check, Plus, RefreshCw } from 'lucide-react';
import {
  useEmployees,
  usePunchList,
  useUpsertPunch,
  useSyncPunchToPayroll,
  useAdvances,
  useCreateAdvance,
  useApproveAdvance,
  usePayAdvance,
  useRejectAdvance,
  useExportPayrollExcel,
  usePayrollPeriods,
} from '@/features/hr/api';
import { useAuthStore } from '@/stores/auth-store';
import toast from 'react-hot-toast';

const today = () => new Date().toISOString().split('T')[0];

const advanceStatusLabel: Record<string, string> = {
  PENDING: 'Beklemede',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  PAID: 'Ödendi',
  DEDUCTED: 'Mahsup Edildi',
};

const advanceStatusColor: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
  PAID: 'bg-green-100 text-green-800',
  DEDUCTED: 'bg-purple-100 text-purple-800',
};

const punchStatusLabel: Record<string, string> = {
  CLOCKED_IN: 'Mesai Başında',
  CLOCKED_OUT: 'Mesai Sonu',
  ON_BREAK: 'Molada',
  ABSENT: 'Devamsız',
};

export function HR8910Page() {
  const user = useAuthStore((s) => s.user);
  const tenantId = (user as any)?.tenantId ?? '';
  const [tab, setTab] = useState<'punch' | 'advances' | 'export'>('punch');

  return (
    <div className="p-6 space-y-4">
      <PageHeader title="Puantaj • Avans • Excel Export" description="HR-8 / HR-9 / HR-10 — günlük yoklama, avans takibi ve bordro export" />

      <div className="flex gap-2 border-b border-outline">
        {[
          { key: 'punch' as const, label: 'Puantaj' },
          { key: 'advances' as const, label: 'Avanslar' },
          { key: 'export' as const, label: 'Excel Export' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-fg-muted hover:text-fg'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'punch' && <PunchTab tenantId={tenantId} />}
      {tab === 'advances' && <AdvancesTab tenantId={tenantId} />}
      {tab === 'export' && <ExportTab tenantId={tenantId} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 1) PUANTAJ
// ════════════════════════════════════════════════════════════════════════

function PunchTab({ tenantId }: { tenantId: string }) {
  const push = (x: any) => toast(x.tone === 'error' ? '❌ ' + x.message : '✅ ' + x.message);
  const [date, setDate] = useState(today());
  const { data: employeesResp, isLoading: empLoading } = useEmployees();
  const employees: any[] = Array.isArray(employeesResp) ? employeesResp : (employeesResp as any)?.data ?? [];
  const { data: punches = [], isLoading } = usePunchList(date);
  const upsertPunch = useUpsertPunch();
  const _syncToPayroll = useSyncPunchToPayroll();
  void _syncToPayroll;
  const _qc = useQueryClient();
  void _qc;

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ clockIn: '', clockOut: '', status: 'CLOCKED_OUT', notes: '' });

  const startEdit = (p: any) => {
    setEditingKey(p.id);
    setEditForm({
      clockIn: p.clockIn ? new Date(p.clockIn).toISOString().slice(0, 16) : '',
      clockOut: p.clockOut ? new Date(p.clockOut).toISOString().slice(0, 16) : '',
      status: p.status,
      notes: p.notes ?? '',
    });
  };

  const startNew = (employeeId: string) => {
    setEditingKey(`new-${employeeId}`);
    setEditForm({ clockIn: '', clockOut: '', status: 'CLOCKED_OUT', notes: '' });
  };

  const save = async (employeeId: string) => {
    try {
      await upsertPunch.mutateAsync({
        tenantId,
        employeeId,
        punchDate: date,
        clockIn: editForm.clockIn ? new Date(editForm.clockIn).toISOString() : undefined,
        clockOut: editForm.clockOut ? new Date(editForm.clockOut).toISOString() : undefined,
        status: editForm.status,
        notes: editForm.notes,
      });
      push({ message: 'Kayıt güncellendi', tone: 'success' });
      setEditingKey(null);
    } catch (e: any) {
      push({ message: e.message ?? 'Hata', tone: 'error' });
    }
  };

  const columns: DataTableColumn<any>[] = [
    { key: 'employeeNo', label: 'Personel No', render: (e) => e.employeeNo },
    { key: 'fullName', label: 'Ad Soyad', render: (e) => `${e.firstName} ${e.lastName}` },
    {
      key: 'clockIn',
      label: 'Giriş',
      render: (e) => {
        const p = punches.find((x: any) => x.employeeId === e.id);
        if (editingKey === `new-${e.id}` || (p && editingKey === p.id)) {
          return <input type="datetime-local" value={editForm.clockIn} onChange={(ev) => setEditForm({ ...editForm, clockIn: ev.target.value })} className="rounded border border-outline px-2 py-1 text-sm" />;
        }
        return p?.clockIn ? new Date(p.clockIn).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '—';
      },
    },
    {
      key: 'clockOut',
      label: 'Çıkış',
      render: (e) => {
        const p = punches.find((x: any) => x.employeeId === e.id);
        if (editingKey === `new-${e.id}` || (p && editingKey === p.id)) {
          return <input type="datetime-local" value={editForm.clockOut} onChange={(ev) => setEditForm({ ...editForm, clockOut: ev.target.value })} className="rounded border border-outline px-2 py-1 text-sm" />;
        }
        return p?.clockOut ? new Date(p.clockOut).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '—';
      },
    },
    { key: 'totalHours', label: 'Saat', render: (e) => { const p = punches.find((x: any) => x.employeeId === e.id); return p?.totalHours ?? '—'; } },
    { key: 'overtime', label: 'Mesai', render: (e) => { const p = punches.find((x: any) => x.employeeId === e.id); return p?.overtimeHours ?? '—'; } },
    {
      key: 'status',
      label: 'Durum',
      render: (e) => {
        const p = punches.find((x: any) => x.employeeId === e.id);
        if (!p) return <span className="rounded bg-bg-subtle px-2 py-1 text-xs">Kayıt yok</span>;
        return <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">{punchStatusLabel[p.status]}</span>;
      },
    },
    {
      key: 'action',
      label: 'İşlem',
      render: (e) => {
        const p = punches.find((x: any) => x.employeeId === e.id);
        if (editingKey === `new-${e.id}` || (p && editingKey === p.id)) {
          return (
            <div className="flex gap-1">
              <button onClick={() => save(e.id)} className="rounded bg-primary px-2 py-1 text-xs text-white hover:bg-primary/90"><Save className="h-3 w-3" /></button>
              <button onClick={() => setEditingKey(null)} className="rounded border border-outline px-2 py-1 text-xs hover:bg-bg-subtle"><X className="h-3 w-3" /></button>
            </div>
          );
        }
        return (
          <button onClick={() => (p ? startEdit(p) : startNew(e.id))} className="rounded border border-outline bg-surface px-3 py-1 text-xs hover:bg-bg-subtle">
            {p ? 'Düzenle' : 'Ekle'}
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end">
        <TextInput label="Tarih" type="date" value={date} onChange={(e) => setDate((e.target as any).value)} />
      </div>

      {isLoading || empLoading ? <LoadingState /> : <DataTable data={employees} rowKey={(e) => e.id} columns={columns} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 2) AVANSLAR
// ════════════════════════════════════════════════════════════════════════

function AdvancesTab({ tenantId }: { tenantId: string }) {
  const push = (x: any) => toast(x.tone === 'error' ? '❌ ' + x.message : '✅ ' + x.message);
  const [filter, setFilter] = useState<string>('all');
  const { data: advances = [], isLoading } = useAdvances(filter === 'all' ? undefined : { status: filter });
  const { data: employeesResp } = useEmployees();
  const employees: any[] = Array.isArray(employeesResp) ? employeesResp : (employeesResp as any)?.data ?? [];
  const create = useCreateAdvance();
  const approve = useApproveAdvance();
  const pay = usePayAdvance();
  const reject = useRejectAdvance();

  const [form, setForm] = useState({ employeeId: '', amount: '', reason: '' });
  const [showForm, setShowForm] = useState(false);

  const submit = async () => {
    if (!form.employeeId || !form.amount) {
      push({ message: 'Personel ve tutar zorunlu', tone: 'error' });
      return;
    }
    try {
      await create.mutateAsync({ tenantId, employeeId: form.employeeId, amount: Number(form.amount), reason: form.reason });
      push({ message: 'Avans talebi oluşturuldu', tone: 'success' });
      setForm({ employeeId: '', amount: '', reason: '' });
      setShowForm(false);
    } catch (e: any) {
      push({ message: e.message ?? 'Hata', tone: 'error' });
    }
  };

  const columns: DataTableColumn<any>[] = [
    { key: 'employee', label: 'Personel', render: (a) => a.employee?.fullName ?? a.employeeId },
    { key: 'amount', label: 'Tutar', render: (a) => <span className="font-medium">{Number(a.amount).toLocaleString('tr-TR')} ₺</span> },
    { key: 'reason', label: 'Sebep', render: (a) => a.reason ?? '—' },
    { key: 'status', label: 'Durum', render: (a) => <span className={`rounded px-2 py-0.5 text-xs ${advanceStatusColor[a.status]}`}>{advanceStatusLabel[a.status]}</span> },
    { key: 'date', label: 'Tarih', render: (a) => new Date(a.createdAt).toLocaleDateString('tr-TR') },
    {
      key: 'action',
      label: 'İşlem',
      render: (a) => (
        <div className="flex gap-1">
          {a.status === 'PENDING' && (
            <>
              <button onClick={() => approve.mutate(a.id)} className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"><Check className="h-3 w-3" /></button>
              <button onClick={() => reject.mutate(a.id)} className="rounded border border-outline bg-surface px-2 py-1 text-xs hover:bg-bg-subtle"><X className="h-3 w-3" /></button>
            </>
          )}
          {a.status === 'APPROVED' && (
            <button onClick={() => pay.mutate({ id: a.id })} className="rounded bg-primary px-2 py-1 text-xs text-white hover:bg-primary/90">Öde</button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Avans Talepleri</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90">
          <Plus className="h-4 w-4" />Yeni Talep
        </button>
      </div>

      {showForm && (
        <div className="rounded-md border border-outline bg-bg-subtle p-4 space-y-3">
          <div>
            <label className="text-sm font-medium">Personel</label>
            <select
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              className="mt-1 w-full rounded border border-outline bg-surface px-3 py-2 text-sm"
            >
              <option value="">Seçin</option>
              {employees.filter((e: any) => e.status === 'ACTIVE').map((e: any) => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeNo})</option>
              ))}
            </select>
          </div>
          <TextInput label="Tutar (TL)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: (e.target as any).value })} />
          <TextInput label="Sebep" value={form.reason} onChange={(e) => setForm({ ...form, reason: (e.target as any).value })} />
          <button onClick={submit} className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90">Talep Oluştur</button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {['all', 'PENDING', 'APPROVED', 'PAID', 'DEDUCTED', 'REJECTED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${filter === s ? 'bg-primary text-white' : 'border border-outline bg-surface text-fg hover:bg-bg-subtle'}`}
          >
            {s === 'all' ? 'Tümü' : advanceStatusLabel[s]}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingState /> : advances.length === 0 ? <EmptyState title="Avans talebi yok" /> : (
        <DataTable data={advances as any[]} rowKey={(a) => a.id} columns={columns} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 3) EXCEL EXPORT
// ════════════════════════════════════════════════════════════════════════

function ExportTab({ tenantId: _ }: { tenantId: string }) {
  const push = (x: any) => toast(x.tone === 'error' ? '❌ ' + x.message : '✅ ' + x.message);
  const [year, setYear] = useState(new Date().getFullYear());
  const { data: periods = [], isLoading } = usePayrollPeriods();
  const exportExcel = useExportPayrollExcel();
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = (periods as any[]).filter((p) => p.year === year);

  const doExport = async (periodId: string) => {
    setBusy(periodId);
    try {
      const result: any = await exportExcel.mutateAsync(periodId);
      push({ message: `Excel indirildi: ${result.filename}`, tone: 'success' });
    } catch (e: any) {
      push({ message: e?.message ?? 'Export başarısız', tone: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const columns: DataTableColumn<any>[] = [
    { key: 'period', label: 'Dönem', render: (p) => `${p.year} - ${p.period}` },
    { key: 'type', label: 'Tip', render: (p) => p.periodType },
    { key: 'status', label: 'Durum', render: (p) => <span className="rounded border border-outline px-2 py-0.5 text-xs">{p.status}</span> },
    {
      key: 'action',
      label: 'İşlem',
      render: (p) => (
        <button onClick={() => doExport(p.id)} disabled={busy === p.id} className="flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary/90 disabled:opacity-50">
          <FileDown className="h-3 w-3" />Excel İndir
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-fg-muted">
        Dönem seçip Excel dosyası indirin. Dosya mali müşavire gönderilecek formatta 5 sheet içerir: Puantaj, İzinler, Avanslar, Bordro, Özet.
      </p>
      <div className="max-w-xs">
        <TextInput label="Yıl" type="number" value={String(year)} onChange={(e) => setYear(Number((e.target as any).value))} />
      </div>

      {isLoading ? <LoadingState /> : filtered.length === 0 ? <EmptyState title="Bu yıla ait dönem yok" /> : (
        <DataTable data={filtered} rowKey={(p) => p.id} columns={columns} />
      )}
    </div>
  );
}

export default HR8910Page;