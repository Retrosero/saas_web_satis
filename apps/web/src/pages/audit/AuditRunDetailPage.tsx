import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useRun, useResults } from '@/features/audit/api';
import { DataCheckTypeLabel, DataCheckTypeIcon, DataCheckRunStatusLabel, formatDateTime } from '@saas/shared';

const STATUS_BG: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-800', RUNNING: 'bg-blue-100 text-blue-800', FAILED: 'bg-red-100 text-red-800', CANCELLED: 'bg-gray-200 text-gray-700',
};

export function AuditRunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: run, isLoading, error } = useRun(id ?? '');
  const { data: results } = useResults({ runId: id, pageSize: 100 });

  if (isLoading) return <LoadingState />;
  if (error || !run) return <ErrorState message="Çalıştırma yüklenemedi" />;

  return (
    <div className="space-y-4">
      <PageHeader title={run.ruleName} description={`${DataCheckTypeLabel[run.checkType]} • ${formatDateTime(run.startedAt)}`}
        actions={<button onClick={() => navigate('/audit/runs')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" /> Geri</button>}
      />

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-outline-variant bg-surface p-3"><p className="text-xs text-on-surface-variant">Durum</p><span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BG[run.status]}`}>{DataCheckRunStatusLabel[run.status]}</span></div>
        <div className="rounded-lg border border-outline-variant bg-surface p-3"><p className="text-xs text-on-surface-variant">Bulgu</p><p className="mt-1 text-2xl font-bold">{run.resultCount}</p></div>
        <div className="rounded-lg border border-outline-variant bg-surface p-3"><p className="text-xs text-on-surface-variant">Süre</p><p className="mt-1 text-2xl font-bold">{run.durationMs ?? '—'}<span className="text-sm font-normal">ms</span></p></div>
        <div className="rounded-lg border border-outline-variant bg-surface p-3"><p className="text-xs text-on-surface-variant">Tetikleyen</p><p className="mt-1 text-sm">{run.triggeredBy ?? '—'}</p></div>
      </div>

      {run.warning && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5" /> {run.warning}
        </div>
      )}

      <section className="rounded-lg border border-outline-variant bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><Activity className="h-4 w-4" /> Bulunan Sorunlar ({results?.total ?? 0})</h3>
        {!results || results.items.length === 0 ? <p className="text-sm text-on-surface-variant">Bulgu yok — veriler temiz 🎉</p> : (
          <div className="space-y-1">
            {results.items.map((r) => (
              <div key={r.id} onClick={() => navigate(`/audit/results/${r.id}`)} className="flex items-center gap-2 rounded-md p-2 hover:bg-surface-variant/30 cursor-pointer">
                <span className="text-lg">{DataCheckTypeIcon[r.checkType]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{r.entityLabel}</p>
                  <p className="text-xs text-on-surface-variant truncate">{r.description}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${r.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : r.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' : r.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>{r.severity}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
