import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, ThumbsUp, ThumbsDown, Send, Clock, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useStockCount, useApproveStockCount, useCancelStockCount } from '@/features/stock-count/api';
import toast from 'react-hot-toast';

export function StockCountApprovalPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useStockCount(id);
  const approve = useApproveStockCount();
  const cancel = useCancelStockCount();
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (isLoading) return <LoadingState label="Onay yükleniyor…" />;
  if (!data) return null;

  const items = (data.items ?? []) as any[];
  const differences = items.filter((i) => i.difference != null && i.difference !== 0);
  const positiveTotal = differences.filter((i) => i.difference > 0).reduce((s, i) => s + i.difference, 0);
  const negativeTotal = Math.abs(differences.filter((i) => i.difference < 0).reduce((s, i) => s + i.difference, 0));

  const handleApprove = async () => {
    try {
      await approve.mutateAsync(id!);
      toast.success('Sayım onaylandı — ADJUST hareketleri oluşturuldu');
      setShowApproveModal(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Onay başarısız');
    }
  };

  const handleReject = async () => {
    try {
      await cancel.mutateAsync(id!);
      toast.success('Sayım iptal edildi');
      setShowRejectModal(false);
      navigate('/stock-counts');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'İptal başarısız');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`${data.countNumber} — Onay Ekranı`}
        description={`${data.name} · ${data.warehouseName} · ${data.completedAt ? new Date(data.completedAt).toLocaleString('tr-TR') : '—'}`}
        actions={
          <button onClick={() => navigate(`/stock-counts/${id}`)} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            Sayım Detayına Dön
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sol: Fark özeti */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="card p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Sayım Özeti
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <div className="text-xs text-on-surface-variant">Toplam Ürün</div>
                <div className="font-mono font-bold text-2xl text-foreground">{items.length}</div>
              </div>
              <div>
                <div className="text-xs text-on-surface-variant">Sayılan</div>
                <div className="font-mono font-bold text-2xl text-secondary">{items.filter((i) => i.status === 'COUNTED').length}</div>
              </div>
              <div>
                <div className="text-xs text-on-surface-variant">Fark Sayısı</div>
                <div className="font-mono font-bold text-2xl text-error">{differences.length}</div>
              </div>
              <div>
                <div className="text-xs text-on-surface-variant">Net Fark</div>
                <div className={`font-mono font-bold text-2xl ${
                  (positiveTotal - negativeTotal) >= 0 ? 'text-secondary' : 'text-error'
                }`}>
                  {(positiveTotal - negativeTotal).toLocaleString('tr-TR')}
                </div>
              </div>
            </div>
          </div>

          {/* Fark listesi önizleme */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container">
              <h3 className="font-semibold text-foreground">Fark Listesi (İlk 10)</h3>
            </div>
            {differences.length === 0 ? (
              <div className="p-6 text-center text-sm text-on-surface-variant">
                Bu sayımda fark yok
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-surface-container border-b border-outline-variant">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-foreground">Ürün</th>
                    <th className="text-right px-4 py-2 font-semibold text-foreground">Sistem</th>
                    <th className="text-right px-4 py-2 font-semibold text-foreground">Sayılan</th>
                    <th className="text-right px-4 py-2 font-semibold text-foreground">Fark</th>
                  </tr>
                </thead>
                <tbody>
                  {differences.slice(0, 10).map((i) => (
                    <tr key={i.id} className="border-b border-outline-variant last:border-0">
                      <td className="px-4 py-2 font-medium text-foreground">{i.productName}</td>
                      <td className="px-4 py-2 text-right font-mono">{i.systemQuantity.toLocaleString('tr-TR')}</td>
                      <td className="px-4 py-2 text-right font-mono font-semibold">{i.countedQuantity.toLocaleString('tr-TR')}</td>
                      <td className={`px-4 py-2 text-right font-mono font-semibold ${
                        i.difference > 0 ? 'text-secondary' : 'text-error'
                      }`}>
                        {i.difference > 0 ? '+' : ''}{i.difference}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {differences.length > 10 && (
              <div className="px-4 py-2 bg-surface-container text-center">
                <button onClick={() => navigate(`/stock-counts/${id}/differences`)} className="text-sm text-primary hover:underline">
                  +{differences.length - 10} fark daha — Tümünü Gör
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sağ: Onay paneli */}
        <div className="flex flex-col gap-4">
          <div className="card p-4 bg-primary-container text-primary text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Önemli:</strong> Onay işlemi geri alınamaz. Stok miktarları sayım sonuçlarına göre ADJUST hareketi ile güncellenecek.
            </span>
          </div>

          {data.status === 'PENDING_APPROVAL' ? (
            <div className="card p-4 flex flex-col gap-2">
              <h3 className="font-semibold text-foreground mb-2">Onay Kararı</h3>
              <button
                onClick={() => setShowApproveModal(true)}
                disabled={approve.isPending}
                className="w-full font-semibold py-3 rounded-md bg-secondary text-on-secondary hover:bg-secondary-hover disabled:opacity-50"
              >
                <ThumbsUp className="inline h-4 w-4 mr-1" />
                Onayla
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={cancel.isPending}
                className="w-full font-semibold py-3 rounded-md bg-error-container text-error hover:bg-error-container-hover disabled:opacity-50"
              >
                <ThumbsDown className="inline h-4 w-4 mr-1" />
                Reddet (İptal)
              </button>
            </div>
          ) : (
            <div className="card p-4 bg-surface-container text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-secondary" />
              <div className="font-semibold text-foreground mt-2">Sayım Onaylandı</div>
              <div className="text-xs text-on-surface-variant mt-1">
                {data.approvedAt ? new Date(data.approvedAt).toLocaleString('tr-TR') : '—'}
              </div>
            </div>
          )}

          {differences.length > 0 && (
            <div className="card p-3 text-xs">
              <div className="text-on-surface-variant">İşlem etkisi:</div>
              <ul className="mt-2 space-y-1">
                <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-secondary" /> {positiveTotal.toLocaleString('tr-TR')} adet stok artışı</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-error" /> {negativeTotal.toLocaleString('tr-TR')} adet stok düşüşü</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-primary" /> {differences.length} adet ADJUST hareketi</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={handleApprove}
        variant="info"
        title="Sayım Onaylansın mı?"
        description={
          <div>
            <p>
              <strong>{data.countNumber}</strong> sayımı onaylanacak. Stok miktarları sayım sonuçlarına göre güncellenecek.
            </p>
            <p className="mt-2 text-sm">
              <strong>{differences.length}</strong> ürün için ADJUST hareketi oluşturulacak:
            </p>
            <ul className="mt-2 text-sm space-y-1">
              <li className="text-secondary">+{positiveTotal.toLocaleString('tr-TR')} adet (fazla)</li>
              <li className="text-error">−{negativeTotal.toLocaleString('tr-TR')} adet (eksik)</li>
            </ul>
            <p className="mt-2 text-error font-semibold">Bu işlem geri alınamaz.</p>
          </div>
        }
        confirmText={approve.isPending ? 'Onaylanıyor…' : 'Onayla'}
        loading={approve.isPending}
      />

      <ConfirmModal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleReject}
        title="Sayım Reddedilsin mi?"
        description="Sayım iptal edilecek ve onay süreci sonlanacaktır. Yeni bir sayım başlatmanız gerekir."
        confirmText="Evet, Reddet"
        loading={cancel.isPending}
      />
    </div>
  );
}