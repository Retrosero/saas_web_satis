import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { BarChart3, MessageSquare, Wrench, DollarSign, Users, Database, BookOpen, Activity, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useGlobalStats } from '@/features/ai-observability/api';

const COLOR_BG: Record<string, string> = { green: 'bg-green-100 text-green-800', red: 'bg-red-100 text-red-800', amber: 'bg-amber-100 text-amber-800', gray: 'bg-gray-200 text-gray-700' };

export function AIDashboardPage() {
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  const { data, isLoading, error, refetch } = useGlobalStats(days);

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message="İstatistikler yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader title="AI Asistan — Süper Admin Dashboard" description={`Son ${days} gün — tüm tenantlar`}
        actions={
          <div className="flex gap-2">
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm">
              <option value={7}>Son 7 gün</option><option value={30}>Son 30 gün</option><option value={90}>Son 90 gün</option>
            </select>
            <button onClick={() => navigate('/super-admin/ai/conversations')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><MessageSquare className="h-4 w-4" /> Konuşmalar</button>
            <button onClick={() => navigate('/super-admin/ai/training')} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Database className="h-4 w-4" /> Training Data</button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-outline-variant bg-surface p-3"><p className="text-xs text-on-surface-variant">Toplam Konuşma</p><p className="text-2xl font-bold">{data.totalConversations.toLocaleString('tr-TR')}</p></div>
        <div className="rounded-lg border border-outline-variant bg-surface p-3"><p className="text-xs text-on-surface-variant">Toplam Mesaj</p><p className="text-2xl font-bold">{data.totalMessages.toLocaleString('tr-TR')}</p></div>
        <div className="rounded-lg border border-outline-variant bg-surface p-3"><p className="text-xs text-on-surface-variant">Tool Çağrısı</p><p className="text-2xl font-bold">{data.totalToolCalls.toLocaleString('tr-TR')}</p></div>
        <div className="rounded-lg border border-outline-variant bg-surface p-3"><p className="text-xs text-on-surface-variant">Token</p><p className="text-2xl font-bold">{data.totalTokens.toLocaleString('tr-TR')}</p></div>
        <div className="rounded-lg border border-green-300 bg-green-50 p-3"><p className="text-xs text-on-surface-variant">Toplam Maliyet</p><p className="text-2xl font-bold text-green-600">${data.totalCostUSD.toFixed(2)}</p></div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-lg border border-outline-variant bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4" /> En Çok Harcayan Tenant'lar</h3>
          {data.byTenant.length === 0 ? <p className="text-xs text-on-surface-variant">Veri yok</p> : (
            <ul className="space-y-1">
              {data.byTenant.slice(0, 8).map((t) => (
                <li key={t.tenantId} onClick={() => navigate(`/super-admin/ai/conversations?tenantId=${t.tenantId}`)} className="flex items-center justify-between text-sm rounded-md p-1.5 hover:bg-surface-variant/30 cursor-pointer">
                  <span className="font-semibold">{t.tenantName}</span>
                  <span className="text-xs">{t.conversations} konuşma • <strong className="text-green-600">${t.cost.toFixed(4)}</strong></span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-outline-variant bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Model Bazlı Kullanım</h3>
          {data.byModel.length === 0 ? <p className="text-xs text-on-surface-variant">Veri yok</p> : (
            <ul className="space-y-1">
              {data.byModel.sort((a, b) => b.cost - a.cost).map((m) => (
                <li key={m.model} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs">{m.model}</span>
                  <span className="text-xs">{m.requests} istek • <strong>${m.cost.toFixed(4)}</strong></span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-lg border border-outline-variant bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> En Aktif Kullanıcılar</h3>
          {data.topUsers.length === 0 ? <p className="text-xs text-on-surface-variant">Veri yok</p> : (
            <ul className="space-y-1">
              {data.topUsers.map((u) => (
                <li key={u.userId} onClick={() => navigate(`/super-admin/ai/conversations?userId=${u.userId}`)} className="flex items-center justify-between text-sm rounded-md p-1.5 hover:bg-surface-variant/30 cursor-pointer">
                  <span>{u.userName}</span>
                  <span className="text-xs">{u.messages} mesaj</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-outline-variant bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold">Feedback Dağılımı</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border border-green-300 bg-green-50 p-3"><p className="text-xs">👍 Olumlu</p><p className="text-2xl font-bold text-green-600">{data.feedbackStats.positive}</p></div>
            <div className="rounded-md border border-red-300 bg-red-50 p-3"><p className="text-xs">👎 Olumsuz</p><p className="text-2xl font-bold text-red-600">{data.feedbackStats.negative}</p></div>
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3"><p className="text-xs">✏️ Düzeltildi</p><p className="text-2xl font-bold text-amber-600">{data.feedbackStats.corrected}</p></div>
            <div className="rounded-md border border-gray-300 bg-gray-50 p-3"><p className="text-xs">😐 Nötr</p><p className="text-2xl font-bold text-gray-600">{data.feedbackStats.neutral}</p></div>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-outline-variant bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold">Günlük Maliyet (son 14 gün)</h3>
        {data.byDay.length === 0 ? <p className="text-xs text-on-surface-variant">Veri yok</p> : (
          <div className="space-y-1">
            {data.byDay.slice(-14).map((d) => {
              const maxCost = Math.max(...data.byDay.map((x) => x.cost));
              return (
                <div key={d.date} className="flex items-center gap-2">
                  <span className="w-24 text-xs text-on-surface-variant">{d.date.substring(5)}</span>
                  <div className="flex-1 h-4 rounded-full bg-surface-variant overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${maxCost > 0 ? (d.cost / maxCost) * 100 : 0}%` }} />
                  </div>
                  <span className="w-40 text-xs text-right">{d.requests} istek • <strong>${d.cost.toFixed(4)}</strong></span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
