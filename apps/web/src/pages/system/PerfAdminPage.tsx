import { Activity, AlertTriangle, Trash2, Database, Clock, Zap } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { useQueryStats, useRecentQueries, useSlowQueries, useClearQueries } from '@/features/perf-admin/api';

const ACTION_COLOR: any = { SELECT: 'bg-blue-100 text-blue-800', INSERT: 'bg-green-100 text-green-800', UPDATE: 'bg-amber-100 text-amber-800', DELETE: 'bg-red-100 text-red-800', OTHER: 'bg-gray-100 text-gray-700' };

export function PerfAdminPage() {
  const { data: stats, isLoading } = useQueryStats();
  const { data: recent } = useRecentQueries(30);
  const { data: slow } = useSlowQueries(20);
  const clear = useClearQueries();

  return (
    <div className="space-y-4">
      <PageHeader title="DB Performans" description="Prisma query log, yavaş sorgu tespiti, p95/p99 latency" actions={<button onClick={() => clear.mutate()} className="flex items-center gap-1 rounded-md border border-outline px-3 py-2 text-sm"><Trash2 className="h-4 w-4" /> Logları Temizle</button>} />

      {isLoading ? <LoadingState /> : stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-outline bg-surface p-3"><div className="flex items-center gap-2 text-xs text-on-surface-variant"><Database className="h-3 w-3" /> Toplam Sorgu (son 5dk)</div><p className="text-2xl font-bold">{stats.last5MinCount}</p></div>
          <div className="rounded-lg border border-blue-300 bg-blue-50 p-3"><div className="flex items-center gap-2 text-xs text-on-surface-variant"><Activity className="h-3 w-3" /> Ortalama</div><p className="text-2xl font-bold text-blue-600">{stats.avgDuration.toFixed(1)}ms</p></div>
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3"><div className="flex items-center gap-2 text-xs text-on-surface-variant"><Clock className="h-3 w-3" /> p95</div><p className="text-2xl font-bold text-amber-600">{stats.p95Duration.toFixed(1)}ms</p></div>
          <div className="rounded-lg border border-red-300 bg-red-50 p-3"><div className="flex items-center gap-2 text-xs text-on-surface-variant"><Zap className="h-3 w-3" /> p99</div><p className="text-2xl font-bold text-red-600">{stats.p99Duration.toFixed(1)}ms</p></div>
        </div>
      )}

      {stats && stats.slowQueriesCount > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3">
          <div className="flex items-center gap-2 font-semibold text-red-900"><AlertTriangle className="h-4 w-4" /> {stats.slowQueriesCount} Yavaş Sorgu Tespit Edildi</div>
          <p className="mt-1 text-sm text-red-800">Eşik: 500ms üzeri. Bu sorguları optimize edin veya index ekleyin.</p>
        </div>
      )}

      <div className="rounded-lg border border-outline bg-surface p-3">
        <h3 className="mb-2 font-semibold">Yavaş Sorgular (top {slow?.length ?? 0})</h3>
        {slow && slow.length > 0 ? (
          <div className="space-y-1">
            {slow.map((q, i) => (
              <div key={i} className="rounded border border-red-200 bg-red-50/50 p-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-red-700">⏱ {q.durationMs}ms</span>
                  {q.model && <span className="rounded bg-red-200 px-1.5 py-0.5 text-red-900">{q.model}</span>}
                </div>
                <p className="mt-1 truncate font-mono text-on-surface-variant">{q.query}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-on-surface-variant">Yavaş sorgu yok 🎉</p>}
      </div>

      <div className="rounded-lg border border-outline bg-surface p-3">
        <h3 className="mb-2 font-semibold">Son Sorgular (top {recent?.length ?? 0})</h3>
        {recent && recent.length > 0 ? (
          <div className="max-h-96 space-y-1 overflow-y-auto">
            {recent.map((q, i) => (
              <div key={i} className="flex items-center gap-2 rounded border border-outline-variant p-1.5 text-xs">
                <span className={`rounded-full px-1.5 py-0.5 ${ACTION_COLOR[q.action] ?? 'bg-gray-100'}`}>{q.action}</span>
                {q.model && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700">{q.model}</span>}
                <span className="flex-1 truncate font-mono text-on-surface-variant">{q.query}</span>
                <span className={`font-mono font-bold ${q.durationMs > 500 ? 'text-red-600' : q.durationMs > 100 ? 'text-amber-600' : 'text-green-600'}`}>{q.durationMs}ms</span>
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-on-surface-variant">Henüz sorgu yok</p>}
      </div>
    </div>
  );
}
