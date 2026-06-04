import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Filter, Eye, Edit2, Archive, FileText } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { MobileCardList } from '@/components/data/MobileCardList';
import { useEmployees, useArchiveEmployee } from '@/features/hr/api';
import { EmploymentStatusLabels } from '@saas/shared';
import type { HrEmployee } from '@saas/shared';

export function EmployeeListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const { data, isLoading } = useEmployees({ search: search || undefined, status: status as any || undefined });
  const archiveMut = useArchiveEmployee();
  const [confirmArchive, setConfirmArchive] = useState<string | null>(null);

  const employees: HrEmployee[] = (data?.data as any) ?? [];

  const columns: DataTableColumn<HrEmployee>[] = [
    {
      key: 'employeeNo',
      label: 'Personel No',
      width: '110px',
      render: (e) => <span className="font-mono text-xs">{e.employeeNo}</span>,
    },
    {
      key: 'fullName',
      label: 'Ad Soyad',
      render: (e) => (
        <div>
          <p className="font-semibold text-fg">{e.fullName}</p>
          {e.email && <p className="text-xs text-fg-muted">{e.email}</p>}
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Departman',
      render: (e) => e.employment?.department ?? <span className="text-fg-muted">—</span>,
    },
    {
      key: 'position',
      label: 'Görev',
      render: (e) => e.employment?.position ?? <span className="text-fg-muted">—</span>,
    },
    {
      key: 'branch',
      label: 'Şube',
      render: (e) => e.employment?.branch ?? <span className="text-fg-muted">—</span>,
    },
    {
      key: 'workingType',
      label: 'Çalışma Tipi',
      width: '120px',
      render: (e) => e.employment?.workingType ?? <span className="text-fg-muted">—</span>,
    },
    {
      key: 'hireDate',
      label: 'İşe Giriş',
      width: '110px',
      render: (e) => (e.hireDate ? new Date(e.hireDate).toLocaleDateString('tr-TR') : '—'),
    },
    {
      key: 'status',
      label: 'Durum',
      width: '100px',
      render: (e) => (
        <span
          className={
            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ' +
            (e.status === 'ACTIVE'
              ? 'bg-green-100 text-green-700'
              : e.status === 'ARCHIVED'
                ? 'bg-zinc-100 text-zinc-600'
                : 'bg-amber-100 text-amber-700')
          }
        >
          {EmploymentStatusLabels[e.status]}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '120px',
      render: (e) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={(ev) => {
              ev.stopPropagation();
              navigate(`/hr/employees/${e.id}`);
            }}
            className="rounded p-1 text-fg-muted hover:bg-bg-subtle hover:text-fg"
            title="Detay"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(ev) => {
              ev.stopPropagation();
              navigate(`/hr/employees/${e.id}/edit`);
            }}
            className="rounded p-1 text-fg-muted hover:bg-bg-subtle hover:text-fg"
            title="Düzenle"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          {e.status !== 'ARCHIVED' && (
            <button
              onClick={(ev) => {
                ev.stopPropagation();
                setConfirmArchive(e.id);
              }}
              className="rounded p-1 text-red-600 hover:bg-red-50"
              title="Arşivle"
            >
              <Archive className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Personel"
        description="Tüm çalışanlarınızın özlük bilgileri"
        actions={
          <button
            onClick={() => navigate('/hr/employees/new')}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" /> Yeni Personel
          </button>
        }
      />

      {/* Filtre bar */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
          <input
            type="text"
            placeholder="Ad, soyad, personel no, TC, telefon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-outline bg-surface px-8 py-2 text-sm placeholder:text-fg-muted focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-outline bg-surface px-3 py-2 text-sm"
        >
          <option value="">Tüm Durumlar</option>
          {Object.entries(EmploymentStatusLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : !employees.length ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="Henüz personel yok"
          description="Yeni personel ekleyerek başlayın"
          action={
            <button
              onClick={() => navigate('/hr/employees/new')}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover"
            >
              İlk Personeli Ekle
            </button>
          }
        />
      ) : (
        <>
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={employees}
              rowKey={(e) => e.id}
              onRowClick={(e) => navigate(`/hr/employees/${e.id}`)}
            />
          </div>
          <div className="md:hidden">
            <MobileCardList
              data={employees}
              keyFn={(e) => e.id}
              onItemClick={(e) => navigate(`/hr/employees/${e.id}`)}
              header={(e) => (
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-fg-muted">{e.employeeNo}</span>
                  <span className="text-xs text-fg-muted">
                    {EmploymentStatusLabels[e.status]}
                  </span>
                </div>
              )}
              subtitle={(e) => <p className="font-semibold">{e.fullName}</p>}
              footer={(e) => (
                <div className="flex items-center justify-between text-xs text-fg-muted">
                  <span>{e.employment?.department ?? '—'}</span>
                  <span>{e.employment?.position ?? '—'}</span>
                </div>
              )}
            />
          </div>
        </>
      )}

      <ConfirmModal
        open={!!confirmArchive}
        title="Personeli Arşivle"
        description="Bu personel soft delete ile arşivlenecek. Daha sonra geri getirilemez."
        confirmText="Arşivle"
        variant="danger"
        onClose={() => setConfirmArchive(null)}
        onConfirm={async () => {
          if (confirmArchive) {
            await archiveMut.mutateAsync(confirmArchive);
            setConfirmArchive(null);
          }
        }}
      />
    </div>
  );
}
