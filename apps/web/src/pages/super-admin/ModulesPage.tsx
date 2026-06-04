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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Modül adı veya kodu ile ara…"
            className="w-full h-10 pl-10 pr-4 rounded-md bg-surface-container text-sm border border-outline-variant focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {isLoading && <LoadingState size="lg" />}
      {isError && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}

      {data && (
        <div className="flex flex-col gap-4">
          {Object.entries(grouped).map(([category, modules]) => (
            <div key={category} className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    CATEGORY_COLORS[category] ?? 'bg-surface-variant text-on-surface-variant'
                  }`}
                >
                  {CATEGORY_LABELS[category] ?? category}
                </span>
                <span className="text-xs text-on-surface-variant">{modules.length} modül</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {modules.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-md border border-outline-variant bg-surface-container-lowest hover:border-primary transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="h-8 w-8 rounded-md bg-primary-container text-primary flex items-center justify-center flex-shrink-0">
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-foreground truncate">{m.name}</div>
                          <div className="text-xs font-mono text-on-surface-variant truncate">{m.code}</div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          m.isActive ? 'bg-secondary-container text-secondary' : 'bg-error-container text-error'
                        }`}
                      >
                        {m.isActive ? 'AKTİF' : 'PASİF'}
                      </span>
                    </div>
                    {m.description && <p className="text-xs text-on-surface-variant mt-2 line-clamp-2">{m.description}</p>}
                    <div className="text-[10px] text-on-surface-variant font-mono mt-2">{m.defaultRoute}</div>
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
