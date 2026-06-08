import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { EmptyState } from '@/components/data/EmptyState';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import {
  usePurchaseInvoicesList,
  useDeletePurchaseInvoice,
  type PurchaseInvoiceListItem,
} from '@/features/purchase-invoices/api';
import { formatCurrency, formatDate } from '@saas/shared';
import type { PaymentStatus, PurchaseInvoiceStatus } from '@saas/shared';
import toast from 'react-hot-toast';

const statusColors: Record<PurchaseInvoiceStatus, string> = {
  DRAFT: 'bg-surface-variant text-on-surface-variant',
  CONFIRMED: 'bg-secondary-container text-secondary',
  CANCELLED: 'bg-error-container text-error',
};

const statusLabels: Record<PurchaseInvoiceStatus, string> = {
  DRAFT: 'Taslak',
  CONFIRMED: 'Onaylandı',
  CANCELLED: 'İptal',
};

const paymentStatusColors: Record<PaymentStatus, string> = {
  UNPAID: 'bg-warning-container text-warning',
  PARTIALLY_PAID: 'bg-tertiary-container text-tertiary',
  PAID: 'bg-secondary-container text-secondary',
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  UNPAID: 'Ödenmedi',
  PARTIALLY_PAID: 'Kısmi Ödeme',
  PAID: 'Ödendi',
};

export function PurchaseInvoiceListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PurchaseInvoiceListItem | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, error, refetch } = usePurchaseInvoicesList({
    page,
    pageSize: 20,
    search: debouncedSearch || undefined,
  });

  const deleteInvoice = useDeletePurchaseInvoice();

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteInvoice.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Fatura silindi');
        setDeleteTarget(null);
      },
      onError: (err: unknown) => {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Silme başarısız');
      },
    });
  };

  const columns: DataTableColumn<PurchaseInvoiceListItem>[] = [
    {
      key: 'invoiceNumber',
      label: 'Fatura No',
      render: (item) => (
        <Link
          to={`/purchase-invoices/${item.id}`}
          className="font-medium text-primary hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          {item.invoiceNumber}
        </Link>
      ),
    },
    {
      key: 'invoiceDate',
      label: 'Tarih',
      render: (item) => formatDate(item.invoiceDate),
    },
    {
      key: 'supplierName',
      label: 'Tedarikçi',
    },
    {
      key: 'warehouseName',
      label: 'Depo',
      render: (item) => item.warehouseName ?? '-',
    },
    {
      key: 'grandTotal',
      label: 'Tutar',
      align: 'right',
      render: (item) => <span className="font-medium">{formatCurrency(item.grandTotal, item.currency)}</span>,
    },
    {
      key: 'status',
      label: 'Durum',
      render: (item) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[item.status]}`}>
          {statusLabels[item.status]}
        </span>
      ),
    },
    {
      key: 'paymentStatus',
      label: 'Ödeme',
      render: (item) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${paymentStatusColors[item.paymentStatus]}`}>
          {paymentStatusLabels[item.paymentStatus]}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (item) =>
        item.status === 'DRAFT' ? (
          <button
            onClick={(event) => {
              event.stopPropagation();
              setDeleteTarget(item);
            }}
            className="rounded p-1 text-on-surface-variant hover:bg-error-container hover:text-error"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null,
    },
  ];

  if (isLoading) return <LoadingState label="Faturalar yükleniyor..." />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

  const invoices = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Alış Faturaları"
        description="Tedarikçilerden yapılan alımların faturalarını yönetin"
        actions={
          <Link to="/purchase-invoices/new" className="btn-primary">
            <Plus className="h-4 w-4" />
            Yeni Alış Faturası
          </Link>
        }
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            placeholder="Fatura no veya tedarikçi ara..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full h-10 rounded-md border border-outline-variant bg-surface pl-10 pr-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="Alış faturası yok"
          description="Henüz alış faturası oluşturulmamış. İlk faturanızı oluşturun."
          action={
            <Link to="/purchase-invoices/new" className="btn-primary">
              <Plus className="h-4 w-4" />
              Yeni Alış Faturası
            </Link>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={invoices}
          rowKey={(item) => item.id}
          total={pagination?.total}
          page={page}
          pageSize={pagination?.pageSize ?? 20}
          onPageChange={setPage}
          totalLabel="fatura"
          onRowClick={(item) => navigate(`/purchase-invoices/${item.id}`)}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Faturayı Sil"
        description={`${deleteTarget?.invoiceNumber} numaralı taslak faturayı silmek istediğinize emin misiniz?`}
        confirmText="Sil"
        variant="danger"
        loading={deleteInvoice.isPending}
      />
    </div>
  );
}
