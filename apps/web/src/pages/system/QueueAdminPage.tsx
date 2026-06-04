import { useState } from 'react';
import { Server, Mail, FileText, ListChecks, RotateCw, Trash2, Plus, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { useQueues, useQueueJobs, useEnqueueMail, useEnqueueReport, useEnqueueBulk } from '@/features/queue-admin/api';

const QUEUE_ICONS: any = { mail: Mail, report: FileText, bulk: ListChecks };
const STATUS_COLOR: any = { waiting: 'bg-blue-100 text-blue-800', active: 'bg-amber-100 text-amber-800', completed: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800', delayed: 'bg-purple-100 text-purple-800' };

export function QueueAdminPage() {
  const { data: queues, isLoading } = useQueues();
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState('waiting');
  const { data: jobs } = useQueueJobs(selected, status);
  const enqMail = useEnqueueMail();
  const enqReport = useEnqueueReport();
  const enqBulk = useEnqueueBulk();
  const [testTo, setTestTo] = useState('test@example.com');
  const [testReport, setTestReport] = useState('weekly-sales');

  return (
    <div className="space-y-4">
      <PageHeader title="Queue Yönetimi" description="BullMQ queue'lar ve worker'lar (mail, report, bulk)" />

      {isLoading ? <LoadingState /> : queues && (
        <div className="grid gap-3 sm:grid-cols-3">
          {queues.map((q) => {
            const Icon = QUEUE_ICONS[q.name] ?? Server;
            return (
              <button key={q.name} onClick={() => setSelected(q.name)} className={`rounded-lg border-2 p-3 text-left transition ${selected === q.name ? 'border-primary bg-blue-50' : 'border-outline bg-surface hover:border-primary/50'}`}>
                <div className="flex items-center gap-2 font-semibold"><Icon className="h-4 w-4" /> {q.name}</div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
                  <div className="rounded bg-blue-50 px-1 py-0.5 text-center"><b className="text-blue-600">{q.waiting ?? 0}</b> wait</div>
                  <div className="rounded bg-amber-50 px-1 py-0.5 text-center"><b className="text-amber-600">{q.active ?? 0}</b> active</div>
                  <div className="rounded bg-green-50 px-1 py-0.5 text-center"><b className="text-green-600">{q.completed ?? 0}</b> done</div>
                  <div className="col-span-3 rounded bg-red-50 px-1 py-0.5 text-center"><b className="text-red-600">{q.failed ?? 0}</b> failed</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="rounded-lg border border-outline bg-surface p-3">
          <div className="mb-2 flex items-center gap-2"><span className="font-semibold">{selected}</span> queue işleri</div>
          <div className="mb-2 flex gap-1">{['waiting', 'active', 'completed', 'failed', 'delayed'].map((s) => <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-2 py-0.5 text-xs ${status === s ? 'bg-primary text-on-primary' : 'border'}`}>{s}</button>)}</div>
          {jobs && jobs.length > 0 ? (
            <div className="space-y-1">
              {jobs.map((j: any) => (
                <div key={j.id} className="flex items-center gap-2 rounded border border-outline-variant p-2 text-xs">
                  <span className="font-mono text-on-surface-variant">#{j.id}</span>
                  <span className={`rounded-full px-2 py-0.5 ${STATUS_COLOR[status] ?? 'bg-gray-100'}`}>{j.name}</span>
                  {j.attemptsMade > 0 && <span className="text-amber-600">deneme: {j.attemptsMade}</span>}
                  {j.failedReason && <span className="text-red-600 truncate max-w-xs">{j.failedReason}</span>}
                  <span className="ml-auto text-on-surface-variant">{j.processedOn ? new Date(j.processedOn).toLocaleTimeString('tr-TR') : new Date(j.timestamp).toLocaleTimeString('tr-TR')}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-on-surface-variant">Bu kategoride iş yok</p>}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-blue-300 bg-blue-50 p-3">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-blue-900"><Mail className="h-4 w-4" /> Test Mail Gönder</h3>
          <input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="to" className="mb-1 w-full rounded border px-2 py-1 text-sm" />
          <button onClick={() => enqMail.mutate({ to: testTo, subject: 'Test Mail', html: '<h1>Selam</h1>' })} disabled={enqMail.isPending} className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50">{enqMail.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Ekle</button>
        </div>
        <div className="rounded-lg border border-green-300 bg-green-50 p-3">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-green-900"><FileText className="h-4 w-4" /> Test Rapor Üret</h3>
          <input value={testReport} onChange={(e) => setTestReport(e.target.value)} placeholder="report key" className="mb-1 w-full rounded border px-2 py-1 text-sm" />
          <button onClick={() => enqReport.mutate({ reportKey: testReport })} disabled={enqReport.isPending} className="flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"><Plus className="h-3 w-3" /> Üret</button>
        </div>
        <div className="rounded-lg border border-purple-300 bg-purple-50 p-3">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-purple-900"><ListChecks className="h-4 w-4" /> Test Bulk İşlem</h3>
          <button onClick={() => enqBulk.mutate({ op: 'PRICE_UPDATE', filters: { status: 'ACTIVE' }, update: { percentage: 5 } })} disabled={enqBulk.isPending} className="flex items-center gap-1 rounded bg-purple-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"><Plus className="h-3 w-3" /> Kuyruğa Ekle</button>
        </div>
      </div>
    </div>
  );
}
