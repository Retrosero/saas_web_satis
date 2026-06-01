import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@saas/shared';

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SYSTEM';
export type NotificationCategory =
  | 'SYSTEM' | 'SECURITY' | 'TENANT' | 'PLAN' | 'MODULE' | 'USER'
  | 'SALE' | 'COLLECTION' | 'STOCK' | 'ORDER' | 'INVOICE' | 'REPORT';

export interface NotificationItem {
  id: string;
  tenantId: string | null;
  userId: string | null;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export const notificationsApi = {
  async list(params: { page?: number; pageSize?: number; isRead?: boolean; category?: string } = {}): Promise<PaginatedResponse<NotificationItem>> {
    const res = await apiClient.get<{ data: PaginatedResponse<NotificationItem> }>('/notifications', { params });
    return res.data.data;
  },

  async unreadCount(): Promise<{ count: number }> {
    const res = await apiClient.get<{ data: { count: number } }>('/notifications/unread-count');
    return res.data.data;
  },

  async recent(limit = 5): Promise<NotificationItem[]> {
    const res = await apiClient.get<{ data: NotificationItem[] }>('/notifications/recent', { params: { limit } });
    return res.data.data;
  },

  async markAsRead(id: string): Promise<NotificationItem> {
    const res = await apiClient.patch<{ data: NotificationItem }>(`/notifications/${id}/read`);
    return res.data.data;
  },

  async markAllAsRead(): Promise<{ updated: number }> {
    const res = await apiClient.patch<{ data: { updated: number } }>('/notifications/mark-all-read');
    return res.data.data;
  },

  async remove(id: string): Promise<{ deleted: boolean }> {
    const res = await apiClient.delete<{ data: { deleted: boolean } }>(`/notifications/${id}`);
    return res.data.data;
  },
};
