import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Search, Barcode, AlertCircle, Warehouse as WarehouseIcon } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/data/EmptyState';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useProducts } from '@/features/products/api';
import { usePermission } from '@/lib/usePermission';
import { formatNumber } from '@saas/shared';
import type { ProductStatus, ProductType } from '@saas/shared';

const TYPE_LABEL: Record<ProductType, string> = {
  GOODS: 'Ticari Mal',
  SERVICE: 'Hizmet',
  RAW_MATERIAL: 'Hammadde',
  FINISHED_GOOD: 'Mamul',
  CONSUMABLE: 'Sarf Malzeme',
};

const STATUS_LABEL: Record<ProductStatus, { text: string; color: string }> = {
  DRAFT: { text: 'Taslak', color: 'bg-surface-variant text-on-surface-variant' },
  ACTIVE: { text: 'Aktif', color: 'bg-secondary-container text-secondary' },
  PASSIVE: { text: 'Pasif', color: 'bg-surface-variant text-on-surface-variant' },
  DISCONTINUED: { text: 'Üretimi Durdu', color: 'bg-error-container text-error' },
};

export function ProductListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ProductType | undefined>();
  const [statusFilter, setStatusFilter] = useState<ProductStatus | undefined>();

  const { data, isLoading, isError, error, refetch } = useProducts({
    search: search || undefined,
    type: typeFilter,
    status: statusFilter,
    pageSize: 100,
  });

  const canCreate = usePermission('stok:product:create');

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Ürünler / Stok"
        description="Ürün kartları ve anlık stok miktarları (event-sourcing)"
        actions={
          canCreate ? (
            <button onClick={() => navigate('/products/new')} className="btn-primary">
              <Plus className="h-4 w-4" />
              Yeni Ürün
            </button>
          ) : null
        }
      />

      {/* Filtreler */}
      <div className="card p-3 flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ürün kodu, adı veya barkod…"
            className="w-full h-10 pl-10 pr-4 rounded-md bg-surface-container text-sm border border-outline-variant focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={typeFilter ?? ''}
          onChange={(e) => setTypeFilter((e.target.value as ProductType) || undefined)}
          className="h-10 px-3 rounded-md bg-surface-container text-sm border border-outline-variant"
        >
          <option value="">Tüm tipler</option>
          {Object.entries(TYPE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={statusFilter ?? ''}
          onChange={(e) => setStatusFilter((e.target.value as ProductStatus) || undefined)}
          className="h-10 px-3 rounded-md bg-surface-container text-sm border border-outline-variant"
        >
          <option value="">Tüm durumlar</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l.text}</option>
          ))}
        </select>
      </div>

      {isLoading && <LoadingState label="Ürünler yükleniyor…" />}
      {isError && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {data && data.data.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<Package className="h-8 w-8" />}
            title="Henüz ürün yok"
            description="Ürün kartları satış, alış ve stok işlemlerinde kullanılır. İlk ürününüzü oluşturarak başlayın."
            action={
              canCreate ? (
                <button onClick={() => navigate('/products/new')} className="btn-primary">
                  <Plus className="h-4 w-4" />
                  İlk Ürünü Oluştur
                </button>
              ) : null
            }
          />
        </div>
      )}
      {data && data.data.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container border-b border-outline-variant">
                <tr>
                  <th className="text-left font-semibold text-foreground px-4 py-3">Ürün</th>
                  <th className="text-left font-semibold text-foreground px-4 py-3">Tip</th>
                  <th className="text-left font-semibold text-foreground px-4 py-3">Kategori/Marka</th>
                  <th className="text-right font-semibold text-foreground px-4 py-3">Stok</th>
                  <th className="text-right font-semibold text-foreground px-4 py-3">KDV</th>
                  <th className="text-center font-semibold text-foreground px-4 py-3">Durum</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((p) => {
                  const s = STATUS_LABEL[p.status];
                  const lowStock = p.trackStock && p.minStock > 0 && p.totalStock < p.minStock;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/products/${p.id}`)}
                      className="border-b border-outline-variant last:border-0 hover:bg-surface-container cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{p.name}</div>
                        <div className="text-xs text-on-surface-variant font-mono mt-0.5">{p.code}</div>
                        {p.primaryBarcode && (
                          <div className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                            <Barcode className="h-3 w-3" /> {p.primaryBarcode}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{TYPE_LABEL[p.type]}</td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">
                        {p.categoryName ?? '—'}
                        {p.brandName && <span> / {p.brandName}</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className={`font-mono font-semibold ${lowStock ? 'text-error' : 'text-foreground'}`}>
                          {formatNumber(p.totalStock)} {p.unitName}
                        </div>
                        {lowStock && (
                          <div className="text-xs text-error flex items-center justify-end gap-1 mt-0.5">
                            <AlertCircle className="h-3 w-3" />
                            Alt sınır: {formatNumber(p.minStock)}
                          </div>
                        )}
                        {!p.trackStock && (
                          <div className="text-xs text-on-surface-variant mt-0.5">Stok takipsiz</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-on-surface-variant">%{p.vatRate}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${s.color}`}>
                          {s.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-outline-variant bg-surface-container text-xs text-on-surface-variant flex justify-between">
            <span>Toplam {data.pagination.total} ürün</span>
            <span className="flex items-center gap-1">
              <WarehouseIcon className="h-3 w-3" />
              Stok miktarları tüm depoların toplamı (event-sourcing)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
