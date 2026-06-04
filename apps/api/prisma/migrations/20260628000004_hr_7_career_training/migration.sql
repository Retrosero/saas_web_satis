-- HR-7: Kariyer, Eğitim ve Performans

-- Kariyer kayıtları (terfi, transfer, maaş değişikliği)
CREATE TABLE "HrCareerRecord" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "recordType" TEXT NOT NULL,
  "effectiveDate" TIMESTAMP(3) NOT NULL,
  "oldValue" TEXT,
  "newValue" TEXT,
  "notes" TEXT,
  "approvedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HrCareerRecord_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "HrCareerRecord_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE
);
CREATE INDEX "HrCareerRecord_tenantId_employeeId_idx" ON "HrCareerRecord"("tenantId", "employeeId");
CREATE INDEX "HrCareerRecord_tenantId_recordType_idx" ON "HrCareerRecord"("tenantId", "recordType");
CREATE INDEX "HrCareerRecord_tenantId_effectiveDate_idx" ON "HrCareerRecord"("tenantId", "effectiveDate");

-- Eğitim programları
CREATE TABLE "HrTraining" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "trainer" TEXT,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "location" TEXT,
  "trainingType" TEXT NOT NULL,
  "maxParticipants" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'PLANNED',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HrTraining_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);
CREATE INDEX "HrTraining_tenantId_status_idx" ON "HrTraining"("tenantId", "status");

-- Eğitime katılımcılar
CREATE TABLE "HrTrainingParticipant" (
  "id" TEXT PRIMARY KEY,
  "trainingId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'REGISTERED',
  "score" DECIMAL(5,2),
  "certificateUrl" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HrTrainingParticipant_trainingId_fkey"
    FOREIGN KEY ("trainingId") REFERENCES "HrTraining"("id") ON DELETE CASCADE,
  CONSTRAINT "HrTrainingParticipant_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE,
  CONSTRAINT "HrTrainingParticipant_trainingId_employeeId_key"
    UNIQUE ("trainingId", "employeeId")
);

-- Performans değerlendirmeleri
CREATE TABLE "HrPerformanceReview" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "reviewerId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "overallScore" DECIMAL(3,2),
  "taskCompletion" DECIMAL(3,2),
  "teamwork" DECIMAL(3,2),
  "communication" DECIMAL(3,2),
  "problemSolving" DECIMAL(3,2),
  "leadership" DECIMAL(3,2),
  "strengths" TEXT,
  "developmentAreas" TEXT,
  "goals" TEXT,
  "reviewerNotes" TEXT,
  "employeeComment" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HrPerformanceReview_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "HrPerformanceReview_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE,
  CONSTRAINT "HrPerformanceReview_reviewerId_fkey"
    FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL
);
CREATE INDEX "HrPerformanceReview_tenantId_employeeId_idx" ON "HrPerformanceReview"("tenantId", "employeeId");
CREATE INDEX "HrPerformanceReview_tenantId_period_idx" ON "HrPerformanceReview"("tenantId", "period");
CREATE INDEX "HrPerformanceReview_tenantId_status_idx" ON "HrPerformanceReview"("tenantId", "status");