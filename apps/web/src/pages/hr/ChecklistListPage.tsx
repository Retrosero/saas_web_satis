import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ClipboardList, LogOut, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { MobileCardList } from '@/components/data/MobileCardList';
import {
  HrOnboardingStatusColors,
  HrOnboardingStatusLabels,
  type HrOnboardingStatus,
} from '@saas/shared';
import { useEmployees } from '@/features/hr/api';

type Mode = 'onboardings' | 'offboardings';

interface ChecklistRow {
  id: string;
  employeeId: string;
  employee: { id: string; fullName: string; employeeNo: string; department: string | null };
  startDate?: string;
  terminationDate?: string;
  reason?: string | null;
  status: HrOnboardingStatus;
  itemCount: number;
  createdAt: string;
}

interface ChecklistListPageProps {
  mode: Mode;
  useList: () => { data: ChecklistRow[] | undefined; isLoading: boolean };
  useStart: () => any;
  title: string;
  description: string;
  pathSegment: string;
  employeeField: 'startDate' | 'terminationDate';
  extraFields?: (row: ChecklistRow) => React.ReactNode;
}

export function ChecklistListPage({
  mode,
  useList,
  useStart,
  title,
  description,
  pathSegment,
  employeeField,
  extraFields,
}: ChecklistListPageProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useList();
  const startMut = useStart();
  const [showStart, setShowStart] = useState(false);
  const [form, setForm] = useState<{ employeeId: string; date: string; reason: string; notes: string }>({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
  });
  const { data: employeesData } = useEmployees({ status: 'ACTIVE' as any });
  const employees = (employeesData?.data as any) ?? [];

  const rows: ChecklistRow[] = data ?? [];

  const columns: DataTableColumn<ChecklistRow>[] = [
    {
      key: 'employee',
      label: 'Personel',
      render: (r) => (
        <div>
          <p className="font-semibold">{r.employee.fullName}</p>
          <p className="font-mono text-xs text-fg-muted">{r.employee.employeeNo}</p>
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Departman',
      render: (r) => r.employee.department ?? <span className="text-fg-muted">—</span>,
    },
    {
      key: 'date',
      label: employeeField === 'startDate' ? 'Başlangıç' : 'Çıkış Tarihi',
      render: (r) => {
        const d = employeeField === 'startDate' ? r.startDate : r.terminationDate;
        return d ? new Date(d).toLocaleDateString('tr-TR') : '—';
      },
    },
    ...(extraFields ? [({ key: 'extra', label: 'Detay', render: extraFields } as DataTableColumn<ChecklistRow>)] : []),
    {
      key: 'items',
      label: 'Maddeler',
      render: (r) => <span className="text-xs text-fg-muted">{r.itemCount} adet</span>,
    },
    {
      key: 'status',
      label: 'Durum',
      render: (r) => (
        <span className={'rounded-full px-2 py-0.5 text-xs font-medium ' + HrOnboardingStatusColors[r.status]}>
          {HrOnboardingStatusLabels[r.status]}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={title}
        description={description}
        actions={
          <button
            onClick={() => setShowStart(true)}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" /> {mode === 'onboardings' ? 'Yeni İşe Giriş' : 'Yeni İşten Çıkış'}
          </button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : !rows.length ? (
        <EmptyState
          icon={mode === 'onboardings' ? <ClipboardList className="h-12 w-12" /> : <LogOut className="h-12 w-12" />}
          title={mode === 'onboardings' ? 'Henüz işe giriş süreci yok' : 'Henüz işten çıkış süreci yok'}
          description={mode === 'onboardings' ? 'Yeni personel için checklist başlatın' : 'Çıkış süreci başlatın'}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={rows}
              rowKey={(r) => r.id}
              onRowClick={(r) => navigate(`/hr/checklists/${pathSegment}/${r.id}`)}
            />
          </div>
          <div className="md:hidden">
            <MobileCardList
              data={rows}
              keyFn={(r) => r.id}
              onItemClick={(r) => navigate(`/hr/checklists/${pathSegment}/${r.id}`)}
              header={(r) => (
                <div className="flex items-center justify-between">
                  <span className={'rounded-full px-2 py-0.5 text-[10px] font-medium ' + HrOnboardingStatusColors[r.status]}>
                    {HrOnboardingStatusLabels[r.status]}
                  </span>
                  <span className="font-mono text-xs text-fg-muted">{r.employee.employeeNo}</span>
                </div>
              )}
              subtitle={(r) => <p className="font-semibold">{r.employee.fullName}</p>}
              footer={(r) => (
                <p className="text-xs text-fg-muted">
                  {r.itemCount} madde • {r.employee.department ?? '—'}
                </p>
              )}
            />
          </div>
        </>
      )}

      {showStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-lg bg-surface p-4 shadow-lg">
            <h3 className="mb-3 text-base font-semibold">
              {mode === 'onboardings' ? 'Yeni İşe Giriş Süreci' : 'Yeni İşten Çıkış Süreci'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs">Personel *</label>
                <select
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm"
                >
                  <option value="">Seçin</option>
                  {employees.map((e: any) => (
                    <option key={e.id} value={e.id}>
                      {e.employeeNo} — {e.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs">{employeeField === 'startDate' ? 'Başlangıç Tarihi' : 'Çıkış Tarihi'} *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm"
                />
              </div>
              {mode === 'offboardings' && (
                <div>
                  <label className="text-xs">Çıkış Nedeni</label>
                  <textarea
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="text-xs">Notlar</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowStart(false)}
                className="rounded-md border border-outline bg-surface px-3 py-1.5 text-sm hover:bg-bg-subtle"
              >
                İptal
              </button>
              <button
                onClick={async () => {
                  if (!form.employeeId || !form.date) return;
                  await startMut.mutateAsync(
                    mode === 'onboardings'
                      ? { employeeId: form.employeeId, startDate: form.date, notes: form.notes || undefined }
                      : { employeeId: form.employeeId, terminationDate: form.date, reason: form.reason || undefined, notes: form.notes || undefined },
                  );
                  setShowStart(false);
                  setForm({ employeeId: '', date: new Date().toISOString().split('T')[0], reason: '', notes: '' });
                }}
                disabled={!form.employeeId || startMut.isPending}
                className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50"
              >
                <CheckCircle2 className="h-3 w-3" />
                {startMut.isPending ? 'Başlatılıyor...' : 'Başlat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
