-- HR-9: Avans Yönetimi

CREATE TYPE "AdvanceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID', 'DEDUCTED');

CREATE TABLE "HrAdvanceRequest" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL,
  "reason" TEXT,
  "status" "AdvanceStatus" NOT NULL DEFAULT 'PENDING',
  "requestedBy" TEXT NOT NULL,
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "paidBy" TEXT,
  "deductionMonth" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HrAdvanceRequest_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "HrAdvanceRequest_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE
);
CREATE INDEX "HrAdvanceRequest_tenantId_employeeId_idx" ON "HrAdvanceRequest"("tenantId", "employeeId");
CREATE INDEX "HrAdvanceRequest_tenantId_status_idx" ON "HrAdvanceRequest"("tenantId", "status");
CREATE INDEX "HrAdvanceRequest_tenantId_createdAt_idx" ON "HrAdvanceRequest"("tenantId", "createdAt");

CREATE TABLE "HrAdvanceRepayment" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "advanceId" TEXT NOT NULL,
  "periodId" TEXT,
  "amount" DECIMAL(15,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HrAdvanceRepayment_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "HrAdvanceRepayment_advanceId_fkey"
    FOREIGN KEY ("advanceId") REFERENCES "HrAdvanceRequest"("id") ON DELETE CASCADE,
  CONSTRAINT "HrAdvanceRepayment_periodId_fkey"
    FOREIGN KEY ("periodId") REFERENCES "HrPayrollPeriod"("id") ON DELETE SET NULL
);
CREATE INDEX "HrAdvanceRepayment_tenantId_advanceId_idx" ON "HrAdvanceRepayment"("tenantId", "advanceId");
CREATE INDEX "HrAdvanceRepayment_tenantId_periodId_idx" ON "HrAdvanceRepayment"("tenantId", "periodId");