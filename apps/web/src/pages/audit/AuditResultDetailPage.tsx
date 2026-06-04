import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, CheckCircle2, X, Eye, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useResult, useAcknowledgeResult, useFixResult, useIgnoreResult, useFalsePositive } from '@/features/audit/api';
import { DataCheckTypeLabel, DataCheckTypeIcon, DataCheckSeverityLabel, DataCheckSeverityColor, DataCheckResultStatusLabel, DataCheckResultStatusColor, formatDateTime } from '@saas/shared';

const COLOR_BG: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800', gray: 'bg-gray-200 text-gray-700', amber: 'bg-amber-100 text-amber-800',
  orange: 'bg-orange-100 text-orange-800', red: 'bg-red-100 text-red-800', green: 'bg-green-100 text-green-800', purple: 'bg-purple-100 text-purple-800',
};

export function AuditResultDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: result, isLoading, error, refetch } = useResult(id ?? '');
  const ackMut = useAcknowledgeResult();
  const fixMut = useFixResult();
  const ignoreMut = useIgnoreResult();
  const fpMut = useFalsePositive();
  const [note, setNote] = useState(''); const [ignoreReason, setIgnoreReason] = useState('');

  if (isLoading) return <LoadingState />;
  if (error || !result) return <ErrorState message="Bulgu yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader title={result.entityLabel} description={`${DataCheckTypeLabel[result.checkType]} • ${formatDateTime(result.createdAt)}`}
        actions={<button onClick={() => navigate('/audit/results')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" /> Geri</button>}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-outline-variant bg-surface p-3">
          <p className="text-xs text-on-surface-variant">Ciddiyet</p>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_BG[DataCheckSeverityColor[result.severity]]}`}>{DataCheckSeverityLabel[result.severity]}</span>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface p-3">
          <p className="text-xs text-on-surface-variant">Durum</p>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_BG[DataCheckResultStatusColor[result.status]]}`}>{DataCheckResultStatusLabel[result.status]}</span>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface p-3">
          <p className="text-xs text-on-surface-variant">Kontrol Tipi</p>
          <p className="mt-1 text-sm font-semibold flex items-center gap-1">{DataCheckTypeIcon[result.checkType]} {DataCheckTypeLabel[result.checkType]}</p>
        </div>
      </div>

      <section className="rounded-lg border border-outline-variant bg-surface p-4">
        <h3 className="mb-2 text-sm font-semibold">Açıklama</h3>
        <p className="text-sm">{result.description}</p>
        {result.suggestedFix && (
          <div className="mt-3 rounded-md bg-blue-50 p-3 text-sm">
            <p className="font-semibold text-blue-800 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> Önerilen Çözüm</p>
            <p className="mt-1 text-blue-900">{result.suggestedFix}</p>
          </div>
        )}
      </section>

      {Object.keys(result.details).length > 0 && (
        <section className="rounded-lg border border-outline-variant bg-surface p-4">
          <h3 className="mb-2 text-sm font-semibold">Detaylar</h3>
          <div className="rounded-md bg-surface-variant/30 p-3">
            <pre className="text-xs overflow-auto">{JSON.stringify(result.details, null, 2)}</pre>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-outline-variant bg-surface p-4">
        <h3 className="mb-2 text-sm font-semibold">Bağlam</h3>
        <p className="text-xs"><strong>Entity Tipi:</strong> {result.entityType}</p>
        <p className="text-xs"><strong>Entity ID:</strong> <code className="text-[10px]">{result.entityId}</code></p>
        {result.entityNumber && <p className="text-xs"><strong>No:</strong> {result.entityNumber}</p>}
        <p className="text-xs"><strong>Kural ID:</strong> <code className="text-[10px]">{result.ruleId}</code></p>
      </section>

      {(result.fixNote || result.ignoreReason) && (
        <section className="rounded-lg border border-outline-variant bg-surface p-4">
          <h3 className="mb-2 text-sm font-semibold">İşlem Geçmişi</h3>
          {result.fixNote && <p className="text-sm"><strong>Çözüm Notu:</strong> {result.fixNote} {result.fixedByName && <span className="text-xs text-on-surface-variant">— {result.fixedByName} • {result.fixedAt && formatDateTime(result.fixedAt)}</span>}</p>}
          {result.ignoreReason && <p className="text-sm"><strong>Yok Sayma:</strong> {result.ignoreReason}</p>}
        </section>
      )}

      {result.status === 'OPEN' || result.status === 'ACKNOWLEDGED' ? (
        <section className="rounded-lg border-2 border-primary bg-primary-container/10 p-4">
          <h3 className="mb-2 text-sm font-semibold">Aksiyon</h3>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Çözüm notu (ops.)..." rows={2} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
          <div className="mt-2 flex flex-wrap gap-2">
            {result.status === 'OPEN' && <button onClick={async () => { await ackMut.mutateAsync(result.id); refetch(); }} className="rounded-md border border-amber-400 px-3 py-1.5 text-sm text-amber-700">İnceleniyor</button>}
            <button onClick={async () => { await fixMut.mutateAsync({ id: result.id, note }); setNote(''); refetch(); }} className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white"><CheckCircle2 className="h-4 w-4" /> Çözüldü</button>
            <button onClick={async () => { if (!ignoreReason) { alert('Sebep girin'); return; } await ignoreMut.mutateAsync({ id: result.id, reason: ignoreReason }); setIgnoreReason(''); refetch(); }} className="flex items-center gap-1 rounded-md bg-gray-600 px-3 py-1.5 text-sm font-medium text-white"><X className="h-4 w-4" /> Yok Say</button>
            <button onClick={async () => { if (!ignoreReason) { alert('Sebep girin'); return; } await fpMut.mutateAsync({ id: result.id, reason: ignoreReason }); setIgnoreReason(''); refetch(); }} className="rounded-md border border-purple-400 px-3 py-1.5 text-sm text-purple-700">Yanlış Tespit</button>
          </div>
          <input value={ignoreReason} onChange={(e) => setIgnoreReason(e.target.value)} placeholder="Yok sayma / yanlış tespit sebebi..." className="mt-2 w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
        </section>
      ) : null}
    </div>
  );
}
