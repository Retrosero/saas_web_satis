-- =====================================================================
-- FAZ 21 — İADE MODÜLÜ MİGRATİONU
-- =====================================================================
-- Satıştan veya siparişten geri alınan ürünler için:
--   - Return: iade başlık (cari, kaynak, neden, durum, tutarlar)
--   - ReturnItem: iade kalemleri (ürün, miktar, durum, fiyat)
-- Soft delete + event sourcing felsefesi.
-- =====================================================================

-- Enums
CREATE TYPE "ReturnStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED', 'CANCELLED');
CREATE TYPE "ReturnReason" AS ENUM ('INTACT', 'DEFECTIVE', 'WRONG_PRODUCT', 'EXCESS', 'OTHER');
CREATE TYPE "ReturnSource" AS ENUM ('SALE', 'ORDER', 'DIRECT');
CREATE TYPE "ReturnItemCondition" AS ENUM ('INTACT', 'DEFECTIVE', 'DAMAGED');

-- Return başlık tablosu
CREATE TABLE "returns" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "returnNumber" TEXT NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "source" "ReturnSource" NOT NULL DEFAULT 'DIRECT',
    "sourceId" TEXT,
    "reason" "ReturnReason" NOT NULL DEFAULT 'OTHER',
    "status" "ReturnStatus" NOT NULL DEFAULT 'DRAFT',
    "customerName" TEXT NOT NULL,
    "customerTaxNumber" TEXT,
    "customerAddress" TEXT,
    "customerPhone" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "exchangeRate" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "subTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "vatTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "returnToStock" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "internalNotes" TEXT,
    "rejectionReason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "completedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "returns_pkey" PRIMARY KEY ("id")
);

-- Unique + index
CREATE UNIQUE INDEX "returns_tenantId_returnNumber_key" ON "returns"("tenantId", "returnNumber");
CREATE INDEX "returns_tenantId_customerId_returnDate_idx" ON "returns"("tenantId", "customerId", "returnDate");
CREATE INDEX "returns_tenantId_status_idx" ON "returns"("tenantId", "status");
CREATE INDEX "returns_tenantId_source_sourceId_idx" ON "returns"("tenantId", "source", "sourceId");
CREATE INDEX "returns_isDeleted_idx" ON "returns"("isDeleted");

-- Return kalem tablosu
CREATE TABLE "return_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "unitId" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "vatRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discountRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "condition" "ReturnItemCondition" NOT NULL DEFAULT 'INTACT',
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "lineSubTotal" DECIMAL(65,30) NOT NULL,
    "lineVatAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "lineGrandTotal" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "return_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "return_items_tenantId_returnId_idx" ON "return_items"("tenantId", "returnId");
CREATE INDEX "return_items_tenantId_productId_idx" ON "return_items"("tenantId", "productId");

-- Foreign keys
ALTER TABLE "returns" ADD CONSTRAINT "returns_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "returns" ADD CONSTRAINT "returns_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "return_items" ADD CONSTRAINT "return_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
