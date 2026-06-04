import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Save, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { useHelpArticle, useCreateArticle, useUpdateArticle } from '@/features/assistant/api';
import { HelpContentTypeLabel, type HelpContentType } from '@saas/shared';

const MODULE_OPTIONS = ['cari', 'urun', 'stok', 'satis', 'siparis', 'tahsilat', 'kasa', 'depo', 'iade', 'banka', 'pos', 'portal', 'import', 'api', 'webhook', 'sistem'];

export function AssistantArticleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const { data: existing, isLoading } = useHelpArticle(id ?? '');
  const createMut = useCreateArticle();
  const updateMut = useUpdateArticle(id ?? '');

  const [module, setModule] = useState('cari');
  const [page, setPage] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<HelpContentType>('MODULE');
  const [permissionKey, setPermissionKey] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'PASSIVE'>('ACTIVE');

  useEffect(() => {
    if (existing && isEdit) {
      setModule(existing.module); setPage(existing.page ?? '');
      setTitle(existing.title); setContent(existing.content);
      setContentType(existing.contentType); setPermissionKey(existing.permissionKey ?? '');
      setStatus(existing.status);
    }
  }, [existing, isEdit]);

  if (isLoading && isEdit) return <LoadingState />;

  const submit = async () => {
    if (!title || !content) return;
    const payload = {
      module, page: page || undefined, title, content, contentType,
      permissionKey: permissionKey || undefined, status,
    };
    if (isEdit) await updateMut.mutateAsync(payload);
    else await createMut.mutateAsync(payload);
    navigate('/assistant/articles');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={isEdit ? 'Yardım İçeriği Düzenle' : 'Yeni Yardım İçeriği'}
        description="Modül, sayfa, buton açıklaması veya SSS yazın"
        actions={<button onClick={() => navigate('/assistant/articles')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" /> Geri</button>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-3 rounded-lg border border-outline-variant bg-surface p-4">
          <div><label className="mb-1 block text-xs font-medium">Başlık *</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
          <div>
            <label className="mb-1 block text-xs font-medium">İçerik * (Markdown desteklenir)</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={14} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" placeholder="# Başlık&#10;&#10;Bu bir SSS içeriğidir. Markdown kullanabilirsiniz." />
          </div>
        </div>
        <div className="space-y-3 rounded-lg border border-outline-variant bg-surface p-4">
          <div>
            <label className="mb-1 block text-xs font-medium">İçerik Tipi *</label>
            <select value={contentType} onChange={(e) => setContentType(e.target.value as HelpContentType)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
              {Object.entries(HelpContentTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Modül *</label>
            <select value={module} onChange={(e) => setModule(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
              {MODULE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Sayfa (opsiyonel)</label>
            <input value={page} onChange={(e) => setPage(e.target.value)} placeholder="/customers/new" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" />
            <p className="mt-1 text-xs text-on-surface-variant">Boş bırakırsanız tüm sayfalar için geçerli</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Yetki Anahtarı</label>
            <input value={permissionKey} onChange={(e) => setPermissionKey(e.target.value)} placeholder="cari:write" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" />
            <p className="mt-1 text-xs text-on-surface-variant">Sadece bu yetkiye sahip kullanıcılar görebilir</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Durum</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
              <option value="ACTIVE">Aktif</option>
              <option value="PASSIVE">Pasif</option>
            </select>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={() => navigate('/assistant/articles')} className="rounded-md border border-outline px-4 py-2 text-sm">İptal</button>
        <button onClick={submit} disabled={!title || !content || createMut.isPending || updateMut.isPending} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-40">
          <Save className="h-4 w-4" /> {isEdit ? 'Güncelle' : 'Kaydet'}
        </button>
      </div>
    </div>
  );
}
