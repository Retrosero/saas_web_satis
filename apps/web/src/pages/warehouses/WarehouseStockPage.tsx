import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useWarehouse, useWarehouseStock } from '@/features/warehouses/api';
import { formatCurrency } from '@saas/shared';

export function WarehouseStockPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: warehouse, isLoading: ld } = useWarehouse(id);
  const { data: stock, isLoading, isError, error, refetch } = useWarehouseStock(id);

  const rows = stock ?? [];

  const columns: DataTableColumn<(typeof rows)[number]>[] = [
    {
      key: 'productCode',
      label: 'Ürün Kodu',
      width: '120px',
      render: (p) => <span className="font-mono">{p.productCode}</span>,
    },
    {
      key: 'productName',
      label: 'Ürün Adı',
      sortable: true,
      render: (p) => (
        <button
          onClick={() => navigate(`/products/${p.productId}`)}
          className="text-left font-medium text-foreground hover:text-primary"
        >
          {p.productName}
        </button>
      ),
    },
    {
      key: 'totalStock',
      label: 'Mevcut Stok',
      align: 'right',
      sortable: true,
      render: (p) => (
        <span className={`font-mono font-semibold ${
          p.minStock != null && p.totalStock < p.minStock ? 'text-error' : 'text-foreground'
        }`}>
          {p.totalStock.toLocaleString('tr-TR')}
          {p.unitName && <span className="text-xs text-on-surface-variant ml-1">{p.unitName}</span>}
        </span>
      ),
    },
    {
      key: 'minStock',
      label: 'Min. Stok',
      align: 'right',
      hideOnMobile: true,
      render: (p) => p.minStock != null ? p.minStock.toLocaleString('tr-TR') : '—',
    },
    {
      key: 'unitPrice',
      label: 'Birim Fiyat',
      align: 'right',
      hideOnMobile: true,
      render: (p) => formatCurrency(p.unitPrice),
    },
    {
      key: 'stockValue',
      label: 'Stok Değeri',
      align: 'right',
      sortable: true,
      render: (p) => <span className="font-mono font-medium">{formatCurrency(p.stockValue)}</span>,
    },
    {
      key: 'status',
      label: 'Durum',
      align: 'center',
      render: (p) => {
        if (p.minStock == null) return <span className="text-xs text-on-surface-variant">Takipsiz</span>;
        if (p.totalStock < p.minStock) {
          return <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-error-container text-error">Kritik</span>;
        }
        return <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary-container text-secondary">Yeterli</span>;
      },
    },
  ];

  if (ld || isLoading) return <LoadingState label="Stok bilgileri yükleniyor…" />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  const totalValue = rows.reduce((sum, p) => sum + p.stockValue, 0);
  const totalQty = rows.reduce((sum, p) => sum + p.totalStock, 0);
  const critical = rows.filter((p) => p.minStock != null && p.totalStock < p.minStock).length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={warehouse ? `${warehouse.code} — Stoklar` : 'Depo Stokları'}
        description={warehouse ? `${warehouse.name}${warehouse.branch ? ` • ${warehouse.branch}` : ''}` : 'Bu depodaki ürünler ve stok seviyeleri'}
        actions={
          <button onClick={() => navigate(`/warehouses/${id}`)} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            Depoya Dön
          </button>
        }
      />

      {/* Özet kartları */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3">
          <div className="text-xs text-on-surface-variant">Ürün Çeşidi</div>
          <div className="font-mono font-bold text-2xl text-foreground">{rows.length}</div>
        </div>
        <div className="card p-3">
          <div className="text-xs text-on-surface-variant">Toplam Stok</div>
          <div className="font-mono font-bold text-2xl text-primary">{totalQty.toLocaleString('tr-TR')}</div>
        </div>
        <div className="card p-3 bg-error-container">
          <div className="text-xs text-error">Kritik Stok</div>
          <div className="font-mono font-bold text-2xl text-error flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> {critical}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(p) => p.productId}
        totalLabel="ürün"
        emptyMessage="Bu depoda henüz ürün yok"
      />

      <MobileCardList
        data={rows}
        keyFn={(p) => p.productId}
        onItemClick={(p) => navigate(`/products/${p.productId}`)}
        header={(p) => p.productName}
        subtitle={(p) => p.productCode}
        rightBadge={(p) => {
          if (p.minStock != null && p.totalStock < p.minStock) {
            return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-error-container text-error">Kritik</span>;
          }
          return <span className="font-mono text-sm font-semibold">{p.totalStock.toLocaleString('tr-TR')}</span>;
        }}
        footer={(p) => `${formatCurrency(p.stockValue)} stok değeri`}
      />

      <div className="card p-3 bg-secondary-container text-secondary text-sm flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />
        <span>
          Toplam <strong>{rows.length}</strong> ürün / <strong>{totalQty.toLocaleString('tr-TR')}</strong> adet /{' '}
          <strong>{formatCurrency(totalValue)}</strong> stok değeri
        </span>
      </div>
    </div>
  );
}