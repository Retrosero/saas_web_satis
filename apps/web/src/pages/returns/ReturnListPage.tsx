import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Undo2, Plus, Eye, Pencil, Check, X, Send, FileText, Filter } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { PageGuard } from '@/components/data/PageGuard';
import { useReturnsList, useReturnAction, useDeleteReturn } from '@/features/returns/api';
import {
  ReturnReasonLabel,
  ReturnSourceLabel,
  ReturnStatusLabel,
  type ReturnListItem,
  type ReturnStatus,
  type ReturnReason,
} from '@saas/shared';
import { formatCurrency, formatDate } from '@saas/shared';

const STATUS_COLOR: Record<ReturnStatus, string> = {
  DRAFT: 'bg-surface-variant text-on-surface-variant',
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-200 text-gray-700',
};

const REASON_OPTIONS: Array<{ value: ReturnReason | 'all'; label: string }> = [
  { value: 'all', label: 'Tüm Nedenler' },
  { value: 'INTACT', label: ReturnReasonLabel.INTACT },
  { value: 'DEFECTIVE', label: ReturnReasonLabel.DEFECTIVE },
  { value: 'WRONG_PRODUCT', label: ReturnReasonLabel.WRONG_PRODUCT },
  { value: 'EXCESS', label: ReturnReasonLabel.EXCESS },
  { value: 'OTHER', label: ReturnReasonLabel.OTHER },
];

const STATUS_OPTIONS: Array<{ value: ReturnStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Tüm Durumlar' },
  { value: 'DRAFT', label: ReturnStatusLabel.DRAFT },
  { value: 'PENDING', label: ReturnStatusLabel.PENDING },
  { value: 'APPROVED', label: ReturnStatusLabel.APPROVED },
  { value: 'COMPLETED', label: ReturnStatusLabel.COMPLETED },
  { value: 'REJECTED', label: ReturnStatusLabel.REJECTED },
  { value: 'CANCELLED', label: ReturnStatusLabel.CANCELLED },
];

