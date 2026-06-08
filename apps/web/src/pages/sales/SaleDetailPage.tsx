import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Building2, FileText, Package, Pencil, Printer, Trash2, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useCancelSale, useConfirmSale, useDeleteSale, useSale } from '@/features/sales/api';
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
  const deleteMutation = useDeleteSale();
  const canCancelSale = usePermission('satis:sale:cancel');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) return <LoadingState label="Satış yükleniyor..." />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!data) return null;

  const st = STATUS_LABEL[data.status];
  const py = PAYMENT_LABEL[data.paymentStatus];
  const canConfirm = data.status === 'DRAFT';
  const canEdit = data.status === 'DRAFT';
  const canDelete = data.status === 'DRAFT';
  const canCancel = data.status === 'CONFIRMED';

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
            <button onClick={() => window.print()} className="btn-ghost">
              <Printer className="h-4 w-4" />
              Yazdır
            </button>
            {canEdit && (
              <button onClick={() => navigate(`/sales/${data.id}/edit`)} className="btn-secondary">
                <Pencil className="h-4 w-4" />
                Düzenle
              </button>
            )}
            {canDelete && (
              <button onClick={() => setDeleteOpen(true)} className="rounded-md bg-error-container px-3 py-2 text-sm font-medium text-error">
                <Trash2 className="mr-2 inline h-4 w-4" />
                Sil
              </button>
            )}
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${st.color}`}>{st.text}</span>
        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${py.color}`}>{py.text}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="border-b border-outline-variant bg-surface-container px-4 py-3">
              <h3 className="flex items-center gap-2 font-semibold text-foreground">
                <Package className="h-4 w-4" />
                Satış Kalemleri ({data.items.length})
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead className="border-b border-outline-variant bg-surface-container">
                <tr>
                  <th className="w-8 px-4 py-3 text-left font-semibold text-foreground">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Ürün</th>
                  <th className="w-24 px-4 py-3 text-right font-semibold text-foreground">Miktar</th>
                  <th className="w-28 px-4 py-3 text-right font-semibold text-foreground">Birim Fiyat</th>
                  <th className="w-12 px-4 py-3 text-right font-semibold text-foreground">KDV</th>
                  <th className="w-12 px-4 py-3 text-right font-semibold text-foreground">İsk%</th>
                  <th className="w-32 px-4 py-3 text-right font-semibold text-foreground">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, idx) => {
                  const net = item.quantity * item.unitPrice * (1 - item.discountRate / 100);
                  const vat = net * (item.vatRate / 100);
                  const lineTotal = net + vat;
                  return (
                    <tr key={item.id} className="border-b border-outline-variant last:border-0">
                      <td className="px-4 py-3 text-on-surface-variant">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{item.description ?? item.productId}</div>
                        <div className="text-xs font-mono text-on-surface-variant">{item.productId}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">{item.quantity.toLocaleString('tr-TR')}</td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right font-mono text-on-surface-variant">{item.vatRate}%</td>
                      <td className="px-4 py-3 text-right font-mono">{item.discountRate > 0 ? <span className="text-tertiary">{item.discountRate}%</span> : <span className="text-on-surface-variant">—</span>}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">{formatCurrency(lineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(data.notes || data.internalNotes) && (
            <div className="card p-4">
              {data.notes && <div className="mb-3"><h4 className="mb-1 text-xs font-semibold text-on-surface-variant">Not</h4><p className="text-sm text-foreground">{data.notes}</p></div>}
              {data.internalNotes && <div><h4 className="mb-1 text-xs font-semibold text-on-surface-variant">Dahili Not</h4><p className="text-sm italic text-tertiary">{data.internalNotes}</p></div>}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground"><Building2 className="h-4 w-4" /> Müşteri</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="font-medium text-foreground">{data.customerName}</div>
              {data.customerTaxNumber && <div className="font-mono text-xs text-on-surface-variant">Vergi no: {data.customerTaxNumber}</div>}
              {data.customerEmail && <div className="text-xs text-on-surface-variant">{data.customerEmail}</div>}
              {data.customerPhone && <div className="text-xs text-on-surface-variant">{data.customerPhone}</div>}
              {data.customerAddress && <div className="mt-1 text-xs text-on-surface-variant">{data.customerAddress}</div>}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground"><FileText className="h-4 w-4" /> Belgeler</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant">Tarih</span><span className="font-medium text-foreground">{formatDate(data.saleDate)}</span></div>
              {data.dueDate && <div className="flex justify-between"><span className="text-on-surface-variant">Vade</span><span className="font-medium text-foreground">{formatDate(data.dueDate)}</span></div>}
              <div className="flex justify-between"><span className="text-on-surface-variant">Para birimi</span><span className="font-mono font-medium text-foreground">{data.currency}</span></div>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="mb-3 font-semibold text-foreground">Tutar Özeti</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant">Ara Toplam</span><span className="font-mono font-medium text-foreground">{formatCurrency(data.subTotal)}</span></div>
              {data.discountTotal > 0 && <div className="flex justify-between"><span className="text-on-surface-variant">İskonto</span><span className="font-mono text-tertiary">−{formatCurrency(data.discountTotal)}</span></div>}
              <div className="flex justify-between"><span className="text-on-surface-variant">KDV</span><span className="font-mono font-medium text-foreground">{formatCurrency(data.vatTotal)}</span></div>
              <div className="mt-1 flex justify-between border-t border-outline-variant pt-2"><span className="font-semibold text-foreground">Genel Toplam</span><span className="font-mono text-lg font-bold text-primary">{formatCurrency(data.grandTotal)}</span></div>
            </div>
          </div>

          <div className="card flex flex-col gap-2 p-4">
            {canConfirm && (
              <button onClick={() => setConfirmOpen(true)} disabled={confirmMutation.isPending} className="w-full rounded-md bg-primary py-2.5 font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-50">
                Satışı Onayla
              </button>
            )}
            {canCancelSale && canCancel && (
              <button onClick={() => setCancelOpen(true)} disabled={cancelMutation.isPending} className="w-full rounded-md bg-error-container py-2.5 font-semibold text-error hover:bg-error-container-hover disabled:opacity-50">
                <XCircle className="mr-2 inline h-4 w-4" />
                Satışı İptal Et
              </button>
            )}
            {data.status === 'CANCELLED' && (
              <div className="flex items-start gap-2 pt-1 text-xs text-on-surface-variant">
                <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                <span>Bu satış iptal edilmiştir; cari ve stok hareketleri tersine çevrilmiştir.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() =>
          confirmMutation.mutate(id!, {
            onSuccess: () => {
              toast.success('Satış onaylandı — stok ve cari hareketleri oluşturuldu');
              setConfirmOpen(false);
              refetch();
            },
            onError: (err: unknown) => {
              toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Onaylama başarısız');
            },
          })
        }
        title="Satış onaylansın mı?"
        description="Satış onaylandığında stok çıkışı ve cari borç hareketi otomatik oluşturulur."
        confirmText="Onayla"
        cancelText="Vazgeç"
        variant="info"
        loading={confirmMutation.isPending}
      />

      <ConfirmModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() =>
          cancelMutation.mutate(
            { id: id!, reason: 'Detay ekranından iptal edildi' },
            {
              onSuccess: () => {
                toast.success('Satış iptal edildi — ters hareketler oluşturuldu');
                setCancelOpen(false);
                refetch();
              },
              onError: (err: unknown) => {
                toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'İptal başarısız');
              },
            },
          )
        }
        title="Satış iptal edilsin mi?"
        description="Bu işlem satışa bağlı cari ve stok hareketlerini ters kayıt ile geri alır."
        confirmText="İptal Et"
        cancelText="Vazgeç"
        variant="warning"
        loading={cancelMutation.isPending}
      />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() =>
          deleteMutation.mutate(id!, {
            onSuccess: () => {
              toast.success('Taslak satış silindi');
              navigate('/sales');
            },
            onError: (err: unknown) => {
              toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Silme başarısız');
            },
          })
        }
        title="Taslak satış silinsin mi?"
        description="Bu işlem hard delete yapmaz. Taslak satış soft delete ile kaldırılır."
        confirmText="Sil"
        cancelText="Vazgeç"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
