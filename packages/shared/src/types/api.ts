import type {
  ApiKeyStatus,
  ApiScope,
  WebhookDeliveryStatus,
  WebhookEventType,
  WebhookStatus,
} from '../enums/api.enum.js';

export interface ApiKey {
  id: string;
  tenantId: string;
  name: string;
  keyPrefix: string;        // "saas_live_abc123" — sadece ilk kısım gösterilir
  keyHint: string;          // "...xyz4" — son 4 karakter
  scopes: ApiScope[];
  status: ApiKeyStatus;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Webhook {
  id: string;
  tenantId: string;
  name: string;
  url: string;
  events: WebhookEventType[];
  status: WebhookStatus;
  secretPrefix: string;     // "whsec_xxxx" (son 4)
  successCount: number;
  failureCount: number;
  lastDeliveryAt: string | null;
  lastDeliveryStatus: WebhookDeliveryStatus | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDelivery {
  id: string;
  tenantId: string;
  webhookId: string;
  eventType: WebhookEventType;
  payload: Record<string, any>;
  responseStatus: number | null;
  responseBody: string | null;
  duration: number | null;   // ms
  attempt: number;
  status: WebhookDeliveryStatus;
  errorMessage: string | null;
  deliveredAt: string;
}

export interface ApiKeyUsageLog {
  id: string;
  tenantId: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}
