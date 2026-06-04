import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Filter, Download, Edit3, FileDown, Trash2, Plus, X, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useTrainingEntries, useDatasets, useCorrectEntry, useCreateDataset, useGenerateDataset, useDeleteDataset } from '@/features/ai-observability/api';
import { AIFeedbackTypeLabel, AIFeedbackTypeColor, AITrainingFormatLabel, AITrainingFormat, formatDateTime, type AITrainingEntry, type AITrainingDataset } from '@saas/shared';

const COLOR_BG: Record<string, string> = { green: 'bg-green-100 text-green-800', red: 'bg-red-100 text-red-800', amber: 'bg-amber-100 text-amber-800', gray: 'bg-gray-200 text-gray-700' };

export function AITrainingDataPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'entries' | 'datasets'>('entries');
  const [feedback, setFeedback] = useState(''); const [model, setModel] = useState(''); const [rating, setRating] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AITrainingEntry | null>(null);
  const [correctedText, setCorrectedText] = useState('');
  const [feedbackNote, setFeedbackNote] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<AITrainingDataset | null>(null);
  const [downloadResult, setDownloadResult] = useState<{ content: string; filename: string; count: number } | null>(null);
  const [showDatasetForm, setShowDatasetForm] = useState(false);
  const [datasetName, setDatasetName] = useState(''); const [datasetFormat, setDatasetFormat] = useState<AITrainingFormat>('OPENAI_JSONL'); const [datasetDescription, setDatasetDescription] = useState('');

  const { data, isLoading, error, refetch } = useTrainingEntries({ feedback: (feedback as any) || undefined, model: model || undefined, rating, page, pageSize: 20 });
  const { data: datasets = [], refetch: refetchDatasets } = useDatasets();
  const correctMut = useCorrectEntry();
  const createMut = useCreateDataset();
  const generateMut = useGenerateDataset();
  const delMut = useDeleteDataset();

  const columns: DataTableColumn<AITrainingEntry>[] = [
    { key: 'createdAt', label: 'Tarih', width: '140px', render: (e) => formatDateTime(e.createdAt) },
    { key: 'tenant', label: 'Tenant', width: '120px', hideOnMobile: true, render: (e) => e.tenantName ?? '—' },
    { key: 'userQuery', label: 'Soru', render: (e) => <div><p className="text-sm line-clamp-2">{e.userQuery}</p></div> },
    { key: 'model', label: 'Model', width: '140px', hideOnMobile: true, render: (e) => <code className="text-[10px]">{e.model}</code> },
    { key: 'rating', label: 'Puan', width: '80px', align: 'right', render: (e) => e.rating ? `${e.rating}/5` : '—' },
    { key: 'feedback', label: 'Feedback', width: '120px', render: (e) => e.feedback ? <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_BG[AIFeedbackTypeColor[e.feedback]]}`}>{AIFeedbackTypeLabel[e.feedback]}</span> : <span className="text-xs text-on-surface-variant">—</span> },
    { key: 'cost', label: 'Maliyet', width: '90px', align: 'right', hideOnMobile: true, render: (e) => e.costUSD ? `$${e.costUSD.toFixed(4)}` : '—' },
    { key: 'actions', label: '', width: '70px', render: (e) => (
      <button onClick={() => { setEditing(e); setCorrectedText(e.correctedAnswer ?? e.assistantAnswer); setFeedbackNote(e.feedbackNote ?? ''); }} className="rounded p-1 text-primary hover:bg-primary-container/30" title="Düzelt"><Edit3 className="h-4 w-4" /></button>
    ) },
  ];

  const exportDataset = async (ds: AITrainingDataset) => {
    const r = await generateMut.mutateAsync(ds.id);
    setDownloadResult({ content: atob(r.contentBase64), filename: r.filename, count: r.entryCount });
    refetchDatasets();
  };

  if (error) return <ErrorState message="Training entry'ler yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader title="AI Training Data" description="Konuşmalardan eğitim verisi toplama ve fine-tuning export"
        actions={
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><FileDown className="h-4 w-4" /> Export</button>
          </div>
        }
      />

      <div className="flex gap-2 border-b border-outline-variant">
        <button onClick={() => setTab('entries')} className={`px-3 py-2 text-sm font-medium ${tab === 'entries' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant'}`}>
          <Database className="inline h-4 w-4" /> Training Entries ({data?.total ?? 0})
        </button>
        <button onClick={() => setTab('datasets')} className={`px-3 py-2 text-sm font-medium ${tab === 'datasets' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant'}`}>
          <Sparkles className="inline h-4 w-4" /> Dataset'ler ({datasets.length})
        </button>
      </div>

      {tab === 'entries' ? (
        <>
          <div className="flex flex-wrap gap-2">
            <select value={feedback} onChange={(e) => setFeedback(e.target.value)} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm">
              <option value="">Tüm Feedback</option>
              {Object.entries(AIFeedbackTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model" className="rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" />
            <select value={rating === undefined ? '' : String(rating)} onChange={(e) => setRating(e.target.value === '' ? undefined : Number(e.target.value))} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm">
              <option value="">Tüm Puanlar</option>
              <option value="5">5 (Mükemmel)</option>
              <option value="4">4 (İyi)</option>
              <option value="3">3 (Orta)</option>
              <option value="2">2 (Zayıf)</option>
              <option value="1">1 (Kötü)</option>
            </select>
          </div>
          {isLoading ? <LoadingState /> : !data || data.items.length === 0 ? (
            <EmptyState icon={<Database className="h-12 w-12" />} title="Training entry yok" description="Kullanıcılar AI'ı kullandıkça entry'ler otomatik oluşur" />
          ) : (
            <>
              <DataTable<AITrainingEntry> columns={columns} data={data.items} rowKey={(e) => e.id} />
              <div className="flex items-center justify-between rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm">
                <p>Toplam: {data.total}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded border border-outline px-2 py-1 disabled:opacity-40">Önceki</button>
                  <span className="px-2 py-1">{page} / {Math.max(1, Math.ceil(data.total / data.pageSize))}</span>
                  <button onClick={() => setPage(page + 1)} disabled={page * data.pageSize >= data.total} className="rounded border border-outline px-2 py-1 disabled:opacity-40">Sonraki</button>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="flex justify-end">
            <button onClick={() => setShowDatasetForm(true)} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Plus className="h-4 w-4" /> Yeni Dataset</button>
          </div>
          {showDatasetForm && (
            <div className="rounded-lg border-2 border-primary bg-surface p-4">
              <h3 className="mb-3 text-sm font-semibold">Yeni Dataset Oluştur</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div><label className="mb-1 block text-xs font-medium">Ad *</label><input value={datasetName} onChange={(e) => setDatasetName(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
                <div><label className="mb-1 block text-xs font-medium">Format *</label>
                  <select value={datasetFormat} onChange={(e) => setDatasetFormat(e.target.value as AITrainingFormat)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
                    {Object.entries(AITrainingFormatLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2"><label className="mb-1 block text-xs font-medium">Açıklama</label><input value={datasetDescription} onChange={(e) => setDatasetDescription(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => setShowDatasetForm(false)} className="rounded-md border border-outline px-3 py-1.5 text-sm">İptal</button>
                <button onClick={async () => { if (datasetName) { await createMut.mutateAsync({ name: datasetName, format: datasetFormat, description: datasetDescription }); setShowDatasetForm(false); setDatasetName(''); setDatasetDescription(''); refetchDatasets(); } }} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-on-primary">Oluştur</button>
              </div>
            </div>
          )}
          {datasets.length === 0 ? <EmptyState icon={<Database className="h-12 w-12" />} title="Henüz dataset yok" /> : (
            <div className="space-y-2">
              {datasets.map((d) => (
                <div key={d.id} className="rounded-lg border border-outline-variant bg-surface p-3 flex items-center gap-3">
                  <Database className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{d.name}</p>
                    <p className="text-xs text-on-surface-variant">{AITrainingFormatLabel[d.format]} • {d.entryCount} entry {d.generatedAt && `• Son: ${formatDateTime(d.generatedAt)}`}</p>
                    {d.description && <p className="text-xs text-on-surface-variant mt-0.5">{d.description}</p>}
                  </div>
                  <button onClick={() => exportDataset(d)} className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white"><Download className="h-4 w-4" /> Generate & Download</button>
                  <button onClick={() => setConfirmDelete(d)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Düzeltme modalı */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-surface p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-1"><Edit3 className="h-4 w-4" /> Cevabı Düzelt</h3>
              <button onClick={() => setEditing(null)}><X className="h-4 w-4" /></button>
            </div>
            <div className="rounded-md bg-surface-variant/30 p-2 text-sm">
              <p className="font-semibold text-xs">Soru:</p>
              <p className="text-xs">{editing.userQuery}</p>
            </div>
            <div className="rounded-md bg-red-50 p-2 text-sm">
              <p className="font-semibold text-xs text-red-800">Asıl Cevap:</p>
              <p className="whitespace-pre-wrap text-xs">{editing.assistantAnswer}</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Düzeltilmiş Cevap *</label>
              <textarea value={correctedText} onChange={(e) => setCorrectedText(e.target.value)} rows={5} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Not (ops.)</label>
              <input value={feedbackNote} onChange={(e) => setFeedbackNote(e.target.value)} placeholder="Neden düzeltildi?" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-md border border-outline px-3 py-1.5 text-sm">İptal</button>
              <button onClick={async () => { await correctMut.mutateAsync({ id: editing.id, correctedAnswer: correctedText, feedbackNote }); setEditing(null); refetch(); }} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-on-primary">Kaydet</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal open={!!confirmDelete} title="Dataset Silinsin mi?" description={confirmDelete?.name} confirmText="Sil" variant="danger" onClose={() => setConfirmDelete(null)} onConfirm={async () => { if (confirmDelete) { await delMut.mutateAsync(confirmDelete.id); setConfirmDelete(null); refetchDatasets(); } }} />

      {/* İndirme sonucu modalı */}
      {downloadResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-surface p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-1"><Download className="h-4 w-4" /> Dataset Hazır: {downloadResult.filename}</h3>
              <button onClick={() => setDownloadResult(null)}><X className="h-4 w-4" /></button>
            </div>
            <p className="text-sm">{downloadResult.count} entry başarıyla export edildi.</p>
            <pre className="max-h-60 overflow-auto rounded-md bg-surface-variant/30 p-2 text-[10px]">{downloadResult.content.substring(0, 2000)}</pre>
            <div className="flex justify-end gap-2">
              <button onClick={() => { navigator.clipboard.writeText(downloadResult.content); alert('Kopyalandı'); }} className="rounded-md border border-outline px-3 py-1.5 text-sm">Kopyala</button>
              <button onClick={() => { const blob = new Blob([downloadResult.content], { type: 'application/jsonl' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = downloadResult.filename; a.click(); }} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-on-primary">İndir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
