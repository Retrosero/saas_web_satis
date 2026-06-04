import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import {
  HrLeaveRequestStatusLabels,
  HrLeaveRequestStatusColors,
} from '@saas/shared';
import {
  useLeaveRequest,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
  useCancelLeaveRequest,
  useLeaveTypes,
  useEmployees,
  useCreateLeaveRequest,
} from '@/features/hr/api';

export function LeaveRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: request, isLoading } = useLeaveRequest(id!);
  const { data: types } = useLeaveTypes();
  const approveMut = useApproveLeaveRequest();
  const rejectMut = useRejectLeaveRequest();
  const cancelMut = useCancelLeaveRequest();
  const [rejectReason, setRejectReason] = useState('');

  if (isLoading || !request) return <LoadingState />;

  const r = request as any;
  const isPending = r.status === 'PENDING';
  const isApproved = r.status === 'APPROVED';
  const isRejected = r.status === 'REJECTED';

  return (
    <div className="space-y-4">
      <PageHeader
        title="İzin Talebi Detay"
        description={r.employee?.fullName ?? 'Personel'}
        actions={
          <button onClick={() => navigate('/hr/leave/requests')} className="flex items-center gap-1 rounded-md border border-outline bg-surface px-3 py-2 text-sm hover:bg-bg-subtle">
            <ArrowLeft className="h-4 w-4" /> Geri
          </button>
        }
      />

      {/* Üst bilgi */}
      <div className="rounded-lg border border-outline bg-surface p-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{r.leaveType?.icon}</span>
          <div>
            <p className="text-lg font-semibold">{r.leaveType?.name}</p>
            <p className="text-sm text-fg-muted">
              {r.employee?.fullName} — {r.employee?.employeeNo}
              {r.employee?.department && ` • ${r.employee.department}`}
            </p>
          </div>
          <span className={'ml-auto rounded-full px-3 py-1 text-sm font-medium ' + (HrLeaveRequestStatusColors[r.status as keyof typeof HrLeaveRequestStatusColors] ?? 'bg-zinc-100')}>
            {HrLeaveRequestStatusLabels[r.status as keyof typeof HrLeaveRequestStatusLabels] ?? r.status}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-md bg-bg-subtle p-3">
            <p className="text-xs text-fg-muted">Başlangıç</p>
            <p className="font-semibold">{new Date(r.startDate).toLocaleDateString('tr-TR')}</p>
          </div>
          <div className="rounded-md bg-bg-subtle p-3">
            <p className="text-xs text-fg-muted">Bitiş</p>
            <p className="font-semibold">{new Date(r.endDate).toLocaleDateString('tr-TR')}</p>
          </div>
          <div className="rounded-md bg-bg-subtle p-3">
            <p className="text-xs text-fg-muted">İş Günü</p>
            <p className="font-semibold">{r.workingDays} gün</p>
          </div>
          <div className="rounded-md bg-bg-subtle p-3">
            <p className="text-xs text-fg-muted">Toplam Gün</p>
            <p className="font-semibold">{r.totalDays} gün</p>
          </div>
        </div>

        {r.reason && (
          <div className="mt-3 rounded-md bg-amber-50 p-3 text-sm">
            <p className="text-xs font-medium text-amber-700">Açıklama</p>
            <p className="mt-1 text-amber-900">{r.reason}</p>
          </div>
        )}

        {r.approver && (
          <p className="mt-3 text-xs text-fg-muted">
            {r.approvedAt ? '✓' : r.rejectedAt ? '✗' : '⏳'} {r.approver.fullName} tarafından{' '}
            {r.approvedAt ? 'onaylandı' : r.rejectedAt ? 'reddedildi' : 'onaylanacak'}:{' '}
            {r.approvedAt ? new Date(r.approvedAt).toLocaleString('tr-TR') : r.rejectedAt ? new Date(r.rejectedAt).toLocaleString('tr-TR') : ''}
          </p>
        )}

        {r.rejectionReason && (
          <div className="mt-2 rounded-md bg-red-50 p-3 text-sm">
            <p className="text-xs font-medium text-red-700">Red Nedeni</p>
            <p className="mt-1 text-red-900">{r.rejectionReason}</p>
          </div>
        )}

        {/* Aksiyonlar */}
        {isPending && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => approveMut.mutate(r.id)}
              disabled={approveMut.isPending}
              className="flex items-center gap-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" /> Onayla
            </button>
            <button
              onClick={() => {
                const reason = prompt('Red nedeni:');
                if (reason !== null) rejectMut.mutate({ id: r.id, reason });
              }}
              disabled={rejectMut.isPending}
              className="flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" /> Reddet
            </button>
            <button
              onClick={() => {
                if (confirm('Talebi iptal etmek istediğinize emin misiniz?')) {
                  cancelMut.mutate({ id: r.id });
                }
              }}
              disabled={cancelMut.isPending}
              className="rounded-md border border-outline bg-surface px-4 py-2 text-sm hover:bg-bg-subtle"
            >
              İptal Et
            </button>
          </div>
        )}

        {(isApproved || isRejected) && (
          <div className="mt-4">
            <button
              onClick={() => {
                if (confirm('Talebi iptal etmek istediğinize emin misiniz?')) {
                  cancelMut.mutate({ id: r.id });
                }
              }}
              disabled={cancelMut.isPending}
              className="rounded-md border border-outline bg-surface px-4 py-2 text-sm hover:bg-bg-subtle"
            >
              İptal Et
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function LeaveRequestFormPage() {
  const navigate = useNavigate();
  const { data: types } = useLeaveTypes();
  const { data: employeesData } = useEmployees({ status: 'ACTIVE' as any });
  const createMut = useCreateLeaveRequest();
  const [form, setForm] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const employees = (employeesData as any)?.data ?? [];

  const handleSubmit = async () => {
    if (!form.employeeId || !form.leaveTypeId || !form.startDate || !form.endDate) return;
    await createMut.mutateAsync({
      employeeId: form.employeeId,
      leaveTypeId: form.leaveTypeId,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason || undefined,
    });
    navigate('/hr/leave/requests');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Yeni İzin Talebi"
        description="Personelin izin başvurusu oluştur"
        actions={
          <button onClick={() => navigate('/hr/leave/requests')} className="flex items-center gap-1 rounded-md border border-outline bg-surface px-3 py-2 text-sm hover:bg-bg-subtle">
            <ArrowLeft className="h-4 w-4" /> Geri
          </button>
        }
      />

      <div className="rounded-lg border border-outline bg-surface p-4">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium">Personel *</label>
            <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
              <option value="">Seçin</option>
              {employees.map((e: any) => (
                <option key={e.id} value={e.id}>{e.fullName} — {e.employeeNo}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">İzin Türü *</label>
            <select value={form.leaveTypeId} onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
              <option value="">Seçin</option>
              {((types as any[]) ?? []).map((t: any) => (
                <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium">Başlangıç *</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Bitiş *</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Açıklama</label>
            <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" placeholder="İzin nedeni..." />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => navigate('/hr/leave/requests')} className="rounded-md border border-outline bg-surface px-4 py-2 text-sm hover:bg-bg-subtle">İptal</button>
          <button onClick={handleSubmit} disabled={!form.employeeId || !form.leaveTypeId || !form.startDate || !form.endDate || createMut.isPending} className="flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50">
            <CheckCircle2 className="h-4 w-4" /> {createMut.isPending ? 'Gönderiliyor...' : 'Talep Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}