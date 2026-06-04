import { useState } from 'react';
import { Archive, AlertCircle, Trash2, FileText, Image as ImageIcon, Users, Package, Play, Eye, Database } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useCleanupDashboard, useCleanupJobs, useCleanupPreview, useRunCleanup } from '@/features/ux-bulk/api';
import { CleanupType, CleanupTypeLabel, formatDate } from '@saas/shared';

export function CleanupPage() {
  const { data: dash, isLoading } = useCleanupDashboard();
  const { data: jobs } = useCleanupJobs();
  const preview = useCleanupPreview();
  const run = useRunCleanup();
  const [selectedType, setSelectedType] = useState<CleanupType>(CleanupType.INACTIVE_CUSTOMERS);
  const [archive, setArchive] = useState(true);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [confirmRun, setConfirmRun] = useState(false);

  const onPreview = async () => {
    const r = await preview.mutateAsync({ type: selectedType, filters: { olderThanDays: 365 } });
    setPreviewResult(r);
  };
  const onRun = async () => {
    await run.mutateAsync({ type: selectedType, filters: { olderThanDays: 365 }, archive });
    setConfirmRun(false);
    setPreviewResult(null);
  };

  const jobColumns: DataTableColumn<any>[] = [
    { key: 'type', label: 'Tip', render: (j) => <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{CleanupTypeLabel[j.type as keyof typeof CleanupTypeLabel]}</span> },
    { key: 'matched', label: 'Eşleşen', align: 'right', render: (j) => j.totalMatched },
    { key: 'archived', label: 'Arşivlenen', align: 'right', render: (j) => j.totalArchived ?? 0 },
    { key: 'status', label: 'Durum', render: (j) => <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{j.status}</span> },
    { key: 'date', label: 'Tarih', hideOnMobile: true, render: (j) => formatDate(j.completedAt ?? j.createdAt) },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Arşivleme & Temizlik" description="Fiziksel silme yok, sadece arşivleme. 6 temizlik türü" />

      {isLoading ? <LoadingState /> : dash && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3"><div className="flex items-center gap-2 text-xs text-on-surface-variant"><FileText className="h-3 w-3" /> Eski Log (&gt;1 yıl)</div><p className="text-2xl font-bold text-amber-600">{dash.oldLogs}</p></div>
          <div className="rounded-lg border border-red-300 bg-red-50 p-3"><div className="flex items-center gap-2 text-xs text-on-surface-variant"><ImageIcon className="h-3 w-3" /> Kullanılmayan Görsel</div><p className="text-2xl font-bold text-red-600">{dash.unusedImages}</p></div>
          <div className="rounded-lg border border-gray-300 bg-gray-50 p-3"><div className="flex items-center gap-2 text-xs text-on-surface-variant"><Users className="h-3 w-3" /> Pasif Müşteri</div><p className="text-2xl font-bold">{dash.inactiveCustomers}</p></div>
          <div className="rounded-lg border border-gray-300 bg-gray-50 p-3"><div className="flex items-center gap-2 text-xs text-on-surface-variant"><Package className="h-3 w-3" /> Pasif Ürün</div><p className="text-2xl font-bold">{dash.inactiveProducts}</p></div>
          <div className="rounded-lg border border-blue-300 bg-blue-50 p-3"><div className="flex items-center gap-2 text-xs text-on-surface-variant"><Database className="h-3 w-3" /> Eski Import</div><p className="text-2xl font-bold text-blue-600">{dash.oldImports ?? 0}</p></div>
        </div>
      )}

      <div className="rounded-lg border border-orange-300 bg-orange-50 p-3 text-sm">
        <div className="flex items-center gap-2 font-semibold text-orange-900"><AlertCircle className="h-4 w-4" /> Önemli</div>
        <p className="mt-1 text-orange-800">Fiziksel silme YOKTUR. Tüm temizlik işlemleri önce arşive alır, sonra soft delete yapar. Arşivden geri dönüş mümkündür.</p>
      </div>

      <div className="rounded-lg border border-outline bg-surface p-3">
        <h3 className="mb-2 font-semibold">Yeni Temizlik Çalıştır</h3>
        <div className="space-y-2 text-sm">
          <div><label className="text-xs">Tip</label><select value={selectedType} onChange={(e) => setSelectedType(e.target.value as CleanupType)} className="mt-1 w-full rounded border px-2 py-1.5">{Object.values(CleanupType).map((t) => <option key={t} value={t}>{CleanupTypeLabel[t]}</option>)}</select></div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={archive} onChange={(e) => setArchive(e.target.checked)} /> Arşivle (soft delete)</label>
          <div className="flex gap-2"><button onClick={onPreview} disabled={preview.isPending} className="flex items-center gap-1 rounded border border-blue-500 px-3 py-1.5 text-blue-600"><Eye className="h-3 w-3" /> Önizle</button></div>
          {previewResult && <div className="rounded border border-blue-200 bg-blue-50 p-2 text-xs"><p><b>{previewResult.totalMatched}</b> kayıt eşleşti</p>{previewResult.sample?.length > 0 && <ul className="mt-1">{previewResult.sample.slice(0, 5).map((s: any) => <li key={s.entityId}>{s.label}</li>)}</ul>}</div>}
        </div>
        <button onClick={() => setConfirmRun(true)} disabled={!previewResult} className="mt-3 flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary disabled:opacity-50"><Play className="h-4 w-4" /> Çalıştır</button>
      </div>

      {jobs && jobs.length > 0 && <DataTable columns={jobColumns} data={jobs} rowKey={(j) => j.id} />}

      <ConfirmModal open={confirmRun} title="Temizlik Çalıştır" description={`${previewResult?.totalMatched ?? '?'} kayıt arşivlenecek. Geri dönüş mümkün.`} confirmText="Çalıştır" variant="warning" onClose={() => setConfirmRun(false)} onConfirm={onRun} />
    </div>
  );
}
