-- FAZ HR-4: Bordro Hazırlık
-- 3 tablo: HrPayrollPeriod, HrPayrollRecord, HrPayrollSupplement
-- 4 enum: PayrollPeriodType, PayrollPeriodStatus, PayrollRecordStatus, SupplementType
-- Hesaplama yapılmaz — sadece veri girişi + muhasebeye export

-- Enums
CREATE TYPE "PayrollPeriodType" AS ENUM ('MONTHLY', 'WEEKLY');
CREATE TYPE "PayrollPeriodStatus" AS ENUM ('DRAFT', 'REVIEW', 'CONFIRMED', 'EXPORTED', 'CLOSED');
CREATE TYPE "PayrollRecordStatus" AS ENUM ('DRAFT', 'REVIEW', 'CONFIRMED', 'EXPORTED');
CREATE TYPE "SupplementType" AS ENUM ('BONUS', 'INCENTIVE', 'ALLOWANCE', 'DEDUCTION', 'SOCIAL_SEC', 'TAX', 'OTHER');

-- HrPayrollPeriod: Bordro dönemi (ay/hafta başına bir kayıt)
CREATE TABLE "HrPayrollPeriod" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "period" INTEGER NOT NULL,
  "periodType" "PayrollPeriodType" NOT NULL DEFAULT 'MONTHLY',
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "status" "PayrollPeriodStatus" NOT NULL DEFAULT 'DRAFT',
  "totalGross" DECIMAL(15,2),
  "totalNet" DECIMAL(15,2),
  "employeeCount" INTEGER,
  "confirmedBy" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "exportedBy" TEXT,
  "exportedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "HrPayrollPeriod_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "HrPayrollPeriod_tenantId_year_period_periodType_key"
    UNIQUE ("tenantId", "year", "period", "periodType")
);
CREATE INDEX "HrPayrollPeriod_tenantId_year_idx" ON "HrPayrollPeriod"("tenantId", "year");
CREATE INDEX "HrPayrollPeriod_tenantId_status_idx" ON "HrPayrollPeriod"("tenantId", "status");

-- HrPayrollRecord: Personel başına bordro satırı
CREATE TABLE "HrPayrollRecord" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "periodId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "workingDays" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "absentDays" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "overtimeHours" DECIMAL(8,2) NOT NULL DEFAULT 0,
  "lateHours" DECIMAL(8,2) NOT NULL DEFAULT 0,
  "baseSalary" DECIMAL(15,2) NOT NULL,
  "grossPay" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "sgkEmployee" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "unemploymentEmployee" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "incomeTax" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "netPay" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "status" "PayrollRecordStatus" NOT NULL DEFAULT 'DRAFT',
  "exportedAt" TIMESTAMP(3),
  "exportedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "HrPayrollRecord_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "HrPayrollRecord_periodId_fkey"
    FOREIGN KEY ("periodId") REFERENCES "HrPayrollPeriod"("id") ON DELETE CASCADE,
  CONSTRAINT "HrPayrollRecord_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE,
  CONSTRAINT "HrPayrollRecord_tenantId_periodId_employeeId_key"
    UNIQUE ("tenantId", "periodId", "employeeId")
);
CREATE INDEX "HrPayrollRecord_tenantId_periodId_idx" ON "HrPayrollRecord"("tenantId", "periodId");
CREATE INDEX "HrPayrollRecord_tenantId_employeeId_idx" ON "HrPayrollRecord"("tenantId", "employeeId");
CREATE INDEX "HrPayrollRecord_tenantId_status_idx" ON "HrPayrollRecord"("tenantId", "status");

-- HrPayrollSupplement: Ek kalemler (prim, ikramiye, kesinti)
CREATE TABLE "HrPayrollSupplement" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "periodId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "recordId" TEXT,
  "type" "SupplementType" NOT NULL,
  "name" TEXT NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL,
  "isDeduction" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HrPayrollSupplement_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "HrPayrollSupplement_periodId_fkey"
    FOREIGN KEY ("periodId") REFERENCES "HrPayrollPeriod"("id") ON DELETE CASCADE,
  CONSTRAINT "HrPayrollSupplement_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE,
  CONSTRAINT "HrPayrollSupplement_recordId_fkey"
    FOREIGN KEY ("recordId") REFERENCES "HrPayrollRecord"("id") ON DELETE SET NULL
);
CREATE INDEX "HrPayrollSupplement_tenantId_periodId_idx" ON "HrPayrollSupplement"("tenantId", "periodId");
CREATE INDEX "HrPayrollSupplement_tenantId_employeeId_idx" ON "HrPayrollSupplement"("tenantId", "employeeId");
CREATE INDEX "HrPayrollSupplement_tenantId_type_idx" ON "HrPayrollSupplement"("tenantId", "type");