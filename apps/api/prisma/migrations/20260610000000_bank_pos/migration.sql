-- =====================================================================
-- FAZ 22 — BANKA & POS MODÜLÜ MİGRATİONU
-- =====================================================================
-- 4 tablo: BankAccount, BankTransaction, PosDevice, PosCollection
-- Event-sourced: bakiye = SUM(transactions)
-- =====================================================================

-- Enums
CREATE TYPE "BankAccountStatus" AS ENUM ('ACTIVE', 'PASSIVE', 'BLOCKED');
CREATE TYPE "BankAccountType" AS ENUM ('CHECKING', 'SAVINGS', 'FOREIGN_CURRENCY', 'POS');
CREATE TYPE "BankTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'FEE', 'COLLECTION', 'PAYMENT', 'POS_COLLECTION', 'INTEREST', 'OTHER');
CREATE TYPE "PosStatus" AS ENUM ('ACTIVE', 'PASSIVE');
CREATE TYPE "PosCollectionStatus" AS ENUM ('PENDING', 'SETTLED', 'REVERSED', 'PARTIAL');

-- BankAccount
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "iban" VARCHAR(34),
    "accountNumber" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "type" "BankAccountType" NOT NULL DEFAULT 'CHECKING',
    "status" "BankAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "branchCode" TEXT,
    "branchName" TEXT,
    "notes" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bank_accounts_tenantId_iban_key" ON "bank_accounts"("tenantId", "iban");
CREATE INDEX "bank_accounts_tenantId_status_idx" ON "bank_accounts"("tenantId", "status");
CREATE INDEX "bank_accounts_tenantId_type_idx" ON "bank_accounts"("tenantId", "type");
CREATE INDEX "bank_accounts_tenantId_isDeleted_idx" ON "bank_accounts"("tenantId", "isDeleted");
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BankTransaction
CREATE TABLE "bank_transactions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "txnDate" TIMESTAMP(3) NOT NULL,
    "type" "BankTransactionType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "exchangeRate" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "amountTry" DECIMAL(65,30) NOT NULL,
    "customerId" TEXT,
    "counterBankAccountId" TEXT,
    "posCollectionId" TEXT,
    "description" TEXT,
    "refType" TEXT,
    "refId" TEXT,
    "refNumber" TEXT,
    "isReconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciledAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bank_transactions_tenantId_bankAccountId_txnDate_idx" ON "bank_transactions"("tenantId", "bankAccountId", "txnDate");
CREATE INDEX "bank_transactions_tenantId_type_idx" ON "bank_transactions"("tenantId", "type");
CREATE INDEX "bank_transactions_tenantId_customerId_idx" ON "bank_transactions"("tenantId", "customerId");
CREATE INDEX "bank_transactions_tenantId_txnDate_idx" ON "bank_transactions"("tenantId", "txnDate");
CREATE INDEX "bank_transactions_tenantId_isDeleted_idx" ON "bank_transactions"("tenantId", "isDeleted");
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_counterBankAccountId_fkey" FOREIGN KEY ("counterBankAccountId") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- PosDevice
CREATE TABLE "pos_devices" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "posCode" TEXT NOT NULL,
    "commissionRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "blockDays" INTEGER NOT NULL DEFAULT 1,
    "status" "PosStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pos_devices_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "pos_devices_tenantId_posCode_key" ON "pos_devices"("tenantId", "posCode");
CREATE INDEX "pos_devices_tenantId_status_idx" ON "pos_devices"("tenantId", "status");
CREATE INDEX "pos_devices_tenantId_isDeleted_idx" ON "pos_devices"("tenantId", "isDeleted");
ALTER TABLE "pos_devices" ADD CONSTRAINT "pos_devices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pos_devices" ADD CONSTRAINT "pos_devices_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- PosCollection
CREATE TABLE "pos_collections" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "posDeviceId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "collectionDate" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "commission" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(65,30) NOT NULL,
    "installment" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" "PosCollectionStatus" NOT NULL DEFAULT 'PENDING',
    "settlementDate" TIMESTAMP(3),
    "description" TEXT,
    "refType" TEXT,
    "refId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pos_collections_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "pos_collections_tenantId_posDeviceId_collectionDate_idx" ON "pos_collections"("tenantId", "posDeviceId", "collectionDate");
CREATE INDEX "pos_collections_tenantId_bankAccountId_collectionDate_idx" ON "pos_collections"("tenantId", "bankAccountId", "collectionDate");
CREATE INDEX "pos_collections_tenantId_status_idx" ON "pos_collections"("tenantId", "status");
CREATE INDEX "pos_collections_tenantId_customerId_idx" ON "pos_collections"("tenantId", "customerId");
CREATE INDEX "pos_collections_tenantId_isDeleted_idx" ON "pos_collections"("tenantId", "isDeleted");
ALTER TABLE "pos_collections" ADD CONSTRAINT "pos_collections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pos_collections" ADD CONSTRAINT "pos_collections_posDeviceId_fkey" FOREIGN KEY ("posDeviceId") REFERENCES "pos_devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pos_collections" ADD CONSTRAINT "pos_collections_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