export function ReturnListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | 'all'>('all');
  const [reasonFilter, setReasonFilter] = useState<ReturnReason | 'all'>('all');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; number: string } | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<{ id: string; number: string } | null>(null);

  const { data, isLoading, error, refetch } = useReturnsList({
    page,
    pageSize: 25,
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    reason: reasonFilter !== 'all' ? reasonFilter : undefined,
  });

  const deleteMutation = useDeleteReturn();
  const actionMutation = useReturnAction('');

  const rows: ReturnListItem[] = data?.data ?? [];
  const pagination = data?.pagination;

  const columns: DataTableColumn<ReturnListItem>[] = [
    {
      key: 'returnNumber',
      label: 'İade No',
      width: '150px',
      sortable: true,
      render: (r) => <span className="font-mono font-semibold">{r.returnNumber}</span>,
    },
    {
      key: 'returnDate',
      label: 'Tarih',
      width: '120px',
      sortable: true,
      hideOnMobile: true,
      render: (r) => formatDate(r.returnDate),
    },
    {
      key: 'customer',
      label: 'Cari',
      sortable: true,
      render: (r) => (
        <div>
          <div className="font-medium text-foreground">{r.customerName}</div>
          {r.customerCode && <div className="text-xs text-on-surface-variant font-mono">{r.customerCode}</div>}
        </div>
      ),
    },
    {
      key: 'reason',
      label: 'Neden',
      width: '150px',
      hideOnMobile: true,
      render: (r) => ReturnReasonLabel[r.reason],
    },
    {
      key: 'source',
      label: 'Kaynak',
      width: '180px',
      hideOnMobile: true,
      render: (r) => ReturnSourceLabel[r.source],
    },
    {
      key: 'itemCount',
      label: 'Kalem',
      width: '70px',
      hideOnMobile: true,
      render: (r) => <span className="font-medium">{r.itemCount}</span>,
    },
    {
      key: 'grandTotal',
      label: 'Tutar',
      width: '130px',
      align: 'right',
      render: (r) => <span className="font-semibold">{formatCurrency(r.grandTotal, r.currency)}</span>,
    },
    {
      key: 'status',
      label: 'Durum',
      width: '130px',
      render: (r) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[r.status]}`}>
          {ReturnStatusLabel[r.status]}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'İşlemler',
      width: '180px',
      render: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/returns/${r.id}`)}
            className="rounded-md p-1.5 text-primary hover:bg-primary-container/40"
            title="Detay"
          >
            <Eye className="h-4 w-4" />
          </button>
          {['DRAFT', 'PENDING'].includes(r.status) && (
            <button
              onClick={() => navigate(`/returns/${r.id}/edit`)}
              className="rounded-md p-1.5 text-primary hover:bg-primary-container/40"
              title="Düzenle"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {r.status === 'DRAFT' && (
            <button
              onClick={async () => {
                await actionMutation.mutateAsync({ action: 'submit' } as any);
                refetch();
              }}
              className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50"
              title="Onaya Gönder"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
          {!['COMPLETED', 'CANCELLED', 'REJECTED'].includes(r.status) && (
            <button
              onClick={() => setConfirmCancel({ id: r.id, number: r.returnNumber })}
              className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50"
              title="İptal"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {['DRAFT', 'PENDING'].includes(r.status) && (
            <button
              onClick={() => setConfirmDelete({ id: r.id, number: r.returnNumber })}
              className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
              title="Sil"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message="İade listesi yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
        <PageHeader
          title="İade Yönetimi"
          description="Müşterilerden alınan iadeleri yönetin"
          actions={
            <button
              onClick={() => navigate('/returns/new')}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Yeni İade
            </button>
          }
        />

        {/* Filtreler */}
        <div className="rounded-lg border border-outline-variant bg-surface p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-xs font-medium text-on-surface-variant">Arama</label>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="İade no, müşteri adı..."
                className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="w-[180px]">
              <label className="mb-1 block text-xs font-medium text-on-surface-variant">Durum</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
                className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="w-[180px]">
              <label className="mb-1 block text-xs font-medium text-on-surface-variant">Neden</label>
              <select
                value={reasonFilter}
                onChange={(e) => { setReasonFilter(e.target.value as any); setPage(1); }}
                className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm"
              >
                {REASON_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); setReasonFilter('all'); setPage(1); }}
              className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm hover:bg-surface-variant"
            >
              <Filter className="h-4 w-4" />
              Temizle
            </button>
          </div>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Undo2 className="h-12 w-12" />}
            title="Henüz iade yok"
            description="İlk iadenizi oluşturmak için 'Yeni İade' butonunu kullanın"
          />
        ) : (
          <>
            <DataTable<ReturnListItem>
              columns={columns}
              data={rows}
              rowKey={(r) => r.id}
              onRowClick={(r) => navigate(`/returns/${r.id}`)}
            />
            <MobileCardList
              data={rows}
              keyFn={(r: ReturnListItem) => r.id}
              onItemClick={(r: ReturnListItem) => navigate(`/returns/${r.id}`)}
              header={(r: ReturnListItem) => r.returnNumber}
              subtitle={(r: ReturnListItem) => `${r.customerName} • ${formatDate(r.returnDate)}`}
              rightBadge={(r: ReturnListItem) => (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[r.status]}`}>
                  {ReturnStatusLabel[r.status]}
                </span>
              )}
              footer={(r: ReturnListItem) => (
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant">{r.itemCount} kalem</span>
                  <span className="font-semibold">{formatCurrency(r.grandTotal, r.currency)}</span>
                </div>
              )}
            />

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface px-4 py-3">
                <span className="text-sm text-on-surface-variant">
                  Toplam {pagination.total} kayıt — sayfa {pagination.page}/{pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={!pagination.hasPrev}
                    onClick={() => setPage(page - 1)}
                    className="rounded-md border border-outline px-3 py-1.5 text-sm disabled:opacity-40"
                  >
                    Önceki
                  </button>
                  <button
                    disabled={!pagination.hasNext}
                    onClick={() => setPage(page + 1)}
                    className="rounded-md border border-outline px-3 py-1.5 text-sm disabled:opacity-40"
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <ConfirmModal
          open={!!confirmDelete}
          title="İade Silinsin mi?"
          description={`${confirmDelete?.number} numaralı iade silinecek. Bu işlem geri alınamaz.`}
          confirmText="Sil"
          variant="danger"
          onClose={() => setConfirmDelete(null)}
          onConfirm={async () => {
            if (confirmDelete) {
              await deleteMutation.mutateAsync(confirmDelete.id);
              setConfirmDelete(null);
            }
          }}
        />

        <ConfirmModal
          open={!!confirmCancel}
          title="İade İptal Edilsin mi?"
          description={`${confirmCancel?.number} numaralı iade iptal edilecek.`}
          confirmText="İptal Et"
          variant="warning"
          onClose={() => setConfirmCancel(null)}
          onConfirm={async () => {
            if (confirmCancel) {
              const m = useReturnAction(confirmCancel.id);
              await m.mutateAsync({ action: 'cancel' });
              setConfirmCancel(null);
              refetch();
            }
          }}
        />
      </div>
  );
}
