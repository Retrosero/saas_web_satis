import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Plus, Filter, Package } from 'lucide-react';
import { usePortalCatalog, type PortalProduct } from '@/features/portal/api';
import { usePortalCart } from '@/features/portal/store';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { formatCurrency } from '@saas/shared';

export function PortalCatalogPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [inStockOnly, setInStockOnly] = useState(true);
  const { data, isLoading, error, refetch } = usePortalCatalog({ search: search || undefined, inStockOnly, pageSize: 48 });
  const cart = usePortalCart();
  const products: PortalProduct[] = data?.data ?? [];

  if (error) return <ErrorState message="Katalog yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-outline-variant bg-surface p-4">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs font-medium">Ürün Ara</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ürün adı veya kodu..." className="w-full rounded-md border border-outline bg-surface pl-10 pr-3 py-2 text-sm" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
          Sadece stoktakiler
        </label>
        <button onClick={() => navigate('/portal/cart')} className="ml-auto flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary">
          <ShoppingCart className="h-4 w-4" /> Sepetim ({cart.totalItems})
        </button>
      </div>

      {isLoading ? <LoadingState /> : products.length === 0 ? (
        <EmptyState icon={<Filter className="h-12 w-12" />} title="Ürün bulunamadı" description="Arama kriterlerinizi değiştirin" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <div key={p.id} onClick={() => navigate(`/portal/products/${p.id}`)} className="cursor-pointer rounded-lg border border-outline-variant bg-surface p-3 hover:shadow-md transition-shadow">
              <div className="aspect-square mb-2 rounded-md bg-surface-variant flex items-center justify-center">
                <Package className="h-12 w-12 text-on-surface-variant" />
              </div>
              <p className="font-mono text-xs text-on-surface-variant">{p.code}</p>
              <h3 className="text-sm font-semibold line-clamp-2 mb-1">{p.name}</h3>
              {p.brand && <p className="text-xs text-on-surface-variant">{p.brand.name}</p>}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-base font-bold text-primary">{formatCurrency(p.defaultSalePrice)}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${p.totalStock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {p.totalStock > 0 ? `${p.totalStock} adet` : 'Stokta yok'}
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); cart.add({ productId: p.id, code: p.code, name: p.name, price: p.defaultSalePrice, vatRate: p.defaultVatRate, quantity: 1 }); }}
                disabled={p.totalStock === 0}
                className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-primary bg-surface py-1.5 text-xs font-medium text-primary hover:bg-primary-container disabled:opacity-40"
              >
                <Plus className="h-3 w-3" /> Sepete Ekle
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
