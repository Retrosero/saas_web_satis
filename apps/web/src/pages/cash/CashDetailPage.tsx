import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useCashAccount, useCashMovements, useCreateCashMovement, useReverseCashMovement } from '@/features/cash/api';
import { formatCurrency, formatDate } from '@saas/shared';
import type { CashMovementType } from '@saas/shared';
import toast from 'react-hot-toast';

const TYPE_LABEL: Record<string, { text: string; color: string }> = {
  IN: { text: 'Giriş', color: 'text-secondary font-semibold' },
  OUT: { text: 'Çıkış', color: 'text-error font-semibold' },
  TRANSFER: { text: 'Transfer', color: 'text-tertiary font-semibold' },
};

export function CashDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showNewMovement, setShowNewMovement] = useState(false);
  const [newType, setNewType] = useState<CashMovementType>('IN');
  const [newAmount, setNewAmount] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const { data, isLoading, isError, error, refetch } = useCashAccount(id);
  const { data: movements, refetch: refetchMovements } = useCashMovements({ cashAccountId: id, pageSize: 50 });
  const createMovement = useCreateCashMovement();
  const reverseMovement = useReverseCashMovement();

  const handleAddMovement = () => {
    const amount = parseFloat(newAmount);
    if (!amount || amount <= 0) {
      toast.error('Geçerli tutar girin');
      return;
    }
    createMovement.mutate(
      {
        cashAccountId: id!,
        type: newType,
        amount,
        description: newDesc || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Hareket eklendi');
          setShowNewMovement(false);
          setNewAmount('');
          setNewDesc('');
          refetch();
          refetchMovements();
        },
        onError: (err: unknown) => {
          toast.error(String((err as any)?.response?.data?.message || 'Hata'));
        },
      },
    );
  };

  if (isLoading) return <LoadingState label="Hesap yükleniyor…" />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!data) return null;

  const balance = data.balance ?? 0;
  const balanceColor = balance >= 0 ? 'text-secondary' : 'text-error';

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`${data.code} — ${data.name}`}
        description={`${data.type} ${data.bankName ? `• ${data.bankName}` : ''}`}
        actions={
          <button onClick={() => navigate('/cash')} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            Kasalara Dön
          </button>
        }
      />

      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${data.status === 'ACTIVE' ? 'bg-secondary-container text-secondary' : 'bg-surface-variant text-on-surface-variant'}`}>
        {data.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
      </span>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sol: Hareketler */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Hareketler ({movements?.pagination.total ?? 0})</h3>
              <button
                onClick={() => setShowNewMovement(true)}
                className="btn-ghost text-xs"
              >
                <Plus className="h-3 w-3" />
                Hareket Ekle
              </button>
            </div>
            {!movements || movements.data.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-on-surface-variant">
                Henüz hareket yok
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-surface-container border-b border-outline-variant">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Tarih</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Açıklama</th>
                    <th className="text-center px-4 py-3 font-semibold text-foreground">Tip</th>
                    <th className="text-right px-4 py-3 font-semibold text-foreground">Tutar</th>
                    <th className="text-right px-4 py-3 font-semibold text-foreground">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.data.map((m) => {
                    const t = TYPE_LABEL[m.type] ?? { text: m.type, color: 'text-on-surface-variant' };
                    return (
                      <tr key={m.id} className="border-b border-outline-variant last:border-0">
                        <td className="px-4 py-3 text-xs text-on-surface-variant">
                          {formatDate(m.movementDate)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground text-xs">{m.description ?? '—'}</div>
                          {m.refNumber && (
                            <div className="text-xs font-mono text-on-surface-variant">{m.refNumber}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-semibold ${t.color}`}>{t.text}</span>
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-semibold ${
                          m.type === 'IN' ? 'text-secondary' : m.type === 'OUT' ? 'text-error' : 'text-tertiary'
                        }`}>
                          {m.type === 'IN' ? '+' : m.type === 'OUT' ? '−' : ''}{formatCurrency(m.amount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {m.status !== 'CANCELLED' && !m.reversesId && (
                            <button
                              onClick={() => {
                                if (!confirm('Bu hareketi tersine çevirmek istiyor musunuz?')) return;
                                reverseMovement.mutate(m.id, {
                                  onSuccess: () => { refetch(); refetchMovements(); },
                                  onError: (err: unknown) => {
                                    toast.error(String((err as any)?.response?.data?.message || 'Hata'));
                                  },
                                });
                              }}
                              className="btn-ghost text-xs text-error"
                              disabled={reverseMovement.isPending}
                            >
                              Tersine Çevir
                            </button>
                          )}
                          {m.reversesId && (
                            <span className="text-xs text-on-surface-variant">Ters</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sağ: Özet */}
        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <h3 className="font-semibold text-foreground mb-4">Bakiye</h3>
            <div className={`font-mono font-bold text-3xl ${balanceColor}`}>
              {formatCurrency(balance)}
            </div>
            <div className="text-xs text-on-surface-variant mt-2">
              {movements?.pagination.total ?? 0} hareket
            </div>
          </div>

          {data.iban && (
            <div className="card p-4">
              <h3 className="font-semibold text-foreground mb-2">IBAN</h3>
              <div className="font-mono text-sm text-foreground">{data.iban}</div>
            </div>
          )}

          {data.bankName && (
            <div className="card p-4">
              <h3 className="font-semibold text-foreground mb-2">Banka Bilgileri</h3>
              <div className="flex flex-col gap-1 text-sm">
                <div className="font-medium text-foreground">{data.bankName}</div>
                {data.bankBranch && <div className="text-on-surface-variant text-xs">{data.bankBranch}</div>}
                {data.accountHolder && <div className="text-on-surface-variant text-xs">{data.accountHolder}</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Yeni hareket modal */}
      {showNewMovement && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card max-w-sm w-full p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Kasa Hareketi Ekle</h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Tür</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as CashMovementType)}
                  className="w-full h-10 px-3 rounded-md bg-surface-container text-sm border border-outline-variant"
                >
                  <option value="IN">💵 Giriş (Nakit/ödeme aldınız)</option>
                  <option value="OUT">💸 Çıkış (Ödeme yaptınız)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Tutar (₺)</label>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full h-10 px-3 rounded-md bg-surface-container text-lg font-mono border border-outline-variant"
                />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Açıklama</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Hareket açıklaması…"
                  className="w-full h-10 px-3 rounded-md bg-surface-container text-sm border border-outline-variant"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={handleAddMovement}
                disabled={createMovement.isPending}
                className="flex-1 font-semibold py-2.5 rounded-md bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-50"
              >
                {createMovement.isPending ? 'Ekleniyor…' : '✓ Ekle'}
              </button>
              <button onClick={() => setShowNewMovement(false)} className="px-4 py-2.5 text-sm text-on-surface-variant">
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}