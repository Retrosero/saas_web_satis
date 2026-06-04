-- HR-6: Devamsızlık ve Disiplin

CREATE TYPE "AbsenceType" AS ENUM ('UNPAID_LEAVE', 'SICK', 'UNAUTHORIZED', 'LATE', 'EARLY_LEAVE', 'OTHER');
CREATE TYPE "DisciplinaryActionType" AS ENUM ('WARNING', 'SUSPENSION', 'SALARY_CUT', 'TERMINATION', 'OTHER');

-- Devamsızlık kayıtları
CREATE TABLE "HrAbsenceRecord" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "absenceType" "AbsenceType" NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "totalDays" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "reason" TEXT,
  "isJustified" BOOLEAN NOT NULL DEFAULT false,
  "deductionAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "periodId" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HrAbsenceRecord_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "HrAbsenceRecord_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE,
  CONSTRAINT "HrAbsenceRecord_periodId_fkey"
    FOREIGN KEY ("periodId") REFERENCES "HrPayrollPeriod"("id") ON DELETE SET NULL
);
CREATE INDEX "HrAbsenceRecord_tenantId_employeeId_idx" ON "HrAbsenceRecord"("tenantId", "employeeId");
CREATE INDEX "HrAbsenceRecord_tenantId_startDate_idx" ON "HrAbsenceRecord"("tenantId", "startDate");
CREATE INDEX "HrAbsenceRecord_tenantId_absenceType_idx" ON "HrAbsenceRecord"("tenantId", "absenceType");

-- Disiplin kayıtları
CREATE TABLE "HrDisciplinaryCase" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "caseNo" TEXT NOT NULL,
  "incidentDate" TIMESTAMP(3) NOT NULL,
  "incidentDesc" TEXT NOT NULL,
  "actionType" "DisciplinaryActionType" NOT NULL,
  "actionDate" TIMESTAMP(3),
  "actionNotes" TEXT,
  "isClosed" BOOLEAN NOT NULL DEFAULT false,
  "closedBy" TEXT,
  "closedAt" TIMESTAMP(3),
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HrDisciplinaryCase_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "HrDisciplinaryCase_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE,
  CONSTRAINT "HrDisciplinaryCase_tenantId_caseNo_key"
    UNIQUE ("tenantId", "caseNo")
);
CREATE INDEX "HrDisciplinaryCase_tenantId_employeeId_idx" ON "HrDisciplinaryCase"("tenantId", "employeeId");
CREATE INDEX "HrDisciplinaryCase_tenantId_actionType_idx" ON "HrDisciplinaryCase"("tenantId", "actionType");
CREATE INDEX "HrDisciplinaryCase_tenantId_isClosed_idx" ON "HrDisciplinaryCase"("tenantId", "isClosed");