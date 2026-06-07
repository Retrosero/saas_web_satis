import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  FileText,
  Printer,
  Package,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import {
  useSale,
  useConfirmSale,
  useCancelSale,
} from '@/features/sales/api';
import { usePermission } from '@/lib/usePermission';
import { formatCurrency, formatDate } from '@saas/shared';
import type { PaymentStatus, SaleStatus, SaleType } from '@saas/shared';
import toast from 'react-hot-toast';

const STATUS_LABEL: Record<SaleStatus, { text: string; color: string }> = {
  DRAFT: { text: 'Taslak', color: 'bg-surface-variant text-on-surface-variant' },
  CONFIRMED: { text: 'Onaylandı', color: 'bg-primary-container text-primary' },
  PARTIALLY_SHIPPED: { text: 'Kısmi Sevk', color: 'bg-tertiary-container text-tertiary' },
  SHIPPED: { text: 'Sevk Edildi', color: 'bg-secondary-container text-secondary' },
  DELIVERED: { text: 'Teslim Edildi', color: 'bg-secondary-container text-secondary' },
  PARTIALLY_PAID: { text: 'Kısmi Ödeme', color: 'bg-tertiary-container text-tertiary' },
  PAID: { text: 'Ödendi', color: 'bg-secondary-container text-secondary' },
  OVERDUE: { text: 'Vadesi Geçmiş', color: 'bg-error-container text-error' },
  CANCELLED: { text: 'İptal', color: 'bg-error-container text-error' },
  CLOSED: { text: 'Kapalı', color: 'bg-surface-variant text-on-surface-variant' },
};

const PAYMENT_LABEL: Record<PaymentStatus, { text: string; color: string }> = {
  UNPAID: { text: 'Ödenmedi', color: 'bg-error-container text-error' },
  PARTIALLY_PAID: { text: 'Kısmi Ödeme', color: 'bg-tertiary-container text-tertiary' },
  PAID: { text: 'Ödendi', color: 'bg-secondary-container text-secondary' },
};

const SALE_TYPE_LABEL: Record<SaleType, string> = {
  SALE: 'Satış',
  RETURN: 'İade',
  PROFORMA: 'Teklif',
  CONSIGNMENT_OUT: 'Konsiye Çıkış',
  CONSIGNMENT_IN: 'Konsiye Giriş',
};

