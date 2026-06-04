import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, DollarSign, Zap, Users, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useStats } from '@/features/assistant-chat/api';

export function ChatStatsPage() {
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  const { data, isLoading, error, refetch } = useStats(days);

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message="İstatistikler yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader title="AI Asistan İstatistikleri" description={`Son ${days} gün kullanım ve maliyet`} actions={
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm">
          <option value={7}>Son 7 gün</option>
          <option value={30}>Son 30 gün</option>
          <option value={90}>Son 90 gün</option>
        </select>
      } />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-outline-variant bg-surface p-3"><p className="text-xs text-on-surface-variant">Toplam İstek</p><p className="text-2xl font-bold">{data.totalRequests}</p></div>
        <div className="rounded-lg border border-outline-variant bg-surface p-3"><p className="text-xs text-on-surface-variant">Toplam Token</p><p className="text-2xl font-bold">{data.totalTokens.toLocaleString('tr-TR')}</p></div>
        <div className="rounded-lg border border-green-300 bg-green-50 p-3"><p className="text-xs text-on-surface-variant">Toplam Maliyet</p><p className="text-2xl font-bold text-green-600">${data.totalCostUSD.toFixed(4)}</p></div>
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3"><p className="text-xs text-on-surface-variant">Bütçe Kullanımı</p><p className="text-2xl font-bold text-amber-600">{(data.budgetUsage * 100).toFixed(1)}%</p></div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-lg border border-outline-variant bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Model Bazlı</h3>
          {data.byModel.length === 0 ? <p className="text-xs text-on-surface-variant">Veri yok</p> : (
            <ul className="space-y-1">
              {data.byModel.sort((a, b) => b.cost - a.cost).map((m) => (
                <li key={m.model} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs">{m.model}</span>
                  <span className="text-xs">{m.requests} istek • {m.tokens.toLocaleString('tr-TR')} tok • <strong className="text-green-600">${m.cost.toFixed(4)}</strong></span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-outline-variant bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> Kullanıcı Bazlı</h3>
          {data.byUser.length === 0 ? <p className="text-xs text-on-surface-variant">Veri yok</p> : (
            <ul className="space-y-1">
              {data.byUser.sort((a, b) => b.cost - a.cost).slice(0, 10).map((u) => (
                <li key={u.userId} className="flex items-center justify-between text-sm">
                  <span>{u.userName}</span>
                  <span className="text-xs">{u.requests} istek • <strong>${u.cost.toFixed(4)}</strong></span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-outline-variant bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Günlük Kullanım</h3>
        {data.byDay.length === 0 ? <p className="text-xs text-on-surface-variant">Veri yok</p> : (
          <div className="space-y-1">
            {data.byDay.slice(-14).map((d) => {
              const maxReq = Math.max(...data.byDay.map((x) => x.requests));
              return (
                <div key={d.date} className="flex items-center gap-2">
                  <span className="w-24 text-xs text-on-surface-variant">{d.date.substring(5)}</span>
                  <div className="flex-1 h-3 rounded-full bg-surface-variant overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${maxReq > 0 ? (d.requests / maxReq) * 100 : 0}%` }} />
                  </div>
                  <span className="w-32 text-xs text-right">{d.requests} istek • ${d.cost.toFixed(4)}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
