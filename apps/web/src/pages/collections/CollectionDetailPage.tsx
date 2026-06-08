import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Banknote, Building2, Pencil, Printer, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useCollection, useConfirmCollection, useCancelCollection, useDeleteCollection } from '@/features/collections/api';
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { data, isLoading, isError, error, refetch } = useCollection(id);
  const { data: cashAccounts, isLoading: isCashAccountsLoading } = useCashAccounts();
  const confirmMutation = useConfirmCollection();
  const cancelMutation = useCancelCollection();
  const deleteMutation = useDeleteCollection();
  const canCancel = usePermission('tahsilat:collection:cancel');

  if (isLoading) return <LoadingState label="Tahsilat yükleniyor..." />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!data) return null;

  const st = STATUS_LABEL[data.status];
  const canConfirm = data.status === 'PENDING';
  const canEdit = data.status === 'PENDING';
  const canDelete = data.status === 'PENDING';
  const canCancelStatus = data.status === 'CONFIRMED';
  const availableAccounts = cashAccounts?.data.filter((account) => account.status === 'ACTIVE') ?? [];

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
            <button onClick={() => window.print()} className="btn-ghost">
              <Printer className="h-4 w-4" />
              Yazdır
            </button>
            {canEdit && (
              <button onClick={() => navigate(`/collections/${data.id}/edit`)} className="btn-secondary">
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

      <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${st.color}`}>{st.text}</span>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-on-surface-variant" />
              <h3 className="font-semibold text-foreground">Müşteri Bilgisi</h3>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant">Ad</span><span className="font-medium text-foreground">{data.customerName}</span></div>
              {data.customerTaxNumber && <div className="flex justify-between"><span className="text-on-surface-variant">Vergi No</span><span className="font-mono text-foreground">{data.customerTaxNumber}</span></div>}
              <div className="flex justify-between"><span className="text-on-surface-variant">Tarih</span><span className="text-foreground">{formatDate(data.collectionDate)}</span></div>
              {data.linkedSaleId && <div className="flex justify-between"><span className="text-on-surface-variant">Satış Ref.</span><span className="cursor-pointer font-mono text-primary hover:underline" onClick={() => navigate(`/sales/${data.linkedSaleId}`)}>{data.linkedSaleId.slice(0, 12)}...</span></div>}
            </div>
          </div>

          {(data.notes || data.internalNotes) && (
            <div className="card p-4">
              {data.notes && <div className="mb-2"><h4 className="mb-1 text-xs font-semibold text-on-surface-variant">Not</h4><p className="text-sm text-foreground">{data.notes}</p></div>}
              {data.internalNotes && <div><h4 className="mb-1 text-xs font-semibold text-on-surface-variant">Dahili Not</h4><p className="text-sm italic text-tertiary">{data.internalNotes}</p></div>}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground"><Banknote className="h-4 w-4" /> Tutar</h3>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Tahsil Edilen</span>
              <span className="font-mono text-2xl font-bold text-secondary">{formatCurrency(data.amount)}</span>
            </div>
            {data.confirmedAt && <div className="mt-2 flex items-center gap-1 text-xs text-secondary"><AlertCircle className="h-3 w-3" /> {formatDate(data.confirmedAt)} tarihinde onaylandı</div>}
          </div>

          <div className="card flex flex-col gap-3 p-4">
            {canConfirm && (
              <>
                <div>
                  <label className="mb-1 block text-xs text-on-surface-variant">Kasa / Banka Seçin</label>
                  <select value={cashAccountId} onChange={(e) => setCashAccountId(e.target.value)} className="h-10 w-full rounded-md border border-outline-variant bg-surface-container px-3 text-sm" disabled={isCashAccountsLoading || availableAccounts.length === 0}>
                    <option value="">{isCashAccountsLoading ? 'Hesaplar yükleniyor...' : availableAccounts.length === 0 ? 'Aktif kasa/banka bulunamadı' : 'Kasa / banka seçin'}</option>
                    {availableAccounts.map((account) => <option key={account.id} value={account.id}>{account.code} - {account.name} ({CASH_ACCOUNT_TYPE_LABEL[account.type]})</option>)}
                  </select>
                </div>
                <button onClick={() => setConfirmOpen(true)} disabled={confirmMutation.isPending || !cashAccountId} className="w-full rounded-md bg-secondary py-2.5 font-semibold text-on-secondary hover:bg-secondary-container disabled:opacity-50">
                  {confirmMutation.isPending ? 'Onaylanıyor...' : 'Tahsilatı Onayla'}
                </button>
              </>
            )}

            {canCancel && canCancelStatus && (
              <button onClick={() => setCancelOpen(true)} disabled={cancelMutation.isPending} className="w-full rounded-md bg-error-container py-2.5 font-semibold text-error hover:bg-error-container-hover disabled:opacity-50">
                Tahsilatı İptal Et
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() =>
          confirmMutation.mutate(
            { id: id!, cashAccountId },
            {
              onSuccess: () => {
                toast.success('Tahsilat onaylandı, cari ve kasa güncellendi');
                setConfirmOpen(false);
                refetch();
              },
              onError: (err: unknown) => {
                toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Onaylama başarısız');
              },
            },
          )
        }
        title="Tahsilat onaylansın mı?"
        description="Seçilen kasa veya banka hesabına hareket işlenecek ve cari alacak kapatılacaktır."
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
                toast.success('Tahsilat iptal edildi, ters hareketler oluşturuldu');
                setCancelOpen(false);
                refetch();
              },
              onError: (err: unknown) => {
                toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'İptal başarısız');
              },
            },
          )
        }
        title="Tahsilat iptal edilsin mi?"
        description="İptal işleminde varsa muhasebe hareketleri ters kayıtla geri alınır."
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
              toast.success('Bekleyen tahsilat silindi');
              navigate('/collections');
            },
            onError: (err: unknown) => {
              toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Silme başarısız');
            },
          })
        }
        title="Bekleyen tahsilat silinsin mi?"
        description="Bu işlem hard delete yapmaz. Bekleyen tahsilat soft delete ile kaldırılır."
        confirmText="Sil"
        cancelText="Vazgeç"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
