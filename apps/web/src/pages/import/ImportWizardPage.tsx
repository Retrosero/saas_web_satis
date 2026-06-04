import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check, X, Play, Undo2, Download, Database, FileText, Eye } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useCreateImportBatch, useParseImport, useSetMapping, useImportBatch, useImportPreview, useExecuteImport, useRollbackImport } from '@/features/import/api';
import { ImportEntityTypeLabel, ImportSourceLabel, ImportTargetFields, type ImportEntityType, type ImportSource } from '@saas/shared';

const STEPS = [
  { key: 'source', label: 'Kaynak Seç', icon: Database },
  { key: 'upload', label: 'Dosya Yükle', icon: Upload },
  { key: 'mapping', label: 'Eşleştir', icon: FileSpreadsheet },
  { key: 'preview', label: 'Ön İzle', icon: Eye },
  { key: 'result', label: 'Aktar', icon: Play },
];

export function ImportWizardPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [source, setSource] = useState<ImportSource>('EXCEL');
  const [entityType, setEntityType] = useState<ImportEntityType>('CUSTOMER');
  const [batchId, setBatchId] = useState<string | undefined>(id);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [fileContent, setFileContent] = useState('');
  const [parseResult, setParseResult] = useState<{ columns: string[]; rowCount: number; sample: any[] } | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ success: number; errors: number; duplicates: number } | null>(null);
  const [confirmRollback, setConfirmRollback] = useState(false);

  const createBatch = useCreateImportBatch();
  const parse = useParseImport(batchId ?? '');
  const setMap = useSetMapping(batchId ?? '');
  const batchQ = useImportBatch(batchId ?? '');
  const preview = useImportPreview(batchId ?? '', 1, 50);
  const execute = useExecuteImport(batchId ?? '');
  const rollback = useRollbackImport(batchId ?? '');

  const next = async () => {
    if (step === 0) {
      if (!name) return;
      const b = await createBatch.mutateAsync({ name, source, entityType });
      setBatchId(b.id);
      setStep(1);
    } else if (step === 1) {
      if (!fileContent) return;
      const r = await parse.mutateAsync({ content: fileContent, fileName, fileSize });
      setParseResult(r);
      // Otomatik mapping: aynı isimli kolonları eşle
      const auto: Record<string, string> = {};
      const targets = ImportTargetFields[entityType];
      r.columns.forEach((col) => {
        const t = targets.find((tt) => tt.key.toLowerCase() === col.toLowerCase().replace(/\s/g, ''));
        if (t) auto[col] = t.key;
      });
      setMapping(auto);
      setStep(2);
    } else if (step === 2) {
      await setMap.mutateAsync(mapping);
      setStep(3);
    } else if (step === 3) {
      const r = await execute.mutateAsync();
      setResult(r);
      setStep(4);
    }
  };

  const prev = () => setStep(Math.max(0, step - 1));

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileSize(file.size);
    const reader = new FileReader();
    reader.onload = (ev) => setFileContent(String(ev.target?.result ?? ''));
    if (source === 'EXCEL' || source === 'CSV') {
      reader.readAsText(file);
    }
  };

  const downloadErrors = () => {
    // TODO: backend'den hata CSV indir
    alert('Hata dosyası indirilecek (henüz backend hazır değil)');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Veri Taşıma Sihirbazı"
        description="Eski sisteminizden verilerinizi içe aktarın"
        actions={
          <button onClick={() => navigate('/import/history')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm">
            <FileText className="h-4 w-4" /> Geçmiş Aktarımlar
          </button>
        }
      />

      {/* Stepper */}
      <ol className="flex items-center gap-2 overflow-x-auto rounded-lg border border-outline-variant bg-surface p-3">
        {STEPS.map((s, i) => (
          <li key={s.key} className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${i === step ? 'bg-primary text-on-primary' : i < step ? 'bg-green-100 text-green-800' : 'text-on-surface-variant'}`}>
            {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
            {i + 1}. {s.label}
          </li>
        ))}
      </ol>

      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        {/* Step 0: Kaynak Seç */}
        {step === 0 && (
          <div className="space-y-3 max-w-2xl">
            <h2 className="text-lg font-semibold">Kaynak ve Hedef Seçin</h2>
            <div>
              <label className="mb-1 block text-xs font-medium">Aktarım Adı *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: 2025-Q4 Müşteri Aktarımı" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Kaynak Sistem *</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {Object.entries(ImportSourceLabel).map(([k, v]) => (
                  <button key={k} onClick={() => setSource(k as ImportSource)} className={`rounded-md border px-3 py-2 text-sm ${source === k ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline bg-surface hover:bg-surface-variant'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Aktarılacak Veri Tipi *</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Object.entries(ImportEntityTypeLabel).map(([k, v]) => (
                  <button key={k} onClick={() => setEntityType(k as ImportEntityType)} className={`rounded-md border px-3 py-2 text-sm ${entityType === k ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline bg-surface hover:bg-surface-variant'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            {entityType === 'ARCHIVE_SALE' && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                ⚠️ Arşiv satış aktarımı sadece raporlama amaçlıdır. Cari ve stok bakiyelerini ETKİLEMEZ.
              </div>
            )}
            {(entityType === 'CUSTOMER_BALANCE' || entityType === 'STOCK_BALANCE') && (
              <div className="rounded-md border border-blue-300 bg-blue-50 p-3 text-sm text-blue-800">
                ℹ️ Bakiye aktarımı arşiv amaçlıdır. Mevcut bakiyeleri değiştirmez (event-sourcing felsefesi).
              </div>
            )}
          </div>
        )}

        {/* Step 1: Dosya Yükle */}
        {step === 1 && (
          <div className="space-y-3 max-w-2xl">
            <h2 className="text-lg font-semibold">Dosya Yükle</h2>
            <p className="text-sm text-on-surface-variant">{ImportSourceLabel[source]} dosyası yükleyin. İlk satır başlık olmalıdır.</p>
            <div className="rounded-lg border-2 border-dashed border-outline p-8 text-center">
              <input id="file-input" type="file" accept={source === 'EXCEL' ? '.xlsx,.xls' : source === 'CSV' ? '.csv' : '*'} onChange={onFileChange} className="hidden" />
              <label htmlFor="file-input" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-on-surface-variant" />
                <p className="mt-2 text-sm">Dosya seçmek için tıklayın veya sürükleyin</p>
                <p className="mt-1 text-xs text-on-surface-variant">Maks. 10MB</p>
              </label>
            </div>
            {fileName && (
              <div className="rounded-md border border-outline-variant bg-surface p-3 text-sm">
                <p><span className="font-mono">{fileName}</span> — {(fileSize / 1024).toFixed(1)} KB</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Kolon Eşleştirme */}
        {step === 2 && parseResult && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Kolon Eşleştirme</h2>
            <p className="text-sm text-on-surface-variant">Her kaynak kolon için bir hedef alan seçin. <span className="text-red-600">*</span> ile işaretli alanlar zorunludur.</p>
            <div className="rounded-lg border border-outline-variant overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-variant text-xs">
                  <tr>
                    <th className="px-3 py-2 text-left">Kaynak Kolon</th>
                    <th className="px-3 py-2 text-left">Örnek Veri</th>
                    <th className="px-3 py-2 text-left">Hedef Alan *</th>
                  </tr>
                </thead>
                <tbody>
                  {parseResult.columns.map((col) => {
                    const sample = parseResult.sample.find((s) => s && col in s)?.[col] ?? '';
                    return (
                      <tr key={col} className="border-t border-outline-variant">
                        <td className="px-3 py-2 font-mono">{col}</td>
                        <td className="px-3 py-2 text-on-surface-variant truncate max-w-[200px]">{String(sample)}</td>
                        <td className="px-3 py-2">
                          <select value={mapping[col] ?? ''} onChange={(e) => setMapping({ ...mapping, [col]: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm">
                            <option value="">— Eşleştirme —</option>
                            {ImportTargetFields[entityType].map((f) => <option key={f.key} value={f.key}>{f.label}{f.required ? ' *' : ''}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-on-surface-variant">Toplam {parseResult.rowCount} satır, {Object.values(mapping).filter(Boolean).length} kolon eşleştirildi.</p>
          </div>
        )}

        {/* Step 3: Ön İzle */}
        {step === 3 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Veri Ön İzleme</h2>
            {preview.isLoading ? <LoadingState /> : !preview.data || preview.data.rows.length === 0 ? (
              <EmptyState title="Veri yok" />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md border border-outline-variant p-2 text-center">
                    <p className="text-xs text-on-surface-variant">Toplam</p>
                    <p className="text-lg font-bold">{preview.data.total}</p>
                  </div>
                  <div className="rounded-md border border-green-200 p-2 text-center">
                    <p className="text-xs text-green-700">Eşleşen</p>
                    <p className="text-lg font-bold text-green-700">{preview.data.total - preview.data.errorCount}</p>
                  </div>
                  <div className="rounded-md border border-red-200 p-2 text-center">
                    <p className="text-xs text-red-700">Hatalı</p>
                    <p className="text-lg font-bold text-red-700">{preview.data.errorCount}</p>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-lg border border-outline-variant">
                  <table className="w-full text-xs">
                    <thead className="bg-surface-variant">
                      <tr>
                        <th className="px-2 py-1.5 text-left">#</th>
                        {Object.keys(preview.data.rows[0]?.mappedData ?? {}).map((k) => <th key={k} className="px-2 py-1.5 text-left">{k}</th>)}
                        <th className="px-2 py-1.5 text-left">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.data.rows.slice(0, 20).map((r) => (
                        <tr key={r.id} className="border-t border-outline-variant">
                          <td className="px-2 py-1.5 font-mono">{r.rowNumber}</td>
                          {r.mappedData && Object.values(r.mappedData).map((v: any, i) => <td key={i} className="px-2 py-1.5 truncate max-w-[120px]">{String(v ?? '')}</td>)}
                          <td className="px-2 py-1.5">
                            {r.status === 'COMPLETED' ? <span className="text-green-700">✓</span> : r.status === 'FAILED' ? <span className="text-red-600" title={r.errorMessage}>✗</span> : <span className="text-amber-600">⏳</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={downloadErrors} className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Download className="h-4 w-4" /> Hataları İndir
                </button>
              </>
            )}
          </div>
        )}

        {/* Step 4: Sonuç */}
        {step === 4 && result && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-lg font-semibold">Aktarım Tamamlandı</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md border border-green-200 bg-green-50 p-3 text-center">
                <p className="text-xs text-green-700">Başarılı</p>
                <p className="text-2xl font-bold text-green-700">{result.success}</p>
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-center">
                <p className="text-xs text-amber-700">Mükerrer</p>
                <p className="text-2xl font-bold text-amber-700">{result.duplicates}</p>
              </div>
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-center">
                <p className="text-xs text-red-700">Hatalı</p>
                <p className="text-2xl font-bold text-red-700">{result.errors}</p>
              </div>
            </div>
            {result.errors > 0 && (
              <button onClick={downloadErrors} className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Download className="h-4 w-4" /> Hatalı Kayıtları İndir
              </button>
            )}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setConfirmRollback(true)} disabled={result.success === 0} className="flex items-center gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 disabled:opacity-40">
                <Undo2 className="h-4 w-4" /> Geri Al
              </button>
              <button onClick={() => navigate('/import/history')} className="rounded-md border border-outline px-3 py-2 text-sm">Geçmişe Dön</button>
              <button onClick={() => { setStep(0); setName(''); setFileContent(''); setParseResult(null); setResult(null); }} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary">Yeni Aktarım</button>
            </div>
          </div>
        )}

        {/* Nav */}
        {step < 4 && (
          <div className="mt-4 flex justify-between">
            <button onClick={prev} disabled={step === 0} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm disabled:opacity-40">
              <ArrowLeft className="h-4 w-4" /> Geri
            </button>
            <button
              onClick={next}
              disabled={
                (step === 0 && !name) ||
                (step === 1 && !fileContent) ||
                (step === 2 && Object.values(mapping).filter(Boolean).length === 0) ||
                createBatch.isPending || parse.isPending || setMap.isPending || execute.isPending
              }
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-40"
            >
              {step === 3 ? 'Aktarımı Başlat' : 'İleri'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmRollback}
        title="Aktarım Geri Alınsın mı?"
        description="Bu işlem aktarılan tüm kayıtları soft delete yapar. Geri alınamaz."
        confirmText="Geri Al"
        variant="danger"
        onClose={() => setConfirmRollback(false)}
        onConfirm={async () => {
          if (batchId) {
            const r = await rollback.mutateAsync();
            setConfirmRollback(false);
            alert(`${r.deleted} kayıt silindi.`);
            navigate('/import/history');
          }
        }}
      />
    </div>
  );
}
