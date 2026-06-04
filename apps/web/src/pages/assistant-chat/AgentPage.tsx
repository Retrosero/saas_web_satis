import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, CheckCircle2, XCircle, Clock, Wrench, ArrowRight, Play, RotateCw, MessageSquare } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useRunAgent, type AgentStep } from '@/features/agent/api';
import { LoadingState } from '@/components/data/LoadingState';

const EXAMPLE_GOALS = [
  'ABC Ltd. müşterisinin bakiyesini kontrol et, eğer 10000 TRY üzerindeyse son 30 gündeki ödemelerini listele',
  'Bugünün satışlarını özetle, en çok satış yapılan müşteriyi bul ve o müşterinin son 5 satışını göster',
  'Kritik stoktaki ürünleri listele, hangi tedarikçiden aldığımızı göster ve toplam sipariş tutarını hesapla',
  'Bu ay tahsilatı olmayan müşterileri bul, en yüksek bakiyeli 5 tanesini listele ve toplam alacağı hesapla',
  'Son 7 günde en çok satılan 3 ürünü bul, her birinin stok durumunu kontrol et',
];

const STATUS_ICON: any = { PENDING: Clock, RUNNING: Loader2, COMPLETED: CheckCircle2, FAILED: XCircle, SKIPPED: Clock };
const STATUS_BG: any = {
  PENDING: 'bg-gray-200 text-gray-700', RUNNING: 'bg-blue-100 text-blue-800', COMPLETED: 'bg-green-100 text-green-800', FAILED: 'bg-red-100 text-red-800', SKIPPED: 'bg-gray-200 text-gray-700',
};

export function AgentPage() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState('');
  const runMut = useRunAgent();
  const [result, setResult] = useState<any>(null);

  const onRun = async () => {
    if (!goal.trim()) return;
    const r = await runMut.mutateAsync({ goal });
    setResult(r);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="AI Agent" description="Hedef ver, agent sırayla araçları kullanarak sonucu üretsin" actions={<button onClick={() => navigate('/assistant-chat')} className="flex items-center gap-1 rounded-md border border-outline px-3 py-2 text-sm"><MessageSquare className="h-4 w-4" /> Normal Chat</button>} />

      <div className="rounded-lg border border-purple-300 bg-purple-50 p-3 text-sm">
        <div className="flex items-center gap-2 font-semibold text-purple-900"><Sparkles className="h-4 w-4" /> Plan → Execute → Reflect</div>
        <p className="mt-1 text-purple-800">Agent verdiğiniz hedefe ulaşmak için gerekirse birden fazla aracı sırayla çalıştırır. Her adımda düşünür, hata varsa yeni bir planla devam eder. Maks. 5 iterasyon.</p>
      </div>

      <div className="rounded-lg border border-outline bg-surface p-3">
        <label className="text-xs text-on-surface-variant">Hedef</label>
        <textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={3} placeholder="Örn: Stokta kritik seviyede olan ürünleri listele..." className="mt-1 w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" />
        <div className="mt-2 flex flex-wrap gap-1">
          {EXAMPLE_GOALS.map((g) => <button key={g} onClick={() => setGoal(g)} className="rounded-full border border-outline px-2 py-0.5 text-xs">{g.length > 60 ? g.slice(0, 60) + '...' : g}</button>)}
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={onRun} disabled={!goal.trim() || runMut.isPending} className="flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-50">{runMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} {runMut.isPending ? 'Çalışıyor...' : 'Çalıştır'}</button>
          {result && <button onClick={() => { setResult(null); setGoal(''); }} className="flex items-center gap-1 rounded-md border px-3 py-2 text-sm"><RotateCw className="h-4 w-4" /> Temizle</button>}
        </div>
      </div>

      {runMut.isPending && <LoadingState />}

      {result && (
        <>
          {result.steps && result.steps.length > 0 && (
            <div className="rounded-lg border border-outline bg-surface p-3">
              <h3 className="mb-2 font-semibold">Adımlar ({result.steps.length})</h3>
              <ol className="space-y-2">
                {result.steps.map((s: AgentStep, i: number) => {
                  const Icon = STATUS_ICON[s.status] ?? Clock;
                  return (
                    <li key={i} className="flex items-start gap-2 rounded border border-outline-variant p-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-variant text-xs font-bold">{s.order ?? i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${STATUS_BG[s.status]}`}><Icon className="h-3 w-3" /> {s.status}</span>
                          {s.toolCode && <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700"><Wrench className="inline h-3 w-3" /> {s.toolCode}</span>}
                          {s.durationMs != null && <span className="text-xs text-on-surface-variant">{s.durationMs}ms</span>}
                        </div>
                        <p className="mt-1 text-xs text-on-surface-variant">{s.description}</p>
                        {s.result && <p className="mt-1 rounded bg-surface-variant p-2 text-xs"><b>Sonuç:</b> {typeof s.result === 'string' ? s.result : JSON.stringify(s.result).slice(0, 300)}</p>}
                        {s.error && <p className="mt-1 rounded bg-red-50 p-2 text-xs text-red-700"><b>Hata:</b> {s.error}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {result.finalAnswer && (
            <section className="rounded-lg border-2 border-green-400 bg-green-50 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-800"><CheckCircle2 className="h-5 w-5" /> Agent Final Cevabı</h3>
              <p className="whitespace-pre-wrap text-sm text-green-900">{result.finalAnswer}</p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
