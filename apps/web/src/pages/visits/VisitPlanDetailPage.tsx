import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, MapPin, Phone, MessageCircle, CheckCircle2, XCircle, Truck, Coins } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { useVisitPlan, useUpdateCustomerStatus, useAddNote } from '@/features/visits/api';
import { VisitStatus, VisitStatusLabel, VisitStatusColor, formatDateTime } from '@saas/shared';
const COLOR_BG: Record<string, string> = { gray: 'bg-gray-200 text-gray-700', blue: 'bg-blue-100 text-blue-800', green: 'bg-green-100 text-green-800', amber: 'bg-amber-100 text-amber-800', red: 'bg-red-100 text-red-800' };

export function VisitPlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: plan, isLoading, refetch } = useVisitPlan(id ?? '');
  const updateMut = useUpdateCustomerStatus();
  const addNoteMut = useAddNote();
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  if (isLoading) return <LoadingState />;
  if (!plan) return null;

  const doCheckIn = (customerId: string) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await updateMut.mutateAsync({ planId: plan.id, customerId, status: VisitStatus.IN_PROGRESS, reason: `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` });
        refetch();
      },
      () => alert('GPS alınamadı'),
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader title={plan.name} description={`${plan.totalCustomers} müşteri • ${plan.visitedCount} ziyaret edildi`}
        actions={<button onClick={() => navigate('/visits/plans')} className="flex items-center gap-1 rounded-md border border-outline px-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" /> Geri</button>}
      />

      <div className="space-y-2">
        {plan.customers?.map((c: any) => (
          <div key={c.id} className="rounded-lg border border-outline-variant bg-surface p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{c.customerName}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${COLOR_BG[VisitStatusColor[c.status as keyof typeof VisitStatusColor]]}`}>{VisitStatusLabel[c.status as keyof typeof VisitStatusLabel]}</span>
                </div>
                {c.customerAddress && <p className="mt-0.5 text-xs text-on-surface-variant">📍 {c.customerAddress}</p>}
                {c.customerPhone && <p className="text-xs text-on-surface-variant">📞 {c.customerPhone}</p>}
              </div>
              <div className="flex flex-wrap gap-1">
                <a href={`tel:${c.customerPhone}`} className="rounded p-1.5 text-green-600 hover:bg-green-50" title="Ara"><Phone className="h-4 w-4" /></a>
                <a href={`https://wa.me/${c.customerPhone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="rounded p-1.5 text-green-700 hover:bg-green-50" title="WhatsApp"><MessageCircle className="h-4 w-4" /></a>
                <button onClick={() => doCheckIn(c.id)} className="rounded p-1.5 text-blue-600 hover:bg-blue-50" title="GPS Check-in"><MapPin className="h-4 w-4" /></button>
                <button onClick={() => updateMut.mutate({ planId: plan.id, customerId: c.id, status: VisitStatus.ORDER_TAKEN })} className="rounded p-1.5 text-amber-600 hover:bg-amber-50" title="Sipariş Alındı"><Truck className="h-4 w-4" /></button>
                <button onClick={() => updateMut.mutate({ planId: plan.id, customerId: c.id, status: VisitStatus.COLLECTION_TAKEN })} className="rounded p-1.5 text-green-600 hover:bg-green-50" title="Tahsilat Alındı"><Coins className="h-4 w-4" /></button>
                <button onClick={() => updateMut.mutate({ planId: plan.id, customerId: c.id, status: VisitStatus.COULDNT_MEET, reason: prompt('Sebep:') ?? '' })} className="rounded p-1.5 text-red-600 hover:bg-red-50" title="Görüşülemedi"><XCircle className="h-4 w-4" /></button>
                <button onClick={() => updateMut.mutate({ planId: plan.id, customerId: c.id, status: VisitStatus.VISITED })} className="rounded p-1.5 text-green-700 hover:bg-green-50" title="Ziyaret Edildi"><CheckCircle2 className="h-4 w-4" /></button>
                <button onClick={() => setNoteFor(c.id)} className="rounded p-1.5 text-blue-700 hover:bg-blue-50" title="Not Ekle">📝</button>
              </div>
            </div>
            {c.notes && <p className="mt-2 rounded bg-surface-variant/30 p-2 text-xs">📝 {c.notes}</p>}
            {c.reason && <p className="mt-2 rounded bg-red-50 p-2 text-xs text-red-800">⚠ {c.reason}</p>}
          </div>
        ))}
      </div>

      {noteFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-surface p-4">
            <h3 className="text-sm font-semibold">Ziyaret Notu</h3>
            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4} className="mt-2 w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" placeholder="Görüşme notu..." />
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => { setNoteFor(null); setNoteText(''); }} className="rounded-md border border-outline px-3 py-1.5 text-sm">İptal</button>
              <button onClick={async () => { await addNoteMut.mutateAsync({ planId: plan.id, customerId: noteFor, content: noteText, type: 'GENERAL' }); setNoteFor(null); setNoteText(''); }} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-on-primary">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
