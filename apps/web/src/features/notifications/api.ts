import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { NotificationChannel, NotificationRule, NotificationLog, NotificationInbox } from '@saas/shared';

export function useChannels(filters: { type?: string; isActive?: boolean; search?: string } = {}) {
  return useQuery({
    queryKey: ['notif', 'channels', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: NotificationChannel[] }>('/notifications-extended/channels', { params: filters });
      return data.data;
    },
  });
}

export function useChannel(id: string) {
  return useQuery({
    queryKey: ['notif', 'channels', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: NotificationChannel }>(`/notifications-extended/channels/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<NotificationChannel>) => {
      const { data } = await apiClient.post<NotificationChannel>('/notifications-extended/channels', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notif', 'channels'] }),
  });
}

export function useUpdateChannel(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<NotificationChannel>) => {
      const { data } = await apiClient.put<NotificationChannel>(`/notifications-extended/channels/${id}`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notif', 'channels'] }),
  });
}

export function useDeleteChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/notifications-extended/channels/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notif', 'channels'] }),
  });
}

export function useTestChannel() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<{ status: 'OK' | 'FAILED'; message: string; durationMs: number }>(`/notifications-extended/channels/${id}/test`);
      return data;
    },
  });
}

export function useRules(filters: { triggerType?: string; isActive?: boolean; search?: string } = {}) {
  return useQuery({
    queryKey: ['notif', 'rules', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: NotificationRule[] }>('/notifications-extended/rules', { params: filters });
      return data.data;
    },
  });
}

export function useRule(id: string) {
  return useQuery({
    queryKey: ['notif', 'rules', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: NotificationRule }>(`/notifications-extended/rules/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<NotificationRule>) => {
      const { data } = await apiClient.post<NotificationRule>('/notifications-extended/rules', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notif', 'rules'] }),
  });
}

export function useUpdateRule(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<NotificationRule>) => {
      const { data } = await apiClient.put<NotificationRule>(`/notifications-extended/rules/${id}`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notif', 'rules'] }),
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/notifications-extended/rules/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notif', 'rules'] }),
  });
}

export function useToggleRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<NotificationRule>(`/notifications-extended/rules/${id}/toggle`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notif', 'rules'] }),
  });
}

export function usePreviewRule(id: string) {
  return useMutation({
    mutationFn: async (sample: Record<string, any>) => {
      const { data } = await apiClient.post<{ renderedSubject?: string; renderedBody: string; matchedRecipients: number }>(`/notifications-extended/rules/${id}/preview`, sample);
      return data;
    },
  });
}

export function useLogs(params: { status?: string; ruleId?: string; channelId?: string; triggerType?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ['notif', 'logs', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { items: NotificationLog[]; total: number; page: number; pageSize: number } }>('/notifications-extended/logs', { params });
      return data.data;
    },
  });
}

export function useInbox(params: { isRead?: boolean; category?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ['notif', 'inbox', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { items: NotificationInbox[]; total: number; unread: number } }>('/notifications-extended/inbox', { params });
      return data.data;
    },
    refetchInterval: 30_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await apiClient.post('/notifications-extended/inbox/read', { ids });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notif', 'inbox'] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => { await apiClient.post('/notifications-extended/inbox/read-all'); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notif', 'inbox'] }),
  });
}

export function useTrigger() {
  return useMutation({
    mutationFn: async ({ type, payload, sample }: { type: string; payload: any; sample?: any }) => {
      const { data } = await apiClient.post(`/notifications-extended/trigger/${type}`, { payload, sample });
      return data;
    },
  });
}
