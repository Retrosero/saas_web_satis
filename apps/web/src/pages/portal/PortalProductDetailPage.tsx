import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, ShoppingCart, Package, Tag, Hash } from 'lucide-react';
import { usePortalProduct } from '@/features/portal/api';
import { usePortalCart } from '@/features/portal/store';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { formatCurrency } from '@saas/shared';

export function PortalProductDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const { data: p, isLoading, error, refetch } = usePortalProduct(id);
  const cart = usePortalCart();
  const [qty, setQty] = useState(1);

  if (isLoading) return <LoadingState />;
  if (error || !p) return <ErrorState message="Ürün yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-primary">
        <ArrowLeft className="h-4 w-4" /> Geri
      </button>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-outline-variant bg-surface">
          <div className="aspect-square bg-surface-variant flex items-center justify-center">
            <Package className="h-32 w-32 text-on-surface-variant" />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-outline-variant bg-surface p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="flex items-center gap-1 font-mono text-xs text-on-surface-variant"><Hash className="h-3 w-3" /> {p.code}</p>
              <h2 className="text-xl font-semibold mt-1">{p.name}</h2>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.totalStock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {p.totalStock > 0 ? `${p.totalStock} adet stokta` : 'Stokta yok'}
            </span>
          </div>

          {p.brand && <p className="text-sm"><Tag className="inline h-3 w-3" /> Marka: <span className="font-medium">{p.brand.name}</span></p>}
          {p.category && <p className="text-sm">Kategori: <span className="font-medium">{p.category.name}</span></p>}
          {p.primaryBarcode && <p className="text-sm font-mono">Barkod: {p.primaryBarcode}</p>}
          {p.description && <p className="text-sm text-on-surface-variant border-t border-outline-variant pt-3">{p.description}</p>}

          <div className="border-t border-outline-variant pt-3">
            <p className="text-3xl font-bold text-primary">{formatCurrency(p.defaultSalePrice)}</p>
            <p className="text-xs text-on-surface-variant">KDV dahil • %{p.defaultVatRate}</p>
          </div>

          {p.totalStock > 0 && (
            <div className="flex items-center gap-3 border-t border-outline-variant pt-3">
              <div className="flex items-center gap-2 rounded-md border border-outline">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-1.5 hover:bg-surface-variant"><Minus className="h-4 w-4" /></button>
                <span className="w-10 text-center font-semibold">{qty}</span>
                <button onClick={() => setQty(Math.min(p.totalStock, qty + 1))} className="p-1.5 hover:bg-surface-variant"><Plus className="h-4 w-4" /></button>
              </div>
              <button
                onClick={() => { cart.add({ productId: p.id, code: p.code, name: p.name, price: p.defaultSalePrice, vatRate: p.defaultVatRate, quantity: qty }); navigate('/portal/cart'); }}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary"
              >
                <ShoppingCart className="h-4 w-4" /> Sepete Ekle
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
