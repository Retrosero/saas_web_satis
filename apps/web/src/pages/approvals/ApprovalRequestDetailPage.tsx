import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { CheckCircle2, XCircle, ArrowLeft, Share2, MessageSquare, Clock, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useRequest, useActOnRequest, useCancelRequest } from '@/features/approvals/api';
import { ApprovalRequestStatusLabel, ApprovalRequestStatusColor, ApprovalTriggerTypeLabel, ApprovalActionTypeLabel, ApprovalPriorityLabel, ApprovalPriorityColor, formatDateTime, type ApprovalAction } from '@saas/shared';

const COLOR_BG: Record<string, string> = {
  amber: 'bg-amber-100 text-amber-800', green: 'bg-green-100 text-green-800', red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-200 text-gray-700', blue: 'bg-blue-100 text-blue-800',
};

export function ApprovalRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: request, isLoading, error, refetch } = useRequest(id ?? '');
  const actMut = useActOnRequest();
  const cancelMut = useCancelRequest();
  const [comment, setComment] = useState('');

  if (isLoading) return <LoadingState />;
  if (error || !request) return <ErrorState message="İstek yüklenemedi" onRetry={refetch} />;

  const isPending = request.status === 'PENDING';
  const isExpired = request.expiresAt && new Date(request.expiresAt) < new Date();

  return (
    <div className="space-y-4">
      <PageHeader
        title={request.entityLabel}
        description={`${ApprovalTriggerTypeLabel[request.triggerType]} • ${request.ruleName}`}
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate('/approvals')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" /> Geri</button>
            {isPending && <button onClick={async () => { await cancelMut.mutateAsync({ id: request.id, comment: 'Talep eden tarafından iptal edildi' }); }} className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700">İptal</button>}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-3">
          {/* Genel Bilgi */}
          <section className="rounded-lg border border-outline-variant bg-surface p-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <div><p className="text-xs text-on-surface-variant">Durum</p><span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_BG[ApprovalRequestStatusColor[request.status]]}`}>{ApprovalRequestStatusLabel[request.status]}</span></div>
              <div><p className="text-xs text-on-surface-variant">Öncelik</p><span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_BG[ApprovalPriorityColor[request.priority]]}`}>{ApprovalPriorityLabel[request.priority]}</span></div>
              <div><p className="text-xs text-on-surface-variant">Tutar</p><p className="mt-1 text-sm font-semibold">{request.amount ? `${request.amount.toLocaleString('tr-TR')} ${request.amountCurrency ?? 'TRY'}` : '—'}</p></div>
              <div><p className="text-xs text-on-surface-variant">Talep Eden</p><p className="mt-1 text-sm">{request.requesterName ?? request.requesterId}</p></div>
              <div><p className="text-xs text-on-surface-variant">Oluşturuldu</p><p className="mt-1 text-sm">{formatDateTime(request.createdAt)}</p></div>
              {request.expiresAt && <div><p className="text-xs text-on-surface-variant">Son Tarih</p><p className={`mt-1 text-sm ${isExpired ? 'text-red-600 font-semibold' : ''}`}>{formatDateTime(request.expiresAt)}</p></div>}
            </div>
            {request.finalComment && <div className="mt-3 rounded-md bg-surface-variant/30 p-2 text-sm"><strong>Son Yorum:</strong> {request.finalComment}</div>}
          </section>

          {/* Adımlar */}
          <section className="rounded-lg border border-outline-variant bg-surface p-4">
            <h3 className="mb-2 text-sm font-semibold">Onay Adımları ({request.currentStep}/{request.totalSteps})</h3>
            <div className="space-y-2">
              {request.actions?.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-md border border-outline-variant p-2">
                  <div className={`mt-1 h-2 w-2 rounded-full ${a.actionType === 'APPROVED' ? 'bg-green-500' : a.actionType === 'REJECTED' ? 'bg-red-500' : 'bg-amber-500'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><span className="rounded bg-primary-container px-2 py-0.5 text-xs">Adım {a.stepOrder}</span><p className="text-sm font-semibold">{a.stepName}</p></div>
                    <p className="text-xs text-on-surface-variant">{a.actorName ?? a.actorId} • {formatDateTime(a.createdAt)}</p>
                    {a.comment && <p className="mt-1 text-sm italic">"{a.comment}"</p>}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.actionType === 'APPROVED' ? 'bg-green-100 text-green-800' : a.actionType === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{ApprovalActionTypeLabel[a.actionType]}</span>
                </div>
              ))}
              {request.currentStepInfo && request.status === 'PENDING' && (
                <div className="rounded-md border-2 border-primary border-dashed p-2 bg-primary-container/10">
                  <p className="text-xs font-semibold text-primary">Şu an: Adım {request.currentStep} — {request.currentStepInfo.name}</p>
                  <p className="text-xs text-on-surface-variant">Bu adımın onayı bekleniyor</p>
                </div>
              )}
            </div>
          </section>

          {/* Aksiyon paneli */}
          {isPending && !isExpired && (
            <section className="rounded-lg border-2 border-primary bg-primary-container/10 p-4">
              <h3 className="mb-2 text-sm font-semibold">Karar Ver</h3>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Yorum (opsiyonel)..." rows={3} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={async () => { await actMut.mutateAsync({ id: request.id, actionType: 'APPROVED', comment: comment || undefined }); setComment(''); refetch(); }} className="flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white"><CheckCircle2 className="h-4 w-4" /> Onayla</button>
                <button onClick={async () => { if (!comment) { alert('Red sebebi zorunlu'); return; } await actMut.mutateAsync({ id: request.id, actionType: 'REJECTED', comment }); setComment(''); refetch(); }} className="flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white"><XCircle className="h-4 w-4" /> Reddet</button>
                <button onClick={async () => { await actMut.mutateAsync({ id: request.id, actionType: 'COMMENTED', comment }); setComment(''); refetch(); }} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><MessageSquare className="h-4 w-4" /> Yorum</button>
              </div>
            </section>
          )}
        </div>

        {/* Sağ panel — detay */}
        <div className="space-y-3">
          <section className="rounded-lg border border-outline-variant bg-surface p-3">
            <h3 className="mb-2 text-sm font-semibold">Bağlam</h3>
            <p className="text-xs"><strong>Tip:</strong> {request.entityType}</p>
            <p className="text-xs"><strong>ID:</strong> <code className="text-[10px]">{request.entityId}</code></p>
            {request.entityNumber && <p className="text-xs"><strong>No:</strong> {request.entityNumber}</p>}
            <p className="text-xs mt-1"><strong>Adım:</strong> {request.currentStep} / {request.totalSteps}</p>
          </section>
          {isExpired && (
            <div className="rounded-md bg-red-100 p-2 text-xs text-red-800 flex items-start gap-1">
              <AlertCircle className="h-3 w-3 mt-0.5" /> Süresi dolmuş bir istek. Yeni karar verilemez.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
