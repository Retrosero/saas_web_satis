-- FAZ HR-2: İşe Giriş / İşten Çıkış Checklist
-- 4 tablo: HrOnboardingChecklist, HrOnboardingChecklistItem, HrOffboardingChecklist, HrOffboardingChecklistItem
-- 2 enum: HrOnboardingStatus, HrOnboardingItemStatus

-- Enums
CREATE TYPE "HrOnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'PENDING_DOCS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "HrOnboardingItemStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'NOT_APPLICABLE');

-- HrOnboardingChecklist
CREATE TABLE "HrOnboardingChecklist" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "targetCompletionDate" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "status" "HrOnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "notes" TEXT,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  CONSTRAINT "HrOnboardingChecklist_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "HrOnboardingChecklist_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE
);

CREATE INDEX "HrOnboardingChecklist_tenantId_isDeleted_idx" ON "HrOnboardingChecklist"("tenantId", "isDeleted");
CREATE INDEX "HrOnboardingChecklist_tenantId_employeeId_idx" ON "HrOnboardingChecklist"("tenantId", "employeeId");

-- HrOnboardingChecklistItem
CREATE TABLE "HrOnboardingChecklistItem" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "checklistId" TEXT NOT NULL,
  "itemKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "isRequired" BOOLEAN NOT NULL DEFAULT true,
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  "completedBy" TEXT,
  "status" "HrOnboardingItemStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "documentId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HrOnboardingChecklistItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "HrOnboardingChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "HrOnboardingChecklist"("id") ON DELETE CASCADE
);

CREATE INDEX "HrOnboardingChecklistItem_tenantId_checklistId_idx" ON "HrOnboardingChecklistItem"("tenantId", "checklistId");
CREATE INDEX "HrOnboardingChecklistItem_tenantId_itemKey_idx" ON "HrOnboardingChecklistItem"("tenantId", "itemKey");

-- HrOffboardingChecklist
CREATE TABLE "HrOffboardingChecklist" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "terminationDate" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "status" "HrOnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "notes" TEXT,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  CONSTRAINT "HrOffboardingChecklist_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "HrOffboardingChecklist_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE
);

CREATE INDEX "HrOffboardingChecklist_tenantId_isDeleted_idx" ON "HrOffboardingChecklist"("tenantId", "isDeleted");
CREATE INDEX "HrOffboardingChecklist_tenantId_employeeId_idx" ON "HrOffboardingChecklist"("tenantId", "employeeId");

-- HrOffboardingChecklistItem
CREATE TABLE "HrOffboardingChecklistItem" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "checklistId" TEXT NOT NULL,
  "itemKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "isRequired" BOOLEAN NOT NULL DEFAULT true,
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  "completedBy" TEXT,
  "status" "HrOnboardingItemStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "documentId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HrOffboardingChecklistItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "HrOffboardingChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "HrOffboardingChecklist"("id") ON DELETE CASCADE
);

CREATE INDEX "HrOffboardingChecklistItem_tenantId_checklistId_idx" ON "HrOffboardingChecklistItem"("tenantId", "checklistId");
CREATE INDEX "HrOffboardingChecklistItem_tenantId_itemKey_idx" ON "HrOffboardingChecklistItem"("tenantId", "itemKey");
