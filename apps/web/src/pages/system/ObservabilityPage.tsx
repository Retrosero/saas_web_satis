import { Activity, AlertTriangle, Bug, Server, CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { useObservabilityHealth, useTestError } from '@/features/observability/api';
import { captureError, captureMessage } from '@/lib/sentry';

export function ObservabilityPage() {
  const { data, isLoading } = useObservabilityHealth();
  const testErr = useTestError();

  return (
    <div className="space-y-4">
      <PageHeader title="Gözlemlenebilirlik" description="Sentry hata takibi, OpenTelemetry tracing" />

      {isLoading ? <LoadingState /> : data && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-outline bg-surface p-3"><div className="flex items-center gap-2 text-xs"><Activity className="h-3 w-3" /> OpenTelemetry</div><p className="flex items-center gap-1 text-lg font-bold text-green-600"><CheckCircle2 className="h-4 w-4" /> Aktif</p></div>
          <div className={`rounded-lg border p-3 ${data.sentry ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
            <div className="flex items-center gap-2 text-xs"><AlertTriangle className="h-3 w-3" /> Sentry</div>
            <p className={`flex items-center gap-1 text-lg font-bold ${data.sentry ? 'text-green-600' : 'text-amber-600'}`}>{data.sentry ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}{data.sentry ? 'Bağlı' : 'DSN Yok'}</p>
          </div>
          <div className="rounded-lg border border-outline bg-surface p-3"><div className="flex items-center gap-2 text-xs"><Server className="h-3 w-3" /> Environment</div><p className="text-lg font-bold">{data.env}</p></div>
          <div className="rounded-lg border border-outline bg-surface p-3"><div className="flex items-center gap-2 text-xs"><Server className="h-3 w-3" /> Version</div><p className="text-lg font-bold">{data.version}</p></div>
        </div>
      )}

      <div className="rounded-lg border border-outline bg-surface p-3">
        <h3 className="mb-2 font-semibold">Test Event'leri</h3>
        <p className="mb-2 text-xs text-on-surface-variant">Backend ve frontend'in doğru çalıştığını doğrula.</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => testErr.mutate('sentry')} disabled={testErr.isPending} className="flex items-center gap-1 rounded-md border border-blue-500 px-3 py-1.5 text-sm text-blue-600"><Bug className="h-3 w-3" /> Backend Sentry Test</button>
          <button onClick={() => testErr.mutate('http')} disabled={testErr.isPending} className="flex items-center gap-1 rounded-md border border-amber-500 px-3 py-1.5 text-sm text-amber-600"><Bug className="h-3 w-3" /> Backend 500 Test</button>
          <button onClick={() => captureMessage('Frontend test mesajı: ' + Date.now(), 'info')} className="flex items-center gap-1 rounded-md border border-green-500 px-3 py-1.5 text-sm text-green-600"><Bug className="h-3 w-3" /> Frontend Sentry Test</button>
          <button onClick={() => { try { throw new Error('Frontend test hatası: ' + Date.now()); } catch (e) { captureError(e as Error, { source: 'manual_test' }); } }} className="flex items-center gap-1 rounded-md border border-red-500 px-3 py-1.5 text-sm text-red-600"><Bug className="h-3 w-3" /> Frontend Hata Test</button>
        </div>
      </div>

      <div className="rounded-lg border border-blue-300 bg-blue-50 p-3 text-sm">
        <h3 className="mb-1 font-semibold text-blue-900">Yapılandırma</h3>
        <p className="text-blue-800">OpenTelemetry tracing için OTEL_EXPORTER_OTLP_ENDPOINT env değişkeni (varsayılan: http://localhost:4318)</p>
        <p className="text-blue-800">Sentry için SENTRY_DSN env değişkeni gerekli (sentry.io'dan alınır)</p>
      </div>
    </div>
  );
}
