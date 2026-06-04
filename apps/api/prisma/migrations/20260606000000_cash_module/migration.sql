-- Migration: FAZ 11 — Kasa Modülü (schema extensions + yeni relations)
-- Created: 2026-06-06

-- =====================================================================
-- ALTER TABLE: cash_accounts — add collections relation + transfer relations
-- =====================================================================

ALTER TABLE "cash_accounts" ADD COLUMN "collection_count" INTEGER NOT NULL DEFAULT 0;

-- =====================================================================
-- ALTER TABLE: cash_movements — add transferToAccount self-relation
-- =====================================================================

ALTER TABLE "cash_movements" ADD COLUMN "transfer_to_account_id" TEXT;

ALTER TABLE "cash_movements"
  ADD CONSTRAINT "cash_movements_transfer_to_account_id_fkey"
  FOREIGN KEY ("transfer_to_account_id")
  REFERENCES "cash_accounts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "cash_movements_transfer_to_account_id_idx"
  ON "cash_movements"("transfer_to_account_id");

-- =====================================================================
-- ALTER TABLE: collections — add cash_account back-ref
-- =====================================================================

ALTER TABLE "collections" ADD COLUMN "cash_account_id" TEXT;

ALTER TABLE "collections"
  ADD CONSTRAINT "collections_cash_account_id_fkey"
  FOREIGN KEY ("cash_account_id")
  REFERENCES "cash_accounts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "collections_cash_account_id_idx" ON "collections"("cash_account_id");