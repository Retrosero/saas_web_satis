import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Banknote, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useCollection, useConfirmCollection, useCancelCollection } from '@/features/collections/api';
import { useCashAccounts } from '@/features/cash/api';
import { usePermission } from '@/lib/usePermission';
import { formatCurrency, formatDate } from '@saas/shared';
import type { CashAccountType, CollectionStatus, CollectionType } from '@saas/shared';
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

const CASH_ACCOUNT_TYPE_LABEL: Record<CashAccountType, string> = {
  CASH: 'Kasa',
  BANK: 'Banka',
  POS: 'POS',
};

export function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cashAccountId, setCashAccountId] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data, isLoading, isError, error, refetch } = useCollection(id);
  const { data: cashAccounts, isLoading: isCashAccountsLoading } = useCashAccounts();
  const confirmMutation = useConfirmCollection();
  const cancelMutation = useCancelCollection();

  const canView = usePermission('tahsilat:collection:view');
  const canCancel = usePermission('tahsilat:collection:cancel');

  const st = data ? STATUS_LABEL[data.status] : null;
  const canConfirm = data?.status === 'PENDING';
  const canCancelStatus = data?.status !== 'CANCELLED';
  const availableAccounts = cashAccounts?.data.filter((account) => account.status === 'ACTIVE') ?? [];

  const openConfirmModal = () => {
    if (!cashAccountId) {
      toast.error('Kasa veya banka seçimi zorunludur');
      return;
    }
    setConfirmOpen(true);
  };

  const submitConfirm = () => {
    confirmMutation.mutate(
      { id: id!, cashAccountId },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          toast.success('Tahsilat onaylandı, cari ve kasa güncellendi');
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

  const openCancelModal = () => {
    setCancelOpen(true);
  };

  const submitCancel = () => {
    cancelMutation.mutate(
      { id: id!, reason: cancelReason.trim() || undefined },
      {
        onSuccess: () => {
          setCancelOpen(false);
          setCancelReason('');
          toast.success('Tahsilat iptal edildi, ters hareketler oluşturuldu');
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

  if (isLoading) return <LoadingState label="Tahsilat yükleniyor..." />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={data.collectionNumber}
        description={`${TYPE_LABEL[data.type]} - ${data.customerName}`}
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
        <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${st.color}`}>
          {st.text}
        </span>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="card p-4">
            <div className="mb-3 flex items-center gap-2">
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
                  <span
                    className="cursor-pointer font-mono text-primary hover:underline"
                    onClick={() => navigate(`/sales/${data.linkedSaleId}`)}
                  >
                    {data.linkedSaleId.slice(0, 12)}...
                  </span>
                </div>
              )}
            </div>
          </div>

          {(data.notes || data.internalNotes) && (
            <div className="card p-4">
              {data.notes && (
                <div className="mb-2">
                  <h4 className="mb-1 text-xs font-semibold text-on-surface-variant">Not</h4>
                  <p className="text-sm text-foreground">{data.notes}</p>
                </div>
              )}

              {data.internalNotes && (
                <div>
                  <h4 className="mb-1 text-xs font-semibold text-on-surface-variant">Dahili Not</h4>
                  <p className="text-sm italic text-tertiary">{data.internalNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
              <Banknote className="h-4 w-4" />
              Tutar
            </h3>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Tahsil Edilen</span>
              <span className="font-mono text-2xl font-bold text-secondary">{formatCurrency(data.amount)}</span>
            </div>

            {data.confirmedAt && (
              <div className="mt-2 flex items-center gap-1 text-xs text-secondary">
                <AlertCircle className="h-3 w-3" />
                {formatDate(data.confirmedAt)} tarihinde onaylandı
              </div>
            )}
          </div>

          <div className="card flex flex-col gap-3 p-4">
            {canView && canConfirm && (
              <>
                <div>
                  <label className="mb-1 block text-xs text-on-surface-variant">Kasa / Banka Seçin</label>
                  <select
                    value={cashAccountId}
                    onChange={(e) => setCashAccountId(e.target.value)}
                    className="h-10 w-full rounded-md border border-outline-variant bg-surface-container px-3 text-sm"
                    disabled={isCashAccountsLoading || availableAccounts.length === 0}
                  >
                    <option value="">
                      {isCashAccountsLoading
                        ? 'Hesaplar yükleniyor...'
                        : availableAccounts.length === 0
                          ? 'Aktif kasa/banka bulunamadı'
                          : 'Kasa / banka seçin'}
                    </option>
                    {availableAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name} ({CASH_ACCOUNT_TYPE_LABEL[account.type]})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={openConfirmModal}
                  disabled={confirmMutation.isPending || !cashAccountId}
                  className="w-full rounded-md bg-secondary py-2.5 font-semibold text-on-secondary hover:bg-secondary-container disabled:opacity-50"
                >
                  {confirmMutation.isPending ? 'Onaylanıyor...' : 'Tahsilatı Onayla'}
                </button>

                <p className="text-xs text-on-surface-variant">Cari alacak ve kasa hareketi oluşturulur.</p>

                {!isCashAccountsLoading && availableAccounts.length === 0 && (
                  <p className="text-xs text-error">
                    Onay için önce aktif bir kasa veya banka hesabı tanımlayın.
                  </p>
                )}
              </>
            )}

            {canCancel && canCancelStatus && data.status !== 'CANCELLED' && (
              <button
                onClick={openCancelModal}
                disabled={cancelMutation.isPending}
                className="w-full rounded-md bg-error-container py-2.5 font-semibold text-error hover:bg-error-container-hover disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'İptal ediliyor...' : 'Tahsilatı İptal Et'}
              </button>
            )}

            {data.status === 'CANCELLED' && (
              <div className="flex items-start gap-2 text-xs text-error">
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                <span>Bu tahsilat iptal edilmiştir, ters hareketler oluşturulmuştur.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={submitConfirm}
        title="Tahsilat onaylansın mı?"
        description="Seçilen kasa veya banka hesabına hareket işlenecek ve cari alacak kapatılacaktır."
        confirmText="Onayla"
        cancelText="Vazgeç"
        variant="info"
        loading={confirmMutation.isPending}
      />

      {cancelOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            if (cancelMutation.isPending) return;
            setCancelOpen(false);
          }}
        >
          <div className="card w-full max-w-md p-6" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">Tahsilat iptal edilsin mi?</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                İptal işleminde varsa muhasebe hareketleri ters kayıtla geri alınır.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-on-surface-variant">İptal Sebebi</label>
              <textarea
                rows={4}
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                placeholder="İptal nedenini yazabilirsiniz"
                className="w-full rounded-md border border-outline-variant bg-surface-container px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  if (cancelMutation.isPending) return;
                  setCancelOpen(false);
                }}
                className="rounded-md px-4 py-2 text-sm text-foreground hover:bg-surface-container"
              >
                Vazgeç
              </button>
              <button
                onClick={submitCancel}
                disabled={cancelMutation.isPending}
                className="rounded-md bg-error px-4 py-2 text-sm font-semibold text-on-error hover:bg-error-hover disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'İşleniyor...' : 'İptal Et'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
