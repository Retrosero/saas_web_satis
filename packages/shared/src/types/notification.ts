/** Bildirim tipleri (M3 standart). */
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SYSTEM';

export type NotificationCategory =
  | 'SYSTEM'
  | 'SECURITY'
  | 'TENANT'
  | 'PLAN'
  | 'MODULE'
  | 'USER'
  | 'SALE'
  | 'COLLECTION'
  | 'STOCK'
  | 'ORDER'
  | 'INVOICE'
  | 'REPORT';

export interface Notification {
  id: string;
  tenantId: string | null;
  userId: string | null;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  link: string | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}
