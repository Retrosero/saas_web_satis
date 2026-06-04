import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, Server, Zap, Building2, ListChecks, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/cards/StatCard';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useMonitoringDashboard, useApiErrors, useSlowEndpoints, useTenantErrors, useServices } from '@/features/monitoring/api';

type Tab = 'overview' | 'api-errors' | 'slow' | 'tenants' | 'services';

const TABS: Array<{ key: Tab; label: string; icon: any }> = [
  { key: 'overview', label: 'Dashboard', icon: Activity },
  { key: 'api-errors', label: 'API Hataları', icon: AlertTriangle },
  { key: 'slow', label: 'Yavaş Endpoint', icon: Clock },
  { key: 'tenants', label: 'Firma Bazlı', icon: Building2 },
  { key: 'services', label: 'Servisler', icon: Server },
];

const STATUS_BADGE: Record<string, { color: string; icon: any }> = {
  OPERATIONAL: { color: 'bg-green-100 text-green-800', icon: '🟢' },
  DEGRADED: { color: 'bg-amber-100 text-amber-800', icon: '🟡' },
  OUTAGE: { color: 'bg-red-100 text-red-800', icon: '🔴' },
  NOT_CONFIGURED: { color: 'bg-gray-200 text-gray-700', icon: '⚪' },
};

export function MonitoringPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const dashboard = useMonitoringDashboard();
  const apiErrors = useApiErrors();
  const slow = useSlowEndpoints();
  const tenants = useTenantErrors();
  const services = useServices();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Sistem Sağlığı"
        description="Hata oranları, yavaş endpointler ve servis durumları"
        actions={
          <button onClick={() => navigate('/monitoring/logs')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm">
            <ListChecks className="h-4 w-4" /> Tüm Hata Logları
          </button>
        }
      />

      <div className="flex overflow-x-auto rounded-lg border border-outline-variant bg-surface">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-foreground'}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <OverviewTab data={dashboard.data} isLoading={dashboard.isLoading} error={dashboard.error} onRetry={dashboard.refetch} />
      )}

      {tab === 'api-errors' && (
        <DataTable
          columns={[
            { key: 'endpoint', label: 'Endpoint', render: (r: any) => <code className="text-xs">{r.endpoint}</code> },
            { key: 'total', label: 'Toplam', width: '100px', align: 'right', render: (r: any) => r.total },
            { key: 'errors', label: 'Hata', width: '90px', align: 'right', render: (r: any) => <span className="text-red-700 font-semibold">{r.errors}</span> },
            { key: 'success', label: 'Başarılı', width: '100px', align: 'right', render: (r: any) => <span className="text-green-700">{r.success}</span> },
            { key: 'errorRate', label: 'Hata %', width: '100px', align: 'right', render: (r: any) => <span className={`font-semibold ${r.errorRate > 5 ? 'text-red-600' : r.errorRate > 1 ? 'text-amber-600' : 'text-green-600'}`}>%{r.errorRate.toFixed(2)}</span> },
          ] as any}
          data={apiErrors.data ?? []}
          rowKey={(r: any) => r.endpoint}
        />
      )}

      {tab === 'slow' && (
        <DataTable
          columns={[
            { key: 'method', label: 'Method', width: '90px', render: (r: any) => <span className="font-mono font-semibold">{r.method}</span> },
            { key: 'endpoint', label: 'Endpoint', render: (r: any) => <code className="text-xs">{r.endpoint}</code> },
            { key: 'avgDuration', label: 'Ort. Süre', width: '110px', align: 'right', render: (r: any) => <span className="text-amber-700 font-semibold">{r.avgDuration}ms</span> },
            { key: 'maxDuration', label: 'Maks. Süre', width: '110px', align: 'right', render: (r: any) => r.maxDuration + 'ms' },
            { key: 'count', label: 'İstek', width: '90px', align: 'right', render: (r: any) => r.count },
          ] as any}
          data={slow.data ?? []}
          rowKey={(r: any) => r.endpoint + r.method}
        />
      )}

      {tab === 'tenants' && (
        <DataTable
          columns={[
            { key: 'tenant', label: 'Firma', render: (r: any) => <div><div className="font-semibold">{r.tenantName}</div><div className="text-xs text-on-surface-variant font-mono">{r.tenantCode}</div></div> },
            { key: 'errorCount', label: 'Hata Sayısı', width: '130px', align: 'right', render: (r: any) => <span className="text-red-700 font-semibold">{r.errorCount}</span> },
            { key: 'actions', label: '', width: '150px', render: (r: any) => <button onClick={() => navigate(`/tenants/${(r as any).tenantId}`)} className="text-sm text-primary hover:underline">Firmaya Git →</button> },
          ] as any}
          data={tenants.data ?? []}
          rowKey={(r: any) => r.tenantId}
        />
      )}

      {tab === 'services' && (
        <div className="space-y-2">
          {(services.data ?? []).map((s) => {
            const badge = STATUS_BADGE[s.status] ?? STATUS_BADGE.NOT_CONFIGURED;
            return (
              <div key={s.name} className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface p-3">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-on-surface-variant">{s.description}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.color}`}>{badge.icon} {s.status}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OverviewTab({ data, isLoading, error, onRetry }: any) {
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Dashboard yüklenemedi" onRetry={onRetry} />;
  if (!data) return null;
  const Icon = data.errorDelta && data.errorDelta < 0 ? TrendingDown : TrendingUp;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Bugünkü Hata" value={data.errorsToday} icon={<AlertTriangle className="h-5 w-5" />} hint={data.errorDelta !== null ? `%${data.errorDelta?.toFixed(1)} (dün)` : 'Dün verisi yok'} />
        <StatCard label="Toplam Kritik Hata (7g)" value={data.criticalErrors} icon={<Zap className="h-5 w-5" />} />
        <StatCard label="En Çok Hata Alan Firma" value={data.topTenant?.tenantName ?? 'Yok'} hint={data.topTenant ? `${data.topTenant.errorCount} hata` : '-'} icon={<Building2 className="h-5 w-5" />} />
        <StatCard label="Bugün 5xx Hataları" value={data.apiFailures} icon={<Server className="h-5 w-5" />} />
      </div>
      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold">Yavaş Endpointler (&gt;1s)</h3>
        {data.slowEndpoints?.length === 0 ? <p className="text-sm text-on-surface-variant">Yavaş endpoint yok 🎉</p> : (
          <ul className="space-y-1 text-sm">
            {data.slowEndpoints?.map((s: any) => (
              <li key={s.endpoint} className="flex justify-between border-b border-outline-variant py-1.5">
                <code className="text-xs">{s.endpoint}</code>
                <span className="text-amber-700 font-semibold">{s.avgDuration}ms ort. ({s.requestCount} istek)</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
