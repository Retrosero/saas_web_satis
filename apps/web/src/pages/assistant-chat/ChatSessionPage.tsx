import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Send, ArrowLeft, ThumbsUp, ThumbsDown, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useConversation, useSendMessage, useRateMessage, useLLMConfig } from '@/features/assistant-chat/api';
import { LoadingState } from '@/components/data/LoadingState';
import { formatDateTime, type AssistantToolCallResult } from '@saas/shared';

export function ChatSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const { data: conv, isLoading } = useConversation(isNew ? '' : (id ?? ''));
  const { data: config } = useLLMConfig();
  const sendMut = useSendMessage();
  const rateMut = useRateMessage();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(isNew ? undefined : id);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conv?.messages) setMessages(conv.messages);
  }, [conv]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    if (!input.trim() || sendMut.isPending) return;
    const userMsg = input;
    setInput('');
    // Optimistic user message
    const tempUser = { id: 'temp-' + Date.now(), role: 'USER', content: userMsg, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, tempUser]);

    try {
      const res = await sendMut.mutateAsync({ conversationId, message: userMsg });
      setConversationId(res.conversationId);
      setMessages((m) => [...m.filter((x) => x.id !== tempUser.id), { ...res.userMessage }, { ...res.assistantMessage, toolCalls: res.toolCalls, sources: res.sources }]);
      if (isNew) navigate(`/assistant-chat/session/${res.conversationId}`, { replace: true });
    } catch (e: any) {
      setMessages((m) => [...m, { id: 'err', role: 'SYSTEM', content: `❌ Hata: ${e.message}`, createdAt: new Date().toISOString() }]);
    }
  };

  if (!isNew && isLoading) return <LoadingState />;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center gap-2 border-b border-outline-variant bg-surface p-3">
        <button onClick={() => navigate('/assistant-chat')} className="rounded-md p-1.5 hover:bg-surface-variant"><ArrowLeft className="h-4 w-4" /></button>
        <div className="flex-1">
          <p className="text-sm font-semibold">{conv?.title ?? (isNew ? 'Yeni Sohbet' : '...')}</p>
          {config && <p className="text-xs text-on-surface-variant">{config.defaultModel} • {config.temperature}°</p>}
        </div>
        {conv && <p className="text-xs text-on-surface-variant">{conv.messageCount} mesaj • ${conv.totalCostUSD.toFixed(4)}</p>}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12 text-on-surface-variant">
            <Sparkles className="mx-auto h-12 w-12 text-primary opacity-50" />
            <p className="mt-3 text-sm">Asistana bir soru sor veya komut ver.</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {['ABC Ltd. cari bakiyesi', 'Bu ay kaç satış yapıldı', 'Stokta azalan ürünler', 'Dashboard özetini göster'].map((s) => (
                <button key={s} onClick={() => setInput(s)} className="rounded-full border border-outline-variant bg-surface px-3 py-1 text-xs hover:bg-surface-variant">{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={m.id ?? i} message={m} onRate={(rating) => m.id && !m.id.startsWith('temp-') && rateMut.mutate({ id: m.id, rating })} />
        ))}
        {sendMut.isPending && (
          <div className="flex items-start gap-2">
            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">🤖</div>
            <div className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Düşünüyor...
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-outline-variant bg-surface p-3">
        <div className="flex items-end gap-2">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Mesajınızı yazın... (Enter = gönder, Shift+Enter = yeni satır)" rows={2} className="flex-1 rounded-md border border-outline bg-surface px-3 py-2 text-sm resize-none" />
          <button onClick={send} disabled={!input.trim() || sendMut.isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-40">
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-[10px] text-on-surface-variant text-center">AI yanıtları bilgi tabanından gelir. Yanlış cevaplar olabilir, önemli kararlar için doğrulayın.</p>
      </div>
    </div>
  );
}

function MessageBubble({ message, onRate }: { message: any; onRate: (rating: number) => void }) {
  const isUser = message.role === 'USER';
  return (
    <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center text-white text-sm ${isUser ? 'bg-blue-600' : 'bg-primary'}`}>
        {isUser ? '👤' : '🤖'}
      </div>
      <div className={`max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block rounded-lg px-3 py-2 text-sm ${isUser ? 'bg-blue-600 text-white' : 'bg-surface border border-outline-variant'}`}>
          {message.role === 'SYSTEM' ? (
            <span className="text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{message.content}</span>
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </div>
        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-1 space-y-1">
            {message.toolCalls.map((tc: AssistantToolCallResult, i: number) => (
              <div key={i} className="rounded-md border border-blue-300 bg-blue-50 p-2 text-xs">
                <p className="font-semibold text-blue-800">🔧 {tc.toolName}</p>
                {Object.keys(tc.arguments ?? {}).length > 0 && <p className="text-blue-700">Args: {JSON.stringify(tc.arguments)}</p>}
                {tc.result && <pre className="mt-1 text-[10px] text-blue-900 overflow-auto max-h-20">{JSON.stringify(tc.result, null, 2).substring(0, 200)}</pre>}
                {tc.latencyMs !== undefined && <p className="text-[10px] text-blue-600">{tc.latencyMs}ms</p>}
              </div>
            ))}
          </div>
        )}
        {/* KB Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-1 space-y-1">
            <p className="text-[10px] font-semibold text-on-surface-variant">📚 Bilgi Tabanı:</p>
            {message.sources.slice(0, 3).map((s: any, i: number) => (
              <div key={i} className="rounded-md bg-amber-50 border border-amber-200 p-1.5 text-[10px]">
                <p className="font-semibold text-amber-900">{s.title}</p>
                <p className="text-amber-800">{s.snippet}</p>
              </div>
            ))}
          </div>
        )}
        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-on-surface-variant">
          <span>{formatDateTime(message.createdAt)}</span>
          {message.latencyMs && <span>• {message.latencyMs}ms</span>}
          {message.costUSD !== undefined && <span>• ${message.costUSD.toFixed(5)}</span>}
          {!isUser && message.id && !message.id.startsWith('temp-') && (
            <span className="ml-1 flex gap-0.5">
              <button onClick={() => onRate(5)} className="hover:text-green-600"><ThumbsUp className="h-3 w-3" /></button>
              <button onClick={() => onRate(1)} className="hover:text-red-600"><ThumbsDown className="h-3 w-3" /></button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
