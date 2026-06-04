import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { MessageSquare, Plus, Settings, Trash2, BarChart3, Search, X, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useConversations, useDeleteConversation, useUpdateConversation, useLLMConfig, useSendMessage } from '@/features/assistant-chat/api';
import { formatRelative, type AssistantConversation } from '@saas/shared';

export function ChatHomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<AssistantConversation | null>(null);
  const [newPrompt, setNewPrompt] = useState('');
  const { data, isLoading, error, refetch } = useConversations();
  const { data: config } = useLLMConfig();
  const delMut = useDeleteConversation();
  const sendMut = useSendMessage();

  const conversations = data?.items.filter((c) => c.title.toLowerCase().includes(search.toLowerCase())) ?? [];

  const startNew = async () => {
    if (!newPrompt.trim()) { navigate('/assistant-chat/session/new'); return; }
    const res = await sendMut.mutateAsync({ message: newPrompt });
    navigate(`/assistant-chat/session/${res.conversationId}`);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="AI Asistan"
        description={config ? `${config.provider} • ${config.defaultModel}` : 'Yapılandırma gerekli'}
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate('/assistant-chat/config')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><Settings className="h-4 w-4" /> Ayarlar</button>
            <button onClick={() => navigate('/assistant-chat/stats')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><BarChart3 className="h-4 w-4" /> İstatistik</button>
            <button onClick={() => navigate('/assistant-chat/session/new')} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Plus className="h-4 w-4" /> Yeni Sohbet</button>
          </div>
        }
      />

      {!config && (
        <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">⚠️ LLM yapılandırması gerekli</p>
          <p className="mt-1">Asistanı kullanmak için önce API anahtarı girin. <button onClick={() => navigate('/assistant-chat/config')} className="underline">Ayarlar'a gidin</button></p>
        </div>
      )}

      {/* Hızlı Başlat */}
      <section className="rounded-lg border-2 border-primary bg-primary-container/20 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">Hızlı Sor</h3>
        </div>
        <div className="mt-2 flex gap-2">
          <input value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && startNew()} placeholder="Örn: ABC Ltd. cari hesap bakiyesi ne kadar?" className="flex-1 rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
          <button onClick={startNew} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">Gönder</button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {['ABC Ltd. bakiyesi', 'Bu ay tahsilat', 'Kritik stok', 'Stoktaki Ürün X', 'Dashboard özeti'].map((s) => (
            <button key={s} onClick={() => setNewPrompt(s)} className="rounded-full border border-outline-variant bg-surface px-2 py-0.5 text-xs hover:bg-surface-variant/50">{s}</button>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-on-surface-variant" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Konuşmalarda ara..." className="w-full rounded-md border border-outline bg-surface pl-8 pr-3 py-2 text-sm" />
        </div>
      </div>

      {isLoading ? <LoadingState /> : error ? <ErrorState message="Konuşmalar yüklenemedi" onRetry={refetch} /> : conversations.length === 0 ? (
        <EmptyState icon={<MessageSquare className="h-12 w-12" />} title="Henüz sohbet yok" description="Yukarıdan bir soru sorarak başlayın" />
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <div key={c.id} onClick={() => navigate(`/assistant-chat/session/${c.id}`)} className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface p-3 hover:shadow-sm cursor-pointer">
              <div className="h-10 w-10 rounded-full bg-primary-container flex items-center justify-center text-lg">💬</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{c.title}</p>
                <p className="text-xs text-on-surface-variant">{c.messageCount} mesaj • {c.totalTokens} token • ${c.totalCostUSD.toFixed(4)}</p>
                <p className="text-xs text-on-surface-variant">Son: {formatRelative(c.lastMessageAt)}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(c); }} className="text-red-600 hover:bg-red-50 rounded p-1.5"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal open={!!confirmDelete} title="Sohbet Silinsin mi?" description={confirmDelete?.title} confirmText="Sil" variant="danger" onClose={() => setConfirmDelete(null)} onConfirm={async () => { if (confirmDelete) { await delMut.mutateAsync(confirmDelete.id); setConfirmDelete(null); } }} />
    </div>
  );
}
