import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from './api';

export type { NotificationItem, NotificationType, NotificationCategory } from './api';

export function useNotifications(params: { page?: number; pageSize?: number; isRead?: boolean; category?: string } = {}) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsApi.list(params),
    staleTime: 10_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 30_000, // 30 saniyede bir otomatik yenile (real-time polling)
    staleTime: 0,
  });
}

export function useRecentNotifications(limit = 5) {
  return useQuery({
    queryKey: ['notifications', 'recent', limit],
    queryFn: () => notificationsApi.recent(limit),
    refetchInterval: 30_000,
    staleTime: 0,
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
