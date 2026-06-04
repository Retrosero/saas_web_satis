import { Trash2, Database, RefreshCw, Zap, Activity, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useCacheMetrics, useCachePing, useInvalidateTenant, useInvalidateAll, useResetMetrics } from '@/features/cache-admin/api';
import { useState } from 'react';

const MODULES = ['customers', 'products', 'sales', 'orders', 'collections', 'quotes', 'users', 'dashboard', 'permissions'];

export function CacheAdminPage() {
  const { data: metrics, isLoading } = useCacheMetrics();
  const { data: ping } = useCachePing();
  const invalidate = useInvalidateTenant();
  const invalidateAll = useInvalidateAll();
  const reset = useResetMetrics();
  const [confirmModule, setConfirmModule] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  return (
    <div className="space-y-4">
      <PageHeader title="Cache Yönetimi" description="Redis cache metrikleri, modül bazlı invalidation" />

      {isLoading ? <LoadingState /> : metrics && (
        <>
          <div className="rounded-lg border border-outline bg-surface p-3">
            <div className="flex items-center gap-2">
              {ping?.ok ? (
                <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800"><Zap className="h-3 w-3" /> Redis bağlı</span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800"><X className="h-3 w-3" /> Redis bağlı değil</span>
              )}
              <span className="ml-auto text-xs text-on-surface-variant">Her 5 saniyede güncellenir</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg border border-green-300 bg-green-50 p-3"><div className="flex items-center gap-2 text-xs text-on-surface-variant"><Activity className="h-3 w-3" /> Hit</div><p className="text-2xl font-bold text-green-600">{metrics.hits}</p></div>
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3"><div className="flex items-center gap-2 text-xs text-on-surface-variant"><Activity className="h-3 w-3" /> Miss</div><p className="text-2xl font-bold text-amber-600">{metrics.misses}</p></div>
            <div className="rounded-lg border border-blue-300 bg-blue-50 p-3"><div className="flex items-center gap-2 text-xs text-on-surface-variant"><Database className="h-3 w-3" /> Set</div><p className="text-2xl font-bold text-blue-600">{metrics.sets}</p></div>
            <div className="rounded-lg border border-red-300 bg-red-50 p-3"><div className="flex items-center gap-2 text-xs text-on-surface-variant"><Trash2 className="h-3 w-3" /> Delete</div><p className="text-2xl font-bold text-red-600">{metrics.deletes}</p></div>
            <div className="rounded-lg border border-purple-300 bg-purple-50 p-3"><div className="flex items-center gap-2 text-xs text-on-surface-variant">Hit Rate</div><p className="text-2xl font-bold text-purple-600">%{(metrics.hitRate * 100).toFixed(1)}</p></div>
          </div>
        </>
      )}

      <div className="rounded-lg border border-outline bg-surface p-3">
        <h3 className="mb-2 font-semibold">Modül Bazlı Cache Temizleme</h3>
        <p className="mb-2 text-xs text-on-surface-variant">Belirli bir modülün tüm cache'ini temizler (write işlem sonrası).</p>
        <div className="flex flex-wrap gap-2">
          {MODULES.map((m) => (
            <button key={m} onClick={() => setConfirmModule(m)} className="rounded-md border border-outline px-3 py-1.5 text-sm hover:bg-surface-variant">
              <Trash2 className="mr-1 inline h-3 w-3" /> {m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setConfirmAll(true)} className="flex items-center gap-1 rounded-md bg-red-600 px-3 py-2 text-sm text-white"><Trash2 className="h-4 w-4" /> TÜM Cache'i Temizle</button>
        <button onClick={() => reset.mutate()} className="flex items-center gap-1 rounded-md border border-outline px-3 py-2 text-sm"><RefreshCw className="h-4 w-4" /> Metrikleri Sıfırla</button>
      </div>

      <ConfirmModal open={!!confirmModule} title="Cache Temizle" description={`"${confirmModule}" modülünün tüm cache'i silinecek. Sonraki istekler DB'den gelecek.`} confirmText="Temizle" variant="warning" onClose={() => setConfirmModule(null)} onConfirm={async () => { if (confirmModule) { await invalidate.mutateAsync(confirmModule); setConfirmModule(null); } }} />
      <ConfirmModal open={confirmAll} title="TÜM Cache Temizle" description="Tüm tenantların cache'i silinecek. Sadece acil durumlarda kullanın." confirmText="Tümünü Sil" variant="danger" onClose={() => setConfirmAll(false)} onConfirm={async () => { await invalidateAll.mutateAsync(); setConfirmAll(false); }} />
    </div>
  );
}
