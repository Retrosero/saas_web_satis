-- FAZ 32: Bildirim Kural Motoru

-- Enums
CREATE TYPE "NotificationTriggerType" AS ENUM ('SALE_CREATED', 'SALE_CANCELLED', 'SALE_OVER_LIMIT', 'COLLECTION_RECEIVED', 'PAYMENT_DUE', 'LOW_STOCK', 'PRICE_CHANGE', 'CAMPAIGN_APPLIED', 'RETURN_CREATED', 'RETURN_APPROVED', 'STOCK_COUNT_VARIANCE', 'CASH_TRANSACTION');
CREATE TYPE "NotificationConditionOperator" AS ENUM ('EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'GREATER_OR_EQUAL', 'LESS_OR_EQUAL', 'CONTAINS', 'IN', 'BETWEEN');
CREATE TYPE "NotificationActionType" AS ENUM ('SEND_NOTIFICATION', 'SEND_EMAIL', 'SEND_SMS', 'CALL_WEBHOOK', 'CREATE_TASK', 'ALERT');
CREATE TYPE "NotificationChannelType" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'WEBHOOK');
CREATE TYPE "NotificationLogStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');
CREATE TYPE "NotificationRecipientType" AS ENUM ('USER', 'ROLE', 'ALL_TENANT_USERS', 'SPECIFIC_USERS', 'CUSTOMER', 'SALESPERSON');

-- Tables
CREATE TABLE "NotificationChannel" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "NotificationChannelType" NOT NULL,
    "description" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "testStatus" TEXT,
    "testAt" TIMESTAMP(3),
    "testError" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "NotificationChannel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationChannelSecret" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationChannelSecret_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerType" "NotificationTriggerType" NOT NULL,
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "actions" JSONB NOT NULL DEFAULT '[]',
    "recipients" JSONB NOT NULL DEFAULT '[]',
    "channels" JSONB NOT NULL DEFAULT '[]',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 0,
    "lastTriggeredAt" TIMESTAMP(3),
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "NotificationRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationRuleChannel" (
    "ruleId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    CONSTRAINT "NotificationRuleChannel_pkey" PRIMARY KEY ("ruleId","channelId")
);

CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ruleId" TEXT,
    "channelId" TEXT,
    "triggerType" "NotificationTriggerType" NOT NULL,
    "recipientType" "NotificationRecipientType" NOT NULL,
    "recipientId" TEXT,
    "recipientName" TEXT,
    "recipientContact" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "status" "NotificationLogStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "error" TEXT,
    "durationMs" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "channels" JSONB NOT NULL DEFAULT '{}',
    "categories" JSONB NOT NULL DEFAULT '{}',
    "quietHours" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NotificationPreferences_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "NotificationPreferences_userId_key" ON "NotificationPreferences"("userId");

-- Indexes
CREATE INDEX "NotificationChannel_tenantId_isDeleted_idx" ON "NotificationChannel"("tenantId", "isDeleted");
CREATE INDEX "NotificationChannel_tenantId_type_idx" ON "NotificationChannel"("type");
CREATE INDEX "NotificationChannel_tenantId_isActive_idx" ON "NotificationChannel"("isActive");
CREATE INDEX "NotificationChannelSecret_channelId_idx" ON "NotificationChannelSecret"("channelId");
CREATE INDEX "NotificationRule_tenantId_isActive_idx" ON "NotificationRule"("isActive");
CREATE INDEX "NotificationRule_tenantId_triggerType_idx" ON "NotificationRule"("triggerType");
CREATE INDEX "NotificationRule_tenantId_isDeleted_idx" ON "NotificationRule"("isDeleted");
CREATE INDEX "NotificationRule_lastTriggeredAt_idx" ON "NotificationRule"("lastTriggeredAt");
CREATE INDEX "NotificationLog_tenantId_createdAt_idx" ON "NotificationLog"("tenantId", "createdAt");
CREATE INDEX "NotificationLog_tenantId_status_idx" ON "NotificationLog"("status");
CREATE INDEX "NotificationLog_ruleId_createdAt_idx" ON "NotificationLog"("ruleId", "createdAt");
CREATE INDEX "NotificationLog_channelId_createdAt_idx" ON "NotificationLog"("channelId", "createdAt");
CREATE INDEX "NotificationLog_recipientId_idx" ON "NotificationLog"("recipientId");

-- Foreign keys
ALTER TABLE "NotificationChannel" ADD CONSTRAINT "NotificationChannel_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "NotificationChannelSecret" ADD CONSTRAINT "NotificationChannelSecret_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "NotificationChannel"("id") ON DELETE CASCADE;
ALTER TABLE "NotificationRule" ADD CONSTRAINT "NotificationRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "NotificationRuleChannel" ADD CONSTRAINT "NotificationRuleChannel_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "NotificationRule"("id") ON DELETE CASCADE;
ALTER TABLE "NotificationRuleChannel" ADD CONSTRAINT "NotificationRuleChannel_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "NotificationChannel"("id") ON DELETE CASCADE;
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "NotificationRule"("id") ON DELETE SET NULL;
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "NotificationChannel"("id") ON DELETE SET NULL;
ALTER TABLE "NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
