-- HR-5: Bordro Parametreleri
-- SGK oranları, vergi dilimleri, asgari ücret, agi, agc

CREATE TABLE "HrPayrollParam" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "paramKey" TEXT NOT NULL,
  "paramValue" DECIMAL(15,4) NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HrPayrollParam_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "HrPayrollParam_tenantId_year_paramKey_key"
    UNIQUE ("tenantId", "year", "paramKey")
);
CREATE INDEX "HrPayrollParam_tenantId_year_idx" ON "HrPayrollParam"("tenantId", "year");

-- Varsayılan parametreler (her tenant için, yıl bazlı)
-- Parametreler service'de seed edilecek