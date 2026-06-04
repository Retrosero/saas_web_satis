-- =====================================================================
-- FAZ 24 — VERİ TAŞIMA / GEÇİŞ MODÜLÜ MİGRATİONU
-- =====================================================================

-- Enums
CREATE TYPE "ImportSource" AS ENUM ('EXCEL', 'CSV', 'XML', 'MIKRO', 'LOGO', 'NETSIS', 'PARASUT', 'CUSTOM_SQL', 'MANUAL');
CREATE TYPE "ImportEntityType" AS ENUM ('CUSTOMER', 'PRODUCT', 'PRICE', 'BARCODE', 'WAREHOUSE', 'CUSTOMER_BALANCE', 'STOCK_BALANCE', 'ARCHIVE_SALE');
CREATE TYPE "ImportStatus" AS ENUM ('DRAFT', 'MAPPING', 'PREVIEW', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'ROLLED_BACK');

-- ImportBatch
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" "ImportSource" NOT NULL,
    "entityType" "ImportEntityType" NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'DRAFT',
    "fileName" TEXT,
    "fileSize" INTEGER,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "columnMapping" JSONB,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rolledBackAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "import_batches_tenantId_status_idx" ON "import_batches"("tenantId", "status");
CREATE INDEX "import_batches_tenantId_entityType_idx" ON "import_batches"("tenantId", "entityType");
CREATE INDEX "import_batches_tenantId_createdAt_idx" ON "import_batches"("tenantId", "createdAt");
CREATE INDEX "import_batches_tenantId_isDeleted_idx" ON "import_batches"("tenantId", "isDeleted");
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ImportRow
CREATE TABLE "import_rows" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "sourceData" JSONB NOT NULL,
    "mappedData" JSONB,
    "status" "ImportStatus" NOT NULL DEFAULT 'DRAFT',
    "errorMessage" TEXT,
    "createdRefId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "import_rows_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "import_rows_tenantId_batchId_status_idx" ON "import_rows"("tenantId", "batchId", "status");
CREATE INDEX "import_rows_tenantId_status_idx" ON "import_rows"("tenantId", "status");
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
