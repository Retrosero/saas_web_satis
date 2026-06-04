-- =====================================================================
-- FAZ 25 — API & WEBHOOK MODÜLÜ MİGRATİONU
-- =====================================================================
-- 4 tablo: ApiKey, ApiKeyUsageLog, Webhook, WebhookDelivery
-- Secret-key'ler SHA-256 hash'lenir, asla plain text saklanmaz
-- =====================================================================

-- Enums
CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');
CREATE TYPE "WebhookStatus" AS ENUM ('ACTIVE', 'PAUSED', 'FAILED', 'REVOKED');
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'RETRYING', 'ABANDONED');

-- ApiKey
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHint" TEXT NOT NULL,
    "scopes" TEXT[],
    "status" "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");
CREATE INDEX "api_keys_tenantId_status_idx" ON "api_keys"("tenantId", "status");
CREATE INDEX "api_keys_tenantId_isDeleted_idx" ON "api_keys"("tenantId", "isDeleted");
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ApiKeyUsageLog
CREATE TABLE "api_key_usage_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "api_key_usage_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "api_key_usage_logs_tenantId_apiKeyId_createdAt_idx" ON "api_key_usage_logs"("tenantId", "apiKeyId", "createdAt");
CREATE INDEX "api_key_usage_logs_tenantId_statusCode_idx" ON "api_key_usage_logs"("tenantId", "statusCode");
ALTER TABLE "api_key_usage_logs" ADD CONSTRAINT "api_key_usage_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "api_key_usage_logs" ADD CONSTRAINT "api_key_usage_logs_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Webhook
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[],
    "status" "WebhookStatus" NOT NULL DEFAULT 'ACTIVE',
    "secretHash" TEXT NOT NULL,
    "secretPrefix" TEXT NOT NULL,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastDeliveryAt" TIMESTAMP(3),
    "lastDeliveryStatus" "WebhookDeliveryStatus",
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "webhooks_tenantId_status_idx" ON "webhooks"("tenantId", "status");
CREATE INDEX "webhooks_tenantId_isDeleted_idx" ON "webhooks"("tenantId", "isDeleted");
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- WebhookDelivery
CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "duration" INTEGER,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "webhook_deliveries_tenantId_webhookId_deliveredAt_idx" ON "webhook_deliveries"("tenantId", "webhookId", "deliveredAt");
CREATE INDEX "webhook_deliveries_tenantId_status_idx" ON "webhook_deliveries"("tenantId", "status");
CREATE INDEX "webhook_deliveries_tenantId_eventType_idx" ON "webhook_deliveries"("tenantId", "eventType");
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
