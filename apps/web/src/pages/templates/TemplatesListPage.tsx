import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Eye, Pencil, Copy, Star, Trash2, Filter, Printer } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useTemplates, useDeleteTemplate, useSetTemplateDefault, useDuplicateTemplate } from '@/features/templates/api';
import { DocumentTypeLabel, PageFormatLabel, formatDateTime, type DocumentTemplate, type DocumentType } from '@saas/shared';

export function TemplatesListPage() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [confirmDelete, setConfirmDelete] = useState<DocumentTemplate | null>(null);
  const { data: templates = [], isLoading, error, refetch } = useTemplates({ documentType: typeFilter !== 'all' ? typeFilter : undefined });
  const delMut = useDeleteTemplate();
  const defaultMut = useSetTemplateDefault();
  const dupMut = useDuplicateTemplate();

  const columns: DataTableColumn<DocumentTemplate>[] = [
    { key: 'name', label: 'Şablon Adı', render: (t) => <div className="flex items-center gap-2"><span className="font-semibold">{t.name}</span>{t.isDefault && <Star className="h-3 w-3 fill-amber-400 text-amber-500" />}{t.tenantId === null && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-800">GLOBAL</span>}</div> },
    { key: 'documentType', label: 'Belge Tipi', width: '160px', hideOnMobile: true, render: (t) => DocumentTypeLabel[t.documentType] },
    { key: 'language', label: 'Dil', width: '70px', render: (t) => t.language.toUpperCase() },
    { key: 'pageFormat', label: 'Sayfa', width: '130px', hideOnMobile: true, render: (t) => PageFormatLabel[t.pageFormat] },
    { key: 'sections', label: 'Bölüm', width: '80px', align: 'right', render: (t) => t.sections.length },
    { key: 'isActive', label: 'Durum', width: '90px', render: (t) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{t.isActive ? 'Aktif' : 'Pasif'}</span> },
    { key: 'updatedAt', label: 'Son Güncelleme', width: '150px', hideOnMobile: true, render: (t) => formatDateTime(t.updatedAt) },
    {
      key: 'actions', label: '', width: '200px', render: (t) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => navigate(`/templates/${t.id}/preview`)} className="rounded-md p-1.5 text-primary hover:bg-primary-container/40" title="Ön İzle"><Eye className="h-4 w-4" /></button>
          <button onClick={() => navigate(`/templates/${t.id}/edit`)} className="rounded-md p-1.5 text-primary hover:bg-primary-container/40"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => dupMut.mutate(t.id)} className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50" title="Kopyala"><Copy className="h-4 w-4" /></button>
          {!t.isDefault && <button onClick={() => defaultMut.mutate(t.id)} className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50" title="Varsayılan Yap"><Star className="h-4 w-4" /></button>}
          <button onClick={() => setConfirmDelete(t)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message="Şablonlar yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader title="Belge Şablonları" description="PDF ve yazdırma şablonları" actions={<button onClick={() => navigate('/templates/new')} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Plus className="h-4 w-4" /> Yeni Şablon</button>} />

      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        <div className="w-[220px]">
          <label className="mb-1 block text-xs font-medium">Belge Tipi</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
            <option value="all">Tümü</option>
            {Object.entries(DocumentTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? <LoadingState /> : templates.length === 0 ? (
        <EmptyState icon={<FileText className="h-12 w-12" />} title="Henüz şablon yok" description="İlk şablonunuzu oluşturun" action={<button onClick={() => navigate('/templates/new')} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">Yeni Şablon</button>} />
      ) : (
        <>
          <DataTable<DocumentTemplate> columns={columns} data={templates} rowKey={(t) => t.id} onRowClick={(t) => navigate(`/templates/${t.id}/edit`)} />
          <MobileCardList<DocumentTemplate> data={templates} keyFn={(t) => t.id} onItemClick={(t) => navigate(`/templates/${t.id}/edit`)} header={(t) => t.name} subtitle={(t) => `${DocumentTypeLabel[t.documentType]} • ${t.sections.length} bölüm`} rightBadge={(t) => t.isDefault ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Varsayılan</span> : null} footer={(t) => <span className="text-xs text-on-surface-variant">{PageFormatLabel[t.pageFormat]}</span>} />
        </>
      )}

      <ConfirmModal open={!!confirmDelete} title="Şablon Silinsin mi?" description={`${confirmDelete?.name} silinecek.`} confirmText="Sil" variant="danger" onClose={() => setConfirmDelete(null)} onConfirm={async () => { if (confirmDelete) { await delMut.mutateAsync(confirmDelete.id); setConfirmDelete(null); } }} />
    </div>
  );
}
