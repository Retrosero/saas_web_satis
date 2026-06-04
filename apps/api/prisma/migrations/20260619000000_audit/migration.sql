-- FAZ 34: Denetim / Veri Tutarlılığı

CREATE TYPE "DataCheckType" AS ENUM ('MISSING_CUSTOMER_BALANCE', 'MISSING_PRODUCT_BARCODE', 'NEGATIVE_STOCK', 'DUPLICATE_INVOICE_NUMBER', 'ORPHANED_PAYMENT', 'STOCK_BALANCE_MISMATCH', 'CUSTOMER_NO_CONTACT', 'CASH_MOVEMENT_MISSING_DOC', 'PRICE_BELOW_COST', 'DISCOUNT_OVER_LIMIT', 'INACTIVE_PRODUCT_SOLD', 'INACTIVE_CUSTOMER_SALE', 'STOCK_NO_WAREHOUSE', 'RETURN_NO_REASON', 'COLLECTION_OVERDUE', 'TAX_NUMBER_INVALID', 'EMAIL_INVALID', 'PHONE_INVALID');
CREATE TYPE "DataCheckSeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "DataCheckRunStatus" AS ENUM ('DRAFT', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "DataCheckResultStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'FIXED', 'IGNORED', 'FALSE_POSITIVE');
CREATE TYPE "DataCheckFrequency" AS ENUM ('MANUAL', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY');

CREATE TABLE "DataCheckRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "checkType" "DataCheckType" NOT NULL,
    "severity" "DataCheckSeverity" NOT NULL DEFAULT 'MEDIUM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parameters" JSONB NOT NULL DEFAULT '{}',
    "query" TEXT,
    "autoFixable" BOOLEAN NOT NULL DEFAULT false,
    "notifyUsers" JSONB NOT NULL DEFAULT '[]',
    "lastRunAt" TIMESTAMP(3),
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "lastResultCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "DataCheckRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DataCheckRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "ruleName" TEXT NOT NULL,
    "checkType" "DataCheckType" NOT NULL,
    "status" "DataCheckRunStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "warning" TEXT,
    "parameters" JSONB NOT NULL DEFAULT '{}',
    "triggeredBy" TEXT,
    "summary" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DataCheckRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DataCheckResult" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "runId" TEXT,
    "checkType" "DataCheckType" NOT NULL,
    "severity" "DataCheckSeverity" NOT NULL,
    "status" "DataCheckResultStatus" NOT NULL DEFAULT 'OPEN',
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityLabel" TEXT NOT NULL,
    "entityNumber" TEXT,
    "description" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "suggestedFix" TEXT,
    "autoFixable" BOOLEAN NOT NULL DEFAULT false,
    "fixedAt" TIMESTAMP(3),
    "fixedById" TEXT,
    "fixedByName" TEXT,
    "fixNote" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "ignoredAt" TIMESTAMP(3),
    "ignoredById" TEXT,
    "ignoreReason" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DataCheckResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DataCheckSchedule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ruleIds" JSONB NOT NULL DEFAULT '[]',
    "schedule" "DataCheckFrequency" NOT NULL DEFAULT 'DAILY',
    "hour" INTEGER NOT NULL DEFAULT 2,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "notifyOnComplete" BOOLEAN NOT NULL DEFAULT false,
    "notifyUserIds" JSONB NOT NULL DEFAULT '[]',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "DataCheckSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DataCheckActionLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "note" TEXT,
    "beforeState" JSONB,
    "afterState" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DataCheckActionLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DataCheckRule_tenantId_isActive_idx" ON "DataCheckRule"("tenantId", "isActive");
CREATE INDEX "DataCheckRule_tenantId_isDeleted_idx" ON "DataCheckRule"("tenantId", "isDeleted");
CREATE INDEX "DataCheckRule_checkType_idx" ON "DataCheckRule"("checkType");
CREATE INDEX "DataCheckRun_tenantId_startedAt_idx" ON "DataCheckRun"("tenantId", "startedAt");
CREATE INDEX "DataCheckRun_ruleId_startedAt_idx" ON "DataCheckRun"("ruleId", "startedAt");
CREATE INDEX "DataCheckRun_status_idx" ON "DataCheckRun"("status");
CREATE INDEX "DataCheckResult_tenantId_status_idx" ON "DataCheckResult"("tenantId", "status");
CREATE INDEX "DataCheckResult_tenantId_severity_idx" ON "DataCheckResult"("tenantId", "severity");
CREATE INDEX "DataCheckResult_tenantId_createdAt_idx" ON "DataCheckResult"("tenantId", "createdAt");
CREATE INDEX "DataCheckResult_ruleId_status_idx" ON "DataCheckResult"("ruleId", "status");
CREATE INDEX "DataCheckResult_entityType_entityId_idx" ON "DataCheckResult"("entityType", "entityId");
CREATE INDEX "DataCheckResult_runId_idx" ON "DataCheckResult"("runId");
CREATE INDEX "DataCheckSchedule_tenantId_isActive_idx" ON "DataCheckSchedule"("tenantId", "isActive");
CREATE INDEX "DataCheckSchedule_nextRunAt_idx" ON "DataCheckSchedule"("nextRunAt");
CREATE INDEX "DataCheckActionLog_tenantId_createdAt_idx" ON "DataCheckActionLog"("tenantId", "createdAt");
CREATE INDEX "DataCheckActionLog_resultId_idx" ON "DataCheckActionLog"("resultId");

ALTER TABLE "DataCheckRule" ADD CONSTRAINT "DataCheckRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "DataCheckRun" ADD CONSTRAINT "DataCheckRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "DataCheckRun" ADD CONSTRAINT "DataCheckRun_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "DataCheckRule"("id") ON DELETE CASCADE;
ALTER TABLE "DataCheckResult" ADD CONSTRAINT "DataCheckResult_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "DataCheckResult" ADD CONSTRAINT "DataCheckResult_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "DataCheckRule"("id") ON DELETE CASCADE;
ALTER TABLE "DataCheckResult" ADD CONSTRAINT "DataCheckResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "DataCheckRun"("id") ON DELETE SET NULL;
ALTER TABLE "DataCheckSchedule" ADD CONSTRAINT "DataCheckSchedule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "DataCheckActionLog" ADD CONSTRAINT "DataCheckActionLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
