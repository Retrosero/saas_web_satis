import { useNavigate } from 'react-router-dom';
import { Shield, ListChecks, Activity, FileText, Play, AlertCircle, CheckCircle2, BarChart3, Calendar, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useStats, useRunAll, useResults } from '@/features/audit/api';
import { DataCheckSeverityColor, DataCheckResultStatusColor, DataCheckTypeLabel, DataCheckTypeIcon, formatDateTime } from '@saas/shared';

const COLOR_BG: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800', gray: 'bg-gray-200 text-gray-700', amber: 'bg-amber-100 text-amber-800',
  orange: 'bg-orange-100 text-orange-800', red: 'bg-red-100 text-red-800', green: 'bg-green-100 text-green-800', purple: 'bg-purple-100 text-purple-800',
};

export function AuditHomePage() {
  const navigate = useNavigate();
  const { data: stats, isLoading, error, refetch } = useStats();
  const { data: recent } = useResults({ pageSize: 5 });
  const runAll = useRunAll();

  return (
    <div className="space-y-4">
      <PageHeader title="Denetim Merkezi" description="Veri tutarlılığı ve kalite kontrolü"
        actions={
          <div className="flex gap-2">
            <button onClick={async () => { await runAll.mutateAsync(); refetch(); }} disabled={runAll.isPending} className="flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40">
              <Play className="h-4 w-4" /> Tümünü Çalıştır
            </button>
            <button onClick={() => navigate('/audit/results')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><FileText className="h-4 w-4" /> Bulgular</button>
            <button onClick={() => navigate('/audit/rules')} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><ListChecks className="h-4 w-4" /> Kurallar</button>
          </div>
        }
      />

      {isLoading ? <LoadingState /> : error ? <ErrorState message="İstatistikler yüklenemedi" onRetry={refetch} /> : stats && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border-2 border-primary bg-primary-container/20 p-3"><p className="text-xs text-on-surface-variant">Toplam Bulgu</p><p className="text-2xl font-bold">{stats.total}</p></div>
            <div className="rounded-lg border border-red-300 bg-red-50 p-3"><p className="text-xs text-on-surface-variant">Açık</p><p className="text-2xl font-bold text-red-600">{stats.open}</p></div>
            <div className="rounded-lg border border-green-300 bg-green-50 p-3"><p className="text-xs text-on-surface-variant">Çözüldü</p><p className="text-2xl font-bold text-green-600">{stats.fixed}</p></div>
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3"><p className="text-xs text-on-surface-variant">Çözüm Oranı</p><p className="text-2xl font-bold text-amber-600">{(stats.fixRate * 100).toFixed(1)}%</p></div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-outline-variant bg-surface p-4">
              <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Ciddiyet Dağılımı</h3>
              {stats.bySeverity.length === 0 ? <p className="text-xs text-on-surface-variant">Henüz bulgu yok</p> : (
                <div className="space-y-2">
                  {stats.bySeverity.map((s) => (
                    <div key={s.severity} className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium w-20 text-center ${COLOR_BG[DataCheckSeverityColor[s.severity]]}`}>{s.severity}</span>
                      <div className="flex-1 h-2 rounded-full bg-surface-variant overflow-hidden">
                        <div className={`h-full ${COLOR_BG[DataCheckSeverityColor[s.severity]]}`} style={{ width: `${stats.total > 0 ? (s.count / stats.total) * 100 : 0}%` }} />
                      </div>
                      <span className="text-xs font-semibold w-10 text-right">{s.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-lg border border-outline-variant bg-surface p-4">
              <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4" /> En Çok Karşılaşılan Kontroller</h3>
              {stats.byCheckType.length === 0 ? <p className="text-xs text-on-surface-variant">Veri yok</p> : (
                <ul className="space-y-1">
                  {stats.byCheckType.sort((a, b) => b.count - a.count).slice(0, 6).map((c) => (
                    <li key={c.checkType} className="flex items-center justify-between text-sm">
                      <span>{DataCheckTypeIcon[c.checkType]} {DataCheckTypeLabel[c.checkType]}</span>
                      <span className="rounded-full bg-surface-variant px-2 py-0.5 text-xs">{c.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      {/* Son Bulgular */}
      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Son Bulgular</h3>
          <button onClick={() => navigate('/audit/results')} className="text-xs text-primary">Tümü →</button>
        </div>
        {recent && recent.items.length > 0 ? (
          <div className="space-y-1">
            {recent.items.map((r) => (
              <div key={r.id} onClick={() => navigate(`/audit/results/${r.id}`)} className="flex items-center gap-2 rounded-md p-2 hover:bg-surface-variant/30 cursor-pointer">
                <span className="text-lg">{DataCheckTypeIcon[r.checkType]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.entityLabel}</p>
                  <p className="text-xs text-on-surface-variant truncate">{DataCheckTypeLabel[r.checkType]} • {formatDateTime(r.createdAt)}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${COLOR_BG[DataCheckResultStatusColor[r.status]]}`}>{r.status}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-on-surface-variant">Henüz bulgu yok. Çalıştır'a basın.</p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div onClick={() => navigate('/audit/rules')} className="cursor-pointer rounded-lg border border-outline-variant bg-surface p-3 hover:shadow-md transition"><ListChecks className="h-6 w-6 text-primary" /><p className="mt-2 text-sm font-semibold">Kurallar</p><p className="text-xs text-on-surface-variant">Kontrol kurallarını yönet</p></div>
        <div onClick={() => navigate('/audit/runs')} className="cursor-pointer rounded-lg border border-outline-variant bg-surface p-3 hover:shadow-md transition"><Activity className="h-6 w-6 text-blue-600" /><p className="mt-2 text-sm font-semibold">Çalıştırma Geçmişi</p><p className="text-xs text-on-surface-variant">Geçmiş kontrolleri incele</p></div>
        <div onClick={() => navigate('/audit/schedules')} className="cursor-pointer rounded-lg border border-outline-variant bg-surface p-3 hover:shadow-md transition"><Calendar className="h-6 w-6 text-amber-600" /><p className="mt-2 text-sm font-semibold">Zamanlama</p><p className="text-xs text-on-surface-variant">Otomatik kontrol zamanlayın</p></div>
        <div onClick={() => navigate('/audit/logs')} className="cursor-pointer rounded-lg border border-outline-variant bg-surface p-3 hover:shadow-md transition"><BookOpen className="h-6 w-6 text-green-600" /><p className="mt-2 text-sm font-semibold">Aksiyon Logları</p><p className="text-xs text-on-surface-variant">Yapılan işlemlerin geçmişi</p></div>
      </div>
    </div>
  );
}
