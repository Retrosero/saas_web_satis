import { Package, Search } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useAdminModules } from '@/features/super-admin/hooks';

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Çekirdek',
  operations: 'Operasyon',
  finance: 'Finans',
  hr: 'İK',
  integration: 'Entegrasyon',
  addon: 'Eklenti',
};

const CATEGORY_COLORS: Record<string, string> = {
  core: 'bg-primary-container text-primary',
  operations: 'bg-secondary-container text-secondary',
  finance: 'bg-tertiary/10 text-tertiary',
  hr: 'bg-surface-variant text-on-surface-variant',
  integration: 'bg-primary/10 text-primary',
  addon: 'bg-secondary/10 text-secondary',
};

export function ModulesPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, error, refetch } = useAdminModules();

  const filtered = (data ?? []).filter(
    (m) =>
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase()),
  );

  // Kategoriye göre grupla
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Sistem Modülleri"
        description={`Toplam ${data?.length ?? 0} modül, tüm firmalara paket bazlı sunulur`}
      />

      <div className="card p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Modül adı veya kodu ile ara…"
            className="h-10 w-full rounded-md border border-outline-variant bg-surface-container pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {isLoading && <LoadingState size="lg" />}
      {isError && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}

      {data && (
        <div className="flex flex-col gap-4">
          {Object.entries(grouped).map(([category, modules]) => (
            <div key={category} className="card p-5">
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    CATEGORY_COLORS[category] ?? 'bg-surface-variant text-on-surface-variant'
                  }`}
                >
                  {CATEGORY_LABELS[category] ?? category}
                </span>
                <span className="text-xs text-on-surface-variant">{modules.length} modül</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {modules.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-md border border-outline-variant bg-surface-container-lowest p-3 transition-colors hover:border-primary"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-primary-container text-primary">
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-foreground">
                            {m.name}
                          </div>
                          <div className="truncate font-mono text-xs text-on-surface-variant">
                            {m.code}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          m.isActive
                            ? 'bg-secondary-container text-secondary'
                            : 'bg-error-container text-error'
                        }`}
                      >
                        {m.isActive ? 'AKTİF' : 'PASİF'}
                      </span>
                    </div>
                    {m.description && (
                      <p className="mt-2 line-clamp-2 text-xs text-on-surface-variant">
                        {m.description}
                      </p>
                    )}
                    <div className="mt-2 font-mono text-[10px] text-on-surface-variant">
                      {m.defaultRoute}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
