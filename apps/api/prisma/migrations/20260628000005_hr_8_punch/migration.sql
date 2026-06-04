-- HR-8: Puantaj / Yoklama

CREATE TYPE "PunchStatus" AS ENUM ('CLOCKED_IN', 'CLOCKED_OUT', 'ON_BREAK', 'ABSENT');

CREATE TABLE "HrPunchRecord" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "punchDate" DATE NOT NULL,
  "clockIn" TIMESTAMP(3),
  "clockOut" TIMESTAMP(3),
  "breakStart" TIMESTAMP(3),
  "breakEnd" TIMESTAMP(3),
  "totalHours" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "overtimeHours" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "lateMinutes" INTEGER NOT NULL DEFAULT 0,
  "earlyMinutes" INTEGER NOT NULL DEFAULT 0,
  "status" "PunchStatus" NOT NULL DEFAULT 'CLOCKED_OUT',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HrPunchRecord_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "HrPunchRecord_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE,
  CONSTRAINT "HrPunchRecord_tenantId_employeeId_punchDate_key"
    UNIQUE ("tenantId", "employeeId", "punchDate")
);
CREATE INDEX "HrPunchRecord_tenantId_punchDate_idx" ON "HrPunchRecord"("tenantId", "punchDate");
CREATE INDEX "HrPunchRecord_tenantId_employeeId_idx" ON "HrPunchRecord"("tenantId", "employeeId");
CREATE INDEX "HrPunchRecord_tenantId_status_idx" ON "HrPunchRecord"("tenantId", "status");