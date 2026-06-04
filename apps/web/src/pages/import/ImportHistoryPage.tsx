import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Plus, Undo2, Trash2, FileText, Download } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useImportBatches, useDeleteImport, useRollbackImport } from '@/features/import/api';
import { ImportEntityTypeLabel, ImportSourceLabel, ImportStatusLabel, formatDate, formatDateTime, type ImportBatch, type ImportStatus } from '@saas/shared';

const STATUS_COLOR: Record<ImportStatus, string> = {
  DRAFT: 'bg-gray-200 text-gray-700',
  MAPPING: 'bg-blue-100 text-blue-800',
  PREVIEW: 'bg-purple-100 text-purple-800',
  RUNNING: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-300 text-gray-700',
  ROLLED_BACK: 'bg-orange-100 text-orange-800',
};

export function ImportHistoryPage() {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState<ImportBatch | null>(null);
  const [confirmRollback, setConfirmRollback] = useState<ImportBatch | null>(null);
  const { data: batches = [], isLoading, error, refetch } = useImportBatches();
  const del = useDeleteImport();
  const rollback = useRollbackImport('');

  const columns: DataTableColumn<ImportBatch>[] = [
    { key: 'name', label: 'Aktarım Adı', render: (b) => <span className="font-semibold">{b.name}</span> },
    { key: 'source', label: 'Kaynak', width: '110px', hideOnMobile: true, render: (b) => ImportSourceLabel[b.source] },
    { key: 'entityType', label: 'Veri Tipi', width: '160px', hideOnMobile: true, render: (b) => ImportEntityTypeLabel[b.entityType] },
    { key: 'rowCount', label: 'Satır', width: '80px', align: 'right', render: (b) => b.rowCount },
    {
      key: 'results', label: 'Sonuç', width: '180px', render: (b) => (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-green-700">✓ {b.successCount}</span>
          <span className="text-amber-700">~ {b.duplicateCount}</span>
          <span className="text-red-700">✗ {b.errorCount}</span>
        </div>
      ),
    },
    { key: 'status', label: 'Durum', width: '130px', render: (b) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[b.status]}`}>{ImportStatusLabel[b.status]}</span> },
    { key: 'createdAt', label: 'Tarih', width: '140px', hideOnMobile: true, render: (b) => formatDateTime(b.createdAt) },
    {
      key: 'actions', label: '', width: '110px', render: (b) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {b.status === 'COMPLETED' && (
            <button onClick={() => setConfirmRollback(b)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50" title="Geri Al"><Undo2 className="h-4 w-4" /></button>
          )}
          <button onClick={() => setConfirmDelete(b)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50" title="Sil"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message="Geçmiş yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Aktarım Geçmişi"
        description="Tüm veri taşıma işlemlerinin listesi"
        actions={
          <button onClick={() => navigate('/import/wizard')} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary">
            <Plus className="h-4 w-4" /> Yeni Aktarım
          </button>
        }
      />

      {isLoading ? <LoadingState /> : batches.length === 0 ? (
        <EmptyState icon={<History className="h-12 w-12" />} title="Henüz aktarım yok" description="Veri taşımaya başlamak için 'Yeni Aktarım' butonunu kullanın" action={<button onClick={() => navigate('/import/wizard')} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">Yeni Aktarım</button>} />
      ) : (
        <>
          <DataTable<ImportBatch> columns={columns} data={batches} rowKey={(b) => b.id} onRowClick={(b) => navigate(`/import/wizard/${b.id}`)} />
          <MobileCardList<ImportBatch>
            data={batches}
            keyFn={(b) => b.id}
            onItemClick={(b) => navigate(`/import/wizard/${b.id}`)}
            header={(b) => b.name}
            subtitle={(b) => `${ImportEntityTypeLabel[b.entityType]} • ${b.rowCount} satır`}
            rightBadge={(b) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[b.status]}`}>{ImportStatusLabel[b.status]}</span>}
            footer={(b) => <div className="flex justify-between text-xs"><span className="text-on-surface-variant">{formatDate(b.createdAt)}</span><span className="font-medium"><span className="text-green-700">{b.successCount}✓</span> {b.errorCount > 0 && <span className="text-red-700">{b.errorCount}✗</span>}</span></div>}
          />
        </>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title="Aktarım Silinsin mi?"
        description={`${confirmDelete?.name} silinecek.`}
        confirmText="Sil"
        variant="danger"
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete) {
            await del.mutateAsync(confirmDelete.id);
            setConfirmDelete(null);
          }
        }}
      />

      <ConfirmModal
        open={!!confirmRollback}
        title="Aktarım Geri Alınsın mı?"
        description={`${confirmRollback?.name} aktarımı geri alınacak — tüm eklenen kayıtlar soft delete yapılacak.`}
        confirmText="Geri Al"
        variant="danger"
        onClose={() => setConfirmRollback(null)}
        onConfirm={async () => {
          if (confirmRollback) {
            const m = useRollbackImport(confirmRollback.id);
            const r = await m.mutateAsync();
            setConfirmRollback(null);
            alert(`${r.deleted} kayıt silindi.`);
          }
        }}
      />
    </div>
  );
}
