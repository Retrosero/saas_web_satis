import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, Barcode, Warehouse as WarehouseIcon, TrendingUp, TrendingDown, Tag } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useProduct } from '@/features/products/api';
import { formatNumber, formatDate } from '@saas/shared';

export function ProductDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError, error, refetch } = useProduct(id);

  if (isLoading) return <LoadingState label="Ürün yükleniyor…" />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!product) return <div className="card p-8 text-center text-on-surface-variant">Ürün bulunamadı</div>;

  const stockLow = product.trackStock && product.minStock > 0 && product.totalStock < product.minStock;

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => navigate('/products')} className="btn-ghost self-start text-sm">
        <ArrowLeft className="h-4 w-4" />
        Ürün Listesine Dön
      </button>

      <PageHeader
        title={product.name}
        description={
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs text-on-surface-variant font-mono">{product.code}</span>
            {product.shortName && <span className="text-xs text-on-surface-variant">· {product.shortName}</span>}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="flex flex-col gap-4">
          <div className="card p-5 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide flex items-center gap-2">
              <Package className="h-4 w-4" />
              Ürün Bilgileri
            </h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Tip:</span>
                <span className="font-semibold">{product.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Durum:</span>
                <span className="font-semibold">{product.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">KDV:</span>
                <span className="font-mono">%{product.vatRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Stok Takibi:</span>
                <span className="font-semibold">{product.trackStock ? 'Açık' : 'Kapalı'}</span>
              </div>
              {product.brandName && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Marka:</span>
                  <span>{product.brandName}</span>
                </div>
              )}
              {product.categoryName && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Kategori:</span>
                  <span>{product.categoryName}</span>
                </div>
              )}
              {product.unitName && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Birim:</span>
                  <span>{product.unitName}</span>
                </div>
              )}
            </div>
          </div>

          {product.primaryBarcode && (
            <div className="card p-5 flex flex-col gap-2 text-sm">
              <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide flex items-center gap-2">
                <Barcode className="h-4 w-4" />
                Barkod
              </h3>
              <div className="font-mono text-base font-semibold">{product.primaryBarcode}</div>
            </div>
          )}

          {product.description && (
            <div className="card p-5 flex flex-col gap-2 text-sm">
              <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide">Açıklama</h3>
              <div className="text-foreground whitespace-pre-wrap">{product.description}</div>
            </div>
          )}

          <div className="card p-5 flex flex-col gap-2 text-xs text-on-surface-variant">
            <div>Oluşturuldu: {formatDate(product.createdAt)}</div>
            <div>Güncellendi: {formatDate(product.updatedAt)}</div>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Toplam Stok */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="card p-5">
              <div className="text-xs text-on-surface-variant uppercase tracking-wide mb-1 flex items-center gap-1">
                <Tag className="h-3 w-3" /> Toplam Stok
              </div>
              <div className={`text-3xl font-bold font-mono ${stockLow ? 'text-error' : 'text-foreground'}`}>
                {formatNumber(product.totalStock)}
              </div>
              <div className="text-xs text-on-surface-variant mt-1">{product.unitName || '—'}</div>
              {stockLow && <div className="text-xs text-error mt-1">Alt sınırın altında ({formatNumber(product.minStock)})</div>}
            </div>
            <div className="card p-5">
              <div className="text-xs text-on-surface-variant uppercase tracking-wide mb-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Min. Stok
              </div>
              <div className="text-3xl font-bold font-mono text-foreground">{formatNumber(product.minStock)}</div>
            </div>
            <div className="card p-5">
              <div className="text-xs text-on-surface-variant uppercase tracking-wide mb-1 flex items-center gap-1">
                <TrendingDown className="h-3 w-3" /> Max. Stok
              </div>
              <div className="text-3xl font-bold font-mono text-foreground">{formatNumber(product.maxStock)}</div>
            </div>
          </div>

          {/* Depo Bazında */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <WarehouseIcon className="h-4 w-4" />
                Depo Bazında Stok
              </h3>
            </div>
            {product.stockByWarehouse.length === 0 ? (
              <div className="p-8 text-center text-sm text-on-surface-variant">
                Henüz stok hareketi yok. Bu ürün için ilk hareketi oluşturun.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-container-low border-b border-outline-variant">
                    <tr>
                      <th className="text-left font-semibold text-foreground px-4 py-2">Depo</th>
                      <th className="text-right font-semibold text-foreground px-4 py-2">Miktar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.stockByWarehouse.map((s) => (
                      <tr key={s.warehouseId} className="border-b border-outline-variant last:border-0">
                        <td className="px-4 py-2 text-foreground">{s.warehouseName}</td>
                        <td className="px-4 py-2 text-right font-mono font-semibold">{formatNumber(s.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
