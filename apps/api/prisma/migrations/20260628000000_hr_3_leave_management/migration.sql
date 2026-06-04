-- FAZ HR-3: İzin Yönetimi
-- 4 tablo: HrLeaveType, HrLeaveBalance, HrLeaveRequest, HrLeaveAdjustment
-- 3 enum: HrLeaveTypeCode, HrLeaveAccrualMethod, HrLeaveRequestStatus

-- Enums
CREATE TYPE "HrLeaveTypeCode" AS ENUM (
  'ANNUAL', 'WEEKLY', 'UNPAID', 'MATERNITY',
  'PATERNITY', 'SICK', 'DEATH', 'EXCUSE',
  'COMPENSATION', 'MARRIAGE'
);

CREATE TYPE "HrLeaveAccrualMethod" AS ENUM (
  'STANDARD', 'MONTHLY', 'NONE'
);

CREATE TYPE "HrLeaveRequestStatus" AS ENUM (
  'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'
);

-- HrLeaveType: İzin türleri
CREATE TABLE "HrLeaveType" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" "HrLeaveTypeCode" NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#6B7280',
  "icon" TEXT NOT NULL DEFAULT '📋',
  "accrualMethod" "HrLeaveAccrualMethod" NOT NULL DEFAULT 'STANDARD',
  "defaultDaysPerYear" INTEGER NOT NULL DEFAULT 0,
  "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
  "requiresDocument" BOOLEAN NOT NULL DEFAULT false,
  "minDaysNotice" INTEGER NOT NULL DEFAULT 0,
  "maxConsecutiveDays" INTEGER NOT NULL DEFAULT 0,
  "canCarryOver" BOOLEAN NOT NULL DEFAULT false,
  "carryOverDays" INTEGER NOT NULL DEFAULT 0,
  "isPaid" BOOLEAN NOT NULL DEFAULT true,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "HrLeaveType_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);
CREATE INDEX "HrLeaveType_tenantId_isActive_idx" ON "HrLeaveType"("tenantId", "isActive");
CREATE INDEX "HrLeaveType_tenantId_code_idx" ON "HrLeaveType"("tenantId", "code");

-- HrLeaveBalance: Personel bazlı izin bakiyesi
CREATE TABLE "HrLeaveBalance" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "leaveTypeId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "entitledDays" NUMERIC(10,2) NOT NULL DEFAULT 0,
  "accruedDays" NUMERIC(10,2) NOT NULL DEFAULT 0,
  "usedDays" NUMERIC(10,2) NOT NULL DEFAULT 0,
  "pendingDays" NUMERIC(10,2) NOT NULL DEFAULT 0,
  "carriedOverDays" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HrLeaveBalance_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "HrLeaveBalance_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE,
  CONSTRAINT "HrLeaveBalance_leaveTypeId_fkey"
    FOREIGN KEY ("leaveTypeId") REFERENCES "HrLeaveType"("id") ON DELETE CASCADE,
  CONSTRAINT "HrLeaveBalance_tenantId_employeeId_leaveTypeId_year_key"
    UNIQUE ("tenantId", "employeeId", "leaveTypeId", "year")
);
CREATE INDEX "HrLeaveBalance_tenantId_employeeId_year_idx" ON "HrLeaveBalance"("tenantId", "employeeId", "year");

-- HrLeaveRequest: İzin talepleri
CREATE TABLE "HrLeaveRequest" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "leaveTypeId" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "totalDays" NUMERIC(10,2) NOT NULL,
  "workingDays" NUMERIC(10,2) NOT NULL,
  "reason" TEXT,
  "status" "HrLeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
  "approverId" TEXT,
  "approvedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "documentUrl" TEXT,
  "replacementEmployeeId" TEXT,
  "cancellationReason" TEXT,
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "HrLeaveRequest_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "HrLeaveRequest_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE,
  CONSTRAINT "HrLeaveRequest_leaveTypeId_fkey"
    FOREIGN KEY ("leaveTypeId") REFERENCES "HrLeaveType"("id") ON DELETE CASCADE,
  CONSTRAINT "HrLeaveRequest_approverId_fkey"
    FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL
);
CREATE INDEX "HrLeaveRequest_tenantId_employeeId_status_idx" ON "HrLeaveRequest"("tenantId", "employeeId", "status");
CREATE INDEX "HrLeaveRequest_tenantId_status_startDate_idx" ON "HrLeaveRequest"("tenantId", "status", "startDate");
CREATE INDEX "HrLeaveRequest_approverId_status_idx" ON "HrLeaveRequest"("approverId", "status");

-- HrLeaveAdjustment: Manuel bakiye düzeltmeleri
CREATE TABLE "HrLeaveAdjustment" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "leaveTypeId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "adjustment" NUMERIC(10,2) NOT NULL,
  "reason" TEXT NOT NULL,
  "adjustedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HrLeaveAdjustment_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "HrLeaveAdjustment_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE,
  CONSTRAINT "HrLeaveAdjustment_leaveTypeId_fkey"
    FOREIGN KEY ("leaveTypeId") REFERENCES "HrLeaveType"("id") ON DELETE CASCADE
);
CREATE INDEX "HrLeaveAdjustment_tenantId_employeeId_year_idx" ON "HrLeaveAdjustment"("tenantId", "employeeId", "year");

-- Seed: varsayılan izin türleri (her tenant için)
-- Bu seed, tenant oluşturulduktan sonra çalışır (service'de)