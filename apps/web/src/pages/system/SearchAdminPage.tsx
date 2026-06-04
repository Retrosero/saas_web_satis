import { Search, RefreshCw, Database, Zap, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { useSearchStats, useReindex } from '@/features/search/api';

export function SearchAdminPage() {
  const { data, isLoading } = useSearchStats();
  const reindex = useReindex();

  return (
    <div className="space-y-4">
      <PageHeader title="Meilisearch Yönetimi" description="Full-text search engine, index istatistikleri, reindex" actions={<button onClick={() => reindex.mutate()} disabled={reindex.isPending} className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><RefreshCw className={`h-4 w-4 ${reindex.isPending ? 'animate-spin' : ''}`} /> Reindex</button>} />

      {!data ? <LoadingState /> : !data.healthy ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4">
          <div className="flex items-center gap-2 font-semibold text-red-900"><X className="h-5 w-5" /> Meilisearch bağlı değil</div>
          <p className="mt-1 text-sm text-red-800">Sistem Prisma fallback ile çalışıyor. docker-compose up meilisearch ile başlatın.</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-green-300 bg-green-50 p-3">
            <div className="flex items-center gap-2 font-semibold text-green-900"><Zap className="h-4 w-4" /> Meilisearch Aktif</div>
            <p className="mt-1 text-sm text-green-800">Sub-50ms arama, typo-tolerant, multi-tenant filter</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.indexes.map((idx: any) => (
              <div key={idx.name} className="rounded-lg border border-outline bg-surface p-3">
                <div className="flex items-center gap-2 text-xs text-on-surface-variant"><Database className="h-3 w-3" /> {idx.name}</div>
                <p className="text-2xl font-bold">{idx.numberOfDocuments?.toLocaleString('tr-TR') ?? '—'}</p>
                {idx.isIndexing && <p className="text-xs text-amber-600">İndeksleniyor...</p>}
                {idx.error && <p className="text-xs text-red-600">{idx.error}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="rounded-lg border border-blue-300 bg-blue-50 p-3 text-sm">
        <h3 className="mb-1 font-semibold text-blue-900">İndekslenen Alanlar</h3>
        <ul className="space-y-0.5 text-blue-800">
          <li>• <b>customers</b>: name, code, phone, email, taxNumber</li>
          <li>• <b>products</b>: name, code</li>
          <li>• <b>sales</b>: saleNumber, customerName</li>
          <li>• <b>quotes</b>: quoteNumber, customerName</li>
        </ul>
        <p className="mt-2 text-xs text-blue-700">Tüm indeksler tenantId ile filtrelenir (multi-tenant izolasyon)</p>
      </div>
    </div>
  );
}
