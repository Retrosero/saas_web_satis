import { useState } from 'react';
import { Users, Search, Shield, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { EmptyState } from '@/components/data/EmptyState';
import { useAdminUsers } from '@/features/super-admin/hooks';
import { formatDateTime, formatNumber } from '@saas/shared';

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  ACTIVE: { text: 'Aktif', color: 'bg-secondary-container text-secondary' },
  INACTIVE: { text: 'Pasif', color: 'bg-surface-variant text-on-surface-variant' },
  LOCKED: { text: 'Kilitli', color: 'bg-error-container text-error' },
  PENDING: { text: 'Bekliyor', color: 'bg-primary-container text-primary' },
};

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useAdminUsers({ search, page, pageSize: 20 });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Kullanıcılar"
        description="Tüm tenant'lardaki kullanıcılar (süper admin görüntüleme)"
      />

      <div className="card p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="E-posta veya ad ile ara…"
            className="w-full h-10 pl-10 pr-4 rounded-md bg-surface-container text-sm border border-outline-variant focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {isLoading && <LoadingState size="lg" />}
      {isError && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {data && data.data.length === 0 && (
        <div className="card">
          <EmptyState icon={<Users className="h-8 w-8" />} title="Kullanıcı bulunamadı" description="Arama kriterlerinizi değiştirin veya yeni kullanıcı oluşturun." />
        </div>
      )}

      {data && data.data.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container border-b border-outline-variant">
                <tr>
                  <th className="text-left font-semibold text-foreground px-4 py-3">Kullanıcı</th>
                  <th className="text-left font-semibold text-foreground px-4 py-3">Firma</th>
                  <th className="text-left font-semibold text-foreground px-4 py-3">Roller</th>
                  <th className="text-left font-semibold text-foreground px-4 py-3">Durum</th>
                  <th className="text-left font-semibold text-foreground px-4 py-3">Son Giriş</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((u) => {
                  const s = STATUS_LABEL[u.status] ?? STATUS_LABEL.ACTIVE;
                  return (
                    <tr key={u.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary-container text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
                            {u.fullName?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate">{u.fullName}</div>
                            <div className="text-xs text-on-surface-variant truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {u.tenant ? (
                          <div className="flex items-center gap-1.5 text-foreground">
                            <Building2 className="h-3.5 w-3.5 text-on-surface-variant" />
                            <span className="truncate">{u.tenant.name}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-container text-primary">
                            <Shield className="h-3 w-3" />
                            Süper Admin
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.length === 0 ? (
                            <span className="text-xs text-on-surface-variant">—</span>
                          ) : (
                            u.roles.map((r) => (
                              <span
                                key={r.code}
                                className="text-xs font-mono px-2 py-0.5 rounded bg-surface-container text-foreground"
                              >
                                {r.code}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.color}`}>
                          {s.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant text-xs">
                        {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Hiç giriş yok'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-outline-variant bg-surface-container flex items-center justify-between text-xs text-on-surface-variant">
            <span>Toplam {formatNumber(data.pagination.total)} kullanıcı</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!data.pagination.hasPrev}
                className="btn-ghost text-xs"
              >
                Önceki
              </button>
              <span>
                Sayfa {data.pagination.page} / {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!data.pagination.hasNext}
                className="btn-ghost text-xs"
              >
                Sonraki
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
