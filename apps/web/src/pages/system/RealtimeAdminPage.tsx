import { Radio, Send, Trash2, Zap, Wifi, WifiOff } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useRealtimeStats, useSendTest } from '@/features/realtime-admin/api';
import { useRealtime } from '@/lib/socket-client';
import { useState } from 'react';

export function RealtimeAdminPage() {
  const { data: stats } = useRealtimeStats();
  const test = useSendTest();
  const { connected, events, clear } = useRealtime();
  const [testMsg, setTestMsg] = useState('Test bildirim mesajı');

  return (
    <div className="space-y-4">
      <PageHeader title="Realtime (WebSocket)" description="Socket.io gateway, online kullanıcılar, event akışı" />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className={`rounded-lg border-2 p-3 ${connected ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
          <div className="flex items-center gap-2 text-xs"><Radio className="h-3 w-3" /> Bağlantı</div>
          <p className={`flex items-center gap-1 text-lg font-bold ${connected ? 'text-green-600' : 'text-red-600'}`}>{connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}{connected ? 'Bağlı' : 'Bağlı Değil'}</p>
        </div>
        <div className="rounded-lg border border-blue-300 bg-blue-50 p-3">
          <div className="flex items-center gap-2 text-xs"><Zap className="h-3 w-3" /> Aktif Bağlantı</div>
          <p className="text-2xl font-bold text-blue-600">{stats?.connectedClients ?? 0}</p>
        </div>
        <div className="rounded-lg border border-purple-300 bg-purple-50 p-3">
          <div className="flex items-center gap-2 text-xs">Event Buffer</div>
          <p className="text-2xl font-bold text-purple-600">{events.length}</p>
        </div>
      </div>

      <div className="rounded-lg border border-outline bg-surface p-3">
        <h3 className="mb-2 font-semibold">Test Event Yayını</h3>
        <div className="flex gap-2">
          <input value={testMsg} onChange={(e) => setTestMsg(e.target.value)} className="flex-1 rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" />
          <button onClick={() => test.mutate({ event: 'test.event', message: testMsg })} disabled={test.isPending} className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white"><Send className="h-3 w-3" /> Yayınla</button>
        </div>
      </div>

      <div className="rounded-lg border border-outline bg-surface p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">Event Akışı (son {events.length})</h3>
          <button onClick={clear} className="flex items-center gap-1 rounded border px-2 py-1 text-xs"><Trash2 className="h-3 w-3" /> Temizle</button>
        </div>
        <div className="max-h-96 space-y-1 overflow-y-auto">
          {events.length === 0 ? <p className="text-xs text-on-surface-variant">Henüz event alınmadı. Bağlıysanız yukarıdaki "Yayınla" butonu ile test edin.</p> : events.map((e, i) => (
            <div key={i} className="flex items-center gap-2 rounded border border-outline-variant p-2 text-xs">
              <span className="rounded bg-purple-100 px-1.5 py-0.5 font-mono text-purple-800">{e.event}</span>
              <span className="flex-1 truncate text-on-surface-variant">{JSON.stringify(e.payload).slice(0, 100)}</span>
              <span className="text-on-surface-variant">{new Date(e.ts).toLocaleTimeString('tr-TR')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
