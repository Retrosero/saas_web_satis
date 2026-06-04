import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTree, Plus, Eye, Pencil, Trash2, Filter, Copy, Download, Upload } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { usePriceLists, useDeletePriceList } from '@/features/pricing/api';
import { PriceListStatusLabel, formatDate, formatDateTime, type PriceList, type PriceListStatus } from '@saas/shared';

const STATUS_COLOR: Record<PriceListStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800', PASSIVE: 'bg-gray-200 text-gray-700', EXPIRED: 'bg-red-100 text-red-800', DRAFT: 'bg-amber-100 text-amber-800',
};

export function PriceListsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PriceListStatus | 'all'>('all');
  const [confirmDelete, setConfirmDelete] = useState<PriceList | null>(null);

  const { data: lists = [], isLoading, error, refetch } = usePriceLists({
    search: search || undefined, status: statusFilter !== 'all' ? statusFilter : undefined,
  });
  const delMut = useDeletePriceList();

  const columns: DataTableColumn<PriceList>[] = [
    { key: 'code', label: 'Kod', width: '140px', render: (l) => <span className="font-mono font-semibold">{l.code}</span> },
    { key: 'name', label: 'Ad', render: (l) => <span className="font-semibold">{l.name}</span> },
    { key: 'currency', label: 'PB', width: '70px', render: (l) => l.currency },
    { key: 'validFrom', label: 'Başlangıç', width: '110px', hideOnMobile: true, render: (l) => l.validFrom ? formatDate(l.validFrom) : '—' },
    { key: 'validTo', label: 'Bitiş', width: '110px', hideOnMobile: true, render: (l) => l.validTo ? formatDate(l.validTo) : '—' },
    { key: 'itemCount', label: 'Ürün', width: '80px', align: 'right', render: (l) => l.itemCount },
    { key: 'status', label: 'Durum', width: '110px', render: (l) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[l.status]}`}>{PriceListStatusLabel[l.status]}</span> },
    { key: 'updatedAt', label: 'Son Güncelleme', width: '150px', hideOnMobile: true, render: (l) => formatDateTime(l.updatedAt) },
    {
      key: 'actions', label: '', width: '160px', render: (l) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => navigate(`/pricing/price-lists/${l.id}`)} className="rounded-md p-1.5 text-primary hover:bg-primary-container/40"><Eye className="h-4 w-4" /></button>
          <button onClick={() => navigate(`/pricing/price-lists/${l.id}/edit`)} className="rounded-md p-1.5 text-primary hover:bg-primary-container/40"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setConfirmDelete(l)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message="Fiyat listeleri yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Fiyat Listeleri"
        description="Müşteri gruplarına özel fiyat listeleri"
        actions={
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><Download className="h-4 w-4" /> Excel'e Aktar</button>
            <button className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><Upload className="h-4 w-4" /> Excel'den Yükle</button>
            <button onClick={() => navigate('/pricing/price-lists/new')} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Plus className="h-4 w-4" /> Yeni</button>
          </div>
        }
      />

      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]"><label className="mb-1 block text-xs font-medium">Arama</label><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kod veya ad..." className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
          <div className="w-[150px]"><label className="mb-1 block text-xs font-medium">Durum</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm"><option value="all">Tümü</option><option value="DRAFT">Taslak</option><option value="ACTIVE">Aktif</option><option value="PASSIVE">Pasif</option><option value="EXPIRED">Süresi Doldu</option></select></div>
          <button onClick={() => { setSearch(''); setStatusFilter('all'); }} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><Filter className="h-4 w-4" /> Temizle</button>
        </div>
      </div>

      {isLoading ? <LoadingState /> : lists.length === 0 ? (
        <EmptyState icon={<ListTree className="h-12 w-12" />} title="Henüz fiyat listesi yok" description="İlk listenizi oluşturarak başlayın" action={<button onClick={() => navigate('/pricing/price-lists/new')} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">Yeni Fiyat Listesi</button>} />
      ) : (
        <>
          <DataTable<PriceList> columns={columns} data={lists} rowKey={(l) => l.id} onRowClick={(l) => navigate(`/pricing/price-lists/${l.id}`)} />
          <MobileCardList<PriceList> data={lists} keyFn={(l) => l.id} onItemClick={(l) => navigate(`/pricing/price-lists/${l.id}`)} header={(l) => `${l.code} - ${l.name}`} subtitle={(l) => `${l.itemCount} ürün • ${l.currency}`} rightBadge={(l) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[l.status]}`}>{PriceListStatusLabel[l.status]}</span>} footer={(l) => <span className="text-xs text-on-surface-variant">{l.updatedAt ? `Güncellendi: ${formatDateTime(l.updatedAt)}` : ''}</span>} />
        </>
      )}

      <ConfirmModal open={!!confirmDelete} title="Fiyat Listesi Silinsin mi?" description={`${confirmDelete?.code} - ${confirmDelete?.name} silinecek.`} confirmText="Sil" variant="danger" onClose={() => setConfirmDelete(null)} onConfirm={async () => { if (confirmDelete) { await delMut.mutateAsync(confirmDelete.id); setConfirmDelete(null); } }} />
    </div>
  );
}
