import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Users, Package, CreditCard, Settings } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { StatCard } from '@/components/cards/StatCard';
import { useAdminTenant } from '@/features/super-admin/hooks';
import { formatCurrency, formatDate, formatNumber } from '@saas/shared';

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useAdminTenant(id);

  if (isLoading) return <LoadingState size="lg" />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/super-admin/tenants"
        className="flex w-fit items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Firmalar
      </Link>

      <PageHeader
        title={data.name}
        description={`Kod: ${data.code} • ${data.workingMode === 'SAAS_MASTER' ? 'SaaS Master' : 'ERP Master'}`}
        actions={
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              data.status === 'ACTIVE'
                ? 'bg-secondary-container text-secondary'
                : data.status === 'TRIAL'
                  ? 'bg-primary-container text-primary'
                  : 'bg-surface-variant text-on-surface-variant'
            }`}
          >
            {data.status}
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Kullanıcı"
          value={formatNumber(data.stats.userCount)}
          hint="Aktif kullanıcı"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Aktif Modül"
          value={formatNumber(data.stats.activeModuleCount)}
          hint="Plan + override"
          icon={<Package className="h-5 w-5" />}
        />
        <StatCard
          label="Plan"
          value={data.subscription ? 'Aktif' : 'Atanmamış'}
          hint={data.subscription ? formatDate(data.subscription.startAt) : '—'}
          icon={<CreditCard className="h-5 w-5" />}
        />
        <StatCard
          label="Oluşturulma"
          value={formatDate(data.createdAt)}
          hint={data.code}
          icon={<Building2 className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
            <Settings className="h-4 w-4 text-primary" />
            Firma Ayarları
          </h2>
          {data.settings ? (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-on-surface-variant">Para Birimi</dt>
                <dd className="font-mono">{data.settings.currency}</dd>
              </div>
              <div>
                <dt className="text-xs text-on-surface-variant">Dil</dt>
                <dd className="font-mono">{data.settings.locale}</dd>
              </div>
              <div>
                <dt className="text-xs text-on-surface-variant">Vergi Dairesi</dt>
                <dd>{data.settings.taxOffice ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-on-surface-variant">Vergi No</dt>
                <dd className="font-mono">{data.settings.taxNumber ?? '—'}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-on-surface-variant">Henüz ayar tanımlanmamış</p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
            <CreditCard className="h-4 w-4 text-primary" />
            Abonelik
          </h2>
          {data.subscription ? (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-on-surface-variant">Durum</dt>
                <dd>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      data.subscription.status === 'ACTIVE'
                        ? 'bg-secondary-container text-secondary'
                        : 'bg-surface-variant text-on-surface-variant'
                    }`}
                  >
                    {data.subscription.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-on-surface-variant">Başlangıç</dt>
                <dd>{formatDate(data.subscription.startAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-on-surface-variant">Bitiş</dt>
                <dd>{data.subscription.endAt ? formatDate(data.subscription.endAt) : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-on-surface-variant">Deneme Bitiş</dt>
                <dd>
                  {data.subscription.trialEndAt ? formatDate(data.subscription.trialEndAt) : '—'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-on-surface-variant">Abonelik atanmamış</p>
          )}
          <button
            onClick={() => navigate(`/super-admin/tenants/${id}/plans`)}
            className="btn-secondary mt-4 w-full"
          >
            Plan Yönet
          </button>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-base font-semibold text-foreground">Firma Yöneticisi</h2>
        {data.adminUser ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-base font-semibold text-primary">
              {data.adminUser.fullName[0]?.toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-foreground">{data.adminUser.fullName}</div>
              <div className="text-sm text-on-surface-variant">{data.adminUser.email}</div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">Henüz firma yöneticisi atanmamış</p>
        )}
      </div>
    </div>
  );
}
