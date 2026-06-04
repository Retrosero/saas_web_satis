-- =====================================================================
-- FAZ 31 — GELİŞMİŞ RAPOR / PIVOT MİGRATİONU
-- =====================================================================
CREATE TYPE "ChartType" AS ENUM ('TABLE', 'BAR', 'LINE', 'PIE', 'AREA');
CREATE TYPE "ReportShareScope" AS ENUM ('PRIVATE', 'ALL_TENANT', 'ROLES', 'USERS');

CREATE TABLE "report_templates" (
    "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL, "description" TEXT,
    "config" JSONB NOT NULL,
    "chartType" "ChartType" NOT NULL DEFAULT 'TABLE',
    "shareScope" "ReportShareScope" NOT NULL DEFAULT 'PRIVATE',
    "sharedRoles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "sharedUsers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false, "deletedAt" TIMESTAMP(3),
    "createdById" TEXT, "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "report_templates_tenantId_isActive_idx" ON "report_templates"("tenantId", "isActive");
CREATE INDEX "report_templates_tenantId_isDeleted_idx" ON "report_templates"("tenantId", "isDeleted");
CREATE INDEX "report_templates_tenantId_isFavorite_idx" ON "report_templates"("tenantId", "isFavorite");
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

CREATE TABLE "scheduled_reports" (
    "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "templateId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'WEEKLY',
    "dayOfWeek" INTEGER, "dayOfMonth" INTEGER,
    "hour" INTEGER NOT NULL DEFAULT 9,
    "recipients" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "sendEmail" BOOLEAN NOT NULL DEFAULT true,
    "sendNotification" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3), "nextRunAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "scheduled_reports_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "scheduled_reports_tenantId_isActive_idx" ON "scheduled_reports"("tenantId", "isActive");
CREATE INDEX "scheduled_reports_nextRunAt_idx" ON "scheduled_reports"("nextRunAt");
ALTER TABLE "scheduled_reports" ADD CONSTRAINT "scheduled_reports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "scheduled_reports" ADD CONSTRAINT "scheduled_reports_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "report_templates"("id") ON DELETE CASCADE;
