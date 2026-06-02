import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Package,
  CreditCard,
  AlertCircle,
  ArrowUpRight,
  Clock,
  Activity,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/cards/StatCard';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { SystemWarningBanner } from '@/components/notifications/SystemWarningBanner';
import { useSuperAdminOverview } from '@/features/super-admin/hooks';
import { formatDateTime, formatNumber } from '@saas/shared';

export function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useSuperAdminOverview();

  if (isLoading) return <LoadingState label="Panel yükleniyor…" size="lg" />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!data) return null;

  const { counts, recent } = data;

  return (
    <div className="flex flex-col gap-6">
      <SystemWarningBanner
        title="Süper Admin Paneli"
        message="Bu ekran tüm firmaları, kullanıcıları, planları ve sistem loglarını gösterir. Buradaki işlemler tüm sistemi etkiler."
        variant="info"
      />

      <PageHeader
        title="Sistem Özeti"
        description={formatDateTime(new Date().toISOString())}
        actions={
          <button onClick={() => navigate('/super-admin/tenants')} className="btn-primary">
            <Building2 className="h-4 w-4" />
            Firmalar
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Toplam Firma"
          value={formatNumber(counts.tenants.total)}
          hint={`${counts.tenants.active} aktif, ${counts.tenants.trial} deneme, ${counts.tenants.suspended} askıda`}
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard
          label="Toplam Kullanıcı"
          value={formatNumber(counts.users.total)}
          hint="Tüm tenant'lar dahil"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Aktif Modül"
          value={formatNumber(counts.modules.total)}
          hint="Sistem kataloğunda"
          icon={<Package className="h-5 w-5" />}
        />
        <StatCard
          label="Paket Sayısı"
          value={formatNumber(counts.plans.total)}
          hint="Starter, Standard, Pro, Enterprise"
          icon={<CreditCard className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Son Firmalar */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Building2 className="h-4 w-4 text-primary" />
              Son Eklenen Firmalar
            </h2>
            <button
              onClick={() => navigate('/super-admin/tenants')}
              className="flex items-center gap-0.5 text-xs text-primary hover:underline"
            >
              Tümü <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {recent.tenants.length === 0 && (
              <p className="py-4 text-center text-sm text-on-surface-variant">Henüz firma yok</p>
            )}
            {recent.tenants.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(`/super-admin/tenants/${t.id}`)}
                className="flex items-center justify-between gap-2 rounded-md p-2 text-left transition-colors hover:bg-surface-container"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{t.name}</div>
                  <div className="font-mono text-xs text-on-surface-variant">{t.code}</div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    t.status === 'ACTIVE'
                      ? 'bg-secondary-container text-secondary'
                      : t.status === 'TRIAL'
                        ? 'bg-primary-container text-primary'
                        : 'bg-surface-variant text-on-surface-variant'
                  }`}
                >
                  {t.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Son Kullanıcılar */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Users className="h-4 w-4 text-primary" />
              Son Eklenen Kullanıcılar
            </h2>
            <button
              onClick={() => navigate('/super-admin/users')}
              className="flex items-center gap-0.5 text-xs text-primary hover:underline"
            >
              Tümü <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {recent.users.length === 0 && (
              <p className="py-4 text-center text-sm text-on-surface-variant">
                Henüz kullanıcı yok
              </p>
            )}
            {recent.users.slice(0, 5).map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-2 rounded-md p-2 hover:bg-surface-container"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-semibold text-primary">
                  {u.fullName?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{u.fullName}</div>
                  <div className="truncate text-xs text-on-surface-variant">{u.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Son Hatalar */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <AlertCircle className="h-4 w-4 text-error" />
              Son Hatalar
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            {recent.errors.length === 0 && (
              <div className="py-4 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-secondary">
                  <Activity className="h-4 w-4" />
                  Sistem hatası yok
                </div>
              </div>
            )}
            {recent.errors.map((e) => (
              <div key={e.id} className="bg-error-container/30 rounded-md p-2 text-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-error">
                  <Clock className="h-3 w-3" />
                  {formatDateTime(e.createdAt)}
                </div>
                <div className="mt-1 truncate text-foreground">{e.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
