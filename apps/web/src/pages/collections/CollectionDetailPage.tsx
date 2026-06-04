import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Banknote, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useCollection, useConfirmCollection, useCancelCollection } from '@/features/collections/api';
import { formatCurrency, formatDate } from '@saas/shared';
import type { CollectionStatus, CollectionType } from '@saas/shared';
import toast from 'react-hot-toast';

const STATUS_LABEL: Record<CollectionStatus, { text: string; color: string }> = {
  PENDING: { text: 'Bekliyor', color: 'bg-surface-variant text-on-surface-variant' },
  CONFIRMED: { text: 'Onaylandı', color: 'bg-secondary-container text-secondary' },
  CANCELLED: { text: 'İptal', color: 'bg-error-container text-error' },
  REFUNDED: { text: 'İade', color: 'bg-tertiary-container text-tertiary' },
};

const TYPE_LABEL: Record<CollectionType, string> = {
  CASH: 'Nakit',
  BANK_TRANSFER: 'EFT/Havale',
  POS: 'Kredi Kartı',
  QR: 'QR Kod',
  CHECK: 'Çek',
  OTHER: 'Diğer',
};

export function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cashAccountId, setCashAccountId] = useState('');

  const { data, isLoading, isError, error, refetch } = useCollection(id);
  const confirmMutation = useConfirmCollection();
  const cancelMutation = useCancelCollection();

  const st = data ? STATUS_LABEL[data.status] : null;
  const canConfirm = data?.status === 'PENDING';
  const canCancel = data?.status !== 'CANCELLED';

  const handleConfirm = () => {
    if (!cashAccountId) {
      toast.error('Kasa/banka seçimi zorunludur');
      return;
    }
    if (!window.confirm('Tahsilat onaylanacak. Cari hesap güncellenecek. Devam?')) return;
    confirmMutation.mutate(
      { id: id!, cashAccountId },
      {
        onSuccess: () => {
          toast.success('Tahsilat onaylandı — cari ve kasa güncellendi');
          refetch();
        },
        onError: (err: unknown) => {
          toast.error(
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
              'Onaylama başarısız',
          );
        },
      },
    );
  };

  const handleCancel = () => {
    const reason = window.prompt('İptal sebebi (opsiyonel):');
    if (reason === null) return;
    cancelMutation.mutate(
      { id: id!, reason },
      {
        onSuccess: () => {
          toast.success('Tahsilat iptal edildi — ters hareketler oluşturuldu');
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

  if (isLoading) return <LoadingState label="Tahsilat yükleniyor…" />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={data.collectionNumber}
        description={`${TYPE_LABEL[data.type]} — ${data.customerName}`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/collections')} className="btn-ghost">
              <ArrowLeft className="h-4 w-4" />
              Tahsilatlara Dön
            </button>
          </div>
        }
      />

      {st && (
        <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${st.color}`}>
          {st.text}
        </span>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Müşteri */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-on-surface-variant" />
              <h3 className="font-semibold text-foreground">Müşteri Bilgisi</h3>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Ad</span>
                <span className="font-medium text-foreground">{data.customerName}</span>
              </div>
              {data.customerTaxNumber && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Vergi No</span>
                  <span className="font-mono text-foreground">{data.customerTaxNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Tarih</span>
                <span className="text-foreground">{formatDate(data.collectionDate)}</span>
              </div>
              {data.linkedSaleId && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Satış Ref.</span>
                  <span className="font-mono text-primary cursor-pointer hover:underline"
                    onClick={() => navigate(`/sales/${data.linkedSaleId}`)}>
                    {data.linkedSaleId.slice(0, 12)}…
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notlar */}
          {(data.notes || data.internalNotes) && (
            <div className="card p-4">
              {data.notes && (
                <div className="mb-2">
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

        {/* Sağ: Tutar + İşlemler */}
        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Tutar
            </h3>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">Tahsil Edilen</span>
              <span className="font-mono font-bold text-secondary text-2xl">
                {formatCurrency(data.amount)}
              </span>
            </div>
            {data.confirmedAt && (
              <div className="mt-2 flex items-center gap-1 text-xs text-secondary">
                <AlertCircle className="h-3 w-3" />
                {formatDate(data.confirmedAt)} tarihinde onaylandı
              </div>
            )}
          </div>

          {/* Kasa seçimi + işlemler */}
          <div className="card p-4 flex flex-col gap-3">
            {canConfirm && (
              <>
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">
                    Kasa / Banka Seçin
                  </label>
                  <input
                    type="text"
                    value={cashAccountId}
                    onChange={(e) => setCashAccountId(e.target.value)}
                    placeholder="Kasa ID (yapılandırmadan)"
                    className="w-full h-10 px-3 rounded-md bg-surface-container text-sm border border-outline-variant font-mono"
                  />
                </div>
                <button
                  onClick={handleConfirm}
                  disabled={confirmMutation.isPending || !cashAccountId}
                  className="w-full font-semibold py-2.5 rounded-md bg-secondary text-on-secondary hover:bg-secondary-container disabled:opacity-50"
                >
                  {confirmMutation.isPending ? 'Onaylanıyor…' : '✓ Tahsilatı Onayla'}
                </button>
                <p className="text-xs text-on-surface-variant">
                  Cari alacak + kasa hareketi oluşturulur
                </p>
              </>
            )}
            {canCancel && data.status !== 'CANCELLED' && (
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="w-full font-semibold py-2.5 rounded-md bg-error-container text-error hover:bg-error-container-hover disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'İptal ediliyor…' : '✕ Tahsilatı İptal Et'}
              </button>
            )}
            {data.status === 'CANCELLED' && (
              <div className="flex items-start gap-2 text-xs text-error">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>
                  Bu tahsilat iptal edilmiştir — ters hareketler oluşturulmuştur
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
