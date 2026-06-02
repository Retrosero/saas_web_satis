import { Shield, Users, Lock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { SystemWarningBanner } from '@/components/notifications/SystemWarningBanner';
import { useTenantRoles } from '@/features/tenant-admin/hooks';
import { formatNumber } from '@saas/shared';

export function SettingsRolesPage() {
  const { data, isLoading, isError, error, refetch } = useTenantRoles();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Roller & Yetkiler"
        description="Tenant'ınıza özel roller ve yetki atamaları"
      />

      <SystemWarningBanner
        title="Rol Yönetimi — Basit Önizleme"
        message="Bu ekran FAZ 4'te temel listeleme için hazırlandı. Detaylı yetki matrisi ve rol oluşturma UI'ı sonraki iterasyonlarda eklenecek."
        variant="info"
      />

      {isLoading && <LoadingState size="lg" />}
      {isError && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {data && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-outline-variant bg-surface-container">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Rol</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Kod</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Tür</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Kullanıcı</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Yetki</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-outline-variant last:border-0 hover:bg-surface-container"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">{r.name}</span>
                      </div>
                      {r.description && (
                        <p className="ml-6 mt-0.5 text-xs text-on-surface-variant">
                          {r.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-surface-container px-2 py-0.5 font-mono text-xs text-foreground">
                        {r.code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.isSystem ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-container px-2 py-0.5 text-xs font-semibold text-primary">
                          <Lock className="h-3 w-3" />
                          Sistem
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-2 py-0.5 text-xs font-semibold text-secondary">
                          <Users className="h-3 w-3" />
                          Özel
                        </span>
                      )}
                    </td>
                    <td className="font-numeric px-4 py-3 text-foreground">
                      {formatNumber(r.userCount)}
                    </td>
                    <td className="font-numeric px-4 py-3 text-foreground">
                      {formatNumber(r.permissionCount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
