import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, Search, Calendar, User, BarChart3, CheckCircle, AlertCircle, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { useStockCounts } from '@/features/stock-count/api';
import { formatDate, formatNumber } from '@saas/shared';

const STATUS_LABEL = {
  DRAFT: { text: 'Taslak', color: 'bg-surface-variant text-on-surface-variant' },
  IN_PROGRESS: { text: 'Devam Ediyor', color: 'bg-primary-container text-primary' },
  COMPLETED: { text: 'Tamamlandı', color: 'bg-secondary-container text-secondary' },
  PENDING_APPROVAL: { text: 'Onay Bekliyor', color: 'bg-tertiary-container text-tertiary' },
  APPROVED: { text: 'Onaylandı', color: 'bg-secondary-container text-secondary' },
  CANCELLED: { text: 'İptal', color: 'bg-error-container text-error' },
} as const;

const TYPE_LABEL = {
  FULL: 'Tam Sayım',
  PARTIAL: 'Kısmi',
  CYCLE: 'Dönemsel',
  SPOT: 'Ani Kontrol',
  CATEGORY: 'Kategori Bazlı',
} as const;

export function StockCountListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading } = useStockCounts({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const rows = (data?.data ?? []) as any[];

  const columns: DataTableColumn<any>[] = [
    {
      key: 'countNumber',
      label: 'Sayım No',
      width: '150px',
      render: (c) => <span className="font-mono font-semibold text-foreground">{c.countNumber}</span>,
    },
    {
      key: 'warehouseName',
      label: 'Depo',
      render: (c) => (
        <button onClick={() => navigate(`/warehouses/${c.warehouseId}`)} className="text-left font-medium hover:text-primary">
          {c.warehouseName}
        </button>
      ),
    },
    { key: 'name', label: 'Sayım Adı', render: (c) => c.name },
    {
      key: 'countType',
      label: 'Tip',
      hideOnMobile: true,
      render: (c) => <span className="text-xs">{(TYPE_LABEL as any)[c.countType] ?? c.countType}</span>,
    },
    {
      key: 'status',
      label: 'Durum',
      align: 'center',
      render: (c) => {
        const s = (STATUS_LABEL as any)[c.status];
        return <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${s?.color}`}>{s?.text ?? c.status}</span>;
      },
    },
    {
      key: 'totalProducts',
      label: 'Ürün',
      align: 'right',
      render: (c) => `${c.countedProducts}/${c.totalProducts}`,
    },
    {
      key: 'differenceCount',
      label: 'Fark',
      align: 'right',
      render: (c) => (
        <span className={c.differenceCount > 0 ? 'font-mono font-semibold text-error' : 'text-on-surface-variant'}>
          {c.differenceCount > 0 ? c.differenceCount : '—'}
        </span>
      ),
    },
    {
      key: 'startedAt',
      label: 'Başlangıç',
      hideOnMobile: true,
      render: (c) => c.startedAt ? formatDate(c.startedAt) : '—',
    },
    {
      key: 'actions',
      label: 'İşlem',
      align: 'right',
      render: (c) => (
        <button onClick={(e) => { e.stopPropagation(); navigate(`/stock-counts/${c.id}`); }} className="btn-ghost text-xs">
          Detay
        </button>
      ),
    },
  ];

  if (isLoading) return <LoadingState label="Sayımlar yükleniyor…" />;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Stok Sayım Modülü"
        description="Depo bazlı stok sayımı — taslaktan onaya kadar tüm aşamalar"
        actions={
          <button onClick={() => navigate('/stock-counts/new')} className="btn-primary">
            <Plus className="h-4 w-4" />
            Yeni Sayım
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(c) => c.id}
        onRowClick={(c) => navigate(`/stock-counts/${c.id}`)}
        search={{ value: search, onChange: setSearch, placeholder: 'Sayım no veya ad…' }}
        toolbar={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant"
          >
            <option value="all">Tüm durumlar</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v.text}</option>
            ))}
          </select>
        }
        totalLabel="sayım"
        emptyMessage="Henüz sayım yapılmamış"
      />

      <MobileCardList
        data={rows}
        keyFn={(c) => c.id}
        onItemClick={(c) => navigate(`/stock-counts/${c.id}`)}
        header={(c) => c.countNumber}
        subtitle={(c) => `${c.warehouseName} · ${c.name}`}
        rightBadge={(c) => {
          const s = (STATUS_LABEL as any)[c.status];
          return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s?.color}`}>{s?.text}</span>;
        }}
        footer={(c) => `${c.countedProducts}/${c.totalProducts} sayıldı`}
      />

      {rows.length === 0 && !isLoading && (
        <div className="card">
          <EmptyState
            icon={<ClipboardList className="h-8 w-8" />}
            title="Henüz sayım yok"
            description="Stok sayımı başlatmak için 'Yeni Sayım' butonunu kullanın."
            action={
              <button onClick={() => navigate('/stock-counts/new')} className="btn-primary">
                <Plus className="h-4 w-4" />
                İlk Sayımı Başlat
              </button>
            }
          />
        </div>
      )}
    </div>
  );
}