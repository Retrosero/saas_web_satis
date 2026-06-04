-- Migration: FAZ 14 — Depo Yönetimi (Warehouse extension + WarehouseTransfer)
-- Created: 2026-06-07

-- =====================================================================
-- ALTER TABLE: warehouses — add branch, managerUserId, authorizedUserIds
-- =====================================================================

ALTER TABLE "warehouses" ADD COLUMN "branch" TEXT;
ALTER TABLE "warehouses" ADD COLUMN "manager_user_id" TEXT;
ALTER TABLE "warehouses" ADD COLUMN "authorized_user_ids" TEXT[] DEFAULT '{}';

CREATE INDEX "warehouses_manager_user_id_idx" ON "warehouses"("manager_user_id");

-- =====================================================================
-- CREATE TABLE: warehouse_transfers
-- =====================================================================

CREATE TABLE "warehouse_transfers" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "transfer_number" TEXT NOT NULL,
  "transfer_date" TIMESTAMP(3) NOT NULL,
  "from_warehouse_id" TEXT NOT NULL,
  "to_warehouse_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "description" TEXT,
  "notes" TEXT,
  "internal_notes" TEXT,
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

ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_pkey" PRIMARY KEY ("id");
ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_tenant_id_transfer_number_key" UNIQUE ("tenant_id", "transfer_number");

ALTER TABLE "warehouse_transfers"
  ADD CONSTRAINT "warehouse_transfers_tenant_id_fkey" FOREIGN KEY ("tenant_id")
  REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "warehouse_transfers"
  ADD CONSTRAINT "warehouse_transfers_from_warehouse_id_fkey" FOREIGN KEY ("from_warehouse_id")
  REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "warehouse_transfers"
  ADD CONSTRAINT "warehouse_transfers_to_warehouse_id_fkey" FOREIGN KEY ("to_warehouse_id")
  REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "warehouse_transfers_tenant_id_idx" ON "warehouse_transfers"("tenant_id");
CREATE INDEX "warehouse_transfers_tenant_transfer_date_idx" ON "warehouse_transfers"("tenant_id", "transfer_date");
CREATE INDEX "warehouse_transfers_tenant_status_idx" ON "warehouse_transfers"("tenant_id", "status");
CREATE INDEX "warehouse_transfers_from_warehouse_id_idx" ON "warehouse_transfers"("from_warehouse_id");
CREATE INDEX "warehouse_transfers_to_warehouse_id_idx" ON "warehouse_transfers"("to_warehouse_id");

-- =====================================================================
-- CREATE TABLE: warehouse_transfer_items
-- =====================================================================

CREATE TABLE "warehouse_transfer_items" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "transfer_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "unit_id" TEXT,
  "quantity" DECIMAL(18,4) NOT NULL,
  "description" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

ALTER TABLE "warehouse_transfer_items" ADD CONSTRAINT "warehouse_transfer_items_pkey" PRIMARY KEY ("id");

ALTER TABLE "warehouse_transfer_items"
  ADD CONSTRAINT "warehouse_transfer_items_tenant_id_fkey" FOREIGN KEY ("tenant_id")
  REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "warehouse_transfer_items"
  ADD CONSTRAINT "warehouse_transfer_items_transfer_id_fkey" FOREIGN KEY ("transfer_id")
  REFERENCES "warehouse_transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "warehouse_transfer_items"
  ADD CONSTRAINT "warehouse_transfer_items_product_id_fkey" FOREIGN KEY ("product_id")
  REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "warehouse_transfer_items_tenant_id_idx" ON "warehouse_transfer_items"("tenant_id");
CREATE INDEX "warehouse_transfer_items_tenant_transfer_id_idx" ON "warehouse_transfer_items"("tenant_id", "transfer_id");
CREATE INDEX "warehouse_transfer_items_transfer_id_sort_order_idx" ON "warehouse_transfer_items"("transfer_id", "sort_order");