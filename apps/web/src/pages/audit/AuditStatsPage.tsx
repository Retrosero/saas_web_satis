import { useState } from 'react';
import { BarChart3, TrendingUp, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useStats } from '@/features/audit/api';
import { DataCheckTypeLabel, DataCheckTypeIcon, DataCheckSeverityLabel, DataCheckSeverityColor } from '@saas/shared';

const COLOR_BG: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800', gray: 'bg-gray-200 text-gray-700', amber: 'bg-amber-100 text-amber-800',
  orange: 'bg-orange-100 text-orange-800', red: 'bg-red-100 text-red-800', green: 'bg-green-100 text-green-800', purple: 'bg-purple-100 text-purple-800',
};

export function AuditStatsPage() {
  const { data: stats, isLoading, error, refetch } = useStats();

  if (isLoading) return <LoadingState />;
  if (error || !stats) return <ErrorState message="İstatistikler yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader title="Denetim İstatistikleri" description="Bulguların dağılımı ve çözüm oranları" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-outline-variant bg-surface p-3"><p className="text-xs text-on-surface-variant">Toplam</p><p className="mt-1 text-2xl font-bold">{stats.total}</p></div>
        <div className="rounded-lg border border-red-300 bg-red-50 p-3"><p className="text-xs text-on-surface-variant">Açık</p><p className="mt-1 text-2xl font-bold text-red-600">{stats.open}</p></div>
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3"><p className="text-xs text-on-surface-variant">İnceleniyor</p><p className="mt-1 text-2xl font-bold text-amber-600">{stats.acknowledged}</p></div>
        <div className="rounded-lg border border-green-300 bg-green-50 p-3"><p className="text-xs text-on-surface-variant">Çözüldü</p><p className="mt-1 text-2xl font-bold text-green-600">{stats.fixed}</p></div>
        <div className="rounded-lg border border-blue-300 bg-blue-50 p-3"><p className="text-xs text-on-surface-variant">Çözüm Oranı</p><p className="mt-1 text-2xl font-bold text-blue-600">{(stats.fixRate * 100).toFixed(1)}%</p></div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-lg border border-outline-variant bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Ciddiyet Dağılımı</h3>
          {stats.bySeverity.length === 0 ? <p className="text-xs text-on-surface-variant">Henüz veri yok</p> : (
            <div className="space-y-2">
              {stats.bySeverity.sort((a, b) => b.count - a.count).map((s) => (
                <div key={s.severity} className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium w-20 text-center ${COLOR_BG[DataCheckSeverityColor[s.severity]]}`}>{DataCheckSeverityLabel[s.severity]}</span>
                  <div className="flex-1 h-3 rounded-full bg-surface-variant overflow-hidden">
                    <div className={`h-full ${COLOR_BG[DataCheckSeverityColor[s.severity]]}`} style={{ width: `${stats.total > 0 ? (s.count / stats.total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-semibold w-12 text-right">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-outline-variant bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Kontrol Tipi Dağılımı</h3>
          {stats.byCheckType.length === 0 ? <p className="text-xs text-on-surface-variant">Henüz veri yok</p> : (
            <ul className="space-y-1">
              {stats.byCheckType.sort((a, b) => b.count - a.count).map((c) => (
                <li key={c.checkType} className="flex items-center justify-between text-sm">
                  <span>{DataCheckTypeIcon[c.checkType]} {DataCheckTypeLabel[c.checkType]}</span>
                  <span className="rounded-full bg-surface-variant px-2 py-0.5 text-xs font-semibold">{c.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-lg border border-outline-variant bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold">Entity Tipi Dağılımı</h3>
          {stats.byEntityType.length === 0 ? <p className="text-xs text-on-surface-variant">Henüz veri yok</p> : (
            <ul className="space-y-1">
              {stats.byEntityType.sort((a, b) => b.count - a.count).map((e) => (
                <li key={e.entityType} className="flex items-center justify-between text-sm">
                  <span>{e.entityType}</span>
                  <span className="rounded-full bg-surface-variant px-2 py-0.5 text-xs">{e.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-lg border border-outline-variant bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><Clock className="h-4 w-4" /> Performans</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-md border border-outline-variant p-2">
              <span className="text-sm">Ortalama Çözüm Süresi</span>
              <span className="text-sm font-semibold">{stats.avgFixTimeMs ? `${(stats.avgFixTimeMs / 86400000).toFixed(1)} gün` : '—'}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-outline-variant p-2">
              <span className="text-sm">Çözüm Oranı</span>
              <span className="text-sm font-semibold text-green-600">{(stats.fixRate * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-outline-variant p-2">
              <span className="text-sm">Yok Sayılan</span>
              <span className="text-sm font-semibold text-gray-600">{stats.ignored}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
