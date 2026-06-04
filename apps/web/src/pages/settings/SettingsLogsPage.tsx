import { useState } from 'react';
import { History, Shield, Download, Search, Clock, Globe, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { EmptyState } from '@/components/data/EmptyState';
import { useTenantAuditLogs, useTenantSecurityLogs } from '@/features/logs/hooks';
import { formatDateTime, formatNumber, type RiskLevel } from '@saas/shared';
import { cn } from '@/lib/cn';
import { exportToCsv } from '@/lib/export';

type Tab = 'audit' | 'security';

const RISK_COLOR: Record<RiskLevel, string> = {
  LOW: 'bg-surface-variant text-on-surface-variant',
  MEDIUM: 'bg-primary-container text-primary',
  HIGH: 'bg-tertiary/10 text-tertiary',
  CRITICAL: 'bg-error-container text-error',
};

export function SettingsLogsPage() {
  const [tab, setTab] = useState<Tab>('audit');

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Firma Logları"
        description="Firmanıza ait audit ve güvenlik logları"
      />

      <div className="card p-1 flex gap-1 w-fit">
        <TabButton active={tab === 'audit'} onClick={() => setTab('audit')} icon={<History className="h-4 w-4" />} label="Audit" />
        <TabButton active={tab === 'security'} onClick={() => setTab('security')} icon={<Shield className="h-4 w-4" />} label="Güvenlik" />
      </div>

      {tab === 'audit' && <AuditTab />}
      {tab === 'security' && <SecurityTab />}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-surface-container',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function AuditTab() {
  const [page, setPage] = useState(1);
  const [module, setModule] = useState('');
  const [riskLevel, setRiskLevel] = useState<RiskLevel | ''>('');
  const params = { page, pageSize: 50, module: module || undefined, riskLevel: (riskLevel || undefined) as RiskLevel | undefined };
  const { data, isLoading, isError, error, refetch } = useTenantAuditLogs(params);

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-3 flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            value={module}
            onChange={(e) => setModule(e.target.value)}
            placeholder="Modül filtresi (cari, satis, ...)..."
            className="w-full h-10 pl-10 pr-4 rounded-md bg-surface-container text-sm border border-outline-variant focus:border-primary focus:outline-none font-mono"
          />
        </div>
        <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value as RiskLevel | '')} className="h-10 px-3 rounded-md bg-surface-container text-sm border border-outline-variant sm:w-40">
          <option value="">Risk tümü</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>
        <button
          onClick={() => data && exportToCsv(data.data as unknown as Record<string, unknown>[], 'firma-audit-loglari', [
            { key: 'createdAt', label: 'Tarih' },
            { key: 'user', label: 'Kullanıcı' },
            { key: 'module', label: 'Modül' },
            { key: 'action', label: 'Aksiyon' },
            { key: 'entityType', label: 'Varlık' },
            { key: 'riskLevel', label: 'Risk' },
            { key: 'ipAddress', label: 'IP' },
          ])}
          className="btn-secondary"
        >
          <Download className="h-4 w-4" />
          CSV
        </button>
      </div>

      {isLoading && <LoadingState size="lg" />}
      {isError && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {data && data.data.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<History className="h-8 w-8" />}
            title="Audit log bulunamadı"
            description="Firmanızda henüz loglanmış bir işlem yok."
          />
        </div>
      )}
      {data && data.data.length > 0 && (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-container border-b border-outline-variant">
                  <tr>
                    <th className="text-left font-semibold text-foreground px-4 py-2.5">Tarih</th>
                    <th className="text-left font-semibold text-foreground px-4 py-2.5">Kullanıcı</th>
                    <th className="text-left font-semibold text-foreground px-4 py-2.5">Modül</th>
                    <th className="text-left font-semibold text-foreground px-4 py-2.5">Aksiyon</th>
                    <th className="text-left font-semibold text-foreground px-4 py-2.5">Varlık</th>
                    <th className="text-left font-semibold text-foreground px-4 py-2.5">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((l) => (
                    <tr key={l.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container">
                      <td className="px-4 py-2.5 text-xs">
                        <div className="flex items-center gap-1 text-foreground">
                          <Clock className="h-3 w-3 text-on-surface-variant" />
                          {formatDateTime(l.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        {l.user ? (
                          <>
                            <div className="text-foreground truncate">{l.user.fullName}</div>
                            <div className="text-xs text-on-surface-variant truncate">{l.user.email}</div>
                          </>
                        ) : (
                          <span className="text-on-surface-variant text-xs">Sistem</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-container text-foreground">{l.module}</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">{l.action}</td>
                      <td className="px-4 py-2.5">
                        <div className="text-foreground">{l.entityType}</div>
                        {l.entityId && <div className="text-[10px] font-mono text-on-surface-variant truncate">{l.entityId}</div>}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${RISK_COLOR[l.riskLevel]}`}>{l.riskLevel}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>Toplam {formatNumber(data.pagination.total)} kayıt</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!data.pagination.hasPrev} className="btn-ghost text-xs">Önceki</button>
              <span>Sayfa {data.pagination.page} / {data.pagination.totalPages}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={!data.pagination.hasNext} className="btn-ghost text-xs">Sonraki</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SecurityTab() {
  const [page, setPage] = useState(1);
  const [event, setEvent] = useState('');
  const { data, isLoading, isError, error, refetch } = useTenantSecurityLogs({ page, pageSize: 50, event: event || undefined });

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            placeholder="Event (LOGIN_SUCCESS, vb.)..."
            className="w-full h-10 pl-10 pr-4 rounded-md bg-surface-container text-sm border border-outline-variant focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {isLoading && <LoadingState size="lg" />}
      {isError && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {data && data.data.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<Shield className="h-8 w-8" />}
            title="Güvenlik olayı yok"
            description="Giriş denemeleri buraya düşecek."
          />
        </div>
      )}
      {data && data.data.length > 0 && (
        <>
          <div className="card divide-y divide-outline-variant">
            {data.data.map((s) => (
              <div key={s.id} className="p-4 hover:bg-surface-container">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0',
                    s.riskLevel === 'CRITICAL' || s.riskLevel === 'HIGH' ? 'bg-error-container text-error' : 'bg-surface-container text-on-surface-variant',
                  )}>
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono font-semibold text-foreground">{s.event}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${RISK_COLOR[s.riskLevel]}`}>{s.riskLevel}</span>
                      <span className="text-xs text-on-surface-variant">
                        <Clock className="h-3 w-3 inline" /> {formatDateTime(s.createdAt)}
                      </span>
                    </div>
                    {s.user && (
                      <div className="text-xs text-on-surface-variant mt-1">
                        {s.user.fullName} &lt;{s.user.email}&gt;
                      </div>
                    )}
                    {s.ipAddress && (
                      <div className="text-xs text-on-surface-variant font-mono mt-1 flex items-center gap-1">
                        <Globe className="h-3 w-3" /> {s.ipAddress}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>Toplam {formatNumber(data.pagination.total)} kayıt</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!data.pagination.hasPrev} className="btn-ghost text-xs">Önceki</button>
              <span>Sayfa {data.pagination.page} / {data.pagination.totalPages}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={!data.pagination.hasNext} className="btn-ghost text-xs">Sonraki</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
