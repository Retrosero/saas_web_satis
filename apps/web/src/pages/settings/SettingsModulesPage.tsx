import { useState } from 'react';
import { Package, ToggleLeft, ToggleRight, Search, CheckCircle2, Sparkles, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { EmptyState } from '@/components/data/EmptyState';
import { useTenantModules, useToggleModule } from '@/features/tenant-admin/hooks';
import { cn } from '@/lib/cn';
import toast from 'react-hot-toast';

const CATEGORY_LABEL: Record<string, string> = {
  core: 'Çekirdek',
  operations: 'Operasyon',
  finance: 'Finans',
  hr: 'İK',
  integration: 'Entegrasyon',
  addon: 'Eklenti',
  SYSTEM: 'Sistem',
  SECURITY: 'Güvenlik',
  TENANT: 'Firma',
  PLAN: 'Paket',
  MODULE: 'Modül',
  USER: 'Kullanıcı',
  SALE: 'Satış',
  COLLECTION: 'Tahsilat',
  STOCK: 'Stok',
  ORDER: 'Sipariş',
  INVOICE: 'Fatura',
  REPORT: 'Rapor',
};

const CATEGORY_COLOR: Record<string, string> = {
  core: 'bg-primary-container text-primary',
  operations: 'bg-secondary-container text-secondary',
  finance: 'bg-tertiary/10 text-tertiary',
  hr: 'bg-surface-variant text-on-surface-variant',
  integration: 'bg-primary/10 text-primary',
  addon: 'bg-secondary/10 text-secondary',
};

export function SettingsModulesPage() {
  const { data, isLoading, isError, error, refetch } = useTenantModules();
  const toggle = useToggleModule();
  const [search, setSearch] = useState('');
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  const handleToggle = async (code: string, currentState: boolean) => {
    setPendingCode(code);
    try {
      const result = await toggle.mutateAsync({ code, isActive: !currentState });
      toast.success(result.isActive ? 'Modül aktif edildi' : 'Modül devre dışı bırakıldı');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'İşlem başarısız';
      toast.error(message);
    } finally {
      setPendingCode(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Modüller"
        description="Aktif ve kullanılabilir modüller. Manuel açma/kapatma yaparak tenant'ınızı özelleştirin."
        actions={
          <span className="text-xs text-on-surface-variant flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {data?.active.length ?? 0} aktif
          </span>
        }
      />

      <div className="card p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Modül ara…"
            className="w-full h-10 pl-10 pr-4 rounded-md bg-surface-container text-sm border border-outline-variant focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {isLoading && <LoadingState size="lg" />}
      {isError && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {data && data.active.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<Package className="h-8 w-8" />}
            title="Aktif modülünüz yok"
            description="Planınızda modül yok. Süper admin ile iletişime geçin veya planı yükseltin."
          />
        </div>
      )}

      {data && data.active.length > 0 && (
        <>
          <h2 className="text-base font-semibold text-foreground mt-2">Aktif Modüller</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.active
              .filter((m) => !search || m.name.toLowerCase().includes(search.toLowerCase()))
              .map((m) => (
                <ModuleCard
                  key={m.code}
                  code={m.code}
                  name={m.name}
                  category={m.category}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  isActive
                  source={m.source}
                  validUntil={m.validUntil}
                  isLoading={pendingCode === m.code}
                  onToggle={() => handleToggle(m.code, true)}
                />
              ))}
          </div>
        </>
      )}

      {data && data.available.length > 0 && (
        <>
          <h2 className="text-base font-semibold text-foreground mt-4 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Kullanılabilir Modüller ({data.available.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.available
              .filter((m) => !search || m.name.toLowerCase().includes(search.toLowerCase()))
              .map((m) => (
                <ModuleCard
                  key={m.code}
                  code={m.code}
                  name={m.name}
                  category={m.category}
                  icon={null}
                  isActive={false}
                  source={null}
                  validUntil={null}
                  isLoading={pendingCode === m.code}
                  onToggle={() => handleToggle(m.code, false)}
                />
              ))}
          </div>
        </>
      )}
    </div>
  );
}

interface ModuleCardProps {
  code: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  isActive: boolean;
  source: 'plan' | 'manual_override' | null;
  validUntil: string | null;
  isLoading: boolean;
  onToggle: () => void;
}

function ModuleCard({ code, name, category, icon, isActive, source, validUntil, isLoading, onToggle }: ModuleCardProps) {
  return (
    <div
      className={cn(
        'card p-4 flex flex-col gap-3 transition-all',
        isActive && 'border-primary bg-primary-container/20',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className={cn(
              'h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0',
              isActive ? 'bg-primary text-primary-foreground' : 'bg-surface-container text-on-surface-variant',
            )}
          >
            <Package className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground truncate">{name}</h3>
            <p className="text-[10px] font-mono text-on-surface-variant truncate">{code}</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          disabled={isLoading}
          className={cn(
            'p-1 rounded-md transition-colors',
            isActive ? 'text-primary hover:bg-primary/10' : 'text-on-surface-variant hover:bg-surface-container',
          )}
          title={isActive ? 'Devre dışı bırak' : 'Aktif et'}
        >
          {isActive ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7" />}
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={cn(
            'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
            CATEGORY_COLOR[category] ?? 'bg-surface-variant text-on-surface-variant',
          )}
        >
          {CATEGORY_LABEL[category] ?? category}
        </span>
        {isActive && source === 'plan' && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-secondary-container text-secondary">PLAN</span>
        )}
        {isActive && source === 'manual_override' && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary-container text-primary">MANUEL</span>
        )}
        {isActive && icon}
        {validUntil && (
          <span className="text-[10px] text-on-surface-variant">
            <X className="h-3 w-3 inline" /> {new Date(validUntil).toLocaleDateString('tr-TR')}
          </span>
        )}
      </div>
    </div>
  );
}
