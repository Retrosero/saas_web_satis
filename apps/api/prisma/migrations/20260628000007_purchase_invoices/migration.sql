-- =====================================================================
-- FAZ 20 — ALIS FATURALARI MIGRATION
-- PurchaseInvoice + PurchaseInvoiceItem tablolari
-- =====================================================================

DO $$
BEGIN
    CREATE TYPE "PurchaseInvoiceStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "PurchaseInvoiceType" AS ENUM ('PURCHASE', 'RETURN');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "PurchaseInvoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "type" "PurchaseInvoiceType" NOT NULL DEFAULT 'PURCHASE',
    "status" "PurchaseInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "warehouseId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "exchangeRate" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "subTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "vatTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "supplierName" TEXT NOT NULL,
    "supplierTaxNumber" TEXT,
    "supplierAddress" TEXT,
    "supplierPhone" TEXT,
    "supplierEmail" TEXT,
    "einvoiceNumber" TEXT,
    "einvoiceStatus" TEXT,
    "einvoiceDate" TIMESTAMP(3),
    "notes" TEXT,
    "internalNotes" TEXT,
    "cancelsInvoiceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseInvoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PurchaseInvoiceItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "unitId" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "vatRate" DECIMAL(65,30) NOT NULL,
    "discountRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "SaleItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "lineSubTotal" DECIMAL(65,30) NOT NULL,
    "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "lineVatAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "lineGrandTotal" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseInvoiceItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PurchaseInvoice_tenantId_invoiceNumber_key"
    ON "PurchaseInvoice"("tenantId", "invoiceNumber");

CREATE UNIQUE INDEX IF NOT EXISTS "PurchaseInvoice_cancelsInvoiceId_key"
    ON "PurchaseInvoice"("cancelsInvoiceId");

CREATE INDEX IF NOT EXISTS "PurchaseInvoice_tenantId_supplierId_invoiceDate_idx"
    ON "PurchaseInvoice"("tenantId", "supplierId", "invoiceDate");

CREATE INDEX IF NOT EXISTS "PurchaseInvoice_tenantId_invoiceDate_idx"
    ON "PurchaseInvoice"("tenantId", "invoiceDate");

CREATE INDEX IF NOT EXISTS "PurchaseInvoice_tenantId_status_idx"
    ON "PurchaseInvoice"("tenantId", "status");

CREATE INDEX IF NOT EXISTS "PurchaseInvoice_tenantId_paymentStatus_idx"
    ON "PurchaseInvoice"("tenantId", "paymentStatus");

CREATE INDEX IF NOT EXISTS "PurchaseInvoice_cancelsInvoiceId_idx"
    ON "PurchaseInvoice"("cancelsInvoiceId");

CREATE INDEX IF NOT EXISTS "PurchaseInvoiceItem_tenantId_invoiceId_idx"
    ON "PurchaseInvoiceItem"("tenantId", "invoiceId");

CREATE INDEX IF NOT EXISTS "PurchaseInvoiceItem_tenantId_productId_idx"
    ON "PurchaseInvoiceItem"("tenantId", "productId");

DO $$
BEGIN
    ALTER TABLE "PurchaseInvoice"
        ADD CONSTRAINT "PurchaseInvoice_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "PurchaseInvoice"
        ADD CONSTRAINT "PurchaseInvoice_supplierId_fkey"
        FOREIGN KEY ("supplierId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "PurchaseInvoice"
        ADD CONSTRAINT "PurchaseInvoice_warehouseId_fkey"
        FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "PurchaseInvoice"
        ADD CONSTRAINT "PurchaseInvoice_cancelsInvoiceId_fkey"
        FOREIGN KEY ("cancelsInvoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "PurchaseInvoiceItem"
        ADD CONSTRAINT "PurchaseInvoiceItem_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "PurchaseInvoiceItem"
        ADD CONSTRAINT "PurchaseInvoiceItem_invoiceId_fkey"
        FOREIGN KEY ("invoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "PurchaseInvoiceItem"
        ADD CONSTRAINT "PurchaseInvoiceItem_productId_fkey"
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
