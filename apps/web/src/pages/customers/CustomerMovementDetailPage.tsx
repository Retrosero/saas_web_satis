import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit3, Printer, Save, Trash2 } from 'lucide-react';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { ErrorState } from '@/components/data/ErrorState';
import { LoadingState } from '@/components/data/LoadingState';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  useCustomerMovement,
  useReverseCustomerMovement,
  useUpdateCustomerMovement,
} from '@/features/customers/api';
import { formatCurrency, formatDate } from '@saas/shared';
import toast from 'react-hot-toast';

const TYPE_LABEL: Record<string, string> = {
  DEBIT: 'Borç',
  CREDIT: 'Alacak',
};

const REF_LABEL: Record<string, string> = {
  SALE: 'Satış',
  COLLECTION: 'Tahsilat',
  RETURN: 'İade',
  ADJUST: 'Düzeltme',
  OPENING_BALANCE: 'Açılış',
  TRANSFER: 'Transfer',
};

export function CustomerMovementDetailPage() {
  const navigate = useNavigate();
  const { id = '', movementId = '' } = useParams<{ id: string; movementId: string }>();
  const { data, isLoading, isError, error, refetch } = useCustomerMovement(id, movementId);
  const updateMovement = useUpdateCustomerMovement();
  const reverseMovement = useReverseCustomerMovement();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmReverse, setConfirmReverse] = useState(false);
  const [movementDate, setMovementDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const movement = data?.movement;

  useEffect(() => {
    if (!movement || isEditing) return;
    setMovementDate(movement.movementDate.slice(0, 10));
    setDueDate(movement.dueDate ? movement.dueDate.slice(0, 10) : '');
    setAmount(String(movement.amount));
    setDescription(movement.description ?? '');
  }, [movement, isEditing]);

  if (isLoading) return <LoadingState label="Cari hareketi yükleniyor..." />;
  if (isError || !data) return <ErrorState message={(error as Error)?.message ?? 'Cari hareketi yüklenemedi'} onRetry={refetch} />;
  const currentMovement = data.movement;

  const handleSave = () => {
    updateMovement.mutate(
      {
        customerId: id,
        movementId,
        data: {
          movementDate: new Date(movementDate).toISOString(),
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          amount: Number(amount),
          description: description || null,
        },
      },
      {
        onSuccess: () => {
          toast.success('Cari hareket güncellendi');
          setIsEditing(false);
          refetch();
        },
        onError: (err: unknown) => {
          toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Güncelleme başarısız');
        },
      },
    );
  };

  const handleReverse = () => {
    reverseMovement.mutate(
      { customerId: id, movementId },
      {
        onSuccess: () => {
          toast.success('Cari hareket ters kayıt ile iptal edildi');
          setConfirmReverse(false);
          refetch();
        },
        onError: (err: unknown) => {
          toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'İptal başarısız');
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={currentMovement.refNumber ?? 'Cari Hareketi'}
        description={`${data.customer.name} • ${REF_LABEL[currentMovement.refType] ?? currentMovement.refType}`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(`/customers/${id}`)} className="btn-ghost">
              <ArrowLeft className="h-4 w-4" />
              Cariye Dön
            </button>
            <button onClick={() => window.print()} className="btn-ghost">
              <Printer className="h-4 w-4" />
              Yazdır
            </button>
            {data.editable && !isEditing && (
              <button onClick={() => setIsEditing(true)} className="btn-secondary">
                <Edit3 className="h-4 w-4" />
                Düzenle
              </button>
            )}
            {data.deletable && (
              <button onClick={() => setConfirmReverse(true)} className="rounded-md bg-error-container px-3 py-2 text-sm font-medium text-error">
                <Trash2 className="mr-2 inline h-4 w-4" />
                Sil
              </button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">Hareket Bilgisi</h3>
          <div className="grid gap-4">
            <div>
              <div className="mb-1 text-xs text-on-surface-variant">Hareket Tipi</div>
              <div className="font-medium">{TYPE_LABEL[currentMovement.type] ?? currentMovement.type}</div>
            </div>
            <div>
              <div className="mb-1 text-xs text-on-surface-variant">Referans Türü</div>
              <div className="font-medium">{REF_LABEL[currentMovement.refType] ?? currentMovement.refType}</div>
            </div>
            <div>
              <div className="mb-1 text-xs text-on-surface-variant">Tarih</div>
              {isEditing ? (
                <input value={movementDate} onChange={(e) => setMovementDate(e.target.value)} type="date" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
              ) : (
                <div>{formatDate(currentMovement.movementDate)}</div>
              )}
            </div>
            <div>
              <div className="mb-1 text-xs text-on-surface-variant">Vade</div>
              {isEditing ? (
                <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
              ) : (
                <div>{currentMovement.dueDate ? formatDate(currentMovement.dueDate) : '—'}</div>
              )}
            </div>
            <div>
              <div className="mb-1 text-xs text-on-surface-variant">Tutar</div>
              {isEditing ? (
                <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0.01" step="0.01" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
              ) : (
                <div className="font-mono text-lg font-semibold">{formatCurrency(currentMovement.amount)}</div>
              )}
            </div>
            <div>
              <div className="mb-1 text-xs text-on-surface-variant">Açıklama</div>
              {isEditing ? (
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
              ) : (
                <div>{currentMovement.description || '—'}</div>
              )}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">Durum ve İz</h3>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs text-on-surface-variant">Durum</div>
              <div>{currentMovement.status}</div>
            </div>
            <div>
              <div className="text-xs text-on-surface-variant">Cari</div>
              <div>{data.customer.name}</div>
            </div>
            <div>
              <div className="text-xs text-on-surface-variant">Referans No</div>
              <div className="font-mono">{currentMovement.refNumber ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-on-surface-variant">Oluşturulma</div>
              <div>{formatDate(currentMovement.createdAt)}</div>
            </div>
            {data.detailRoute && data.detailRoute !== `/customers/${id}/movements/${movementId}` && (
              <button onClick={() => navigate(data.detailRoute!)} className="btn-secondary mt-2">
                İlgili Fişe Git
              </button>
            )}
            {isEditing && (
              <div className="flex gap-2 pt-4">
                <button onClick={() => setIsEditing(false)} className="btn-ghost">
                  Vazgeç
                </button>
                <button onClick={handleSave} disabled={updateMovement.isPending} className="btn-primary">
                  <Save className="h-4 w-4" />
                  {updateMovement.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmReverse}
        onClose={() => setConfirmReverse(false)}
        onConfirm={handleReverse}
        title="Cari hareket silinsin mi?"
        description="Bu işlem hard delete yapmaz. Hareket ters kayıt ile kapatılır ve ekstre izi korunur."
        confirmText="Sil"
        cancelText="Vazgeç"
        variant="danger"
        loading={reverseMovement.isPending}
      />
    </div>
  );
}
