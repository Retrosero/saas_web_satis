import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle, Package, Printer, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import {
  usePurchaseInvoice,
  useConfirmPurchaseInvoice,
  useCancelPurchaseInvoice,
} from '@/features/purchase-invoices/api';
import { formatCurrency, formatDate } from '@saas/shared';
import type { PurchaseInvoiceStatus } from '@saas/shared';
import toast from 'react-hot-toast';

const statusColors: Record<PurchaseInvoiceStatus, string> = {
  DRAFT: 'bg-surface-variant text-on-surface-variant',
  CONFIRMED: 'bg-secondary-container text-secondary',
  CANCELLED: 'bg-error-container text-error',
};

const statusLabels: Record<PurchaseInvoiceStatus, string> = {
  DRAFT: 'Taslak',
  CONFIRMED: 'Onaylandı',
  CANCELLED: 'İptal',
};

export function PurchaseInvoiceDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { data: invoice, isLoading, isError, error, refetch } = usePurchaseInvoice(id);
  const confirmInvoice = useConfirmPurchaseInvoice();
  const cancelInvoice = useCancelPurchaseInvoice();

  const handleConfirm = () => {
    if (!id) return;
    confirmInvoice.mutate(id, {
      onSuccess: () => {
        toast.success('Fatura onaylandı. Stok ve cari hareketler oluşturuldu.');
        refetch();
      },
      onError: (err: unknown) => {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Onaylama başarısız');
      },
    });
  };

  const handleCancel = () => {
    if (!id) return;
    cancelInvoice.mutate(
      { id, reason: cancelReason },
      {
        onSuccess: () => {
          toast.success('Fatura iptal edildi');
          setShowCancelModal(false);
          refetch();
        },
        onError: (err: unknown) => {
          toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'İptal başarısız');
        },
      },
    );
  };

  if (isLoading) return <LoadingState label="Fatura yükleniyor..." />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={refetch} />;
  if (!invoice) return null;

  const pending = confirmInvoice.isPending || cancelInvoice.isPending;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={invoice.invoiceNumber}
        description={`${formatDate(invoice.invoiceDate)} tarihli alış faturası`}
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate(`/purchase-invoices/${id}/print`)} className="btn-ghost">
              <Printer className="h-4 w-4" />
              Yazdır
            </button>
            <button onClick={() => navigate('/purchase-invoices')} className="btn-ghost">
              <ArrowLeft className="h-4 w-4" />
              Geri Dön
            </button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface p-4">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusColors[invoice.status]}`}>
                {statusLabels[invoice.status]}
              </span>
              {invoice.type === 'RETURN' && (
                <span className="inline-flex items-center rounded-full bg-warning-container px-2 py-0.5 text-xs font-medium text-warning">
                  İade
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {invoice.status === 'DRAFT' && (
                <>
                  <button onClick={() => navigate(`/purchase-invoices/${id}/edit`)} className="btn-ghost">
                    Düzenle
                  </button>
                  <button onClick={handleConfirm} disabled={pending} className="btn-primary">
                    <CheckCircle className="h-4 w-4" />
                    Onayla
                  </button>
                </>
              )}
              {invoice.status === 'CONFIRMED' && (
                <button onClick={() => setShowCancelModal(true)} disabled={pending} className="btn-danger">
                  <XCircle className="h-4 w-4" />
                  İptal Et
                </button>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-outline-variant bg-surface p-4">
            <h3 className="mb-4 text-sm font-medium">Tedarikçi Bilgileri</h3>
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-5 w-5 text-on-surface-variant" />
              <div>
                <div className="font-medium">{invoice.supplierName}</div>
                {invoice.supplierTaxNumber && <div className="text-sm text-on-surface-variant">VKN: {invoice.supplierTaxNumber}</div>}
                {invoice.supplierAddress && <div className="mt-1 text-sm text-on-surface-variant">{invoice.supplierAddress}</div>}
                {invoice.supplierPhone && <div className="text-sm text-on-surface-variant">{invoice.supplierPhone}</div>}
                {invoice.supplierEmail && <div className="text-sm text-on-surface-variant">{invoice.supplierEmail}</div>}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-outline-variant bg-surface p-4">
            <h3 className="mb-4 text-sm font-medium">Fatura Kalemleri</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant text-left text-on-surface-variant">
                    <th className="pb-2 font-medium">#</th>
                    <th className="pb-2 font-medium">Ürün</th>
                    <th className="pb-2 text-right font-medium">Miktar</th>
                    <th className="pb-2 text-right font-medium">Birim Fiyat</th>
                    <th className="pb-2 text-right font-medium">KDV</th>
                    <th className="pb-2 text-right font-medium">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={item.id} className="border-b border-outline-variant last:border-0">
                      <td className="py-2">{index + 1}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-on-surface-variant" />
                          <span>{item.productName ?? item.productCode ?? 'Ürün'}</span>
                        </div>
                        {item.description && <div className="text-xs text-on-surface-variant">{item.description}</div>}
                      </td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2 text-right">{item.vatRate}%</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(item.lineGrandTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {invoice.notes && (
            <div className="rounded-lg border border-outline-variant bg-surface p-4">
              <h3 className="mb-2 text-sm font-medium">Notlar</h3>
              <p className="text-sm text-on-surface-variant">{invoice.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-outline-variant bg-surface p-4">
            <h3 className="mb-4 text-sm font-medium">Tarih Bilgileri</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Fatura Tarihi</span>
                <span>{formatDate(invoice.invoiceDate)}</span>
              </div>
              {invoice.dueDate && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Vade Tarihi</span>
                  <span>{formatDate(invoice.dueDate)}</span>
                </div>
              )}
              {invoice.confirmedAt && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Onaylanma</span>
                  <span>{formatDate(invoice.confirmedAt)}</span>
                </div>
              )}
              {invoice.cancelledAt && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">İptal</span>
                  <span>{formatDate(invoice.cancelledAt)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-outline-variant bg-surface p-4">
            <h3 className="mb-4 text-sm font-medium">Hedef Depo</h3>
            <div className="text-sm">
              <div className="font-medium">{invoice.warehouseName ?? 'Belirtilmemiş'}</div>
            </div>
          </div>

          <div className="rounded-lg border border-outline-variant bg-surface p-4">
            <h3 className="mb-4 text-sm font-medium">Fatura Özeti</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Ara Toplam</span>
                <span>{formatCurrency(invoice.subTotal)}</span>
              </div>
              {invoice.discountTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">İskonto</span>
                  <span className="text-error">-{formatCurrency(invoice.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-on-surface-variant">KDV</span>
                <span>{formatCurrency(invoice.vatTotal)}</span>
              </div>
              <div className="flex justify-between border-t border-outline-variant pt-2 font-medium">
                <span>Genel Toplam</span>
                <span className="text-lg">{formatCurrency(invoice.grandTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Ödenen</span>
                <span className="text-secondary">{formatCurrency(invoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Kalan</span>
                <span className={invoice.grandTotal - invoice.paidAmount > 0 ? 'text-error' : 'text-secondary'}>
                  {formatCurrency(invoice.grandTotal - invoice.paidAmount)}
                </span>
              </div>
            </div>
          </div>

          {invoice.einvoiceNumber && (
            <div className="rounded-lg border border-outline-variant bg-surface p-4">
              <h3 className="mb-2 text-sm font-medium">E-Fatura</h3>
              <div className="text-sm">
                <div className="font-medium">{invoice.einvoiceNumber}</div>
                {invoice.einvoiceStatus && <div className="text-xs text-on-surface-variant">{invoice.einvoiceStatus}</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        title="Faturayı İptal Et"
        description={
          <div>
            <p>{invoice.invoiceNumber} numaralı faturayı iptal etmek istediğinize emin misiniz?</p>
            <p className="mt-2 text-sm text-on-surface-variant">Bu işlem ters kayıtlar oluşturacak ve stok ile cari bakiyeleri etkileyecektir.</p>
            <div className="mt-3">
              <label className="text-sm font-medium">İptal Sebebi (Opsiyonel)</label>
              <textarea
                className="mt-1 w-full rounded-md border border-outline-variant bg-surface p-2 text-sm focus:border-primary focus:outline-none"
                rows={2}
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                placeholder="İptal sebebini yazın..."
              />
            </div>
          </div>
        }
        confirmText="İptal Et"
        variant="danger"
        loading={pending}
      />
    </div>
  );
}
