import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, RotateCcw, Filter, Package, Warehouse as WarehouseIcon, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/data/EmptyState';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useStockMovements, useReverseStockMovement } from '@/features/stock/api';
import { formatNumber, formatDate } from '@saas/shared';
import type { StockMovementType } from '@saas/shared';
import toast from 'react-hot-toast';

const TYPE_INFO: Record<StockMovementType, { text: string; color: string; icon: typeof ArrowDownLeft }> = {
  IN: { text: 'Giriş', color: 'bg-secondary-container text-secondary', icon: ArrowDownLeft },
  OUT: { text: 'Çıkış', color: 'bg-error-container text-error', icon: ArrowUpRight },
  TRANSFER: { text: 'Transfer', color: 'bg-primary-container text-primary', icon: TrendingUp },
  ADJUST: { text: 'Düzeltme', color: 'bg-tertiary-container text-tertiary', icon: TrendingDown },
};

const REF_TYPE_LABEL: Record<string, string> = {
  SALE: 'Satış',
  SALE_CANCEL: 'Satış İptal',
  PURCHASE: 'Alış',
  PURCHASE_CANCEL: 'Alış İptal',
  TRANSFER: 'Transfer',
  TRANSFER_CANCEL: 'Transfer İptal',
  ADJUST: 'Düzeltme',
  COUNT: 'Sayım',
  OPENING_BALANCE: 'Açılış',
  RETURN: 'İade',
  PRODUCTION: 'Üretim',
  WASTE: 'Fire',
};

export function StockMovementsPage() {
  const [typeFilter, setTypeFilter] = useState<StockMovementType | undefined>();
  const { data, isLoading, isError, error, refetch } = useStockMovements({ type: typeFilter, pageSize: 100 });
  const reverse = useReverseStockMovement();

  const handleReverse = (id: string, refNumber: string | null) => {
    if (!confirm(`${refNumber ?? id} hareketini ters kayıt ile iptal etmek istiyor musunuz?`)) return;
    reverse.mutate(id, {
      onSuccess: () => {
        toast.success('Hareket ters kayıt ile iptal edildi');
        refetch();
      },
      onError: (err: unknown) => {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'İşlem başarısız';
        toast.error(message);
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Stok Hareketleri"
        description="Tüm depolar için tüm IN/OUT/TRANSFER/ADJUST hareketleri (event-sourcing)"
        actions={
          <div className="flex items-center gap-2">
            <Filter className="h-3 w-3 text-on-surface-variant" />
            <select
              value={typeFilter ?? ''}
              onChange={(e) => setTypeFilter((e.target.value as StockMovementType) || undefined)}
              className="h-10 px-3 rounded-md bg-surface-container text-sm border border-outline-variant"
            >
              <option value="">Tüm tipler</option>
              <option value="IN">Giriş</option>
              <option value="OUT">Çıkış</option>
              <option value="TRANSFER">Transfer</option>
              <option value="ADJUST">Düzeltme</option>
            </select>
          </div>
        }
      />

      {isLoading && <LoadingState label="Hareketler yükleniyor…" />}
      {isError && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {data && data.data.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<Package className="h-8 w-8" />}
            title="Henüz stok hareketi yok"
            description="Ürün/Depo oluşturduktan sonra manuel giriş, çıkış veya transfer hareketleri oluşturabilirsiniz."
          />
        </div>
      )}
      {data && data.data.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container border-b border-outline-variant">
                <tr>
                  <th className="text-left font-semibold text-foreground px-4 py-3">Tarih</th>
                  <th className="text-left font-semibold text-foreground px-4 py-3">Tip</th>
                  <th className="text-left font-semibold text-foreground px-4 py-3">Ürün</th>
                  <th className="text-left font-semibold text-foreground px-4 py-3">Depo</th>
                  <th className="text-left font-semibold text-foreground px-4 py-3">Referans</th>
                  <th className="text-right font-semibold text-foreground px-4 py-3">Miktar</th>
                  <th className="text-right font-semibold text-foreground px-4 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((m) => {
                  const t = TYPE_INFO[m.type];
                  const Icon = t.icon;
                  return (
                    <tr
                      key={m.id}
                      className={`border-b border-outline-variant last:border-0 hover:bg-surface-container ${m.reversesId ? 'opacity-60' : ''}`}
                    >
                      <td className="px-4 py-3 text-xs font-mono text-on-surface-variant whitespace-nowrap">
                        {formatDate(m.movementDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${t.color}`}>
                          <Icon className="h-3 w-3" />
                          {t.text}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-foreground">{m.productName}</div>
                        <div className="text-xs text-on-surface-variant font-mono">{m.productCode}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground">
                        <div className="flex items-center gap-1">
                          <WarehouseIcon className="h-3 w-3 text-on-surface-variant" />
                          {m.warehouseName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="text-foreground">{REF_TYPE_LABEL[m.refType] ?? m.refType}</div>
                        {m.refNumber && <div className="text-on-surface-variant font-mono">{m.refNumber}</div>}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${
                        m.type === 'IN' ? 'text-secondary' : m.type === 'OUT' ? 'text-error' : 'text-foreground'
                      }`}>
                        {m.type === 'IN' ? '+' : m.type === 'OUT' ? '−' : '±'}
                        {formatNumber(m.quantity)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {m.reversesId ? (
                          <span className="text-xs text-on-surface-variant flex items-center justify-end gap-1">
                            <AlertTriangle className="h-3 w-3" /> Ters kayıt
                          </span>
                        ) : (
                          <button
                            onClick={() => handleReverse(m.id, m.refNumber)}
                            disabled={reverse.isPending}
                            className="btn-ghost text-xs text-tertiary"
                          >
                            <RotateCcw className="h-3 w-3" />
                            İptal
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-outline-variant bg-surface-container text-xs text-on-surface-variant">
            Toplam {data.pagination.total} hareket
          </div>
        </div>
      )}
    </div>
  );
}
