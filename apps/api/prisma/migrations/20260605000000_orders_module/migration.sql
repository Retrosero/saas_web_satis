-- Migration: FAZ 9 — Sipariş Modülü
-- Created: 2026-06-05

-- =====================================================================
-- CREATE ENUMS
-- =====================================================================

CREATE TYPE "OrderStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'PARTIALLY_SHIPPED',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE "OrderType" AS ENUM (
  'SALES_ORDER',
  'PURCHASE_ORDER',
  'RETURN_ORDER',
  'PROFORMA_ORDER',
  'CONSIGNMENT_OUT'
);

-- =====================================================================
-- CREATE TABLE: orders
-- =====================================================================

CREATE TABLE "orders" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "order_number" TEXT NOT NULL,
  "order_date" TIMESTAMP(3) NOT NULL,
  "delivery_date" TIMESTAMP(3),
  "type" "OrderType" NOT NULL DEFAULT 'SALES_ORDER',
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',

  "customer_id" TEXT NOT NULL,
  "customer_name" TEXT NOT NULL,
  "customer_tax_number" TEXT,
  "customer_address" TEXT,
  "customer_phone" TEXT,
  "customer_email" TEXT,

  "currency" TEXT NOT NULL DEFAULT 'TRY',
  "exchange_rate" DECIMAL(18,4) NOT NULL DEFAULT 1,
  "sub_total" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "vat_total" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "discount_total" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "grand_total" DECIMAL(18,4) NOT NULL DEFAULT 0,

  "warehouse_id" TEXT,
  "warehouse_name" TEXT,

  "linked_sale_id" TEXT,
  "notes" TEXT,
  "internal_notes" TEXT,
  "cancels_order_id" TEXT,

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
-- CREATE TABLE: order_items
-- =====================================================================

CREATE TABLE "order_items" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "unit_id" TEXT,
  "quantity" DECIMAL(18,4) NOT NULL,
  "quantity_shipped" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "unit_price" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "vat_rate" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "discount_rate" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "description" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "status" "SaleItemStatus" NOT NULL DEFAULT 'ACTIVE',
  "line_sub_total" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "discount_amount" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "line_vat_amount" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "line_grand_total" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- PRIMARY KEYS
-- =====================================================================

ALTER TABLE "orders" ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");

-- =====================================================================
-- UNIQUE CONSTRAINTS
-- =====================================================================

ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_order_number_key" UNIQUE ("tenant_id", "order_number");
ALTER TABLE "orders" ADD CONSTRAINT "orders_linked_sale_id_key" UNIQUE ("linked_sale_id");
ALTER TABLE "orders" ADD CONSTRAINT "orders_cancels_order_id_key" UNIQUE ("cancels_order_id");

-- =====================================================================
-- FOREIGN KEYS — orders
-- =====================================================================

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_linked_sale_id_fkey" FOREIGN KEY ("linked_sale_id") REFERENCES "sales"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_cancels_order_id_fkey" FOREIGN KEY ("cancels_order_id") REFERENCES "orders"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================================
-- FOREIGN KEYS — order_items
-- =====================================================================

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- =====================================================================
-- INDEXES — orders
-- =====================================================================

CREATE INDEX "orders_tenant_id_idx" ON "orders"("tenant_id");
CREATE INDEX "orders_tenant_customer_order_date_idx" ON "orders"("tenant_id", "customer_id", "order_date");
CREATE INDEX "orders_tenant_status_idx" ON "orders"("tenant_id", "status");
CREATE INDEX "orders_tenant_order_date_idx" ON "orders"("tenant_id", "order_date");
CREATE INDEX "orders_tenant_type_idx" ON "orders"("tenant_id", "type");
CREATE INDEX "orders_tenant_linked_sale_id_idx" ON "orders"("tenant_id", "linked_sale_id");
CREATE INDEX "orders_cancels_order_id_idx" ON "orders"("cancels_order_id");

-- =====================================================================
-- INDEXES — order_items
-- =====================================================================

CREATE INDEX "order_items_tenant_id_idx" ON "order_items"("tenant_id");
CREATE INDEX "order_items_tenant_order_id_idx" ON "order_items"("tenant_id", "order_id");
CREATE INDEX "order_items_tenant_product_id_idx" ON "order_items"("tenant_id", "product_id");
CREATE INDEX "order_items_order_id_sort_order_idx" ON "order_items"("order_id", "sort_order");

-- =====================================================================
-- ALTER TABLE: sales — back-reference to orders
-- =====================================================================

ALTER TABLE "sales" ADD COLUMN "from_order_id" TEXT;

ALTER TABLE "sales"
  ADD CONSTRAINT "sales_from_order_id_fkey" FOREIGN KEY ("from_order_id") REFERENCES "orders"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "sales_from_order_id_idx" ON "sales"("from_order_id");

-- =====================================================================
-- ALTER TABLE: customers — orders back-reference
-- =====================================================================

ALTER TABLE "customers" ADD COLUMN "order_count" INTEGER NOT NULL DEFAULT 0;
