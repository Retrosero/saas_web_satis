import { useState } from 'react';
import {
  History,
  AlertCircle,
  Shield,
  Download,
  Search,
  Filter,
  Clock,
  Globe,
  Database,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { EmptyState } from '@/components/data/EmptyState';
import {
  useSuperAuditLogs,
  useSuperErrorLogs,
  useSuperSecurityLogs,
  useSuperAuditStats,
} from '@/features/logs/hooks';
import { formatDateTime, formatNumber, type RiskLevel } from '@saas/shared';
import { cn } from '@/lib/cn';
import { exportToCsv } from '@/lib/export';
import type { AuditLog, ErrorLog, SecurityLog } from '@/features/logs/api';

type Tab = 'audit' | 'error' | 'security';

const RISK_COLOR: Record<RiskLevel, string> = {
  LOW: 'bg-surface-variant text-on-surface-variant',
  MEDIUM: 'bg-primary-container text-primary',
  HIGH: 'bg-tertiary/10 text-tertiary',
  CRITICAL: 'bg-error-container text-error',
};

export function SuperAdminLogsPage() {
  const [tab, setTab] = useState<Tab>('audit');

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Sistem Logları"
        description="Audit, hata ve güvenlik logları — tüm firmalar"
      />

      {/* Tab seçici */}
      <div className="card flex w-fit gap-1 p-1">
        <TabButton
          active={tab === 'audit'}
          onClick={() => setTab('audit')}
          icon={<History className="h-4 w-4" />}
          label="Audit"
        />
        <TabButton
          active={tab === 'error'}
          onClick={() => setTab('error')}
          icon={<AlertCircle className="h-4 w-4" />}
          label="Hatalar"
        />
        <TabButton
          active={tab === 'security'}
          onClick={() => setTab('security')}
          icon={<Shield className="h-4 w-4" />}
          label="Güvenlik"
        />
      </div>

      {tab === 'audit' && <AuditTab />}
      {tab === 'error' && <ErrorTab />}
      {tab === 'security' && <SecurityTab />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-foreground hover:bg-surface-container',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// ============== AUDIT TAB ==============
function AuditTab() {
  const [page, setPage] = useState(1);
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');
  const [riskLevel, setRiskLevel] = useState<RiskLevel | ''>('');
  const params = {
    page,
    pageSize: 50,
    module: module || undefined,
    action: action || undefined,
    riskLevel: (riskLevel || undefined) as RiskLevel | undefined,
  };
  const { data, isLoading, isError, error, refetch } = useSuperAuditLogs(params);
  const { data: stats } = useSuperAuditStats();

  return (
    <div className="flex flex-col gap-4">
      {/* İstatistik bantları */}
      {stats && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatChip
            icon={<History className="h-4 w-4" />}
            label="Son 24 Saat"
            value={formatNumber(stats.last24h)}
            color="primary"
          />
          <StatChip
            icon={<AlertCircle className="h-4 w-4" />}
            label="Yüksek Risk"
            value={formatNumber(stats.high)}
            color="warning"
          />
          <StatChip
            icon={<Shield className="h-4 w-4" />}
            label="Kritik"
            value={formatNumber(stats.critical)}
            color="error"
          />
        </div>
      )}

      <FilterBar
        module={module}
        setModule={setModule}
        action={action}
        setAction={setAction}
        riskLevel={riskLevel}
        setRiskLevel={setRiskLevel}
        onExport={() =>
          data &&
          exportToCsv(data.data as unknown as Record<string, unknown>[], 'audit-loglari', [
            { key: 'createdAt', label: 'Tarih' },
            { key: 'tenant', label: 'Firma' },
            { key: 'user', label: 'Kullanıcı' },
            { key: 'module', label: 'Modül' },
            { key: 'action', label: 'Aksiyon' },
            { key: 'entityType', label: 'Varlık' },
            { key: 'entityId', label: 'Varlık ID' },
            { key: 'riskLevel', label: 'Risk' },
            { key: 'ipAddress', label: 'IP' },
          ])
        }
      />

      {isLoading && <LoadingState size="lg" />}
      {isError && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {data && data.data.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<History className="h-8 w-8" />}
            title="Audit log bulunamadı"
            description="Henüz hiçbir işlem kaydedilmemiş. Sistem kullanıldıkça loglar buraya düşecek."
          />
        </div>
      )}
      {data && data.data.length > 0 && (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-outline-variant bg-surface-container">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold text-foreground">Tarih</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                      Firma / Kullanıcı
                    </th>
                    <th className="px-4 py-2.5 text-left font-semibold text-foreground">Modül</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-foreground">Aksiyon</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-foreground">Varlık</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-foreground">Risk</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-foreground">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((l) => (
                    <tr
                      key={l.id}
                      className="border-b border-outline-variant last:border-0 hover:bg-surface-container"
                    >
                      <td className="px-4 py-2.5 text-xs text-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-on-surface-variant" />
                          {formatDateTime(l.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="truncate text-foreground">{l.tenant?.name ?? '—'}</div>
                        {l.user && (
                          <div className="truncate text-xs text-on-surface-variant">
                            {l.user.email}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="rounded bg-surface-container px-2 py-0.5 font-mono text-xs text-foreground">
                          {l.module}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">{l.action}</td>
                      <td className="px-4 py-2.5">
                        <div className="text-foreground">{l.entityType}</div>
                        {l.entityId && (
                          <div className="truncate font-mono text-[10px] text-on-surface-variant">
                            {l.entityId}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${RISK_COLOR[l.riskLevel]}`}
                        >
                          {l.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-on-surface-variant">
                        {l.ipAddress ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} setPage={setPage} pagination={data.pagination} />
        </>
      )}
    </div>
  );
}

// ============== ERROR TAB ==============
function ErrorTab() {
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState('');
  const [path, setPath] = useState('');
  const params = { page, pageSize: 50, level: level || undefined, path: path || undefined };
  const { data, isLoading, isError, error, refetch } = useSuperErrorLogs(params);

  return (
    <div className="flex flex-col gap-4">
      <div className="card flex flex-col gap-2 p-3 sm:flex-row">
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="h-10 rounded-md border border-outline-variant bg-surface-container px-3 text-sm"
        >
          <option value="">Tüm seviyeler</option>
          <option value="ERROR">ERROR</option>
          <option value="WARN">WARN</option>
          <option value="INFO">INFO</option>
          <option value="FATAL">FATAL</option>
        </select>
        <div className="relative flex-1">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="URL path filtresi (örn. /api/v1/customers)..."
            className="h-10 w-full rounded-md border border-outline-variant bg-surface-container pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <button
          onClick={() =>
            data &&
            exportToCsv(data.data as unknown as Record<string, unknown>[], 'hata-loglari', [
              { key: 'createdAt', label: 'Tarih' },
              { key: 'level', label: 'Seviye' },
              { key: 'message', label: 'Mesaj' },
              { key: 'path', label: 'Path' },
              { key: 'method', label: 'Method' },
              { key: 'statusCode', label: 'Status' },
              { key: 'requestId', label: 'Request ID' },
            ])
          }
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
            icon={<AlertCircle className="h-8 w-8" />}
            title="Hata logu yok"
            description="Sistem temiz çalışıyor! Yeni hatalar buraya düşecek."
          />
        </div>
      )}
      {data && data.data.length > 0 && (
        <>
          <div className="card divide-y divide-outline-variant">
            {data.data.map((e) => (
              <div key={e.id} className="p-4 hover:bg-surface-container">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md',
                      e.level === 'FATAL'
                        ? 'bg-error text-error-foreground'
                        : e.level === 'ERROR'
                          ? 'bg-error-container text-error'
                          : 'bg-tertiary/10 text-tertiary',
                    )}
                  >
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-error-container px-2 py-0.5 text-xs font-bold text-error">
                        {e.level}
                      </span>
                      {e.statusCode && (
                        <span
                          className={cn(
                            'rounded px-2 py-0.5 font-mono text-xs',
                            e.statusCode >= 500
                              ? 'bg-error-container text-error'
                              : 'bg-tertiary/10 text-tertiary',
                          )}
                        >
                          {e.statusCode}
                        </span>
                      )}
                      <span className="text-xs text-on-surface-variant">
                        <Clock className="inline h-3 w-3" /> {formatDateTime(e.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 break-words text-sm text-foreground">{e.message}</p>
                    {e.path && (
                      <div className="mt-1 font-mono text-xs text-on-surface-variant">
                        {e.method} {e.path}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} setPage={setPage} pagination={data.pagination} />
        </>
      )}
    </div>
  );
}

// ============== SECURITY TAB ==============
function SecurityTab() {
  const [page, setPage] = useState(1);
  const [event, setEvent] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const params = {
    page,
    pageSize: 50,
    event: event || undefined,
    ipAddress: ipAddress || undefined,
  };
  const { data, isLoading, isError, error, refetch } = useSuperSecurityLogs(params);

  return (
    <div className="flex flex-col gap-4">
      <div className="card flex flex-col gap-2 p-3 sm:flex-row">
        <div className="relative flex-1">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            placeholder="Event (LOGIN_SUCCESS, LOGIN_FAIL, vb.)"
            className="h-10 w-full rounded-md border border-outline-variant bg-surface-container pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <input
          value={ipAddress}
          onChange={(e) => setIpAddress(e.target.value)}
          placeholder="IP adresi"
          className="h-10 rounded-md border border-outline-variant bg-surface-container px-3 font-mono text-sm sm:w-48"
        />
        <button
          onClick={() =>
            data &&
            exportToCsv(data.data as unknown as Record<string, unknown>[], 'guvenlik-loglari', [
              { key: 'createdAt', label: 'Tarih' },
              { key: 'user', label: 'Kullanıcı' },
              { key: 'event', label: 'Event' },
              { key: 'ipAddress', label: 'IP' },
              { key: 'riskLevel', label: 'Risk' },
            ])
          }
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
            icon={<Shield className="h-8 w-8" />}
            title="Güvenlik olayı yok"
            description="Henüz kayıt yok. Giriş denemeleri buraya düşecek."
          />
        </div>
      )}
      {data && data.data.length > 0 && (
        <>
          <div className="card divide-y divide-outline-variant">
            {data.data.map((s) => (
              <div key={s.id} className="p-4 hover:bg-surface-container">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                      s.riskLevel === 'CRITICAL'
                        ? 'bg-error text-error-foreground'
                        : s.riskLevel === 'HIGH'
                          ? 'bg-error-container text-error'
                          : 'bg-surface-container text-on-surface-variant',
                    )}
                  >
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {s.event}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${RISK_COLOR[s.riskLevel]}`}
                      >
                        {s.riskLevel}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        <Clock className="inline h-3 w-3" /> {formatDateTime(s.createdAt)}
                      </span>
                    </div>
                    {s.user && (
                      <div className="mt-1 text-xs text-on-surface-variant">
                        {s.user.fullName} &lt;{s.user.email}&gt;
                      </div>
                    )}
                    {s.ipAddress && (
                      <div className="mt-1 flex items-center gap-1 font-mono text-xs text-on-surface-variant">
                        <Globe className="h-3 w-3" /> {s.ipAddress}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} setPage={setPage} pagination={data.pagination} />
        </>
      )}
    </div>
  );
}

// ============== SHARED ==============
function FilterBar({
  module,
  setModule,
  action,
  setAction,
  riskLevel,
  setRiskLevel,
  onExport,
}: {
  module: string;
  setModule: (v: string) => void;
  action: string;
  setAction: (v: string) => void;
  riskLevel: RiskLevel | '';
  setRiskLevel: (v: RiskLevel | '') => void;
  onExport: () => void;
}) {
  return (
    <div className="card flex flex-col gap-2 p-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
        <input
          value={module}
          onChange={(e) => setModule(e.target.value)}
          placeholder="Modül (cari, satis, ...)..."
          className="h-10 w-full rounded-md border border-outline-variant bg-surface-container pl-10 pr-4 font-mono text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <input
        value={action}
        onChange={(e) => setAction(e.target.value)}
        placeholder="Aksiyon (CREATE, UPDATE...)"
        className="h-10 rounded-md border border-outline-variant bg-surface-container px-3 font-mono text-sm sm:w-44"
      />
      <select
        value={riskLevel}
        onChange={(e) => setRiskLevel(e.target.value as RiskLevel | '')}
        className="h-10 rounded-md border border-outline-variant bg-surface-container px-3 text-sm sm:w-32"
      >
        <option value="">Risk tümü</option>
        <option value="LOW">LOW</option>
        <option value="MEDIUM">MEDIUM</option>
        <option value="HIGH">HIGH</option>
        <option value="CRITICAL">CRITICAL</option>
      </select>
      <button onClick={onExport} className="btn-secondary">
        <Download className="h-4 w-4" />
        CSV
      </button>
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'primary' | 'warning' | 'error';
}) {
  const bg =
    color === 'primary'
      ? 'bg-primary-container text-primary'
      : color === 'warning'
        ? 'bg-tertiary/10 text-tertiary'
        : 'bg-error-container text-error';
  return (
    <div className="card flex items-center gap-3 p-3">
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-md', bg)}>{icon}</div>
      <div>
        <div className="text-xs text-on-surface-variant">{label}</div>
        <div className="font-numeric text-xl font-bold text-foreground">{value}</div>
      </div>
    </div>
  );
}

function Pagination({
  page,
  setPage,
  pagination,
}: {
  page: number;
  setPage: (fn: (p: number) => number) => void;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
}) {
  return (
    <div className="flex items-center justify-between text-xs text-on-surface-variant">
      <span>Toplam {formatNumber(pagination.total)} kayıt</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={!pagination.hasPrev}
          className="btn-ghost text-xs"
        >
          Önceki
        </button>
        <span>
          Sayfa {pagination.page} / {pagination.totalPages}
        </span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!pagination.hasNext}
          className="btn-ghost text-xs"
        >
          Sonraki
        </button>
      </div>
    </div>
  );
}
