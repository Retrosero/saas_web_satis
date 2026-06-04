-- FAZ HR-1: İK Personel Özlük Kartı
-- 3 tablo: HrEmployee, HrEmployeeEmploymentInfo, HrEmployeeDocument
-- 5 enum: Gender, MaritalStatus, EmploymentStatus, ContractType, WorkingType, HrDocumentType, HrDocumentStatus

-- Enums
CREATE TYPE "HrGender" AS ENUM ('MALE', 'FEMALE', 'OTHER');
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'ARCHIVED');
CREATE TYPE "ContractType" AS ENUM ('INDEFINITE', 'DEFINITE', 'PART_TIME', 'INTERNSHIP', 'SEASONAL', 'OUTSOURCE');
CREATE TYPE "WorkingType" AS ENUM ('FULL_TIME', 'PART_TIME', 'HOURLY', 'TEMPORARY', 'INTERN', 'OUTSOURCE');
CREATE TYPE "HrDocumentType" AS ENUM (
  'IDENTITY_COPY',
  'EMPLOYMENT_CONTRACT',
  'KVKK_CONSENT',
  'HEALTH_REPORT',
  'CRIMINAL_RECORD',
  'DIPLOMA_CERTIFICATE',
  'RESIDENCE_CERTIFICATE',
  'PHOTO',
  'OSH_TRAINING',
  'INVENTORY_FORM',
  'SGK_ENTRY_DECLARATION',
  'TERMINATION_PAPERS',
  'OTHER'
);
CREATE TYPE "HrDocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- HrEmployee
CREATE TABLE "HrEmployee" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "employeeNo" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "identityNumber" TEXT,
  "birthDate" TIMESTAMP(3),
  "gender" "HrGender",
  "maritalStatus" "MaritalStatus",
  "bloodType" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "emergencyContact" TEXT,
  "emergencyPhone" TEXT,
  "iban" TEXT,
  "photoUrl" TEXT,
  "status" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  "hireDate" TIMESTAMP(3),
  "terminationDate" TIMESTAMP(3),
  "terminationReason" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "HrEmployee_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "HrEmployee_tenantId_employeeNo_key" ON "HrEmployee"("tenantId", "employeeNo");
CREATE INDEX "HrEmployee_tenantId_isDeleted_idx" ON "HrEmployee"("tenantId", "isDeleted");
CREATE INDEX "HrEmployee_tenantId_status_idx" ON "HrEmployee"("tenantId", "status");
CREATE INDEX "HrEmployee_tenantId_lastName_firstName_idx" ON "HrEmployee"("tenantId", "lastName", "firstName");
CREATE INDEX "HrEmployee_tenantId_identityNumber_idx" ON "HrEmployee"("tenantId", "identityNumber");

-- HrEmployeeEmploymentInfo
CREATE TABLE "HrEmployeeEmploymentInfo" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL UNIQUE,
  "department" TEXT,
  "branch" TEXT,
  "position" TEXT,
  "workingType" "WorkingType" NOT NULL DEFAULT 'FULL_TIME',
  "contractType" "ContractType" NOT NULL DEFAULT 'INDEFINITE',
  "contractStartDate" TIMESTAMP(3),
  "contractEndDate" TIMESTAMP(3),
  "probationMonths" INTEGER NOT NULL DEFAULT 0,
  "probationEndDate" TIMESTAMP(3),
  "sgkRegistrationNo" TEXT,
  "sgkEmployerNo" TEXT,
  "sgkWorkplaceCode" TEXT,
  "jobDescription" TEXT,
  "weeklyHours" DECIMAL(5,2),
  "workLocation" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "HrEmployeeEmploymentInfo_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "HrEmployeeEmploymentInfo_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE
);

CREATE INDEX "HrEmployeeEmploymentInfo_tenantId_idx" ON "HrEmployeeEmploymentInfo"("tenantId");
CREATE INDEX "HrEmployeeEmploymentInfo_tenantId_department_idx" ON "HrEmployeeEmploymentInfo"("tenantId", "department");
CREATE INDEX "HrEmployeeEmploymentInfo_tenantId_branch_idx" ON "HrEmployeeEmploymentInfo"("tenantId", "branch");

-- HrEmployeeDocument
CREATE TABLE "HrEmployeeDocument" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "documentType" "HrDocumentType" NOT NULL,
  "title" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "mimeType" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "storageProvider" TEXT NOT NULL DEFAULT 'r2',
  "status" "HrDocumentStatus" NOT NULL DEFAULT 'PENDING',
  "issueDate" TIMESTAMP(3),
  "expiryDate" TIMESTAMP(3),
  "description" TEXT,
  "uploadedBy" TEXT NOT NULL,
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HrEmployeeDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "HrEmployeeDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE
);

CREATE INDEX "HrEmployeeDocument_tenantId_employeeId_idx" ON "HrEmployeeDocument"("tenantId", "employeeId");
CREATE INDEX "HrEmployeeDocument_tenantId_documentType_idx" ON "HrEmployeeDocument"("tenantId", "documentType");
CREATE INDEX "HrEmployeeDocument_tenantId_employeeId_isDeleted_idx" ON "HrEmployeeDocument"("tenantId", "employeeId", "isDeleted");
CREATE INDEX "HrEmployeeDocument_expiryDate_idx" ON "HrEmployeeDocument"("expiryDate");
