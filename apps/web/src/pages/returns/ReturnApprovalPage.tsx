import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Eye, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useReturnsList, useReturnAction } from '@/features/returns/api';
import {
  ReturnReasonLabel,
  ReturnStatusLabel,
  formatCurrency,
  formatDate,
  type ReturnListItem,
} from '@saas/shared';

export function ReturnApprovalPage() {
  const navigate = useNavigate();
  const [confirmApprove, setConfirmApprove] = useState<ReturnListItem | null>(null);
  const actionMutation = useReturnAction();

  const { data, isLoading, error, refetch } = useReturnsList({ status: 'PENDING', pageSize: 100 });
  const rows: ReturnListItem[] = data?.data ?? [];

  const approveOne = async (id: string) => {
    await actionMutation.mutateAsync({ id, action: 'approve' });
  };

  const rejectOne = async (id: string, reason: string) => {
    await actionMutation.mutateAsync({ id, action: 'reject', rejectionReason: reason });
  };

  const columns: DataTableColumn<ReturnListItem>[] = [
    { key: 'returnNumber', label: 'İade No', width: '150px', render: (r) => <span className="font-mono font-semibold">{r.returnNumber}</span> },
    { key: 'returnDate', label: 'Tarih', width: '120px', hideOnMobile: true, render: (r) => formatDate(r.returnDate) },
    { key: 'customer', label: 'Cari', render: (r) => <div><div className="font-medium">{r.customerName}</div>{r.customerCode && <div className="text-xs font-mono text-on-surface-variant">{r.customerCode}</div>}</div> },
    { key: 'reason', label: 'Neden', width: '150px', hideOnMobile: true, render: (r) => ReturnReasonLabel[r.reason] },
    { key: 'itemCount', label: 'Kalem', width: '70px', hideOnMobile: true, render: (r) => r.itemCount },
    { key: 'grandTotal', label: 'Tutar', width: '130px', align: 'right', render: (r) => <span className="font-semibold">{formatCurrency(r.grandTotal, r.currency)}</span> },
    {
      key: 'actions',
      label: 'İşlem',
      width: '200px',
      render: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => navigate(`/returns/${r.id}`)} className="rounded-md p-1.5 text-primary hover:bg-primary-container/40" title="Detay"><Eye className="h-4 w-4" /></button>
          <button onClick={() => setConfirmApprove(r)} className="flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white" title="Onayla"><Check className="h-3 w-3" /> Onayla</button>
          <RejectInlineButton onConfirm={(reason) => rejectOne(r.id, reason)} />
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message="Onay bekleyen iadeler yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="İade Onaylama"
        description="Onayınızı bekleyen iadeleri buradan yönetin"
        actions={
          <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800">
            <span>{rows.length} bekleyen</span>
          </div>
        }
      />

      {isLoading ? <LoadingState /> : rows.length === 0 ? (
        <EmptyState icon={<Check className="h-12 w-12" />} title="Onay bekleyen iade yok" description="Tüm iadeler işlenmiş durumda." />
      ) : (
        <>
          <DataTable<ReturnListItem> columns={columns} data={rows} rowKey={(r) => r.id} onRowClick={(r) => navigate(`/returns/${r.id}`)} />
          <MobileCardList<ReturnListItem>
            data={rows}
            keyFn={(r) => r.id}
            onItemClick={(r) => navigate(`/returns/${r.id}`)}
            header={(r) => r.returnNumber}
            subtitle={(r) => `${r.customerName} • ${formatDate(r.returnDate)}`}
            rightBadge={(r) => <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">{ReturnStatusLabel.PENDING}</span>}
            footer={(r) => (
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">{r.itemCount} kalem</span>
                <span className="font-semibold">{formatCurrency(r.grandTotal, r.currency)}</span>
              </div>
            )}
          />
        </>
      )}

      <ConfirmModal
        open={!!confirmApprove}
        title="İade onaylansın mı?"
        description={`${confirmApprove?.returnNumber} numaralı iade onaylanacak. Onay sonrası tamamlama adımı uygulanabilir.`}
        confirmText="Onayla"
        variant="info"
        onConfirm={async () => {
          if (confirmApprove) {
            await approveOne(confirmApprove.id);
            setConfirmApprove(null);
            refetch();
          }
        }}
        onClose={() => setConfirmApprove(null)}
      />
    </div>
  );
}

function RejectInlineButton({ onConfirm }: { onConfirm: (reason: string) => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 rounded-md border border-red-600 px-2 py-1 text-xs font-medium text-red-600" title="Reddet">
        <X className="h-3 w-3" /> Reddet
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-surface p-5 shadow-xl">
            <h3 className="mb-3 text-lg font-semibold">İade reddedilsin</h3>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Red nedeni en az 3 karakter olmalı..." className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => { setOpen(false); setReason(''); }} className="rounded-md border border-outline px-3 py-1.5 text-sm">Vazgeç</button>
              <button
                onClick={async () => { if (reason.trim().length >= 3) { await onConfirm(reason); setOpen(false); setReason(''); } }}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
                disabled={reason.trim().length < 3}
              >
                Reddet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
