import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Layers, Eye, Sparkles, CheckCircle2, X, Building } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useTemplates, useApplyTemplate, usePreviewApply } from '@/features/industry-templates/api';

const TEMPLATE_COLORS: Record<string, string> = {
  wholesale: 'bg-blue-100 border-blue-300', toys: 'bg-pink-100 border-pink-300', food: 'bg-amber-100 border-amber-300',
  textile: 'bg-purple-100 border-purple-300', hardware: 'bg-gray-100 border-gray-300',
  stationery: 'bg-yellow-100 border-yellow-300', warehouse: 'bg-green-100 border-green-300', field_sales: 'bg-cyan-100 border-cyan-300',
};

export function IndustryTemplatesPage() {
  const navigate = useNavigate();
  const { data: templates = [], isLoading } = useTemplates();
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const applyMut = useApplyTemplate();

  return (
    <div className="space-y-4">
      <PageHeader title="Sektör Şablonları" description="8 hazır şablon — hızlı başlangıç için"
        actions={<button onClick={() => navigate('/industry-templates/applied')} className="rounded-md border border-outline px-3 py-2 text-sm">Uygulananlar</button>}
      />

      {isLoading ? <LoadingState /> : templates.length === 0 ? <EmptyState icon={<Layers className="h-12 w-12" />} title="Şablon bulunamadı" /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t: any) => (
            <div key={t.id} className={`rounded-lg border-2 p-4 ${TEMPLATE_COLORS[t.code] ?? 'bg-surface'}`}>
              <div className="flex items-start gap-2">
                <span className="text-4xl">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base">{t.name}</h3>
                  <p className="text-xs text-on-surface-variant">{t.description}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs">
                <p>📦 <strong>{(t.config as any).activeModules?.length ?? 0}</strong> modül</p>
                <p>👥 <strong>{(t.config as any).defaultRoles?.length ?? 0}</strong> rol</p>
                <p>📊 <strong>{(t.config as any).defaultReports?.length ?? 0}</strong> rapor</p>
                <p>🛠️ <strong>{t.usageCount}</strong> kez uygulandı</p>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setPreviewing(t.id)} className="flex-1 rounded-md border border-outline bg-surface px-2 py-1.5 text-xs font-medium"><Eye className="inline h-3 w-3" /> Önizle</button>
                <button onClick={() => setApplying(t.id)} className="flex-1 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-on-primary"><Sparkles className="inline h-3 w-3" /> Uygula</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PreviewModal templateId={previewing} onClose={() => setPreviewing(null)} />
      <ConfirmModal open={!!applying} title="Şablonu Uygula" description="Bu şablon mevcut modülleri aktifleştirecek, yeni roller oluşturacak ve hazır raporları yükleyecek. Devam edilsin mi?" confirmText="Uygula" variant="info" onClose={() => setApplying(null)} onConfirm={async () => { if (applying) { await applyMut.mutateAsync(applying); setApplying(null); navigate('/dashboard'); } }} />
    </div>
  );
}

function PreviewModal({ templateId, onClose }: { templateId: string | null; onClose: () => void }) {
  const { data: preview, isLoading } = usePreviewApply(templateId ?? '');
  if (!templateId) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-surface p-4">
        <div className="flex items-center justify-between"><h3 className="font-semibold">Önizleme</h3><button onClick={onClose}><X className="h-4 w-4" /></button></div>
        {isLoading ? <LoadingState /> : preview ? (
          <div className="mt-3 space-y-2 text-sm">
            <p className="text-xs text-on-surface-variant">Bu şablon uygulandığında:</p>
            <div className="rounded-md border border-green-300 bg-green-50 p-2"><p className="font-semibold">+ {preview.willAddModules?.length} yeni modül</p><p className="text-xs">{preview.willAddModules?.join(', ')}</p></div>
            <div className="rounded-md border border-blue-300 bg-blue-50 p-2"><p className="font-semibold">+ {preview.willCreateRoles?.length} yeni rol</p><p className="text-xs">{preview.willCreateRoles?.join(', ')}</p></div>
            <p className="text-xs">📊 {preview.willApplyReports} rapor, 🎨 {preview.willApplyDashboards} dashboard kartı</p>
          </div>
        ) : null}
        <div className="mt-3 flex justify-end"><button onClick={onClose} className="rounded-md border border-outline px-3 py-1.5 text-sm">Kapat</button></div>
      </div>
    </div>
  );
}
