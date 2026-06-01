import { CreditCard, Users, Warehouse, Webhook, Database, Check } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useAdminPlans } from '@/features/super-admin/hooks';
import { formatCurrency, formatNumber } from '@saas/shared';

export function PlansPage() {
  const { data, isLoading, isError, error, refetch } = useAdminPlans();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Paketler"
        description="Tüm planlar, fiyatlar, limitler ve aktif abone sayıları"
      />

      {isLoading && <LoadingState size="lg" />}
      {isError && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {data.map((plan) => (
            <div
              key={plan.id}
              className={`card p-5 flex flex-col gap-4 ${
                plan.code === 'professional' ? 'border-primary border-2 shadow-m3-2' : ''
              }`}
            >
              {plan.code === 'professional' && (
                <span className="text-xs font-semibold text-primary bg-primary-container px-2 py-0.5 rounded-full w-fit">
                  EN POPÜLER
                </span>
              )}
              <div>
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                {plan.description && <p className="text-xs text-on-surface-variant mt-1">{plan.description}</p>}
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">
                    {plan.monthlyPrice === '0' ? 'Özel' : formatCurrency(Number(plan.monthlyPrice))}
                  </span>
                  {plan.monthlyPrice !== '0' && <span className="text-sm text-on-surface-variant">/ay</span>}
                </div>
                {plan.yearlyPrice !== '0' && (
                  <div className="text-xs text-on-surface-variant mt-1">
                    Yıllık: {formatCurrency(Number(plan.yearlyPrice))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-foreground">
                  <Users className="h-4 w-4 text-on-surface-variant flex-shrink-0" />
                  <span className="font-numeric">{formatNumber(plan.userLimit)}</span>
                  <span className="text-on-surface-variant text-xs">kullanıcı</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Warehouse className="h-4 w-4 text-on-surface-variant flex-shrink-0" />
                  <span className="font-numeric">{formatNumber(plan.branchLimit)}</span>
                  <span className="text-on-surface-variant text-xs">şube</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Database className="h-4 w-4 text-on-surface-variant flex-shrink-0" />
                  <span className="font-numeric">{formatNumber(plan.storageMbLimit)}</span>
                  <span className="text-on-surface-variant text-xs">MB depolama</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Webhook className="h-4 w-4 text-on-surface-variant flex-shrink-0" />
                  <span className="font-numeric">{formatNumber(plan.webhookLimit)}</span>
                  <span className="text-on-surface-variant text-xs">webhook</span>
                </div>
              </div>

              <div className="border-t border-outline-variant pt-3 flex items-center justify-between">
                <div className="text-xs">
                  <div className="text-on-surface-variant">Modül</div>
                  <div className="font-bold text-lg text-primary font-numeric">{plan.moduleCount}</div>
                </div>
                <div className="text-xs text-right">
                  <div className="text-on-surface-variant">Aktif abone</div>
                  <div className="font-bold text-lg text-secondary font-numeric">{plan.activeSubscribers}</div>
                </div>
              </div>

              <button className="btn-secondary w-full text-sm">
                <CreditCard className="h-4 w-4" />
                Düzenle
              </button>
            </div>
          ))}
        </div>
      )}

      {data && (
        <div className="card p-5">
          <h2 className="text-base font-semibold text-foreground mb-3">Modül Karşılaştırması</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-left font-semibold text-foreground px-3 py-2">Modül</th>
                  {data.map((p) => (
                    <th key={p.id} className="text-center font-semibold text-foreground px-3 py-2">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from(new Set(data.flatMap((p) => p.modules.map((m) => m.code)))).map((modCode) => {
                  const modName = data.find((p) => p.modules.some((m) => m.code === modCode))?.modules.find((m) => m.code === modCode)?.name ?? modCode;
                  return (
                    <tr key={modCode} className="border-b border-outline-variant last:border-0">
                      <td className="px-3 py-2 text-foreground">{modName}</td>
                      {data.map((p) => (
                        <td key={p.id} className="text-center px-3 py-2">
                          {p.modules.some((m) => m.code === modCode) ? (
                            <Check className="h-4 w-4 text-secondary inline" />
                          ) : (
                            <span className="text-on-surface-variant">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
