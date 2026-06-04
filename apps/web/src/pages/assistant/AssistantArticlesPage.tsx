import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Pencil, Trash2, Search, Filter, Eye, Brain, Wrench, MessageCircle, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useHelpArticles, useDeleteArticle } from '@/features/assistant/api';
import { HelpContentTypeLabel, type HelpArticle, type HelpContentType } from '@saas/shared';

const TYPE_ICON: Record<HelpContentType, any> = {
  MODULE: BookOpen, PAGE: Eye, BUTTON: MessageCircle, FAQ: Brain, GUIDE: Wrench, WARNING: AlertTriangle,
};

const TYPE_COLOR: Record<string, string> = {
  MODULE: 'bg-blue-100 text-blue-800', PAGE: 'bg-purple-100 text-purple-800', BUTTON: 'bg-teal-100 text-teal-800',
  FAQ: 'bg-amber-100 text-amber-800', GUIDE: 'bg-green-100 text-green-800', WARNING: 'bg-red-100 text-red-800',
};

export function AssistantArticlesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<HelpContentType | 'all'>('all');
  const [confirmDelete, setConfirmDelete] = useState<HelpArticle | null>(null);

  const { data: articles = [], isLoading, error, refetch } = useHelpArticles({
    search: search || undefined,
    contentType: typeFilter !== 'all' ? typeFilter : undefined,
  });
  const delMut = useDeleteArticle();

  const columns: DataTableColumn<HelpArticle>[] = [
    { key: 'type', label: 'Tip', width: '130px', render: (a) => {
        const Icon = TYPE_ICON[a.contentType];
        return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLOR[a.contentType]}`}><Icon className="h-3 w-3" />{HelpContentTypeLabel[a.contentType]}</span>;
      } },
    { key: 'title', label: 'Başlık', render: (a) => <div><div className="font-semibold">{a.title}</div><div className="text-xs text-on-surface-variant line-clamp-1">{a.content}</div></div> },
    { key: 'module', label: 'Modül', width: '120px', hideOnMobile: true, render: (a) => <code className="text-xs">{a.module}</code> },
    { key: 'page', label: 'Sayfa', width: '180px', hideOnMobile: true, render: (a) => a.page ? <code className="text-xs">{a.page}</code> : <span className="text-on-surface-variant text-xs">Tüm sayfalar</span> },
    { key: 'permissionKey', label: 'Yetki', width: '130px', hideOnMobile: true, render: (a) => a.permissionKey ? <code className="text-xs">{a.permissionKey}</code> : '—' },
    { key: 'viewCount', label: 'Görüntülenme', width: '100px', align: 'right', render: (a) => a.viewCount },
    {
      key: 'actions', label: '', width: '100px', render: (a) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => navigate(`/assistant/articles/${a.id}/edit`)} className="rounded-md p-1.5 text-primary hover:bg-primary-container/40" title="Düzenle"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setConfirmDelete(a)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50" title="Sil"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message="Bilgi tabanı yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Asistan Bilgi Tabanı"
        description="Modül, sayfa, buton açıklamaları ve SSS içerikleri"
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate('/assistant/tools')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm">
              <Wrench className="h-4 w-4" /> Tool Listesi
            </button>
            <button onClick={() => navigate('/assistant/articles/new')} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary">
              <Plus className="h-4 w-4" /> Yeni İçerik
            </button>
          </div>
        }
      />

      <div className="rounded-md border border-blue-300 bg-blue-50 p-3 text-sm text-blue-800">
        ℹ️ Akıllı asistanın chat altyapısı henüz aktif değil. Bu ekrandan sadece bilgi tabanı içeriklerini yönetebilirsiniz. Asistan kullanıcının normalde göremeyeceği veriyi cevaplayamayacak.
      </div>

      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-xs font-medium">Arama</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Başlık veya içerik..." className="w-full rounded-md border border-outline bg-surface pl-10 pr-3 py-2 text-sm" />
            </div>
          </div>
          <div className="w-[180px]">
            <label className="mb-1 block text-xs font-medium">İçerik Tipi</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
              <option value="all">Tümü</option>
              {Object.entries(HelpContentTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? <LoadingState /> : articles.length === 0 ? (
        <EmptyState icon={<BookOpen className="h-12 w-12" />} title="Henüz içerik yok" description="İlk yardım içeriğinizi oluşturun" />
      ) : (
        <>
          <DataTable<HelpArticle> columns={columns} data={articles} rowKey={(a) => a.id} onRowClick={(a) => navigate(`/assistant/articles/${a.id}/edit`)} />
          <MobileCardList<HelpArticle>
            data={articles} keyFn={(a) => a.id}
            onItemClick={(a) => navigate(`/assistant/articles/${a.id}/edit`)}
            header={(a) => a.title}
            subtitle={(a) => `${a.module} • ${a.viewCount} görüntülenme`}
            rightBadge={(a) => {
              const Icon = TYPE_ICON[a.contentType];
              return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLOR[a.contentType]}`}><Icon className="h-3 w-3" />{HelpContentTypeLabel[a.contentType]}</span>;
            }}
            footer={(a) => <span className="text-xs text-on-surface-variant line-clamp-1">{a.content}</span>}
          />
        </>
      )}

      <ConfirmModal open={!!confirmDelete} title="İçerik Silinsin mi?" description={`${confirmDelete?.title} silinecek.`} confirmText="Sil" variant="danger" onClose={() => setConfirmDelete(null)} onConfirm={async () => { if (confirmDelete) { await delMut.mutateAsync(confirmDelete.id); setConfirmDelete(null); } }} />
    </div>
  );
}
