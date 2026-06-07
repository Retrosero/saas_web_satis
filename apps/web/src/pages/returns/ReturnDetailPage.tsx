import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Undo2, ArrowLeft, Check, X, Send, Printer, FileText, History, Package, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { PageGuard } from '@/components/data/PageGuard';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useReturn, useReturnAction } from '@/features/returns/api';
import { usePermission } from '@/lib/usePermission';
import {
  ReturnItemConditionLabel,
  ReturnReasonLabel,
  ReturnSourceLabel,
  ReturnStatusLabel,
  formatCurrency,
  formatDate,
  formatDateTime,
} from '@saas/shared';

export function ReturnDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const { data: r, isLoading, error, refetch } = useReturn(id);
  const action = useReturnAction();

  const canApproveReturn = usePermission('iade:return:approve');
  const canCancelReturn = usePermission('iade:return:cancel');

  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  if (isLoading) return <LoadingState />;
  if (error || !r) return <ErrorState message="İade yüklenemedi" onRetry={refetch} />;

  const canEdit = ['DRAFT', 'PENDING'].includes(r.status);
  const canSubmit = r.status === 'DRAFT';
  const canApproveStatus = r.status === 'PENDING';
  const canComplete = r.status === 'APPROVED';
  const canCancelStatus = !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(r.status);

  return (
    <div>
      <div className="space-y-4">
        <PageHeader
          title={`İade ${r.returnNumber}`}
          description={`${formatDate(r.returnDate)} • ${ReturnReasonLabel[r.reason]}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => navigate('/returns')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm">
                <ArrowLeft className="h-4 w-4" /> Geri
              </button>
              {canEdit && (
                <button onClick={() => navigate(`/returns/${id}/edit`)} className="rounded-md border border-primary px-3 py-2 text-sm font-medium text-primary">
                  Düzenle
                </button>
              )}
              <button onClick={() => window.print()} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm">
                <Printer className="h-4 w-4" /> Yazdır
              </button>
            </div>
          }
        />

        {/* Aksiyon bar */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-outline-variant bg-surface p-3">
          <span className="text-sm text-on-surface-variant">Durum:</span>
          <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-medium text-on-primary-container">
            {ReturnStatusLabel[r.status]}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            {canApproveReturn && canSubmit && (
              <button onClick={async () => { await action.mutateAsync({ id, action: 'submit' }); refetch(); }} className="flex items-center gap-2 rounded-md border border-blue-600 bg-surface px-3 py-1.5 text-sm font-medium text-blue-600">
                <Send className="h-4 w-4" /> Onaya Gönder
              </button>
            )}
            {canApproveReturn && canApproveStatus && (
              <>
                <button onClick={() => setConfirmApprove(true)} className="flex items-center gap-2 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white">
                  <Check className="h-4 w-4" /> Onayla
                </button>
                <button onClick={() => setConfirmReject(true)} className="flex items-center gap-2 rounded-md border border-red-600 bg-surface px-3 py-1.5 text-sm font-medium text-red-600">
                  <X className="h-4 w-4" /> Reddet
                </button>
              </>
            )}
            {canApproveReturn && canComplete && (
              <button onClick={() => setConfirmComplete(true)} className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-on-primary">
                <Check className="h-4 w-4" /> Tamamla
              </button>
            )}
            {canCancelReturn && canCancelStatus && (
              <button onClick={() => setConfirmCancel(true)} className="flex items-center gap-2 rounded-md border border-amber-600 bg-surface px-3 py-1.5 text-sm font-medium text-amber-600">
                <X className="h-4 w-4" /> İptal Et
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Sol: Cari + İade bilgileri */}
          <div className="space-y-4 lg:col-span-1">
            <div className="rounded-lg border border-outline-variant bg-surface p-4">
              <h3 className="mb-3 text-sm font-semibold">Cari Bilgisi</h3>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-xs text-on-surface-variant">Cari Adı</dt><dd className="font-medium">{r.customerName}</dd></div>
                {r.customer?.code && <div><dt className="text-xs text-on-surface-variant">Cari Kodu</dt><dd className="font-mono">{r.customer.code}</dd></div>}
                {r.customerTaxNumber && <div><dt className="text-xs text-on-surface-variant">Vergi No</dt><dd className="font-mono">{r.customerTaxNumber}</dd></div>}
                {r.customerPhone && <div><dt className="text-xs text-on-surface-variant">Telefon</dt><dd>{r.customerPhone}</dd></div>}
                {r.customerAddress && <div><dt className="text-xs text-on-surface-variant">Adres</dt><dd className="text-xs">{r.customerAddress}</dd></div>}
              </dl>
            </div>

            <div className="rounded-lg border border-outline-variant bg-surface p-4">
              <h3 className="mb-3 text-sm font-semibold">İade Detayı</h3>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-xs text-on-surface-variant">Kaynak</dt><dd>{ReturnSourceLabel[r.source]}</dd></div>
                <div><dt className="text-xs text-on-surface-variant">Neden</dt><dd>{ReturnReasonLabel[r.reason]}</dd></div>
                <div><dt className="text-xs text-on-surface-variant">Depoya Geri Al</dt><dd>{r.returnToStock ? 'Evet' : 'Hayır'}</dd></div>
                {r.rejectionReason && <div><dt className="text-xs text-on-surface-variant">Red Nedeni</dt><dd className="text-red-600">{r.rejectionReason}</dd></div>}
                {r.notes && <div><dt className="text-xs text-on-surface-variant">Not</dt><dd className="text-xs">{r.notes}</dd></div>}
              </dl>
            </div>
          </div>

          {/* Sağ: Kalemler + Etki */}
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-lg border border-outline-variant bg-surface">
              <div className="border-b border-outline-variant p-4">
                <h3 className="text-sm font-semibold">İade Kalemleri ({r.items.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-variant text-xs">
                    <tr>
                      <th className="px-3 py-2 text-left">Ürün</th>
                      <th className="px-3 py-2 text-right">Miktar</th>
                      <th className="px-3 py-2 text-right">Birim Fiyat</th>
                      <th className="px-3 py-2 text-right">KDV</th>
                      <th className="px-3 py-2 text-center">Durum</th>
                      <th className="px-3 py-2 text-right">Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.items.map((it) => (
                      <tr key={it.id} className="border-t border-outline-variant">
                        <td className="px-3 py-2">
                          <div className="text-xs text-on-surface-variant font-mono">{it.productId}</div>
                          {it.description && <div className="text-xs">{it.description}</div>}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{it.quantity}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(it.unitPrice, r.currency)}</td>
                        <td className="px-3 py-2 text-right">%{it.vatRate}</td>
                        <td className="px-3 py-2 text-center">
                          <span className="rounded-full bg-surface-variant px-2 py-0.5 text-xs">{ReturnItemConditionLabel[it.condition]}</span>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">{formatCurrency(it.lineGrandTotal, r.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-outline bg-surface-variant text-sm">
                    <tr><td colSpan={5} className="px-3 py-2 text-right">Ara Toplam (KDV Hariç)</td><td className="px-3 py-2 text-right font-medium">{formatCurrency(r.subTotal, r.currency)}</td></tr>
                    <tr><td colSpan={5} className="px-3 py-2 text-right">KDV Toplamı</td><td className="px-3 py-2 text-right font-medium">{formatCurrency(r.vatTotal, r.currency)}</td></tr>
                    <tr className="text-base font-bold"><td colSpan={5} className="px-3 py-2 text-right">Genel Toplam</td><td className="px-3 py-2 text-right">{formatCurrency(r.grandTotal, r.currency)}</td></tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Etki */}
            {r.status === 'COMPLETED' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-outline-variant bg-surface p-4">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Package className="h-4 w-4" /> Stok Etkisi
                  </h3>
                  {r.stockMovements && r.stockMovements.length > 0 ? (
                    <ul className="space-y-1 text-sm">
                      {r.stockMovements.map((m) => (
                        <li key={m.id} className="flex justify-between border-b border-outline-variant py-1">
                          <span className="font-mono text-xs">{m.productId}</span>
                          <span className={m.type === 'IN' ? 'text-green-600' : 'text-red-600'}>
                            {m.type === 'IN' ? '+' : '-'}{m.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-xs text-on-surface-variant">Stok hareketi oluşmadı</p>}
                </div>
                <div className="rounded-lg border border-outline-variant bg-surface p-4">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <DollarSign className="h-4 w-4" /> Cari Etkisi
                  </h3>
                  {r.customerMovements && r.customerMovements.length > 0 ? (
                    <ul className="space-y-1 text-sm">
                      {r.customerMovements.map((m) => (
                        <li key={m.id} className="flex justify-between border-b border-outline-variant py-1">
                          <span className="text-xs">{m.description}</span>
                          <span className="font-mono font-medium">{formatCurrency(Number(m.amount), r.currency)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-xs text-on-surface-variant">Cari hareket oluşmadı</p>}
                </div>
              </div>
            )}

            {/* İşlem Geçmişi */}
            <div className="rounded-lg border border-outline-variant bg-surface p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <History className="h-4 w-4" /> İşlem Geçmişi
              </h3>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between border-b border-outline-variant py-1.5">
                  <span>Oluşturma</span>
                  <span className="text-xs text-on-surface-variant">{formatDateTime(r.createdAt)}</span>
                </li>
                {r.approvedAt && (
                  <li className="flex justify-between border-b border-outline-variant py-1.5">
                    <span className="text-green-700">Onay</span>
                    <span className="text-xs text-on-surface-variant">{formatDateTime(r.approvedAt)}</span>
                  </li>
                )}
                {r.completedAt && (
                  <li className="flex justify-between border-b border-outline-variant py-1.5">
                    <span className="text-blue-700">Tamamlandı</span>
                    <span className="text-xs text-on-surface-variant">{formatDateTime(r.completedAt)}</span>
                  </li>
                )}
                {r.rejectedAt && (
                  <li className="flex justify-between border-b border-outline-variant py-1.5">
                    <span className="text-red-700">Reddedildi</span>
                    <span className="text-xs text-on-surface-variant">{formatDateTime(r.rejectedAt)}</span>
                  </li>
                )}
                {r.cancelledAt && (
                  <li className="flex justify-between py-1.5">
                    <span className="text-amber-700">İptal</span>
                    <span className="text-xs text-on-surface-variant">{formatDateTime(r.cancelledAt)}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <ConfirmModal open={confirmApprove} title="İade Onaylansın mı?" description="İade onaylandıktan sonra tamamlama adımı uygulanabilir." confirmText="Onayla" variant="info" onConfirm={async () => { await action.mutateAsync({ id, action: 'approve' }); setConfirmApprove(false); refetch(); }} onClose={() => setConfirmApprove(false)} />
        <ConfirmModal open={confirmComplete} title="İade Tamamlansın mı?" description="Tamamlama sonrası stok ve cari hareketleri oluşturulur. Bu işlem geri alınamaz." confirmText="Tamamla" variant="info" onConfirm={async () => { await action.mutateAsync({ id, action: 'complete' }); setConfirmComplete(false); refetch(); }} onClose={() => setConfirmComplete(false)} />
        <ConfirmModal open={confirmCancel} title="İade İptal Edilsin mi?" description="İade iptal edilecek." confirmText="İptal Et" variant="warning" onConfirm={async () => { await action.mutateAsync({ id, action: 'cancel' }); setConfirmCancel(false); refetch(); }} onClose={() => setConfirmCancel(false)} />

        {confirmReject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-lg bg-surface p-5 shadow-xl">
              <h3 className="mb-3 text-lg font-semibold">İade Reddedilsin</h3>
              <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} placeholder="Red nedeni (en az 3 karakter)..." className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => setConfirmReject(false)} className="rounded-md border border-outline px-3 py-1.5 text-sm">Vazgeç</button>
                <button
                  onClick={async () => { if (rejectionReason.trim().length >= 3) { await action.mutateAsync({ id, action: 'reject', rejectionReason }); setConfirmReject(false); setRejectionReason(''); refetch(); } }}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
                  disabled={rejectionReason.trim().length < 3}
                >Reddet</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
