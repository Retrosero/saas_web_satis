import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Warehouse, Plus, MapPin, Package, Activity, Pencil, Power, ArrowLeftRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { useWarehouses } from '@/features/warehouses/api';
import { PageGuard } from '@/components/data/PageGuard';
import type { WarehouseStatus } from '@saas/shared';

const STATUS_LABEL: Record<WarehouseStatus, { text: string; color: string }> = {
  ACTIVE: { text: 'Aktif', color: 'bg-secondary-container text-secondary' },
  PASSIVE: { text: 'Pasif', color: 'bg-surface-variant text-on-surface-variant' },
};

export function WarehouseListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WarehouseStatus | 'all'>('all');

  const { data, isLoading, error } = useWarehouses({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const rows = data?.data ?? [];

  const columns: DataTableColumn<(typeof rows)[number]>[] = [
    {
      key: 'code',
      label: 'Kod',
      width: '110px',
      sortable: true,
      render: (w) => <span className="font-mono font-semibold">{w.code}</span>,
    },
    {
      key: 'name',
      label: 'Depo Adı',
      sortable: true,
      render: (w) => (
        <div>
          <div className="font-medium text-foreground">{w.name}</div>
          {w.branch && <div className="text-xs text-on-surface-variant">{w.branch}</div>}
        </div>
      ),
    },
    {
      key: 'city',
      label: 'Şehir',
      hideOnMobile: true,
      render: (w) => w.city ?? '—',
    },
    {
      key: 'manager',
      label: 'Sorumlu',
      hideOnMobile: true,
      render: (w) => w.manager ?? '—',
    },
    {
      key: 'productCount',
      label: 'Ürün',
      align: 'right',
      render: (w) => (w.productCount ?? 0).toLocaleString('tr-TR'),
    },
    {
      key: 'totalStock',
      label: 'Toplam Stok',
      align: 'right',
      sortable: true,
      render: (w) => (w.totalStock ?? 0).toLocaleString('tr-TR'),
    },
    {
      key: 'status',
      label: 'Durum',
      align: 'center',
      render: (w) => {
        const s = STATUS_LABEL[w.status];
        return <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${s.color}`}>{s.text}</span>;
      },
    },
    {
      key: 'lastMovementDate',
      label: 'Son Hareket',
      hideOnMobile: true,
      render: (w) => (w.lastMovementDate ? new Date(w.lastMovementDate).toLocaleDateString('tr-TR') : '—'),
    },
    {
      key: 'actions',
      label: 'İşlemler',
      align: 'right',
      render: (w) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => navigate(`/warehouses/${w.id}`)} className="btn-ghost text-xs">
            Detay
          </button>
          <button onClick={() => navigate(`/warehouses/${w.id}/stock`)} className="btn-ghost text-xs" title="Stoklar">
            <Package className="h-3 w-3" />
          </button>
          <button onClick={() => navigate(`/warehouses/transfer?from=${w.id}`)} className="btn-ghost text-xs" title="Transfer">
            <ArrowLeftRight className="h-3 w-3" />
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) return <LoadingState label="Depolar yükleniyor…" />;
  if (error) return <PageGuard allowed={false} title="Yükleme hatası" description={(error as Error).message} onBack={() => navigate('/dashboard')} />;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Depo Yönetimi"
        description="Depo tanımları, sorumlular, depolar arası transfer"
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate('/warehouses/transfer')} className="btn-ghost">
              <ArrowLeftRight className="h-4 w-4" />
              Transfer
            </button>
            <button onClick={() => navigate('/warehouses/new')} className="btn-primary">
              <Plus className="h-4 w-4" />
              Yeni Depo
            </button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(w) => w.id}
        onRowClick={(w) => navigate(`/warehouses/${w.id}`)}
        search={{ value: search, onChange: setSearch, placeholder: 'Depo adı/kod ile ara…' }}
        toolbar={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as WarehouseStatus | 'all')}
            className="h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant"
          >
            <option value="all">Tüm durumlar</option>
            <option value="ACTIVE">Aktif</option>
            <option value="PASSIVE">Pasif</option>
          </select>
        }
        totalLabel="depo"
        emptyMessage="Henüz depo eklenmemiş"
        total={data?.pagination.total}
      />

      {/* Mobile list */}
      <MobileCardList
        data={rows}
        keyFn={(w) => w.id}
        onItemClick={(w) => navigate(`/warehouses/${w.id}`)}
        header={(w) => `${w.code} — ${w.name}`}
        subtitle={(w) => w.branch ?? w.city ?? '—'}
        rightBadge={(w) => (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_LABEL[w.status].color}`}>
            {STATUS_LABEL[w.status].text}
          </span>
        )}
        footer={(w) => `${w.productCount ?? 0} ürün · ${(w.totalStock ?? 0).toLocaleString('tr-TR')} adet`}
      />

      {rows.length === 0 && !isLoading && (
        <div className="card">
          <EmptyState
            icon={<Warehouse className="h-8 w-8" />}
            title="Henüz depo yok"
            description="Ürünlerinizi takip edebilmek için önce depo tanımlayın."
            action={
              <button onClick={() => navigate('/warehouses/new')} className="btn-primary">
                <Plus className="h-4 w-4" />
                İlk Depoyu Oluştur
              </button>
            }
          />
        </div>
      )}
    </div>
  );
}