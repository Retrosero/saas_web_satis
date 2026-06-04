import { useNavigate } from 'react-router-dom';
import { Building2, Users, Package, CreditCard, AlertCircle, ArrowUpRight, Clock, Activity } from 'lucide-react';
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Son Firmalar */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Son Eklenen Firmalar
            </h2>
            <button
              onClick={() => navigate('/super-admin/tenants')}
              className="text-xs text-primary hover:underline flex items-center gap-0.5"
            >
              Tümü <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {recent.tenants.length === 0 && (
              <p className="text-sm text-on-surface-variant py-4 text-center">Henüz firma yok</p>
            )}
            {recent.tenants.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(`/super-admin/tenants/${t.id}`)}
                className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-surface-container text-left transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground truncate">{t.name}</div>
                  <div className="text-xs text-on-surface-variant font-mono">{t.code}</div>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Son Eklenen Kullanıcılar
            </h2>
            <button
              onClick={() => navigate('/super-admin/users')}
              className="text-xs text-primary hover:underline flex items-center gap-0.5"
            >
              Tümü <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {recent.users.length === 0 && (
              <p className="text-sm text-on-surface-variant py-4 text-center">Henüz kullanıcı yok</p>
            )}
            {recent.users.slice(0, 5).map((u) => (
              <div key={u.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-surface-container">
                <div className="h-8 w-8 rounded-full bg-primary-container text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {u.fullName?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground truncate">{u.fullName}</div>
                  <div className="text-xs text-on-surface-variant truncate">{u.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Son Hatalar */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-error" />
              Son Hatalar
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            {recent.errors.length === 0 && (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 text-sm text-secondary">
                  <Activity className="h-4 w-4" />
                  Sistem hatası yok
                </div>
              </div>
            )}
            {recent.errors.map((e) => (
              <div key={e.id} className="p-2 rounded-md bg-error-container/30 text-sm">
                <div className="flex items-center gap-2 text-xs text-error font-semibold">
                  <Clock className="h-3 w-3" />
                  {formatDateTime(e.createdAt)}
                </div>
                <div className="text-foreground mt-1 truncate">{e.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
