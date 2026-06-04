import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, X, Sparkles, Loader2, Wrench, ThumbsUp, ThumbsDown, Plus, Maximize2, BookOpen } from 'lucide-react';
import { useChatPanelStore } from '@/stores/chat-panel-store';
import { useSendMessage, useConversations, useDeleteConversation } from '@/features/assistant-chat/api';
import { formatDateTime, type AssistantMessage } from '@saas/shared';
import { useQueryClient } from '@tanstack/react-query';

export function ChatPanel() {
  const { isOpen, close, conversationId, setConversationId } = useChatPanelStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const sendMut = useSendMessage();
  const { data: convsData } = useConversations({ pageSize: 5 });
  const delMut = useDeleteConversation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && conversationId) {
      // Konuşma mesajlarını yükle
      qc.fetchQuery({ queryKey: ['assistant-chat', 'conversations', conversationId] }).then((d: any) => {
        if (d?.data?.messages) setMessages(d.data.messages);
      });
    }
  }, [isOpen, conversationId, qc]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        useChatPanelStore.getState().toggle();
      }
      if (e.key === 'Escape' && isOpen) close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  const startNew = () => {
    setConversationId(undefined);
    setMessages([]);
  };

  const send = async () => {
    if (!input.trim() || sendMut.isPending) return;
    const userMsg = input;
    setInput('');
    const tempUser: AssistantMessage = { id: 'temp-' + Date.now(), conversationId: conversationId ?? '', role: 'USER' as any, content: userMsg, toolCalls: [], metadata: {}, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, tempUser]);

    try {
      const res = await sendMut.mutateAsync({ conversationId, message: userMsg });
      setConversationId(res.conversationId);
      setMessages((m) => [...m.filter((x) => x.id !== tempUser.id), res.userMessage, res.assistantMessage]);
    } catch (e: any) {
      setMessages((m) => [...m, { id: 'err', conversationId: '', role: 'SYSTEM' as any, content: `❌ ${e.message}`, toolCalls: [], metadata: {}, createdAt: new Date().toISOString() }]);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={close} />
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface shadow-2xl border-l border-outline-variant">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-outline-variant p-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <p className="flex-1 text-sm font-semibold">AI Asistan</p>
          <button onClick={startNew} title="Yeni Sohbet" className="rounded p-1.5 hover:bg-surface-variant"><Plus className="h-4 w-4" /></button>
          <button onClick={() => navigate('/assistant-chat')} title="Tam ekran aç" className="rounded p-1.5 hover:bg-surface-variant"><Maximize2 className="h-4 w-4" /></button>
          <button onClick={close} title="Kapat (Esc)" className="rounded p-1.5 hover:bg-surface-variant"><X className="h-4 w-4" /></button>
        </div>

        {/* Konuşma listesi (compact) */}
        {convsData && convsData.items.length > 0 && (
          <div className="border-b border-outline-variant bg-surface-variant/20 p-2 max-h-32 overflow-auto">
            <p className="mb-1 text-[10px] font-semibold text-on-surface-variant">Son Konuşmalar</p>
            {convsData.items.map((c) => (
              <button
                key={c.id}
                onClick={() => setConversationId(c.id)}
                className={`w-full truncate rounded px-2 py-1 text-left text-xs hover:bg-surface-variant/50 ${conversationId === c.id ? 'bg-primary-container/30 font-semibold' : ''}`}
              >
                💬 {c.title}
                {c.title !== 'Yeni Sohbet' && (
                  <span onClick={async (e) => { e.stopPropagation(); await delMut.mutateAsync(c.id); }} className="ml-1 text-red-500">×</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Mesajlar */}
        <div ref={scrollRef} className="flex-1 overflow-auto p-3 space-y-2">
          {messages.length === 0 && (
            <div className="text-center py-8 text-on-surface-variant">
              <Sparkles className="mx-auto h-10 w-10 text-primary opacity-50" />
              <p className="mt-2 text-xs">Asistana bir soru sor.</p>
              <div className="mt-3 space-y-1">
                {['ABC bakiyesi', 'Bu ay satış', 'Kritik stok', 'Dashboard'].map((s) => (
                  <button key={s} onClick={() => setInput(s)} className="block w-full rounded-full border border-outline-variant bg-surface px-2 py-1 text-xs hover:bg-surface-variant">{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={m.id ?? i} className={`flex ${m.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${m.role === 'USER' ? 'bg-blue-600 text-white' : m.role === 'SYSTEM' ? 'bg-red-100 text-red-800' : 'bg-surface-variant'}`}>
                <div className="whitespace-pre-wrap">{m.content}</div>
                {m.toolCalls && m.toolCalls.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {m.toolCalls.map((tc, j) => (
                      <div key={j} className="rounded bg-white/50 px-1.5 py-0.5 text-[10px]">
                        🔧 {tc.toolName} ({tc.latencyMs}ms)
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-0.5 flex items-center gap-1 text-[9px] opacity-70">
                  {formatDateTime(m.createdAt)}
                  {m.costUSD !== undefined && ` • $${m.costUSD.toFixed(4)}`}
                </div>
              </div>
            </div>
          ))}
          {sendMut.isPending && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-surface-variant px-3 py-2 text-xs flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Düşünüyor...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-outline-variant p-2">
          <div className="flex items-end gap-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Sor... (Enter gönder)"
              rows={1}
              className="flex-1 resize-none rounded-md border border-outline bg-surface px-2 py-1.5 text-xs"
            />
            <button onClick={send} disabled={!input.trim() || sendMut.isPending} className="rounded-md bg-primary p-2 text-white disabled:opacity-40">
              <Send className="h-3 w-3" />
            </button>
          </div>
          <p className="mt-1 text-center text-[9px] text-on-surface-variant">Ctrl+K aç/kapat • Esc kapat</p>
        </div>
      </div>
    </>
  );
}

export function ChatFloatingButton() {
  const { isOpen, toggle, open } = useChatPanelStore();
  if (isOpen) return null;
  return (
    <button
      onClick={open}
      title="AI Asistan (Ctrl+K)"
      className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:shadow-xl transition hover:scale-105 md:bottom-6"
    >
      <Sparkles className="h-6 w-6" />
      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">AI</span>
    </button>
  );
}
