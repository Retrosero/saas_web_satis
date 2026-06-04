-- Migration: FAZ 15 — Stok Sayım Modülü
-- Created: 2026-06-08

-- =====================================================================
-- CREATE ENUMS
-- =====================================================================

CREATE TYPE "StockCountStatus" AS ENUM (
  'DRAFT', 'IN_PROGRESS', 'COMPLETED', 'PENDING_APPROVAL', 'APPROVED', 'CANCELLED'
);

CREATE TYPE "StockCountType" AS ENUM (
  'FULL', 'PARTIAL', 'CYCLE', 'SPOT', 'CATEGORY'
);

CREATE TYPE "CountItemStatus" AS ENUM (
  'PENDING', 'COUNTED', 'SKIPPED', 'RECOUNT_NEEDED'
);

-- =====================================================================
-- CREATE TABLE: stock_counts
-- =====================================================================

CREATE TABLE "stock_counts" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "count_number" TEXT NOT NULL,
  "warehouse_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "count_type" "StockCountType" NOT NULL DEFAULT 'FULL',
  "status" "StockCountStatus" NOT NULL DEFAULT 'DRAFT',
  "total_products" INTEGER NOT NULL DEFAULT 0,
  "counted_products" INTEGER NOT NULL DEFAULT 0,
  "difference_count" INTEGER NOT NULL DEFAULT 0,
  "total_difference" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "approved_at" TIMESTAMP(3),
  "cancelled_at" TIMESTAMP(3),
  "started_by_id" TEXT,
  "completed_by_id" TEXT,
  "approved_by_id" TEXT,
  "cancelled_by_id" TEXT,
  "notes" TEXT,
  "internal_notes" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_pkey" PRIMARY KEY ("id");
ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_tenant_id_count_number_key" UNIQUE ("tenant_id", "count_number");

ALTER TABLE "stock_counts"
  ADD CONSTRAINT "stock_counts_tenant_id_fkey" FOREIGN KEY ("tenant_id")
  REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stock_counts"
  ADD CONSTRAINT "stock_counts_warehouse_id_fkey" FOREIGN KEY ("warehouse_id")
  REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "stock_counts_tenant_id_idx" ON "stock_counts"("tenant_id");
CREATE INDEX "stock_counts_tenant_warehouse_idx" ON "stock_counts"("tenant_id", "warehouse_id");
CREATE INDEX "stock_counts_tenant_status_idx" ON "stock_counts"("tenant_id", "status");
CREATE INDEX "stock_counts_tenant_count_type_idx" ON "stock_counts"("tenant_id", "count_type");
CREATE INDEX "stock_counts_tenant_started_at_idx" ON "stock_counts"("tenant_id", "started_at");

-- =====================================================================
-- CREATE TABLE: stock_count_items
-- =====================================================================

CREATE TABLE "stock_count_items" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "count_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "unit_id" TEXT,
  "system_quantity" DECIMAL(18,4) NOT NULL,
  "counted_quantity" DECIMAL(18,4),
  "difference" DECIMAL(18,4),
  "barcode" TEXT,
  "counted_by_id" TEXT,
  "counted_at" TIMESTAMP(3),
  "status" "CountItemStatus" NOT NULL DEFAULT 'PENDING',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

ALTER TABLE "stock_count_items" ADD CONSTRAINT "stock_count_items_pkey" PRIMARY KEY ("id");

ALTER TABLE "stock_count_items"
  ADD CONSTRAINT "stock_count_items_tenant_id_fkey" FOREIGN KEY ("tenant_id")
  REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stock_count_items"
  ADD CONSTRAINT "stock_count_items_count_id_fkey" FOREIGN KEY ("count_id")
  REFERENCES "stock_counts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stock_count_items"
  ADD CONSTRAINT "stock_count_items_product_id_fkey" FOREIGN KEY ("product_id")
  REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "stock_count_items_tenant_id_idx" ON "stock_count_items"("tenant_id");
CREATE INDEX "stock_count_items_tenant_count_idx" ON "stock_count_items"("tenant_id", "count_id");
CREATE INDEX "stock_count_items_count_status_idx" ON "stock_count_items"("count_id", "status");
CREATE INDEX "stock_count_items_tenant_product_idx" ON "stock_count_items"("tenant_id", "product_id");