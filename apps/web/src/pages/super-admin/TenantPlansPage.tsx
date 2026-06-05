import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, CreditCard } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useAdminTenant, useAdminPlans, useAssignPlan } from '@/features/super-admin/hooks';
import { formatCurrency, formatNumber } from '@saas/shared';
import { cn } from '@/lib/cn';
import toast from 'react-hot-toast';

export function TenantPlansPage() {
  const { id } = useParams<{ id: string }>();
  const { data: tenant, isLoading, isError, error, refetch } = useAdminTenant(id);
  const { data: plans } = useAdminPlans();
  const assignPlan = useAssignPlan();

  const currentPlanId = tenant?.subscription?.planId;

  const handleAssign = async (planCode: string) => {
    if (!id) return;
    try {
      const result = await assignPlan.mutateAsync({ id, planCode });
      toast.success(`${result.activatedModules} modül aktif edildi`);
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Hata';
      toast.error(msg);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Link to={`/super-admin/tenants/${id}`} className="text-sm text-primary hover:underline flex items-center gap-1 w-fit">
        <ArrowLeft className="h-4 w-4" />
        {tenant?.name ?? 'Firma Detay'}
      </Link>

      <PageHeader
        title="Plan Yönet"
        description={`Firma: ${tenant?.name ?? '...'} — Mevcut planı değiştir veya atama yap`}
      />

      {isLoading && <LoadingState size="lg" />}
      {isError && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}

      {plans && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            return (
              <div
                key={plan.id}
                className={cn(
                  'card p-5 flex flex-col gap-4 transition-all',
                  isCurrent ? 'border-primary border-2' : 'border-outline-variant',
                )}
              >
                {isCurrent && (
                  <span className="text-xs font-semibold text-primary bg-primary-container px-2 py-0.5 rounded-full w-fit">
                    AKTİF PLAN
                  </span>
                )}
                <div>
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  {plan.description && <p className="text-xs text-on-surface-variant mt-1">{plan.description}</p>}
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">
                    {plan.monthlyPrice === '0' ? 'Özel' : formatCurrency(Number(plan.monthlyPrice))}
                  </span>
                  {plan.monthlyPrice !== '0' && <span className="text-sm text-on-surface-variant">/ay</span>}
                </div>

                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between text-on-surface-variant text-xs">
                    <span>Kullanıcı</span>
                    <span className="font-numeric font-semibold text-foreground">{formatNumber(plan.userLimit)}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant text-xs">
                    <span>Şube</span>
                    <span className="font-numeric font-semibold text-foreground">{formatNumber(plan.branchLimit)}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant text-xs">
                    <span>Depo</span>
                    <span className="font-numeric font-semibold text-foreground">{formatNumber(plan.warehouseLimit)}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant text-xs">
                    <span>Modül</span>
                    <span className="font-numeric font-semibold text-foreground">{plan.moduleCount}</span>
                  </div>
                </div>

                {plan.modules.length > 0 && (
                  <div className="border-t border-outline-variant pt-3 flex flex-wrap gap-1">
                    {plan.modules.map((m) => (
                      <span key={m.code} className="text-[10px] bg-surface-container px-1.5 py-0.5 rounded text-on-surface-variant flex items-center gap-0.5">
                        <Check className="h-3 w-3" />
                        {m.name}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleAssign(plan.code)}
                  disabled={isCurrent || assignPlan.isPending}
                  className={cn(
                    'btn-secondary w-full text-sm mt-auto',
                    isCurrent && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <CreditCard className="h-4 w-4" />
                  {isCurrent ? 'Mevcut Plan' : 'Ata'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}