/**
 * API & Webhook yönetimi enumları.
 *
 * 3rd party entegrasyonlar için API anahtarları ve webhook'lar.
 * Secret-key'ler SHA-256 hash'lenerek saklanır (asla plain text değil).
 */

export const ApiKeyStatus = {
  ACTIVE: 'ACTIVE',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED',
} as const;
export type ApiKeyStatus = (typeof ApiKeyStatus)[keyof typeof ApiKeyStatus];

/** API scope'ları (resource:action) */
export const ApiScope = {
  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_WRITE: 'customers:write',
  PRODUCTS_READ: 'products:read',
  PRODUCTS_WRITE: 'products:write',
  STOCK_READ: 'stock:read',
  STOCK_WRITE: 'stock:write',
  ORDERS_READ: 'orders:read',
  ORDERS_CREATE: 'orders:create',
  ORDERS_CANCEL: 'orders:cancel',
  COLLECTIONS_READ: 'collections:read',
  COLLECTIONS_CREATE: 'collections:create',
  REPORTS_READ: 'reports:read',
  WEBHOOKS_MANAGE: 'webhooks:manage',
} as const;
export type ApiScope = (typeof ApiScope)[keyof typeof ApiScope];

export const WebhookEventType = {
  ORDER_CREATED: 'order.created',
  ORDER_STATUS_CHANGED: 'order.status_changed',
  STOCK_CHANGED: 'stock.changed',
  CUSTOMER_UPDATED: 'customer.updated',
  COLLECTION_RECEIVED: 'collection.received',
  SYNC_ERROR: 'sync.error',
  INVOICE_CREATED: 'invoice.created',
  RETURN_COMPLETED: 'return.completed',
} as const;
export type WebhookEventType = (typeof WebhookEventType)[keyof typeof WebhookEventType];

export const WebhookStatus = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  FAILED: 'FAILED',
  REVOKED: 'REVOKED',
} as const;
export type WebhookStatus = (typeof WebhookStatus)[keyof typeof WebhookStatus];

export const WebhookDeliveryStatus = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  RETRYING: 'RETRYING',
  ABANDONED: 'ABANDONED',
} as const;
export type WebhookDeliveryStatus = (typeof WebhookDeliveryStatus)[keyof typeof WebhookDeliveryStatus];

export const ApiKeyStatusLabel: Record<ApiKeyStatus, string> = {
  ACTIVE: 'Aktif', REVOKED: 'İptal Edildi', EXPIRED: 'Süresi Doldu',
};

export const WebhookEventTypeLabel: Record<WebhookEventType, string> = {
  'order.created': 'Sipariş Oluşturuldu',
  'order.status_changed': 'Sipariş Durumu Değişti',
  'stock.changed': 'Stok Değişti',
  'customer.updated': 'Cari Güncellendi',
  'collection.received': 'Tahsilat Alındı',
  'sync.error': 'Senkron Hatası Oluştu',
  'invoice.created': 'Fatura Oluşturuldu',
  'return.completed': 'İade Tamamlandı',
};

export const WebhookStatusLabel: Record<WebhookStatus, string> = {
  ACTIVE: 'Aktif', PAUSED: 'Duraklatıldı', FAILED: 'Başarısız', REVOKED: 'İptal',
};

export const WebhookDeliveryStatusLabel: Record<WebhookDeliveryStatus, string> = {
  PENDING: 'Bekliyor', SUCCESS: 'Başarılı', FAILED: 'Başarısız', RETRYING: 'Yeniden Deneniyor', ABANDONED: 'Vazgeçildi',
};
