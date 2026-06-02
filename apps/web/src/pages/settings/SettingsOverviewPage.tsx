import { Link } from 'react-router-dom';
import { Building2, CreditCard, Package, Users, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useTenantInfo, useSubscription } from '@/features/tenant-admin/hooks';
import { formatDate } from '@saas/shared';

export function SettingsOverviewPage() {
  const {
    data: tenant,
    isLoading: tLoading,
    isError: tError,
    error: tErrorMsg,
    refetch: tRefetch,
  } = useTenantInfo();
  const { data: sub } = useSubscription();

  if (tLoading) return <LoadingState size="lg" />;
  if (tError)
    return <ErrorState message={(tErrorMsg as Error).message} onRetry={() => tRefetch()} />;
  if (!tenant) return null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Firma Ayarları"
        description="Firmanızı yönetin, paketinizi görüntüleyin, modülleri özelleştirin"
      />

      {/* Firma Bilgileri */}
      <div className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
          <Building2 className="h-4 w-4 text-primary" />
          Firma Bilgileri
        </h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Row label="Firma Adı" value={tenant.name} />
          <Row label="Firma Kodu" value={tenant.code} mono />
          <Row
            label="Çalışma Modu"
            value={tenant.workingMode === 'SAAS_MASTER' ? 'SaaS Master' : 'ERP Master'}
          />
          <Row
            label="Durum"
            value={tenant.status}
            badge={
              tenant.status === 'ACTIVE'
                ? 'success'
                : tenant.status === 'TRIAL'
                  ? 'info'
                  : 'neutral'
            }
          />
          <Row label="Para Birimi" value={tenant.settings?.currency ?? 'TRY'} mono />
          <Row label="Dil" value={tenant.settings?.locale ?? 'tr-TR'} mono />
          <Row label="Vergi Dairesi" value={tenant.settings?.taxOffice ?? '—'} />
          <Row label="Vergi No" value={tenant.settings?.taxNumber ?? '—'} mono />
        </dl>
        <div className="mt-4 border-t border-outline-variant pt-4 text-xs text-on-surface-variant">
          Oluşturulma: {formatDate(tenant.createdAt)}
        </div>
      </div>

      {/* Hızlı linkler */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink
          to="/settings/subscription"
          icon={<CreditCard className="h-5 w-5" />}
          title="Paket & Kullanım"
          description={
            sub?.plan
              ? `${sub.plan.plan.name} • ${sub.usage.userCount}/${sub.limits?.userLimit ?? '?'} kullanıcı`
              : 'Plan atanmamış'
          }
        />
        <QuickLink
          to="/settings/modules"
          icon={<Package className="h-5 w-5" />}
          title="Modüller"
          description="Aktif modülleri yönet"
        />
        <QuickLink
          to="/settings/users"
          icon={<Users className="h-5 w-5" />}
          title="Kullanıcılar"
          description="Takım üyelerini davet et ve yönet"
        />
        <QuickLink
          to="/settings/roles"
          icon={<ChevronRight className="h-5 w-5" />}
          title="Roller & Yetkiler"
          description="Özel roller tanımla"
        />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  badge,
}: {
  label: string;
  value: string;
  mono?: boolean;
  badge?: 'success' | 'info' | 'neutral';
}) {
  return (
    <div className="flex items-center justify-between rounded-md bg-surface-container p-2.5">
      <span className="text-foreground">{label}</span>
      {badge ? (
        <span
          className={
            badge === 'success'
              ? 'rounded-full bg-secondary-container px-2 py-0.5 text-xs font-semibold text-secondary'
              : badge === 'info'
                ? 'rounded-full bg-primary-container px-2 py-0.5 text-xs font-semibold text-primary'
                : 'rounded-full bg-surface-variant px-2 py-0.5 text-xs font-semibold text-on-surface-variant'
          }
        >
          {value}
        </span>
      ) : (
        <span className={mono ? 'font-mono text-foreground' : 'text-foreground'}>{value}</span>
      )}
    </div>
  );
}

function QuickLink({
  to,
  icon,
  title,
  description,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="card flex items-center gap-3 p-4 transition-all hover:border-primary hover:bg-surface-container"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary-container text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="truncate text-xs text-on-surface-variant">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-on-surface-variant" />
    </Link>
  );
}
