-- FAZ 39-43: Onboarding + Industry Templates + Demo + Visits + Targets

-- Enums
CREATE TYPE "OnboardingStep" AS ENUM ('START', 'COMPANY_INFO', 'BRAND', 'BRANCHES', 'WAREHOUSES', 'CASH_ACCOUNTS', 'BANKS', 'USER_INVITES', 'PERMISSION_TEMPLATE', 'DATA_IMPORT', 'FIRST_SALE_TEST', 'COMPLETED');
CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');
CREATE TYPE "DemoDataSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');
CREATE TYPE "VisitStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'VISITED', 'ORDER_TAKEN', 'COLLECTION_TAKEN', 'COULDNT_MEET', 'CANCELLED');
CREATE TYPE "VisitPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "VisitCheckinType" AS ENUM ('CHECK_IN', 'CHECK_OUT');
CREATE TYPE "TargetType" AS ENUM ('SALES_AMOUNT', 'SALES_COUNT', 'COLLECTION', 'NEW_CUSTOMER', 'VISIT_COUNT', 'ORDER_COUNT', 'BRAND_SALES', 'PRODUCT_SALES');
CREATE TYPE "TargetStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'FAILED', 'EXCEEDED', 'CANCELLED');
CREATE TYPE "TargetPeriod" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');
CREATE TYPE "CommissionType" AS ENUM ('PERCENTAGE', 'FIXED', 'TIERED', 'BONUS');

-- Onboarding
CREATE TABLE "OnboardingProgress" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "currentStep" "OnboardingStep" NOT NULL DEFAULT 'START',
    "completedSteps" JSONB NOT NULL DEFAULT '[]',
    "skippedSteps" JSONB NOT NULL DEFAULT '[]',
    "data" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "startedById" TEXT,
    "completedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OnboardingProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OnboardingStepLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "progressId" TEXT NOT NULL,
    "step" "OnboardingStep" NOT NULL,
    "action" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OnboardingStepLog_pkey" PRIMARY KEY ("id")
);

-- Industry Templates
CREATE TABLE "IndustryTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL DEFAULT '📦',
    "sectorKey" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IndustryTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TenantAppliedTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "appliedById" TEXT,
    "appliedData" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TenantAppliedTemplate_pkey" PRIMARY KEY ("id")
);

-- Demo
CREATE TABLE "DemoDataTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" "DemoDataSize" NOT NULL,
    "description" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DemoDataTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DemoCompany" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "size" "DemoDataSize" NOT NULL,
    "templateCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "resetCount" INTEGER NOT NULL DEFAULT 0,
    "lastResetAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "state" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DemoCompany_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DemoSeedLog" (
    "id" TEXT NOT NULL,
    "demoCompanyId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "size" "DemoDataSize" NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "error" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DemoSeedLog_pkey" PRIMARY KEY ("id")
);

-- Visits
CREATE TABLE "VisitPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "planDate" TIMESTAMP(3) NOT NULL,
    "salespersonId" TEXT NOT NULL,
    "region" TEXT,
    "customerGroupId" TEXT,
    "status" "VisitPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "totalCustomers" INTEGER NOT NULL DEFAULT 0,
    "visitedCount" INTEGER NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "collectionAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VisitPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VisitPlanCustomer" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerAddress" TEXT,
    "customerPhone" TEXT,
    "customerBalance" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "lastOrderDate" TIMESTAMP(3),
    "order" INTEGER NOT NULL,
    "status" "VisitStatus" NOT NULL DEFAULT 'PLANNED',
    "plannedTime" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "resultOrderId" TEXT,
    "resultCollectionId" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    CONSTRAINT "VisitPlanCustomer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VisitCheckin" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "VisitCheckinType" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "accuracy" DOUBLE PRECISION,
    "photo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VisitCheckin_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VisitNote" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VisitNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VisitStatusLog" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "customerId" TEXT,
    "fromStatus" "VisitStatus",
    "toStatus" "VisitStatus" NOT NULL,
    "actorId" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VisitStatusLog_pkey" PRIMARY KEY ("id")
);

