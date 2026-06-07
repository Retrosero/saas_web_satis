import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, Search, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/data/EmptyState';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useOrdersList } from '@/features/orders/api';
import { usePermission } from '@/lib/usePermission';
import { formatCurrency } from '@saas/shared';
import type { OrderStatus } from '@saas/shared';

const STATUS_LABEL: Record<OrderStatus, { text: string; color: string }> = {
  PENDING: { text: 'Bekliyor', color: 'bg-surface-variant text-on-surface-variant' },
  CONFIRMED: { text: 'Onaylandı', color: 'bg-primary-container text-primary' },
  PARTIALLY_SHIPPED: { text: 'Kısmi Sevk', color: 'bg-tertiary-container text-tertiary' },
  SHIPPED: { text: 'Sevk Edildi', color: 'bg-secondary-container text-secondary' },
  DELIVERED: { text: 'Teslim Edildi', color: 'bg-secondary-container text-secondary' },
  COMPLETED: { text: 'Tamamlandı', color: 'bg-secondary-container text-secondary' },
  CANCELLED: { text: 'İptal', color: 'bg-error-container text-error' },
};

const TYPE_LABEL: Record<string, string> = {
  SALES_ORDER: 'Satış Siparişi',
  PURCHASE_ORDER: 'Satın Alma',
  RETURN_ORDER: 'İade',
  PROFORMA_ORDER: 'Teklif',
  CONSIGNMENT_OUT: 'Konsiye Çıkış',
};

export function OrderListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();

  const { data, isLoading, isError, error, refetch } = useOrdersList({
    search: search || undefined,
    status: statusFilter,
    pageSize: 100,
  });

  const canCreate = usePermission('siparis:order:create');

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Siparişler"
        description="Satış siparişleri ve teklifler — onayla, satışa dönüştür"
        actions={
          canCreate ? (
            <button onClick={() => navigate('/orders/new')} className="btn-primary">
              <Plus className="h-4 w-4" />
              Yeni Sipariş
            </button>
          ) : null
        }
      />

      <div className="card p-3 flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sipariş no veya müşteri adı ile ara…"
            className="w-full h-10 pl-10 pr-4 rounded-md bg-surface-container text-sm border border-outline-variant focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={statusFilter ?? ''}
          onChange={(e) => setStatusFilter((e.target.value as OrderStatus) || undefined)}
          className="h-10 px-3 rounded-md bg-surface-container text-sm border border-outline-variant"
        >
          <option value="">Tüm durumlar</option>
          <option value="PENDING">Bekliyor</option>
          <option value="CONFIRMED">Onaylandı</option>
          <option value="PARTIALLY_SHIPPED">Kısmi Sevk</option>
          <option value="SHIPPED">Sevk Edildi</option>
          <option value="DELIVERED">Teslim Edildi</option>
          <option value="COMPLETED">Tamamlandı</option>
          <option value="CANCELLED">İptal</option>
        </select>
      </div>

      {isLoading && <LoadingState label="Siparişler yükleniyor…" />}
      {isError && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {data && data.data.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<ClipboardList className="h-8 w-8" />}
            title="Henüz sipariş yok"
            description="Satış siparişi oluşturun. Onaylanan sipariş daha sonra satışa dönüştürülebilir."
            action={
              canCreate ? (
                <button onClick={() => navigate('/orders/new')} className="btn-primary">
                  <Plus className="h-4 w-4" />
                  İlk Siparişi Oluştur
                </button>
              ) : null
            }
          />
        </div>
      )}
      {data && data.data.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container border-b border-outline-variant">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Sipariş No</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Müşteri</th>
                  <th className="text-center px-4 py-3 font-semibold text-foreground">Tarih</th>
                  <th className="text-center px-4 py-3 font-semibold text-foreground">Teslimat</th>
                  <th className="text-right px-4 py-3 font-semibold text-foreground">Tutar</th>
                  <th className="text-center px-4 py-3 font-semibold text-foreground">Durum</th>
                  <th className="text-center px-4 py-3 font-semibold text-foreground">Tür</th>
                  <th className="text-center px-4 py-3 font-semibold text-foreground">Kalem</th>
                  <th className="text-right px-4 py-3 font-semibold text-foreground">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((order) => {
                  const st = STATUS_LABEL[order.status];
                  return (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="border-b border-outline-variant last:border-0 hover:bg-surface-container cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium font-mono text-foreground">{order.orderNumber}</div>
                        {order.notes && (
                          <div className="text-xs text-on-surface-variant truncate max-w-[140px]">{order.notes}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{order.customerName}</div>
                        {order.customerTaxNumber && (
                          <div className="text-xs font-mono text-on-surface-variant">{order.customerTaxNumber}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-on-surface-variant">
                        {new Date(order.orderDate).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-on-surface-variant">
                        {order.deliveryDate
                          ? new Date(order.deliveryDate).toLocaleDateString('tr-TR')
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                        {formatCurrency(order.grandTotal)}
                        <div className="text-xs text-on-surface-variant">{formatCurrency(order.vatTotal)} KDV</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${st.color}`}>
                          {st.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-on-surface-variant">
                        {TYPE_LABEL[order.type] ?? order.type}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-on-surface-variant">
                        {order.itemCount}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="btn-ghost text-xs"
                        >
                          Detay
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-outline-variant bg-surface-container text-xs text-on-surface-variant flex justify-between">
            <span>Toplam {data.pagination.total} sipariş</span>
            <span className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Satışa dönüştürme yakında aktif
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
