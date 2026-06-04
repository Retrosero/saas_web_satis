import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, DollarSign, Hash, MessageSquare, Wrench, Cpu, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useConversationDetail } from '@/features/ai-observability/api';
import { formatDateTime, AssistantMessageRoleLabel } from '@saas/shared';

const ROLE_BG: Record<string, string> = { USER: 'bg-blue-100', ASSISTANT: 'bg-purple-100', SYSTEM: 'bg-red-100', TOOL: 'bg-amber-100' };

export function AIConversationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useConversationDetail(id ?? '');

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message="Konuşma yüklenemedi" />;

  const c = data.conversation;
  return (
    <div className="space-y-4">
      <PageHeader title={c.title || 'Konuşma'} description={`${c.tenantName} • ${data.user?.fullName ?? data.user?.email ?? c.userId}`}
        actions={<button onClick={() => navigate('/super-admin/ai/conversations')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" /> Geri</button>}
      />

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-outline-variant bg-surface p-3"><p className="text-xs text-on-surface-variant flex items-center gap-1"><User className="h-3 w-3" /> Kullanıcı</p><p className="mt-1 text-sm font-semibold">{data.user?.fullName ?? '?'}</p><p className="text-xs text-on-surface-variant">{data.user?.email}</p></div>
        <div className="rounded-lg border border-outline-variant bg-surface p-3"><p className="text-xs text-on-surface-variant flex items-center gap-1"><Hash className="h-3 w-3" /> Mesaj / Token</p><p className="mt-1 text-sm font-semibold">{c.messageCount} mesaj</p><p className="text-xs text-on-surface-variant">{c.totalTokens.toLocaleString('tr-TR')} token</p></div>
        <div className="rounded-lg border border-green-300 bg-green-50 p-3"><p className="text-xs text-on-surface-variant flex items-center gap-1"><DollarSign className="h-3 w-3" /> Toplam Maliyet</p><p className="mt-1 text-2xl font-bold text-green-600">${c.totalCostUSD.toFixed(4)}</p></div>
        <div className="rounded-lg border border-outline-variant bg-surface p-3"><p className="text-xs text-on-surface-variant flex items-center gap-1"><Clock className="h-3 w-3" /> Tarih</p><p className="mt-1 text-sm font-semibold">{formatDateTime(c.createdAt)}</p><p className="text-xs text-on-surface-variant">Son: {formatDateTime(c.lastMessageAt)}</p></div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Mesajlar ({data.messages.length})</h3>
          {data.messages.map((m: any) => (
            <div key={m.id} className={`rounded-lg border p-3 ${ROLE_BG[m.role] ?? 'bg-surface'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">{AssistantMessageRoleLabel[m.role as keyof typeof AssistantMessageRoleLabel]}</span>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  {m.model && <span className="flex items-center gap-1"><Cpu className="h-3 w-3" />{m.model}</span>}
                  {m.tokens && <span>{m.tokens} tok</span>}
                  {m.costUSD && <span className="font-semibold text-green-700">${m.costUSD.toFixed(5)}</span>}
                  <span>{formatDateTime(m.createdAt)}</span>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{m.content}</p>
              {m.toolCalls && m.toolCalls.length > 0 && (
                <div className="mt-2 space-y-1">
                  {m.toolCalls.map((tc: any, i: number) => (
                    <div key={i} className="rounded-md bg-white/70 p-2 text-xs">
                      <p className="font-semibold">🔧 {tc.toolName} <span className="text-on-surface-variant">({tc.latencyMs}ms)</span></p>
                      <details className="mt-1">
                        <summary className="cursor-pointer text-blue-600">Argümanlar & Sonuç</summary>
                        <pre className="mt-1 overflow-auto rounded bg-surface p-2 text-[10px]">{JSON.stringify({ args: tc.arguments, result: tc.result, error: tc.error }, null, 2)}</pre>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Wrench className="h-4 w-4" /> Tool Çağrıları ({data.toolCalls.length})</h3>
          {data.toolCalls.length === 0 ? <p className="text-xs text-on-surface-variant">Yok</p> : (
            <ul className="space-y-1">
              {data.toolCalls.map((t: any) => (
                <li key={t.id} className="rounded-md border border-outline-variant bg-surface p-2 text-xs">
                  <p className="font-semibold">{t.toolName}</p>
                  <p className="text-on-surface-variant">{t.status} • {t.latencyMs}ms • {formatDateTime(t.createdAt)}</p>
                  {t.error && <p className="text-red-600">❌ {t.error}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
