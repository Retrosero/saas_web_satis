import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Filter, History } from 'lucide-react';
import { usePortalOrders } from '@/features/portal/api';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { formatCurrency, formatDate } from '@saas/shared';
import type { PortalOrderListItem } from '@/features/portal/api';

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Bekliyor', CONFIRMED: 'Onaylandı', PARTIALLY_SHIPPED: 'Kısmi Sevk', SHIPPED: 'Sevk Edildi', DELIVERED: 'Teslim Edildi', COMPLETED: 'Tamamlandı', CANCELLED: 'İptal',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800', CONFIRMED: 'bg-blue-100 text-blue-800', PARTIALLY_SHIPPED: 'bg-purple-100 text-purple-800', SHIPPED: 'bg-indigo-100 text-indigo-800', DELIVERED: 'bg-teal-100 text-teal-800', COMPLETED: 'bg-green-100 text-green-800', CANCELLED: 'bg-red-100 text-red-800',
};

export function PortalOrdersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = usePortalOrders({ page, pageSize: 25 });
  const rows: PortalOrderListItem[] = data?.data ?? [];
  const pagination = data?.pagination;

  const columns: DataTableColumn<PortalOrderListItem>[] = [
    { key: 'orderNumber', label: 'Sipariş No', render: (r) => <span className="font-mono font-semibold">{r.orderNumber}</span> },
    { key: 'orderDate', label: 'Tarih', width: '120px', render: (r) => formatDate(r.orderDate) },
    { key: 'warehouse', label: 'Depo', hideOnMobile: true, render: (r) => r.warehouse ?? '—' },
    { key: 'itemCount', label: 'Kalem', width: '70px', render: (r) => r.itemCount },
    { key: 'grandTotal', label: 'Tutar', width: '130px', align: 'right', render: (r) => <span className="font-semibold">{formatCurrency(r.grandTotal)}</span> },
    { key: 'status', label: 'Durum', width: '140px', render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[r.status] ?? 'bg-gray-200'}`}>{ORDER_STATUS_LABEL[r.status] ?? r.status}</span> },
    { key: 'actions', label: '', width: '50px', render: (r) => <Eye className="h-4 w-4 text-primary" /> },
  ];

  if (error) return <ErrorState message="Siparişler yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      {isLoading ? <LoadingState /> : rows.length === 0 ? (
        <EmptyState icon={<History className="h-12 w-12" />} title="Henüz siparişiniz yok" description="Katalogdan sipariş oluşturabilirsiniz" />
      ) : (
        <>
          <DataTable<PortalOrderListItem> columns={columns} data={rows} rowKey={(r) => r.id} onRowClick={(r) => navigate(`/portal/orders/${r.id}`)} />
          <MobileCardList<PortalOrderListItem> data={rows} keyFn={(r) => r.id} onItemClick={(r) => navigate(`/portal/orders/${r.id}`)} header={(r) => r.orderNumber} subtitle={(r) => `${formatDate(r.orderDate)} • ${r.warehouse ?? '—'}`} rightBadge={(r) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[r.status] ?? ''}`}>{ORDER_STATUS_LABEL[r.status] ?? r.status}</span>} footer={(r) => <div className="flex justify-between text-xs"><span className="text-on-surface-variant">{r.itemCount} kalem</span><span className="font-semibold">{formatCurrency(r.grandTotal)}</span></div>} />
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button disabled={!pagination.hasPrev} onClick={() => setPage(page - 1)} className="rounded-md border border-outline px-3 py-1.5 text-sm disabled:opacity-40">Önceki</button>
              <span className="px-3 py-1.5 text-sm">{page}/{pagination.totalPages}</span>
              <button disabled={!pagination.hasNext} onClick={() => setPage(page + 1)} className="rounded-md border border-outline px-3 py-1.5 text-sm disabled:opacity-40">Sonraki</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
