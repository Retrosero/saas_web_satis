import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { AIAuditLog, AITrainingEntry, AITrainingDataset, AIGlobalStats, AIExportResult } from '@saas/shared';
import { AIAuditAction, AIFeedbackType, AITrainingFormat } from '@saas/shared';

export function useGlobalStats(days = 30) {
  return useQuery({
    queryKey: ['ai-obs', 'stats', days],
    queryFn: async () => {
      const { data } = await apiClient.get<AIGlobalStats>('/ai-observability/stats', { params: { days } });
      return data;
    },
  });
}

export function useAllConversations(filters: { tenantId?: string; userId?: string; status?: string; from?: string; to?: string; minCost?: number; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ['ai-obs', 'conversations', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: any[]; total: number; page: number; pageSize: number }>('/ai-observability/conversations', { params: filters });
      return data;
    },
  });
}

export function useConversationDetail(id: string) {
  return useQuery({
    queryKey: ['ai-obs', 'conversations', id],
    queryFn: async () => {
      const { data } = await apiClient.get<any>(`/ai-observability/conversations/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useAuditLogs(filters: { tenantId?: string; userId?: string; action?: AIAuditAction; severity?: string; from?: string; to?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ['ai-obs', 'audit-logs', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: AIAuditLog[]; total: number; page: number; pageSize: number }>('/ai-observability/audit-logs', { params: filters });
      return data;
    },
  });
}

export function useTrainingEntries(filters: { tenantId?: string; feedback?: AIFeedbackType; model?: string; rating?: number; isExported?: boolean; from?: string; to?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ['ai-obs', 'training-entries', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: AITrainingEntry[]; total: number; page: number; pageSize: number }>('/ai-observability/training-entries', { params: filters });
      return data;
    },
  });
}

export function useCorrectEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, correctedAnswer, feedbackNote }: { id: string; correctedAnswer: string; feedbackNote?: string }) => {
      const { data } = await apiClient.post(`/ai-observability/training-entries/${id}/correct`, { correctedAnswer, feedbackNote });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-obs'] }),
  });
}

export function useDatasets() {
  return useQuery({
    queryKey: ['ai-obs', 'datasets'],
    queryFn: async () => {
      const { data } = await apiClient.get<AITrainingDataset[]>('/ai-observability/datasets');
      return data;
    },
  });
}

export function useCreateDataset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string; format: AITrainingFormat; includeOnlyPositive?: boolean; includeCorrected?: boolean; filterModel?: string; filterFrom?: string; filterTo?: string }) => {
      const { data } = await apiClient.post<AITrainingDataset>('/ai-observability/datasets', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-obs', 'datasets'] }),
  });
}

export function useGenerateDataset() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<AIExportResult>(`/ai-observability/datasets/${id}/generate`);
      return data;
    },
  });
}

export function useDeleteDataset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/ai-observability/datasets/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-obs', 'datasets'] }),
  });
}