-- Targets
CREATE TABLE "PerformanceTarget" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "TargetType" NOT NULL,
    "period" "TargetPeriod" NOT NULL DEFAULT 'MONTHLY',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "assigneeType" TEXT NOT NULL,
    "assigneeId" TEXT,
    "assigneeName" TEXT,
    "targetValue" DECIMAL(18,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "tiers" JSONB NOT NULL DEFAULT '[]',
    "filters" JSONB NOT NULL DEFAULT '{}',
    "status" "TargetStatus" NOT NULL DEFAULT 'ACTIVE',
    "achievedValue" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "achievementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastSnapshotAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "PerformanceTarget_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TargetProgressLog" (
    "id" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "achievedValue" DECIMAL(18,4) NOT NULL,
    "delta" DECIMAL(18,4) NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TargetProgressLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PerformanceSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "userId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "achievedValue" DECIMAL(18,4) NOT NULL,
    "targetValue" DECIMAL(18,4) NOT NULL,
    "achievementRate" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    CONSTRAINT "PerformanceSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommissionRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetType" "TargetType" NOT NULL,
    "minAchievementRate" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "commissionType" "CommissionType" NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "maxAmount" DECIMAL(18,4),
    "minAmount" DECIMAL(18,4),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CommissionRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommissionCalculationLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "period" TEXT NOT NULL,
    "targetId" TEXT,
    "achievedValue" DECIMAL(18,4) NOT NULL,
    "achievementRate" DOUBLE PRECISION NOT NULL,
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "calculatedAmount" DECIMAL(18,4) NOT NULL,
    "finalAmount" DECIMAL(18,4) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "paidAt" TIMESTAMP(3),
    CONSTRAINT "CommissionCalculationLog_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "OnboardingProgress_tenantId_key" ON "OnboardingProgress"("tenantId");
CREATE UNIQUE INDEX "IndustryTemplate_code_key" ON "IndustryTemplate"("code");
CREATE UNIQUE INDEX "DemoDataTemplate_code_key" ON "DemoDataTemplate"("code");
CREATE UNIQUE INDEX "DemoCompany_tenantId_key" ON "DemoCompany"("tenantId");

-- Indexes
CREATE INDEX "OnboardingProgress_tenantId_status_idx" ON "OnboardingProgress"("tenantId", "status");
CREATE INDEX "OnboardingStepLog_tenantId_step_idx" ON "OnboardingStepLog"("tenantId", "step");
CREATE INDEX "OnboardingStepLog_progressId_idx" ON "OnboardingStepLog"("progressId");
CREATE INDEX "IndustryTemplate_isActive_idx" ON "IndustryTemplate"("isActive");
CREATE INDEX "TenantAppliedTemplate_tenantId_idx" ON "TenantAppliedTemplate"("tenantId");
CREATE INDEX "TenantAppliedTemplate_templateId_idx" ON "TenantAppliedTemplate"("templateId");
CREATE INDEX "DemoCompany_size_idx" ON "DemoCompany"("size");
CREATE INDEX "DemoSeedLog_demoCompanyId_idx" ON "DemoSeedLog"("demoCompanyId");
CREATE INDEX "VisitPlan_tenantId_planDate_idx" ON "VisitPlan"("tenantId", "planDate");
CREATE INDEX "VisitPlan_tenantId_status_idx" ON "VisitPlan"("tenantId", "status");
CREATE INDEX "VisitPlan_salespersonId_planDate_idx" ON "VisitPlan"("salespersonId", "planDate");
CREATE INDEX "VisitPlanCustomer_planId_order_idx" ON "VisitPlanCustomer"("planId", "order");
CREATE INDEX "VisitPlanCustomer_customerId_idx" ON "VisitPlanCustomer"("customerId");
CREATE INDEX "VisitCheckin_planId_createdAt_idx" ON "VisitCheckin"("planId", "createdAt");
CREATE INDEX "VisitCheckin_customerId_idx" ON "VisitCheckin"("customerId");
CREATE INDEX "VisitNote_planId_createdAt_idx" ON "VisitNote"("planId", "createdAt");
CREATE INDEX "VisitStatusLog_planId_createdAt_idx" ON "VisitStatusLog"("planId", "createdAt");
CREATE INDEX "PerformanceTarget_tenantId_status_idx" ON "PerformanceTarget"("tenantId", "status");
CREATE INDEX "PerformanceTarget_tenantId_type_idx" ON "PerformanceTarget"("tenantId", "type");
CREATE INDEX "PerformanceTarget_assigneeId_status_idx" ON "PerformanceTarget"("assigneeId", "status");
CREATE INDEX "PerformanceTarget_startDate_endDate_idx" ON "PerformanceTarget"("startDate", "endDate");
CREATE INDEX "TargetProgressLog_targetId_createdAt_idx" ON "TargetProgressLog"("targetId", "createdAt");
CREATE INDEX "PerformanceSnapshot_tenantId_date_idx" ON "PerformanceSnapshot"("tenantId", "date");
CREATE INDEX "PerformanceSnapshot_targetId_date_idx" ON "PerformanceSnapshot"("targetId", "date");
CREATE INDEX "PerformanceSnapshot_userId_date_idx" ON "PerformanceSnapshot"("userId", "date");
CREATE INDEX "CommissionRule_tenantId_isActive_idx" ON "CommissionRule"("tenantId", "isActive");
CREATE INDEX "CommissionRule_targetType_idx" ON "CommissionRule"("targetType");
CREATE INDEX "CommissionCalculationLog_tenantId_period_idx" ON "CommissionCalculationLog"("tenantId", "period");
CREATE INDEX "CommissionCalculationLog_userId_period_idx" ON "CommissionCalculationLog"("userId", "period");
CREATE INDEX "CommissionCalculationLog_ruleId_idx" ON "CommissionCalculationLog"("ruleId");
CREATE INDEX "CommissionCalculationLog_status_idx" ON "CommissionCalculationLog"("status");

-- Foreign keys
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "OnboardingStepLog" ADD CONSTRAINT "OnboardingStepLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "OnboardingStepLog" ADD CONSTRAINT "OnboardingStepLog_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "OnboardingProgress"("id") ON DELETE CASCADE;
ALTER TABLE "TenantAppliedTemplate" ADD CONSTRAINT "TenantAppliedTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "TenantAppliedTemplate" ADD CONSTRAINT "TenantAppliedTemplate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "IndustryTemplate"("id") ON DELETE CASCADE;
ALTER TABLE "DemoCompany" ADD CONSTRAINT "DemoCompany_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "DemoSeedLog" ADD CONSTRAINT "DemoSeedLog_demoCompanyId_fkey" FOREIGN KEY ("demoCompanyId") REFERENCES "DemoCompany"("id") ON DELETE CASCADE;
ALTER TABLE "VisitPlan" ADD CONSTRAINT "VisitPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "VisitPlanCustomer" ADD CONSTRAINT "VisitPlanCustomer_planId_fkey" FOREIGN KEY ("planId") REFERENCES "VisitPlan"("id") ON DELETE CASCADE;
ALTER TABLE "VisitCheckin" ADD CONSTRAINT "VisitCheckin_planId_fkey" FOREIGN KEY ("planId") REFERENCES "VisitPlan"("id") ON DELETE CASCADE;
ALTER TABLE "VisitNote" ADD CONSTRAINT "VisitNote_planId_fkey" FOREIGN KEY ("planId") REFERENCES "VisitPlan"("id") ON DELETE CASCADE;
ALTER TABLE "VisitStatusLog" ADD CONSTRAINT "VisitStatusLog_planId_fkey" FOREIGN KEY ("planId") REFERENCES "VisitPlan"("id") ON DELETE CASCADE;
ALTER TABLE "PerformanceTarget" ADD CONSTRAINT "PerformanceTarget_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "TargetProgressLog" ADD CONSTRAINT "TargetProgressLog_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "PerformanceTarget"("id") ON DELETE CASCADE;
ALTER TABLE "PerformanceSnapshot" ADD CONSTRAINT "PerformanceSnapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "PerformanceSnapshot" ADD CONSTRAINT "PerformanceSnapshot_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "PerformanceTarget"("id") ON DELETE CASCADE;
ALTER TABLE "CommissionRule" ADD CONSTRAINT "CommissionRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "CommissionCalculationLog" ADD CONSTRAINT "CommissionCalculationLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "CommissionCalculationLog" ADD CONSTRAINT "CommissionCalculationLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "CommissionRule"("id") ON DELETE CASCADE;
