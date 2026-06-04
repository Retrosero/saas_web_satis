import { useNavigate } from 'react-router-dom';
import { FileText, Pencil, Trash2, Star, Play } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useState } from 'react';
import { useReportTemplates, useDeleteReportTemplate, useToggleFavorite } from '@/features/reports/api';
import { ChartTypeLabel, formatDateTime, type ReportTemplate } from '@saas/shared';

export function ReportTemplatesPage() {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState<ReportTemplate | null>(null);
  const { data: templates = [], isLoading, error, refetch } = useReportTemplates();
  const delMut = useDeleteReportTemplate();
  const favMut = useToggleFavorite();

  const columns: DataTableColumn<ReportTemplate>[] = [
    { key: 'name', label: 'Ad', render: (t) => <span className="font-semibold">{t.name}</span> },
    { key: 'chartType', label: 'Grafik', width: '100px', hideOnMobile: true, render: (t) => ChartTypeLabel[t.chartType] },
    { key: 'share', label: 'Paylaşım', width: '130px', hideOnMobile: true, render: (t) => t.shareScope === 'PRIVATE' ? 'Sadece Ben' : t.shareScope === 'ALL_TENANT' ? 'Tüm Firma' : 'Belirli' },
    { key: 'runCount', label: 'Çalıştırma', width: '110px', align: 'right', render: (t) => t.runCount },
    { key: 'lastRunAt', label: 'Son', width: '150px', hideOnMobile: true, render: (t) => t.lastRunAt ? formatDateTime(t.lastRunAt) : '—' },
    {
      key: 'actions', label: '', width: '160px', render: (t) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => navigate('/reports/designer', { state: { template: t } })} className="rounded-md p-1.5 text-primary hover:bg-primary-container/40" title="Düzenle/Çalıştır"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => favMut.mutate(t.id)} className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50" title="Favori"><Star className={`h-4 w-4 ${t.isFavorite ? 'fill-current' : ''}`} /></button>
          <button onClick={() => setConfirmDelete(t)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50" title="Sil"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message="Şablonlar yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kayıtlı Rapor Şablonları"
        description="Pivot tasarımcıda oluşturduğunuz raporlar"
        actions={
          <button onClick={() => navigate('/reports/designer')} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary">
            <Play className="h-4 w-4" /> Yeni Rapor
          </button>
        }
      />
      {isLoading ? <LoadingState /> : templates.length === 0 ? (
        <EmptyState icon={<FileText className="h-12 w-12" />} title="Henüz rapor şablonu yok" description="Pivot tasarımcıda ilk raporunuzu oluşturun" action={<button onClick={() => navigate('/reports/designer')} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">Pivot Tasarımcısı</button>} />
      ) : (
        <>
          <DataTable<ReportTemplate> columns={columns} data={templates} rowKey={(t) => t.id} onRowClick={(t) => navigate('/reports/designer', { state: { template: t } })} />
          <MobileCardList<ReportTemplate> data={templates} keyFn={(t) => t.id} onItemClick={(t) => navigate('/reports/designer', { state: { template: t } })} header={(t) => t.name} subtitle={(t) => `${ChartTypeLabel[t.chartType]} • ${t.runCount} çalıştırma`} rightBadge={(_t) => _t.isFavorite ? <Star className="h-4 w-4 fill-amber-400 text-amber-500" /> : null} footer={(t) => <span className="text-xs text-on-surface-variant">{t.lastRunAt ? `Son: ${formatDateTime(t.lastRunAt)}` : 'Hiç çalıştırılmadı'}</span>} />
        </>
      )}

      <ConfirmModal open={!!confirmDelete} title="Şablon Silinsin mi?" description={`${confirmDelete?.name} silinecek.`} confirmText="Sil" variant="danger" onClose={() => setConfirmDelete(null)} onConfirm={async () => { if (confirmDelete) { await delMut.mutateAsync(confirmDelete.id); setConfirmDelete(null); } }} />
    </div>
  );
}
