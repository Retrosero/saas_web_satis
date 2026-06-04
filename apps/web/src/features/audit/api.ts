import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { DataCheckRule, DataCheckRun, DataCheckResult, DataCheckSchedule, DataCheckStats, DataCheckActionLog } from '@saas/shared';

export function useRules(filters: { checkType?: string; isActive?: boolean; severity?: string; search?: string } = {}) {
  return useQuery({
    queryKey: ['audit', 'rules', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<DataCheckRule[]>('/audit/rules', { params: filters });
      return data;
    },
  });
}

export function useRule(id: string) {
  return useQuery({
    queryKey: ['audit', 'rules', id],
    queryFn: async () => {
      const { data } = await apiClient.get<DataCheckRule>(`/audit/rules/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<DataCheckRule>) => {
      const { data } = await apiClient.post<DataCheckRule>('/audit/rules', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit', 'rules'] }),
  });
}

export function useUpdateRule(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<DataCheckRule>) => {
      const { data } = await apiClient.put<DataCheckRule>(`/audit/rules/${id}`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit', 'rules'] }),
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/audit/rules/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit', 'rules'] }),
  });
}

export function useToggleRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<DataCheckRule>(`/audit/rules/${id}/toggle`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit', 'rules'] }),
  });
}

export function useCloneRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<DataCheckRule>(`/audit/rules/${id}/clone`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit', 'rules'] }),
  });
}

export function useRunRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<DataCheckRun>(`/audit/rules/${id}/run`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit', 'runs'] });
      qc.invalidateQueries({ queryKey: ['audit', 'results'] });
    },
  });
}

export function useRunAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ runCount: number }>('/audit/rules/run-all');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit'] });
    },
  });
}

export function useRuns(params: { ruleId?: string; status?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ['audit', 'runs', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: DataCheckRun[]; total: number; page: number; pageSize: number }>('/audit/runs', { params });
      return data;
    },
  });
}

export function useRun(id: string) {
  return useQuery({
    queryKey: ['audit', 'runs', id],
    queryFn: async () => {
      const { data } = await apiClient.get<DataCheckRun>(`/audit/runs/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useResults(params: { ruleId?: string; checkType?: string; severity?: string; status?: string; entityType?: string; runId?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ['audit', 'results', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: DataCheckResult[]; total: number; page: number; pageSize: number }>('/audit/results', { params });
      return data;
    },
  });
}

export function useResult(id: string) {
  return useQuery({
    queryKey: ['audit', 'results', id],
    queryFn: async () => {
      const { data } = await apiClient.get<DataCheckResult>(`/audit/results/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useAcknowledgeResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<DataCheckResult>(`/audit/results/${id}/acknowledge`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit'] }),
  });
}

export function useFixResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const { data } = await apiClient.post<DataCheckResult>(`/audit/results/${id}/fix`, { note });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit'] }),
  });
}

export function useIgnoreResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data } = await apiClient.post<DataCheckResult>(`/audit/results/${id}/ignore`, { reason });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit'] }),
  });
}

export function useFalsePositive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data } = await apiClient.post<DataCheckResult>(`/audit/results/${id}/false-positive`, { reason });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit'] }),
  });
}

export function useBulkAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, action, note }: { ids: string[]; action: 'fix' | 'ignore' | 'acknowledge'; note?: string }) => {
      const { data } = await apiClient.post<{ count: number }>('/audit/results/bulk', { ids, action, note });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit'] }),
  });
}

export function useSchedules() {
  return useQuery({
    queryKey: ['audit', 'schedules'],
    queryFn: async () => {
      const { data } = await apiClient.get<DataCheckSchedule[]>('/audit/schedules');
      return data;
    },
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<DataCheckSchedule>) => {
      const { data } = await apiClient.post<DataCheckSchedule>('/audit/schedules', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit', 'schedules'] }),
  });
}

export function useUpdateSchedule(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<DataCheckSchedule>) => {
      const { data } = await apiClient.put<DataCheckSchedule>(`/audit/schedules/${id}`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit', 'schedules'] }),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/audit/schedules/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit', 'schedules'] }),
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['audit', 'stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<DataCheckStats>('/audit/stats');
      return data;
    },
  });
}

export function useActionLogs(params: { resultId?: string; actionType?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ['audit', 'logs', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: DataCheckActionLog[]; total: number; page: number; pageSize: number }>('/audit/logs', { params });
      return data;
    },
  });
}
