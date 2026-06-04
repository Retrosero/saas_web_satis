import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CalendarDays } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { MobileCardList } from '@/components/data/MobileCardList';
import {
  HrLeaveRequestStatusLabels,
  HrLeaveRequestStatusColors,
} from '@saas/shared';
import { useLeaveRequests } from '@/features/hr/api';

interface RequestRow {
  id: string;
  employee: { id: string; fullName: string; employeeNo: string; department: string | null };
  leaveType: { id: string; name: string; code: string; color: string; icon: string };
  startDate: string;
  endDate: string;
  workingDays: number;
  status: string;
  approver?: { id: string; fullName: string } | null;
  reason: string | null;
  createdAt: string;
}

export function LeaveRequestsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data, isLoading } = useLeaveRequests(statusFilter ? { status: statusFilter } : undefined);

  const rows: RequestRow[] = (data as any[]) ?? [];

  const columns: DataTableColumn<RequestRow>[] = [
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
      key: 'type',
      label: 'İzin Türü',
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{r.leaveType.icon}</span>
          <span className="text-sm">{r.leaveType.name}</span>
        </div>
      ),
    },
    {
      key: 'dates',
      label: 'Tarih Aralığı',
      render: (r) => (
        <div>
          <p className="text-sm">
            {new Date(r.startDate).toLocaleDateString('tr-TR')} — {new Date(r.endDate).toLocaleDateString('tr-TR')}
          </p>
          <p className="text-xs text-fg-muted">{r.workingDays} iş günü</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Durum',
      render: (r) => {
        const colorClass =
          HrLeaveRequestStatusColors[r.status as keyof typeof HrLeaveRequestStatusColors] ??
          'bg-zinc-100 text-zinc-600';
        return (
          <span className={'rounded-full px-2 py-0.5 text-xs font-medium ' + colorClass}>
            {HrLeaveRequestStatusLabels[r.status as keyof typeof HrLeaveRequestStatusLabels] ?? r.status}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="İzin Talepleri"
        description="Personel izin talepleri ve onay yönetimi"
        actions={
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-outline bg-surface px-3 py-2 text-sm"
            >
              <option value="">Tümü</option>
              <option value="PENDING">Beklemede</option>
              <option value="APPROVED">Onaylandı</option>
              <option value="REJECTED">Reddedildi</option>
              <option value="CANCELLED">İptal Edildi</option>
            </select>
            <button
              onClick={() => navigate('/hr/leave/requests/new')}
              className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover"
            >
              <Plus className="h-4 w-4" /> Yeni Talep
            </button>
          </div>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : !rows.length ? (
        <EmptyState
          icon={<CalendarDays className="h-12 w-12" />}
          title="Henüz izin talebi yok"
          description="Personel izin talepleri burada görünür"
        />
      ) : (
        <>
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={rows}
              rowKey={(r) => r.id}
              onRowClick={(r) => navigate(`/hr/leave/requests/${r.id}`)}
            />
          </div>
          <div className="md:hidden">
            <MobileCardList
              data={rows}
              keyFn={(r) => r.id}
              onItemClick={(r) => navigate(`/hr/leave/requests/${r.id}`)}
              header={(r) => (
                <div className="flex items-center gap-2">
                  <span className="text-lg">{r.leaveType.icon}</span>
                  <span className="font-medium">{r.leaveType.name}</span>
                </div>
              )}
              subtitle={(r) => <p className="font-semibold">{r.employee.fullName}</p>}
              footer={(r) => (
                <p className="text-xs text-fg-muted">
                  {new Date(r.startDate).toLocaleDateString('tr-TR')} — {r.workingDays} gün
                </p>
              )}
            />
          </div>
        </>
      )}
    </div>
  );
}