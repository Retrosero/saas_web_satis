import { useState } from 'react';
import { Plus, Edit2, Trash2, Layers } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { useLeaveTypes, useCreateLeaveType, useUpdateLeaveType } from '@/features/hr/api';
import type { HrLeaveTypeCode, HrLeaveAccrualMethod } from '@saas/shared';
import { HrLeaveAccrualMethodLabels } from '@saas/shared';
import { HrLeaveTypeCodeLabels } from '@saas/shared';

interface LeaveTypeRow {
  id: string;
  name: string;
  code: string;
  color: string;
  icon: string;
  accrualMethod: string;
  defaultDaysPerYear: number;
  requiresApproval: boolean;
  requiresDocument: boolean;
  isPaid: boolean;
  canCarryOver: boolean;
}

export function LeaveTypesPage() {
  const { data: types, isLoading } = useLeaveTypes();
  const createMut = useCreateLeaveType();
  const updateMut = useUpdateLeaveType();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LeaveTypeRow | null>(null);
  const [form, setForm] = useState({
    name: '',
    code: '' as HrLeaveTypeCode,
    color: '#6B7280',
    icon: '📋',
    accrualMethod: 'STANDARD' as HrLeaveAccrualMethod,
    defaultDaysPerYear: 0,
    requiresApproval: true,
    requiresDocument: false,
    isPaid: true,
    canCarryOver: false,
  });

  const rows: LeaveTypeRow[] = (types as any[]) ?? [];

  const columns: DataTableColumn<LeaveTypeRow>[] = [
    {
      key: 'icon',
      label: '',
      render: (r) => <span className="text-xl">{r.icon}</span>,
    },
    {
      key: 'name',
      label: 'İzin Türü',
      render: (r) => (
        <div>
          <p className="font-medium">{r.name}</p>
          <p className="text-xs text-fg-muted">{r.code}</p>
        </div>
      ),
    },
    {
      key: 'accrual',
      label: 'Birikim',
      render: (r) => (
        <span className="text-sm">
          {HrLeaveAccrualMethodLabels[r.accrualMethod as HrLeaveAccrualMethod] ?? r.accrualMethod}
          {r.defaultDaysPerYear > 0 && ` (${r.defaultDaysPerYear} gün)`}
        </span>
      ),
    },
    {
      key: 'isPaid',
      label: 'Ücretli',
      render: (r) => (
        <span className={'rounded-full px-2 py-0.5 text-xs ' + (r.isPaid ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-600')}>
          {r.isPaid ? 'Ücretli' : 'Ücretsiz'}
        </span>
      ),
    },
    {
      key: 'requires',
      label: 'Onay',
      render: (r) => (
        <div className="flex gap-1 text-xs">
          {r.requiresApproval && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700">Onay</span>}
          {r.requiresDocument && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">Belge</span>}
          {r.canCarryOver && <span className="rounded bg-purple-100 px-1.5 py-0.5 text-purple-700">Devir</span>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="İzin Türleri"
        description="Sistemde tanımlı izin kategorilerini yönet"
        actions={
          <button
            onClick={() => { setEditing(null); setForm({ name: '', code: '' as HrLeaveTypeCode, color: '#6B7280', icon: '📋', accrualMethod: 'STANDARD', defaultDaysPerYear: 0, requiresApproval: true, requiresDocument: false, isPaid: true, canCarryOver: false }); setShowForm(true); }}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" /> Yeni İzin Türü
          </button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : (
        <>
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={rows}
              rowKey={(r) => r.id}
              onRowClick={(r) => { setEditing(r); setForm({ name: r.name, code: r.code as HrLeaveTypeCode, color: r.color, icon: r.icon, accrualMethod: r.accrualMethod as HrLeaveAccrualMethod, defaultDaysPerYear: r.defaultDaysPerYear, requiresApproval: r.requiresApproval, requiresDocument: r.requiresDocument, isPaid: r.isPaid, canCarryOver: r.canCarryOver }); setShowForm(true); }}
            />
          </div>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-lg bg-surface p-4 shadow-lg">
            <h3 className="mb-3 text-base font-semibold">{editing ? 'İzin Türü Düzenle' : 'Yeni İzin Türü'}</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs">Ad *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs">Kod *</label>
                  <select value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value as HrLeaveTypeCode })} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm">
                    {Object.keys(HrLeaveTypeCodeLabels).map((k) => (
                      <option key={k} value={k}>{HrLeaveTypeCodeLabels[k as HrLeaveTypeCode]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs">Renk</label>
                  <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-9 w-full rounded-md border border-outline" />
                </div>
                <div>
                  <label className="text-xs">İkon</label>
                  <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs">Yıllık Gün</label>
                  <input type="number" value={form.defaultDaysPerYear} onChange={(e) => setForm({ ...form, defaultDaysPerYear: Number(e.target.value) })} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs">Birikim Yöntemi</label>
                <select value={form.accrualMethod} onChange={(e) => setForm({ ...form, accrualMethod: e.target.value as HrLeaveAccrualMethod })} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm">
                  <option value="STANDARD">Yıl başında tam</option>
                  <option value="MONTHLY">Aylık eşit</option>
                  <option value="NONE">Sınırsız</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'requiresApproval', label: 'Onay Gerekli' },
                  { key: 'requiresDocument', label: 'Belge Gerekli' },
                  { key: 'isPaid', label: 'Ücretli' },
                  { key: 'canCarryOver', label: 'Yıl Sonu Devir' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-1.5 rounded-full border border-outline bg-surface px-3 py-1 text-xs cursor-pointer hover:bg-bg-subtle">
                    <input
                      type="checkbox"
                      checked={(form as any)[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                      className="accent-primary"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="rounded-md border border-outline bg-surface px-3 py-1.5 text-sm hover:bg-bg-subtle">İptal</button>
              <button
                onClick={async () => {
                  if (!form.name || !form.code) return;
                  if (editing) {
                    await updateMut.mutateAsync({ id: editing.id, ...form });
                  } else {
                    await createMut.mutateAsync(form);
                  }
                  setShowForm(false);
                }}
                disabled={createMut.isPending || updateMut.isPending}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50"
              >
                {editing ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}