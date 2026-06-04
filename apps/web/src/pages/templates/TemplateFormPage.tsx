import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, Save, ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { useTemplate, useCreateTemplate, useUpdateTemplate, useTemplateVariables } from '@/features/templates/api';
import { DocumentTypeLabel, PageFormatLabel, type DocumentType, type PageFormat, type TemplateSection } from '@saas/shared';

const SECTION_TYPES: Array<{ type: TemplateSection['type']; label: string; defaultContent?: string }> = [
  { type: 'LOGO', label: 'Logo' },
  { type: 'COMPANY_INFO', label: 'Firma Bilgileri' },
  { type: 'HEADER', label: 'Üst Bilgi' },
  { type: 'CUSTOMER_INFO', label: 'Cari Bilgileri' },
  { type: 'DOCUMENT_INFO', label: 'Belge Bilgileri' },
  { type: 'ITEMS_TABLE', label: 'Ürün/Hizmet Tablosu' },
  { type: 'TOTALS', label: 'Toplamlar' },
  { type: 'TAX_INFO', label: 'KDV Bilgileri' },
  { type: 'DISCOUNT_INFO', label: 'İskonto Bilgileri' },
  { type: 'NOTES', label: 'Notlar' },
  { type: 'SIGNATURE', label: 'İmza Alanı' },
  { type: 'QR_BARCODE', label: 'QR / Barkod' },
  { type: 'FOOTER', label: 'Alt Bilgi' },
  { type: 'CUSTOM_TEXT', label: 'Özel Metin' },
];

