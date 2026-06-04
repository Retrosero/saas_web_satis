import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Plus, Eye, Pencil, Trash2, Play, Filter } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useCampaigns, useDeleteCampaign } from '@/features/pricing/api';
import { CampaignStatusLabel, CampaignTypeLabel, DiscountTypeLabel, formatCurrency, formatDate, type Campaign, type CampaignStatus } from '@saas/shared';

const STATUS_COLOR: Record<CampaignStatus, string> = {
  DRAFT: 'bg-gray-200 text-gray-700', ACTIVE: 'bg-green-100 text-green-800', PASSIVE: 'bg-amber-100 text-amber-800', EXPIRED: 'bg-red-100 text-red-800', CANCELLED: 'bg-red-200 text-red-900',
};

export function CampaignsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [confirmDelete, setConfirmDelete] = useState<Campaign | null>(null);
  const { data: campaigns = [], isLoading, error, refetch } = useCampaigns({ status: statusFilter !== 'all' ? statusFilter : undefined });
  const delMut = useDeleteCampaign();

  const columns: DataTableColumn<Campaign>[] = [
    { key: 'code', label: 'Kod', width: '150px', render: (c) => <span className="font-mono font-semibold">{c.code}</span> },
    { key: 'name', label: 'Ad', render: (c) => <span className="font-semibold">{c.name}</span> },
    { key: 'campaignType', label: 'Tip', width: '150px', hideOnMobile: true, render: (c) => CampaignTypeLabel[c.campaignType] },
    { key: 'period', label: 'Tarih', width: '200px', hideOnMobile: true, render: (c) => `${formatDate(c.startDate)} → ${formatDate(c.endDate)}` },
    { key: 'discount', label: 'İskonto', width: '130px', render: (c) => c.discountType === 'PERCENT' ? <span>%{c.discountRate}</span> : <span>{formatCurrency(c.discountAmount)}</span> },
    { key: 'usage', label: 'Kullanım', width: '100px', align: 'right', render: (c) => c.maxUsageCount > 0 ? `${c.usageCount}/${c.maxUsageCount}` : `${c.usageCount}` },
    { key: 'status', label: 'Durum', width: '120px', render: (c) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[c.status]}`}>{CampaignStatusLabel[c.status]}</span> },
    {
      key: 'actions', label: '', width: '160px', render: (c) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => navigate(`/pricing/campaigns/${c.id}/test`)} className="rounded-md p-1.5 text-primary hover:bg-primary-container/40" title="Test Et"><Play className="h-4 w-4" /></button>
          <button onClick={() => navigate(`/pricing/campaigns/${c.id}/edit`)} className="rounded-md p-1.5 text-primary hover:bg-primary-container/40"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setConfirmDelete(c)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message="Kampanyalar yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader title="Kampanyalar" description="Ürün/marka/kategori/müşteri grubu bazlı kampanyalar" actions={<button onClick={() => navigate('/pricing/campaigns/new')} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Plus className="h-4 w-4" /> Yeni Kampanya</button>} />

      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        <div className="w-[180px]">
          <label className="mb-1 block text-xs font-medium">Durum</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
            <option value="all">Tümü</option>
            <option value="DRAFT">Taslak</option>
            <option value="ACTIVE">Aktif</option>
            <option value="PASSIVE">Pasif</option>
            <option value="EXPIRED">Süresi Doldu</option>
            <option value="CANCELLED">İptal</option>
          </select>
        </div>
      </div>

      {isLoading ? <LoadingState /> : campaigns.length === 0 ? (
        <EmptyState icon={<Megaphone className="h-12 w-12" />} title="Henüz kampanya yok" description="İlk kampanyanızı oluşturarak başlayın" action={<button onClick={() => navigate('/pricing/campaigns/new')} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">Yeni Kampanya</button>} />
      ) : (
        <>
          <DataTable<Campaign> columns={columns} data={campaigns} rowKey={(c) => c.id} onRowClick={(c) => navigate(`/pricing/campaigns/${c.id}/edit`)} />
          <MobileCardList<Campaign> data={campaigns} keyFn={(c) => c.id} onItemClick={(c) => navigate(`/pricing/campaigns/${c.id}/edit`)} header={(c) => `${c.code} - ${c.name}`} subtitle={(c) => `${formatDate(c.startDate)} → ${formatDate(c.endDate)}`} rightBadge={(c) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[c.status]}`}>{CampaignStatusLabel[c.status]}</span>} footer={(c) => <span className="text-xs">{c.discountType === 'PERCENT' ? `%${c.discountRate} iskonto` : `${formatCurrency(c.discountAmount)} iskonto`} • {c.usageCount} kullanım</span>} />
        </>
      )}

      <ConfirmModal open={!!confirmDelete} title="Kampanya Silinsin mi?" description={`${confirmDelete?.code} - ${confirmDelete?.name} silinecek.`} confirmText="Sil" variant="danger" onClose={() => setConfirmDelete(null)} onConfirm={async () => { if (confirmDelete) { await delMut.mutateAsync(confirmDelete.id); setConfirmDelete(null); } }} />
    </div>
  );
}
