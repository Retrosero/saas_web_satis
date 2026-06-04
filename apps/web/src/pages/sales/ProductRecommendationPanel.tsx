import { Sparkles, ShoppingCart } from 'lucide-react';
import { useProductRecommendations } from '@/features/ux-bulk/api';
import { RecommendationTypeLabel } from '@saas/shared';

export function ProductRecommendationPanel({ customerId, onAdd }: { customerId?: string; onAdd?: (productId: string) => void }) {
  const { data, isLoading } = useProductRecommendations(customerId);
  if (!customerId) return null;
  if (isLoading) return <p className="p-3 text-sm text-on-surface-variant">Öneriler yükleniyor...</p>;
  if (!data || data.length === 0) return null;
  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
      <div className="mb-2 flex items-center gap-2 font-semibold text-purple-900"><Sparkles className="h-4 w-4" /> Bu Müşteriye Önerilenler</div>
      <div className="space-y-1">
        {data.map((r: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-2 rounded border border-purple-200 bg-white p-2 text-sm">
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">{r.productName}</p>
              <p className="truncate text-xs text-on-surface-variant">{r.reason}</p>
              <p className="text-xs text-purple-700">{RecommendationTypeLabel[r.type as keyof typeof RecommendationTypeLabel]} • {Math.round((r.confidence ?? 0) * 100)}% güven</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{Number(r.price).toLocaleString('tr-TR')}</span>
              {onAdd && <button onClick={() => onAdd(r.productId)} className="rounded p-1 text-purple-600 hover:bg-purple-100"><ShoppingCart className="h-4 w-4" /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