export function TemplateFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const { data: existing, isLoading } = useTemplate(id ?? '');
  const createMut = useCreateTemplate();
  const updateMut = useUpdateTemplate(id ?? '');
  const { data: varData } = useTemplateVariables();

  const [name, setName] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('SALE');
  const [language, setLanguage] = useState('tr');
  const [pageFormat, setPageFormat] = useState<PageFormat>('A4_PORTRAIT');
  const [customWidth, setCustomWidth] = useState<number | ''>('');
  const [customHeight, setCustomHeight] = useState<number | ''>('');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [sections, setSections] = useState<TemplateSection[]>([]);

  useEffect(() => {
    if (existing && isEdit) {
      setName(existing.name); setDocumentType(existing.documentType); setLanguage(existing.language);
      setPageFormat(existing.pageFormat);
      setCustomWidth(existing.customWidth ?? ''); setCustomHeight(existing.customHeight ?? '');
      setIsDefault(existing.isDefault); setIsActive(existing.isActive);
      setSections(existing.sections);
    }
  }, [existing, isEdit]);

  if (isLoading && isEdit) return <LoadingState />;

  const addSection = (type: TemplateSection['type']) => {
    setSections([...sections, { id: `tmp-${Date.now()}`, type, enabled: true, order: sections.length, content: SECTION_TYPES.find((s) => s.type === type)?.defaultContent }]);
  };
  const removeSection = (id: string) => setSections(sections.filter((s) => s.id !== id));
  const moveSection = (idx: number, dir: -1 | 1) => {
    const ns = [...sections];
    const t = idx + dir;
    if (t < 0 || t >= ns.length) return;
    [ns[idx], ns[t]] = [ns[t], ns[idx]];
    ns.forEach((s, i) => (s.order = i));
    setSections(ns);
  };
  const updateSection = (id: string, patch: Partial<TemplateSection>) => setSections(sections.map((s) => s.id === id ? { ...s, ...patch } : s));

  const submit = async () => {
    if (!name) return;
    const payload: any = {
      name, documentType, language, pageFormat,
      customWidth: customWidth === '' ? undefined : Number(customWidth),
      customHeight: customHeight === '' ? undefined : Number(customHeight),
      isDefault, isActive, sections,
    };
    if (isEdit) await updateMut.mutateAsync(payload);
    else await createMut.mutateAsync(payload);
    navigate('/templates');
  };

  return (
    <div className="space-y-4">
      <PageHeader title={isEdit ? 'Şablon Düzenle' : 'Yeni Şablon'} description="Blok-bazlı görsel düzenleyici" actions={
        <div className="flex gap-2">
          <button onClick={() => navigate('/templates')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" /> Geri</button>
          {isEdit && <button onClick={() => navigate(`/templates/${id}/preview`)} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><Eye className="h-4 w-4" /> Ön İzle</button>}
          <button onClick={submit} disabled={!name} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary disabled:opacity-40"><Save className="h-4 w-4" /> Kaydet</button>
        </div>
      } />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-3 rounded-lg border border-outline-variant bg-surface p-4">
          <h3 className="text-sm font-semibold">Şablon Bilgileri</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-medium">Ad *</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Belge Tipi *</label><select value={documentType} onChange={(e) => setDocumentType(e.target.value as DocumentType)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">{Object.entries(DocumentTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div><label className="mb-1 block text-xs font-medium">Dil</label><select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm"><option value="tr">Türkçe</option><option value="en">English</option></select></div>
            <div><label className="mb-1 block text-xs font-medium">Sayfa</label><select value={pageFormat} onChange={(e) => setPageFormat(e.target.value as PageFormat)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">{Object.entries(PageFormatLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            {pageFormat === 'CUSTOM' && (
              <>
                <div><label className="mb-1 block text-xs font-medium">Genişlik (mm)</label><input type="number" min="1" value={customWidth} onChange={(e) => setCustomWidth(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
                <div><label className="mb-1 block text-xs font-medium">Yükseklik (mm)</label><input type="number" min="1" value={customHeight} onChange={(e) => setCustomHeight(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
              </>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface p-4">
          <h3 className="mb-2 text-sm font-semibold">Ayarlar</h3>
          <label className="flex items-center gap-2 text-sm mb-2"><input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} /> Varsayılan Şablon</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Aktif</label>
        </div>
      </div>

      {/* Sections */}
      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Bölümler ({sections.length})</h3>
          <div className="flex flex-wrap gap-1">
            {SECTION_TYPES.map((s) => (
              <button key={s.type} onClick={() => addSection(s.type)} className="rounded border border-outline bg-surface px-2 py-1 text-xs hover:bg-surface-variant">
                <Plus className="inline h-3 w-3" /> {s.label}
              </button>
            ))}
          </div>
        </div>
        {sections.length === 0 ? <p className="py-4 text-center text-sm text-on-surface-variant">Henüz bölüm eklenmedi</p> : (
          <div className="space-y-2">
            {sections.map((s, idx) => {
              const typeLabel = SECTION_TYPES.find((st) => st.type === s.type)?.label;
              return (
                <div key={s.id} className="rounded-md border border-outline-variant p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={s.enabled} onChange={(e) => updateSection(s.id, { enabled: e.target.checked })} />
                      <span className="font-semibold text-sm">{typeLabel}</span>
                      <span className="text-xs text-on-surface-variant">#{idx + 1}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveSection(idx, -1)} className="rounded p-1 text-on-surface-variant hover:bg-surface-variant"><ChevronUp className="h-3 w-3" /></button>
                      <button onClick={() => moveSection(idx, 1)} className="rounded p-1 text-on-surface-variant hover:bg-surface-variant"><ChevronDown className="h-3 w-3" /></button>
                      <button onClick={() => removeSection(s.id)} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                  {s.type === 'CUSTOM_TEXT' && (
                    <textarea value={s.content ?? ''} onChange={(e) => updateSection(s.id, { content: e.target.value })} rows={3} placeholder="HTML/metin içerik" className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm font-mono" />
                  )}
                  {s.type === 'LOGO' && (
                    <select value={(s.config as any)?.position ?? 'left'} onChange={(e) => updateSection(s.id, { config: { ...(s.config ?? {}), position: e.target.value } })} className="rounded-md border border-outline bg-surface px-2 py-1.5 text-sm">
                      <option value="left">Sol</option>
                      <option value="center">Orta</option>
                      <option value="right">Sağ</option>
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Variables reference */}
      {varData && (
        <div className="rounded-lg border border-outline-variant bg-surface p-4">
          <h3 className="mb-2 text-sm font-semibold">Kullanılabilir Değişkenler</h3>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {varData.categories.map((cat) => (
              <div key={cat}>
                <p className="text-xs font-semibold text-on-surface-variant">{cat}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {varData.variables.filter((v) => v.category === cat).map((v) => (
                    <code key={v.key} className="rounded bg-surface-variant px-1.5 py-0.5 text-[10px]" title={v.label}>{`{{${v.key}}}`}</code>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
