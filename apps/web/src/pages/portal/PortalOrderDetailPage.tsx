import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, FileText, Calendar, MapPin, Hash } from 'lucide-react';
import { usePortalOrder } from '@/features/portal/api';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { formatCurrency, formatDate } from '@saas/shared';

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Bekliyor', CONFIRMED: 'Onaylandı', PARTIALLY_SHIPPED: 'Kısmi Sevk', SHIPPED: 'Sevk Edildi', DELIVERED: 'Teslim Edildi', COMPLETED: 'Tamamlandı', CANCELLED: 'İptal',
};

export function PortalOrderDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const { data: o, isLoading, error, refetch } = usePortalOrder(id);

  if (isLoading) return <LoadingState />;
  if (error || !o) return <ErrorState message="Sipariş yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/portal/orders')} className="flex items-center gap-2 text-sm text-primary">
        <ArrowLeft className="h-4 w-4" /> Siparişlerim
      </button>

      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-mono text-lg font-bold">{o.orderNumber}</p>
            <p className="text-sm text-on-surface-variant"><Calendar className="inline h-3 w-3" /> {formatDate(o.orderDate)}{o.deliveryDate && ` • Teslim: ${formatDate(o.deliveryDate)}`}</p>
          </div>
          <span className="rounded-full bg-primary-container px-3 py-1 text-sm font-medium text-on-primary-container">
            {ORDER_STATUS_LABEL[o.status] ?? o.status}
          </span>
        </div>
        {o.warehouse && <p className="mt-2 text-sm"><MapPin className="inline h-3 w-3" /> Depo: {o.warehouse}</p>}
      </div>

      <div className="rounded-lg border border-outline-variant bg-surface">
        <div className="border-b border-outline-variant p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Package className="h-4 w-4" /> Sipariş Kalemleri</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-variant text-xs">
              <tr>
                <th className="px-3 py-2 text-left">Ürün</th>
                <th className="px-3 py-2 text-right">Miktar</th>
                <th className="px-3 py-2 text-right">Birim Fiyat</th>
                <th className="px-3 py-2 text-right">KDV</th>
                <th className="px-3 py-2 text-right">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {o.items.map((it, idx) => (
                <tr key={idx} className="border-t border-outline-variant">
                  <td className="px-3 py-2">
                    <p className="font-mono text-xs">{it.productCode}</p>
                    <p className="font-medium">{it.productName}</p>
                    {it.description && <p className="text-xs text-on-surface-variant">{it.description}</p>}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{it.quantity}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(it.unitPrice)}</td>
                  <td className="px-3 py-2 text-right">%{it.vatRate}</td>
                  <td className="px-3 py-2 text-right font-semibold">{formatCurrency(it.lineGrandTotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-outline bg-surface-variant text-sm">
              <tr><td colSpan={4} className="px-3 py-2 text-right">Ara Toplam</td><td className="px-3 py-2 text-right">{formatCurrency(o.subTotal)}</td></tr>
              <tr><td colSpan={4} className="px-3 py-2 text-right">KDV</td><td className="px-3 py-2 text-right">{formatCurrency(o.vatTotal)}</td></tr>
              <tr className="text-base font-bold"><td colSpan={4} className="px-3 py-2 text-right">Toplam</td><td className="px-3 py-2 text-right text-primary">{formatCurrency(o.grandTotal)}</td></tr>
            </tfoot>
          </table>
        </div>
      </div>

      {o.notes && (
        <div className="rounded-lg border border-outline-variant bg-surface p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4" /> Notlar</h3>
          <p className="mt-2 text-sm text-on-surface-variant">{o.notes}</p>
        </div>
      )}
    </div>
  );
}
