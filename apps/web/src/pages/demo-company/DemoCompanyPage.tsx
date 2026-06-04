import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, RotateCw, ArrowRight, Sparkles, Trash2, CheckCircle2, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useDemoCompany, useDemoTemplates, useCreateDemo, useResetDemo, useConvertDemo } from '@/features/demo-company/api';
import { DemoDataSize, DemoDataSizeLabel } from '@saas/shared';

export function DemoCompanyPage() {
  const navigate = useNavigate();
  const { data: demo, isLoading, refetch } = useDemoCompany();
  const { data: templates = [] } = useDemoTemplates();
  const createMut = useCreateDemo();
  const resetMut = useResetDemo();
  const convertMut = useConvertDemo();
  const [showForm, setShowForm] = useState(false);
  const [size, setSize] = useState<DemoDataSize>(DemoDataSize.MEDIUM);
  const [templateCode, setTemplateCode] = useState('medium_demo');
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmConvert, setConfirmConvert] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const submit = async () => {
    const r = await createMut.mutateAsync({ size, templateCode });
    setStats(r.stats);
    setShowForm(false);
    refetch();
  };

  const reset = async () => {
    const r = await resetMut.mutateAsync();
    setStats(r.stats);
    setConfirmReset(false);
    refetch();
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <PageHeader title="Demo Firma Yönetimi" description="Satış sunumları ve eğitim için örnek veri" />

      {!demo || demo.length === 0 ? (
        <EmptyState
          icon={<Database className="h-12 w-12" />}
          title="Henüz demo firma yok"
          description="Hızlıca demo veri ile dolu bir firma oluşturun"
          action={<button onClick={() => setShowForm(true)} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary inline-flex items-center gap-1"><Sparkles className="h-4 w-4" /> Demo Firma Oluştur</button>}
        />
      ) : (
        <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-amber-700" />
            <div className="flex-1">
              <h3 className="font-bold text-amber-900">{DemoDataSizeLabel[demo.size as DemoDataSize]}</h3>
              <p className="text-xs text-amber-800">Sıfırlama: {demo.resetCount} kez</p>
            </div>
            <button onClick={() => navigate('/dashboard')} className="rounded-md bg-amber-700 px-3 py-1.5 text-sm font-medium text-white">Demo Firmaya Gir →</button>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setConfirmReset(true)} className="rounded-md border border-amber-400 bg-white px-3 py-1.5 text-sm"><RotateCw className="inline h-3 w-3" /> Sıfırla</button>
            <button onClick={() => setConfirmConvert(true)} className="rounded-md border border-green-400 bg-white px-3 py-1.5 text-sm text-green-700"><CheckCircle2 className="inline h-3 w-3" /> Gerçek Firmaya Dönüştür</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="rounded-lg border-2 border-primary bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold flex items-center gap-1"><Sparkles className="h-4 w-4" /> Yeni Demo Firma</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div><label className="mb-1 block text-xs font-medium">Boyut *</label>
              <select value={size} onChange={(e) => { setSize(e.target.value as DemoDataSize); setTemplateCode(e.target.value === DemoDataSize.SMALL ? 'small_demo' : e.target.value === DemoDataSize.MEDIUM ? 'medium_demo' : 'large_demo'); }} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
                <option value={DemoDataSize.SMALL}>Küçük (50 cari, 100 ürün)</option>
                <option value={DemoDataSize.MEDIUM}>Orta (200 cari, 500 ürün)</option>
                <option value={DemoDataSize.LARGE}>Geniş (1000 cari, 2000 ürün)</option>
              </select>
            </div>
            <div><label className="mb-1 block text-xs font-medium">Şablon</label>
              <select value={templateCode} onChange={(e) => setTemplateCode(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
                {templates.map((t: any) => <option key={t.code} value={t.code}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <p className="mt-2 text-xs text-on-surface-variant">Seçtiğiniz pakete göre cariler, ürünler, markalar, kategoriler, depolar ve son 30-90 günlük satış verileri oluşturulacak.</p>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="rounded-md border border-outline px-3 py-1.5 text-sm">İptal</button>
            <button onClick={submit} disabled={createMut.isPending} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-on-primary inline-flex items-center gap-1">{createMut.isPending ? 'Oluşturuluyor...' : 'Oluştur'}</button>
          </div>
        </div>
      )}

      {stats && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm">
          <p className="font-semibold text-green-800">✓ İşlem tamamlandı ({stats.durationMs}ms)</p>
          <p>📊 {stats.customerCount} cari, {stats.productCount} ürün, {stats.brandCount} marka, {stats.saleCount} satış</p>
        </div>
      )}

      <ConfirmModal open={confirmReset} title="Demo Veriyi Sıfırla" description="Tüm demo verileri silinip yeniden oluşturulacak. Devam?" confirmText="Sıfırla" variant="warning" onClose={() => setConfirmReset(false)} onConfirm={reset} />
      <ConfirmModal open={confirmConvert} title="Gerçek Firmaya Dönüştür" description="Bu demo firma artık GERÇEK firma olarak işaretlenecek ve abonelik/plan atanacak. Demo verisi KALACAK." confirmText="Dönüştür" variant="info" onClose={() => setConfirmConvert(false)} onConfirm={async () => { await convertMut.mutateAsync(); setConfirmConvert(false); refetch(); }} />
    </div>
  );
}
