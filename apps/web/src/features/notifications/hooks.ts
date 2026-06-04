import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { NotificationInbox } from '@saas/shared';

export function useRecentNotifications(limit = 5) {
  return useQuery({
    queryKey: ['notif', 'recent', limit],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: NotificationInbox[] }>('/notifications-extended/inbox', { params: { pageSize: limit } });
      return data.items;
    },
    refetchInterval: 30_000,
    staleTime: 0,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notif', 'unread-count'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ unread: number }>('/notifications-extended/inbox');
      return { count: data.unread };
    },
    refetchInterval: 30_000,
    staleTime: 0,
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post('/notifications-extended/inbox/read', { ids: [id] });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notif'] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/notifications-extended/inbox/read-all');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notif'] });
    },
  });
}
