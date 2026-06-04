import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { TenantLLMConfig, AssistantConversation, AssistantMessage, ChatResponse, AssistantUsageStats } from '@saas/shared';
import { LLMProvider, AssistantConversationStatus } from '@saas/shared';

export function useLLMConfig() {
  return useQuery({
    queryKey: ['assistant-chat', 'config'],
    queryFn: async () => {
      const { data } = await apiClient.get<TenantLLMConfig | null>('/assistant-chat/config');
      return data;
    },
  });
}

export function useUpsertConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { provider: LLMProvider; apiKey: string; baseUrl?: string; defaultModel?: string; fallbackModel?: string; maxTokens?: number; temperature?: number; topP?: number; systemPrompt?: string; enabledModules?: string[]; rateLimitPerHour?: number; monthlyBudgetUSD?: number; toolPermissions?: string[] }) => {
      const { data } = await apiClient.post<TenantLLMConfig>('/assistant-chat/config', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assistant-chat'] }),
  });
}

export function useDeleteConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => { await apiClient.delete('/assistant-chat/config'); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assistant-chat'] }),
  });
}

export function useTestConfig() {
  return useMutation({
    mutationFn: async (input: { provider: LLMProvider; apiKey: string; baseUrl?: string; defaultModel?: string }) => {
      const { data } = await apiClient.post<{ ok: boolean; message: string; latencyMs: number; model: string }>('/assistant-chat/config/test', input);
      return data;
    },
  });
}

export function useConversations(filters: { status?: AssistantConversationStatus; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ['assistant-chat', 'conversations', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: AssistantConversation[]; total: number; page: number; pageSize: number }>('/assistant-chat/conversations', { params: filters });
      return data;
    },
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['assistant-chat', 'conversations', id],
    queryFn: async () => {
      const { data } = await apiClient.get<AssistantConversation>(`/assistant-chat/conversations/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateConversation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title?: string; status?: AssistantConversationStatus }) => {
      const { data } = await apiClient.put<AssistantConversation>(`/assistant-chat/conversations/${id}`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assistant-chat', 'conversations'] }),
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/assistant-chat/conversations/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assistant-chat', 'conversations'] }),
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { conversationId?: string; message: string; model?: string; temperature?: number; maxTokens?: number }) => {
      const { data } = await apiClient.post<ChatResponse>('/assistant-chat/chat', input);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['assistant-chat', 'conversations'] });
      qc.invalidateQueries({ queryKey: ['assistant-chat', 'conversations', data.conversationId] });
    },
  });
}

export function useRateMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, rating, note }: { id: string; rating: number; note?: string }) => {
      await apiClient.post(`/assistant-chat/messages/${id}/rate`, { rating, note });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assistant-chat', 'conversations'] }),
  });
}

export function useStats(days = 30) {
  return useQuery({
    queryKey: ['assistant-chat', 'stats', days],
    queryFn: async () => {
      const { data } = await apiClient.get<AssistantUsageStats>('/assistant-chat/stats', { params: { days } });
      return data;
    },
  });
}

export function useKBSearch(q: string, module?: string) {
  return useQuery({
    queryKey: ['assistant-chat', 'kb', q, module],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>('/assistant-chat/kb/search', { params: { q, module } });
      return data;
    },
    enabled: q.length >= 3,
  });
}
