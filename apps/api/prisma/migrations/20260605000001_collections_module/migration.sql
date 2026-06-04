-- Migration: FAZ 10 — Tahsilat Modülü
-- Created: 2026-06-05

-- =====================================================================
-- CREATE ENUM
-- =====================================================================

CREATE TYPE "CollectionStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'REFUNDED'
);

CREATE TYPE "CollectionType" AS ENUM (
  'CASH',
  'BANK_TRANSFER',
  'POS',
  'QR',
  'CHECK',
  'OTHER'
);

-- =====================================================================
-- CREATE TABLE: collections
-- =====================================================================

CREATE TABLE "collections" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "collection_number" TEXT NOT NULL,
  "collection_date" TIMESTAMP(3) NOT NULL,
  "customer_id" TEXT NOT NULL,
  "customer_name" TEXT NOT NULL,
  "customer_tax_number" TEXT,
  "type" "CollectionType" NOT NULL DEFAULT 'CASH',
  "status" "CollectionStatus" NOT NULL DEFAULT 'PENDING',
  "amount" DECIMAL(18,4) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'TRY',
  "exchange_rate" DECIMAL(18,4) NOT NULL DEFAULT 1,
  "linked_sale_id" TEXT,
  "notes" TEXT,
  "internal_notes" TEXT,
  "cancels_collection_id" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  "deleted_at" TIMESTAMP(3),
  "created_by_id" TEXT,
  "updated_by_id" TEXT,
  "confirmed_by_id" TEXT,
  "confirmed_at" TIMESTAMP(3),
  "cancelled_by_id" TEXT,
  "cancelled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- PRIMARY KEY
-- =====================================================================

ALTER TABLE "collections" ADD CONSTRAINT "collections_pkey" PRIMARY KEY ("id");

-- =====================================================================
-- UNIQUE CONSTRAINTS
-- =====================================================================

ALTER TABLE "collections" ADD CONSTRAINT "collections_tenant_id_collection_number_key"
  UNIQUE ("tenant_id", "collection_number");
ALTER TABLE "collections" ADD CONSTRAINT "collections_cancels_collection_id_key"
  UNIQUE ("cancels_collection_id");

-- =====================================================================
-- FOREIGN KEYS — collections
-- =====================================================================

ALTER TABLE "collections"
  ADD CONSTRAINT "collections_tenant_id_fkey" FOREIGN KEY ("tenant_id")
  REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "collections"
  ADD CONSTRAINT "collections_customer_id_fkey" FOREIGN KEY ("customer_id")
  REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "collections"
  ADD CONSTRAINT "collections_linked_sale_id_fkey" FOREIGN KEY ("linked_sale_id")
  REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "collections"
  ADD CONSTRAINT "collections_cancels_collection_id_fkey" FOREIGN KEY ("cancels_collection_id")
  REFERENCES "collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================================
-- INDEXES — collections
-- =====================================================================

CREATE INDEX "collections_tenant_id_idx" ON "collections"("tenant_id");
CREATE INDEX "collections_tenant_customer_collection_date_idx" ON "collections"("tenant_id", "customer_id", "collection_date");
CREATE INDEX "collections_tenant_status_idx" ON "collections"("tenant_id", "status");
CREATE INDEX "collections_tenant_collection_date_idx" ON "collections"("tenant_id", "collection_date");
CREATE INDEX "collections_tenant_type_idx" ON "collections"("tenant_id", "type");
CREATE INDEX "collections_tenant_linked_sale_id_idx" ON "collections"("tenant_id", "linked_sale_id");
CREATE INDEX "collections_cancels_collection_id_idx" ON "collections"("cancels_collection_id");

-- =====================================================================
-- ALTER TABLE: cash_accounts — add collections back-reference
-- =====================================================================

ALTER TABLE "cash_accounts" ADD COLUMN "collection_count" INTEGER NOT NULL DEFAULT 0;
