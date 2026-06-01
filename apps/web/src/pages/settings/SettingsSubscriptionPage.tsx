import { Link } from 'react-router-dom';
import { CreditCard, Users, Warehouse, Webhook, Database, AlertCircle, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { StatCard } from '@/components/cards/StatCard';
import { useSubscription } from '@/features/tenant-admin/hooks';
import { formatDate, formatNumber } from '@saas/shared';

const PLAN_COLOR: Record<string, string> = {
  starter: 'from-surface-variant to-surface-container',
  standard: 'from-primary-container to-primary-container/30',
  professional: 'from-secondary-container to-secondary-container/30',
  enterprise: 'from-tertiary/20 to-tertiary/5',
};

const PLAN_BADGE: Record<string, string> = {
  starter: 'bg-surface-variant text-on-surface-variant',
  standard: 'bg-primary text-primary-foreground',
  professional: 'bg-secondary text-secondary-foreground',
  enterprise: 'bg-tertiary text-tertiary-foreground',
};

const PLAN_LABEL: Record<string, string> = {
  starter: 'Başlangıç',
  standard: 'Standart',
  professional: 'Profesyonel',
  enterprise: 'Kurumsal',
};

export function SettingsSubscriptionPage() {
  const { data, isLoading, isError, error, refetch } = useSubscription();

  if (isLoading) return <LoadingState size="lg" />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!data) return null;

  const { plan, usage, limits } = data;

  if (!plan) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3 text-tertiary">
          <AlertCircle className="h-5 w-5" />
          <div>
            <h2 className="text-base font-semibold">Aktif abonelik yok</h2>
            <p className="text-sm text-on-surface-variant">Paket atanmamış. Süper admin ile iletişime geçin.</p>
          </div>
        </div>
      </div>
    );
  }

  const userPercent = limits ? Math.min(100, Math.round((usage.userCount / limits.userLimit) * 100)) : 0;
  const modulePercent = limits ? Math.min(100, Math.round((usage.activeModuleCount / 25) * 100)) : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Paket & Kullanım"
        description="Aktif abonelik, kullanım limitleri ve yenileme bilgisi"
      />

      {/* Plan kartı */}
      <div className={`card p-6 bg-gradient-to-br ${PLAN_COLOR[plan.plan.code] ?? PLAN_COLOR.standard} relative overflow-hidden`}>
        <div className="absolute -right-12 -top-12 opacity-10">
          <Sparkles className="h-48 w-48" />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${PLAN_BADGE[plan.plan.code]}`}>
                {PLAN_LABEL[plan.plan.code]?.toUpperCase() ?? plan.plan.code.toUpperCase()}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-container text-foreground">
                {plan.status === 'TRIAL' ? 'DENEME' : plan.status === 'ACTIVE' ? 'AKTİF' : plan.status}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1">{plan.plan.name}</h2>
            {plan.plan.description && <p className="text-sm text-on-surface-variant max-w-xl">{plan.plan.description}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs text-on-surface-variant">Başlangıç</p>
            <p className="text-sm font-semibold text-foreground">{formatDate(plan.startAt)}</p>
            {plan.trialEndAt && (
              <>
                <p className="text-xs text-on-surface-variant mt-2">Deneme Bitiş</p>
                <p className="text-sm font-semibold text-tertiary">{formatDate(plan.trialEndAt)}</p>
              </>
            )}
            {plan.endAt && !plan.trialEndAt && (
              <>
                <p className="text-xs text-on-surface-variant mt-2">Bitiş</p>
                <p className="text-sm font-semibold text-foreground">{formatDate(plan.endAt)}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Kullanım istatistikleri */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="text-sm text-on-surface-variant">Kullanıcı</div>
            <Users className="h-4 w-4 text-on-surface-variant" />
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="font-numeric text-2xl font-bold text-foreground">{usage.userCount}</span>
            <span className="text-sm text-on-surface-variant">/ {formatNumber(limits?.userLimit ?? 0)}</span>
          </div>
          <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div
              className={`h-full ${userPercent > 80 ? 'bg-error' : userPercent > 50 ? 'bg-tertiary' : 'bg-primary'}`}
              style={{ width: `${userPercent}%` }}
            />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="text-sm text-on-surface-variant">Aktif Modül</div>
            <Database className="h-4 w-4 text-on-surface-variant" />
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="font-numeric text-2xl font-bold text-foreground">{usage.activeModuleCount}</span>
            <span className="text-sm text-on-surface-variant">/ 25</span>
          </div>
          <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div
              className={`h-full ${modulePercent > 80 ? 'bg-error' : 'bg-secondary'}`}
              style={{ width: `${modulePercent}%` }}
            />
          </div>
        </div>

        <StatCard
          label="Depolama (R2)"
          value={`${formatNumber(limits?.storageMbLimit ?? 0)} MB`}
          hint="Planınızda tanımlı"
          icon={<Database className="h-5 w-5" />}
        />

        <StatCard
          label="API & Webhook"
          value={`${formatNumber(limits?.apiKeyLimit ?? 0)} / ${formatNumber(limits?.webhookLimit ?? 0)}`}
          hint="API key / Webhook"
          icon={<Webhook className="h-5 w-5" />}
        />
      </div>

      {/* Plan detayları */}
      <div className="card p-5">
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          Plan Limitleri
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <LimitRow icon={<Users className="h-4 w-4" />} label="Kullanıcı" value={formatNumber(limits?.userLimit ?? 0)} />
          <LimitRow icon={<Warehouse className="h-4 w-4" />} label="Şube" value={formatNumber(limits?.branchLimit ?? 0)} />
          <LimitRow icon={<Database className="h-4 w-4" />} label="Depo" value={formatNumber(limits?.warehouseLimit ?? 0)} />
          <LimitRow icon={<Webhook className="h-4 w-4" />} label="Webhook" value={formatNumber(limits?.webhookLimit ?? 0)} />
        </dl>
      </div>

      <div className="card p-4 text-sm text-on-surface-variant text-center">
        Paketinizi değiştirmek veya yükseltmek için{' '}
        <Link to="/super-admin/plans" className="text-primary hover:underline font-medium">
          paketler sayfasını
        </Link>{' '}
        ziyaret edin.
      </div>
    </div>
  );
}

function LimitRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-md bg-surface-container">
      <div className="flex items-center gap-2 text-foreground">
        <span className="text-on-surface-variant">{icon}</span>
        <span>{label}</span>
      </div>
      <span className="font-numeric font-semibold">{value}</span>
    </div>
  );
}
