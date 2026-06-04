import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApprovalRule, ApprovalRequest, ApprovalStats } from '@saas/shared';

export function useRules(filters: { triggerType?: string; isActive?: boolean; search?: string } = {}) {
  return useQuery({
    queryKey: ['approvals', 'rules', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<ApprovalRule[]>('/approvals/rules', { params: filters });
      return data;
    },
  });
}

export function useRule(id: string) {
  return useQuery({
    queryKey: ['approvals', 'rules', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApprovalRule>(`/approvals/rules/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ApprovalRule>) => {
      const { data } = await apiClient.post<ApprovalRule>('/approvals/rules', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals', 'rules'] }),
  });
}

export function useUpdateRule(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ApprovalRule>) => {
      const { data } = await apiClient.put<ApprovalRule>(`/approvals/rules/${id}`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals', 'rules'] }),
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/approvals/rules/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals', 'rules'] }),
  });
}

export function useToggleRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<ApprovalRule>(`/approvals/rules/${id}/toggle`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals', 'rules'] }),
  });
}

export function useRequests(params: { status?: string; ruleId?: string; triggerType?: string; requesterId?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ['approvals', 'requests', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: ApprovalRequest[]; total: number; page: number; pageSize: number }>('/approvals/requests', { params });
      return data;
    },
  });
}

export function useRequest(id: string) {
  return useQuery({
    queryKey: ['approvals', 'requests', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApprovalRequest>(`/approvals/requests/${id}`);
      return data;
    },
    enabled: !!id,
    refetchInterval: 15_000,
  });
}

export function useMyPending() {
  return useQuery({
    queryKey: ['approvals', 'requests', 'my-pending'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApprovalRequest[]>('/approvals/requests/my-pending');
      return data;
    },
    refetchInterval: 15_000,
  });
}

export function useMyRequests() {
  return useQuery({
    queryKey: ['approvals', 'requests', 'my'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApprovalRequest[]>('/approvals/requests/my');
      return data;
    },
  });
}

export function useActOnRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; actionType: string; comment?: string; delegatedToId?: string; delegatedToName?: string }) => {
      const { data } = await apiClient.post<ApprovalRequest>(`/approvals/requests/${id}/act`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useCancelRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      const { data } = await apiClient.post<ApprovalRequest>(`/approvals/requests/${id}/cancel`, { comment });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals'] }),
  });
}

export function useSubmitRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const { data } = await apiClient.post<ApprovalRequest>('/approvals/requests', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals', 'requests'] }),
  });
}

export function useApprovalStats(params: { from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: ['approvals', 'stats', params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApprovalStats>('/approvals/stats', { params });
      return data;
    },
  });
}