export function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useSale(id);
  const confirmMutation = useConfirmSale();
  const cancelMutation = useCancelSale();

  const canCancelSale = usePermission('satis:sale:cancel');

  const st = data ? STATUS_LABEL[data.status] : null;
  const py = data ? PAYMENT_LABEL[data.paymentStatus] : null;

  const handleConfirm = () => {
    if (
      !window.confirm(
        'Bu satış onaylanacak.\n\nStok çıkışı ve cari borç hareketi otomatik oluşturulur.\n\nGerçekten onaylamak istiyor musunuz?',
      )
    )
      return;
    confirmMutation.mutate(id!, {
      onSuccess: () => {
        toast.success('Satış onaylandı — stok ve cari hareketleri oluşturuldu');
        refetch();
      },
      onError: (err: unknown) => {
        toast.error(
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Onaylama başarısız',
        );
      },
    });
  };

  const handleCancel = () => {
    if (!data) return;
    const reason = window.prompt('İptal sebebi (opsiyonel):');
    if (reason === null) return;
    cancelMutation.mutate(
      { id: id!, reason },
      {
        onSuccess: () => {
          toast.success('Satış iptal edildi — ters hareketler oluşturuldu');
          refetch();
        },
        onError: (err: unknown) => {
          toast.error(
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
              'İptal başarısız',
          );
        },
      },
    );
  };

  const canConfirm = data?.status === 'DRAFT';
  const canCancel = data?.status === 'CONFIRMED';

  if (isLoading) return <LoadingState label="Satış yükleniyor…" />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={data.saleNumber}
        description={`${SALE_TYPE_LABEL[data.type]} — ${data.customerName}`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/sales')} className="btn-ghost">
              <ArrowLeft className="h-4 w-4" />
              Satışlara Dön
            </button>
            {data.status === 'CONFIRMED' && (
              <button className="btn-ghost">
                <Printer className="h-4 w-4" />
                Yazdır
              </button>
            )}
          </div>
        }
      />

      {(st || py) && (
        <div className="flex items-center gap-2">
          {st && (
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${st.color}`}>
              {st.text}
            </span>
          )}
          {py && (
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${py.color}`}>
              {py.text}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                Satış Kalemleri ({data.items.length})
              </h3>
            </div>
            {data.items.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-on-surface-variant">Kalem yok</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-surface-container border-b border-outline-variant">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-foreground w-8">#</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Ürün</th>
                    <th className="text-right px-4 py-3 font-semibold text-foreground w-24">Miktar</th>
                    <th className="text-right px-4 py-3 font-semibold text-foreground w-28">Birim Fiyat</th>
                    <th className="text-right px-4 py-3 font-semibold text-foreground w-12">KDV</th>
                    <th className="text-right px-4 py-3 font-semibold text-foreground w-12">İsk%</th>
                    <th className="text-right px-4 py-3 font-semibold text-foreground w-32">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, idx) => {
                    const net =
                      item.quantity * item.unitPrice * (1 - item.discountRate / 100);
                    const vat = net * (item.vatRate / 100);
                    const lineTotal = net + vat;
                    return (
                      <tr key={item.id} className="border-b border-outline-variant last:border-0">
                        <td className="px-4 py-3 text-on-surface-variant">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">
                            {item.description ?? item.productId}
                          </div>
                          <div className="text-xs font-mono text-on-surface-variant">
                            {item.productId}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-foreground">
                          {item.quantity.toLocaleString('tr-TR')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-foreground">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-on-surface-variant">
                          {item.vatRate}%
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {item.discountRate > 0 ? (
                            <span className="text-tertiary">{item.discountRate}%</span>
                          ) : (
                            <span className="text-on-surface-variant">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                          {formatCurrency(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {(data.notes || data.internalNotes) && (
            <div className="card p-4">
              {data.notes && (
                <div className="mb-3">
                  <h4 className="text-xs font-semibold text-on-surface-variant mb-1">Not</h4>
                  <p className="text-sm text-foreground">{data.notes}</p>
                </div>
              )}
              {data.internalNotes && (
                <div>
                  <h4 className="text-xs font-semibold text-on-surface-variant mb-1">Dahili Not</h4>
                  <p className="text-sm text-tertiary italic">{data.internalNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Müşteri
            </h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="font-medium text-foreground">{data.customerName}</div>
              {data.customerTaxNumber && (
                <div className="text-on-surface-variant font-mono text-xs">
                  Vergi no: {data.customerTaxNumber}
                </div>
              )}
              {data.customerEmail && (
                <div className="text-on-surface-variant text-xs">{data.customerEmail}</div>
              )}
              {data.customerPhone && (
                <div className="text-on-surface-variant text-xs">{data.customerPhone}</div>
              )}
              {data.customerAddress && (
                <div className="text-on-surface-variant text-xs mt-1">{data.customerAddress}</div>
              )}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Belgeler
            </h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Tarih</span>
                <span className="text-foreground font-medium">{formatDate(data.saleDate)}</span>
              </div>
              {data.dueDate && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Vade</span>
                  <span className="text-foreground font-medium">{formatDate(data.dueDate)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Para birimi</span>
                <span className="text-foreground font-mono font-medium">{data.currency}</span>
              </div>
              {data.exchangeRate !== 1 && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Döviz kuru</span>
                  <span className="text-foreground font-mono">{data.exchangeRate}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-foreground mb-3">Tutar Özeti</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Ara Toplam</span>
                <span className="font-mono font-medium text-foreground">
                  {formatCurrency(data.subTotal)}
                </span>
              </div>
              {data.discountTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">İskonto</span>
                  <span className="font-mono text-tertiary">
                    −{formatCurrency(data.discountTotal)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-on-surface-variant">KDV</span>
                <span className="font-mono font-medium text-foreground">
                  {formatCurrency(data.vatTotal)}
                </span>
              </div>
              <div className="flex justify-between border-t border-outline-variant pt-2 mt-1">
                <span className="font-semibold text-foreground">Genel Toplam</span>
                <span className="font-mono font-bold text-primary text-lg">
                  {formatCurrency(data.grandTotal)}
                </span>
              </div>
              {data.paidAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Ödenen</span>
                  <span className="font-mono text-secondary">{formatCurrency(data.paidAmount)}</span>
                </div>
              )}
              {data.paymentStatus === 'PARTIALLY_PAID' && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Kalan</span>
                  <span className="font-mono text-error">
                    {formatCurrency(Number(data.grandTotal) - Number(data.paidAmount))}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="card p-4 flex flex-col gap-2">
            {canConfirm && (
              <button
                onClick={handleConfirm}
                disabled={confirmMutation.isPending}
                className="w-full font-semibold py-2.5 rounded-md bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {confirmMutation.isPending ? 'Onaylanıyor…' : '✓ Satışı Onayla'}
              </button>
            )}
            {canCancelSale && canCancel && (
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="w-full font-semibold py-2.5 rounded-md bg-error-container text-error hover:bg-error-container-hover disabled:opacity-50 transition-colors"
              >
                {cancelMutation.isPending ? 'İptal ediliyor…' : '✕ Satışı İptal Et'}
              </button>
            )}
            {data.status === 'CANCELLED' && (
              <div className="flex items-start gap-2 text-xs text-on-surface-variant pt-1">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>
                  Bu satış iptal edilmiştir — cari/stok hareketleri tersine çevrilmiştir
                </span>
              </div>
            )}
            {data.status === 'DRAFT' && (
              <div className="flex items-start gap-2 text-xs text-on-surface-variant pt-1">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>
                  Taslak satış silinebilir (onaylanmadığı için stok/carı hareketi yoktur)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
