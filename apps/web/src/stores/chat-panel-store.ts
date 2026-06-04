import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChatPanelState {
  isOpen: boolean;
  conversationId?: string;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setConversationId: (id?: string) => void;
}

export const useChatPanelStore = create<ChatPanelState>()(
  persist(
    (set) => ({
      isOpen: false,
      conversationId: undefined,
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setConversationId: (id) => set({ conversationId: id }),
    }),
    { name: 'mavis-chat-panel' },
  ),
);
