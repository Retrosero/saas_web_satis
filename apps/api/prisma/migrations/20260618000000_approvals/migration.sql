-- FAZ 33: Onay Akışları

CREATE TYPE "ApprovalTriggerType" AS ENUM ('SALE_OVER_LIMIT', 'DISCOUNT_OVER', 'RETURN_OVER', 'PRICE_CHANGE', 'COLLECTION_WRITE_OFF', 'EXPENSE_OVER', 'EMPLOYEE_ADD', 'CASH_TRANSFER_OVER', 'INVOICE_CANCEL', 'CAMPAIGN_OVER', 'STOCK_COUNT_OVER', 'WAREHOUSE_TRANSFER');
CREATE TYPE "ApprovalMode" AS ENUM ('SEQUENTIAL', 'PARALLEL', 'UNANIMOUS');
CREATE TYPE "ApprovalStepType" AS ENUM ('ROLE_BASED', 'USER_BASED', 'DYNAMIC_FIELD', 'SPECIFIC_USERS');
CREATE TYPE "ApprovalRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'DELEGATED');
CREATE TYPE "ApprovalActionType" AS ENUM ('APPROVED', 'REJECTED', 'DELEGATED', 'RETURNED', 'COMMENTED');
CREATE TYPE "ApprovalPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

CREATE TABLE "ApprovalRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerType" "ApprovalTriggerType" NOT NULL,
    "moduleName" TEXT,
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "mode" "ApprovalMode" NOT NULL DEFAULT 'SEQUENTIAL',
    "amountField" TEXT,
    "amountThreshold" DECIMAL(18,4),
    "expiryHours" INTEGER NOT NULL DEFAULT 72,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "lastTriggeredAt" TIMESTAMP(3),
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "ApprovalRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApprovalStep" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "stepType" "ApprovalStepType" NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "requireAll" BOOLEAN NOT NULL DEFAULT false,
    "minApprovals" INTEGER NOT NULL DEFAULT 1,
    "timeoutHours" INTEGER,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApprovalStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "ruleName" TEXT NOT NULL,
    "triggerType" "ApprovalTriggerType" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityNumber" TEXT,
    "entityLabel" TEXT NOT NULL,
    "amount" DECIMAL(18,4),
    "amountCurrency" TEXT DEFAULT 'TRY',
    "requesterId" TEXT NOT NULL,
    "requesterName" TEXT,
    "requesterData" JSONB NOT NULL DEFAULT '{}',
    "priority" "ApprovalPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "ApprovalRequestStatus" NOT NULL DEFAULT 'PENDING',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "totalSteps" INTEGER NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "finalComment" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApprovalAction" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "stepName" TEXT NOT NULL,
    "actionType" "ApprovalActionType" NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT,
    "actorRole" TEXT,
    "comment" TEXT,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "delegatedToId" TEXT,
    "delegatedToName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApprovalAction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApprovalStep_ruleId_stepOrder_key" ON "ApprovalStep"("ruleId", "stepOrder");

CREATE INDEX "ApprovalRule_tenantId_isActive_idx" ON "ApprovalRule"("isActive");
CREATE INDEX "ApprovalRule_tenantId_isDeleted_idx" ON "ApprovalRule"("isDeleted");
CREATE INDEX "ApprovalRule_triggerType_idx" ON "ApprovalRule"("triggerType");
CREATE INDEX "ApprovalRule_lastTriggeredAt_idx" ON "ApprovalRule"("lastTriggeredAt");
CREATE INDEX "ApprovalStep_ruleId_stepOrder_idx" ON "ApprovalStep"("ruleId", "stepOrder");
CREATE INDEX "ApprovalRequest_tenantId_status_idx" ON "ApprovalRequest"("status");
CREATE INDEX "ApprovalRequest_tenantId_createdAt_idx" ON "ApprovalRequest"("tenantId", "createdAt");
CREATE INDEX "ApprovalRequest_requesterId_idx" ON "ApprovalRequest"("requesterId");
CREATE INDEX "ApprovalRequest_ruleId_status_idx" ON "ApprovalRequest"("ruleId", "status");
CREATE INDEX "ApprovalRequest_entityType_entityId_idx" ON "ApprovalRequest"("entityType", "entityId");
CREATE INDEX "ApprovalRequest_expiresAt_idx" ON "ApprovalRequest"("expiresAt");
CREATE INDEX "ApprovalAction_requestId_createdAt_idx" ON "ApprovalAction"("requestId", "createdAt");
CREATE INDEX "ApprovalAction_actorId_idx" ON "ApprovalAction"("actorId");
CREATE INDEX "ApprovalAction_stepId_idx" ON "ApprovalAction"("stepId");

ALTER TABLE "ApprovalRule" ADD CONSTRAINT "ApprovalRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ApprovalRule"("id") ON DELETE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ApprovalRule"("id") ON DELETE CASCADE;
ALTER TABLE "ApprovalAction" ADD CONSTRAINT "ApprovalAction_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ApprovalRequest"("id") ON DELETE CASCADE;
ALTER TABLE "ApprovalAction" ADD CONSTRAINT "ApprovalAction_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "ApprovalStep"("id") ON DELETE CASCADE;
