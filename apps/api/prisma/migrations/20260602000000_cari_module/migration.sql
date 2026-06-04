
-- CreateEnum

CREATE TYPE "CustomerType" AS ENUM ('CUSTOMER', 'SUPPLIER', 'BOTH');

-- CreateEnum

CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'PASSIVE', 'BLOCKED');

-- CreateEnum

CREATE TYPE "CustomerMovementType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum

CREATE TYPE "CustomerMovementRefType" AS ENUM ('SALE', 'SALE_CANCEL', 'COLLECTION', 'COLLECTION_CANCEL', 'RETURN', 'ADJUST', 'OPENING_BALANCE', 'TRANSFER');

-- CreateEnum

CREATE TYPE "CashAccountType" AS ENUM ('CASH', 'BANK', 'POS');

-- CreateEnum

CREATE TYPE "CashAccountStatus" AS ENUM ('ACTIVE', 'PASSIVE');

-- CreateEnum

CREATE TYPE "CashMovementType" AS ENUM ('IN', 'OUT', 'TRANSFER');

-- CreateEnum

CREATE TYPE "CashMovementRefType" AS ENUM ('COLLECTION', 'COLLECTION_CANCEL', 'PAYMENT', 'PAYMENT_CANCEL', 'SALE_REFUND', 'TRANSFER', 'ADJUST', 'OPENING_BALANCE');

-- CreateEnum

CREATE TYPE "PaymentMethodType" AS ENUM ('CASH', 'CARD', 'BANK', 'EFT', 'CHECK', 'OTHER');

-- CreateEnum

CREATE TYPE "MovementStatus" AS ENUM ('DRAFT', 'POSTED', 'PENDING', 'CANCELLED');

-- CreateTable

CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable

CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CustomerType" NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "taxNumber" TEXT,
    "taxOffice" TEXT,
    "identityNumber" TEXT,
    "address" TEXT,
    "city" TEXT,
    "district" TEXT,
    "postalCode" TEXT,
    "country" TEXT DEFAULT 'Türkiye',
    "phone" TEXT,
    "phone2" TEXT,
    "email" TEXT,
    "website" TEXT,
    "iban" TEXT,
    "openingBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "creditLimit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paymentTermDays" INTEGER NOT NULL DEFAULT 0,
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable

CREATE TABLE "CustomerMovement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "CustomerMovementType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "exchangeRate" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "amountTry" DECIMAL(65,30) NOT NULL,
    "movementDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "refType" "CustomerMovementRefType" NOT NULL,
    "refId" TEXT,
    "refNumber" TEXT,
    "description" TEXT,
    "status" "MovementStatus" NOT NULL DEFAULT 'POSTED',
    "reversesId" TEXT,
    "paymentMethodId" TEXT,
    "cashAccountId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CustomerMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable

CREATE TABLE "CashAccount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CashAccountType" NOT NULL,
    "status" "CashAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "iban" TEXT,
    "bankName" TEXT,
    "bankBranch" TEXT,
    "accountHolder" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CashAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable

CREATE TABLE "CashMovement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cashAccountId" TEXT NOT NULL,
    "type" "CashMovementType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "exchangeRate" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "amountTry" DECIMAL(65,30) NOT NULL,
    "movementDate" TIMESTAMP(3) NOT NULL,
    "refType" "CashMovementRefType" NOT NULL,
    "refId" TEXT,
    "refNumber" TEXT,
    "description" TEXT,
    "status" "MovementStatus" NOT NULL DEFAULT 'POSTED',
    "transferToAccountId" TEXT,
    "customerId" TEXT,
    "customerMovementId" TEXT,
    "paymentMethodId" TEXT,
    "reversesId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CashMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex

CREATE INDEX "PaymentMethod_tenantId_isActive_idx" ON "PaymentMethod"("tenantId", "isActive");

-- CreateIndex

CREATE INDEX "PaymentMethod_tenantId_type_idx" ON "PaymentMethod"("tenantId", "type");

-- CreateIndex

CREATE UNIQUE INDEX "PaymentMethod_tenantId_code_key" ON "PaymentMethod"("tenantId", "code");

-- CreateIndex

CREATE INDEX "Customer_tenantId_isDeleted_idx" ON "Customer"("tenantId", "isDeleted");

-- CreateIndex

CREATE INDEX "Customer_tenantId_type_idx" ON "Customer"("tenantId", "type");

-- CreateIndex

CREATE INDEX "Customer_tenantId_status_idx" ON "Customer"("tenantId", "status");

-- CreateIndex

CREATE INDEX "Customer_tenantId_name_idx" ON "Customer"("tenantId", "name");

-- CreateIndex

CREATE INDEX "Customer_tenantId_taxNumber_idx" ON "Customer"("tenantId", "taxNumber");

-- CreateIndex

CREATE INDEX "Customer_tenantId_phone_idx" ON "Customer"("tenantId", "phone");

-- CreateIndex

CREATE UNIQUE INDEX "Customer_tenantId_code_key" ON "Customer"("tenantId", "code");

-- CreateIndex

CREATE UNIQUE INDEX "CustomerMovement_reversesId_key" ON "CustomerMovement"("reversesId");

-- CreateIndex

CREATE INDEX "CustomerMovement_tenantId_customerId_movementDate_idx" ON "CustomerMovement"("tenantId", "customerId", "movementDate");

-- CreateIndex

CREATE INDEX "CustomerMovement_tenantId_movementDate_idx" ON "CustomerMovement"("tenantId", "movementDate");

-- CreateIndex

CREATE INDEX "CustomerMovement_tenantId_refType_refId_idx" ON "CustomerMovement"("tenantId", "refType", "refId");

-- CreateIndex

CREATE INDEX "CustomerMovement_tenantId_status_idx" ON "CustomerMovement"("tenantId", "status");

-- CreateIndex

CREATE INDEX "CustomerMovement_tenantId_dueDate_idx" ON "CustomerMovement"("tenantId", "dueDate");

-- CreateIndex

CREATE INDEX "CustomerMovement_customerId_status_idx" ON "CustomerMovement"("customerId", "status");

-- CreateIndex

CREATE INDEX "CustomerMovement_reversesId_idx" ON "CustomerMovement"("reversesId");

-- CreateIndex

CREATE INDEX "CashAccount_tenantId_isDeleted_idx" ON "CashAccount"("tenantId", "isDeleted");

-- CreateIndex

CREATE INDEX "CashAccount_tenantId_type_idx" ON "CashAccount"("tenantId", "type");

-- CreateIndex

CREATE INDEX "CashAccount_tenantId_status_idx" ON "CashAccount"("tenantId", "status");

-- CreateIndex

CREATE UNIQUE INDEX "CashAccount_tenantId_code_key" ON "CashAccount"("tenantId", "code");

-- CreateIndex

CREATE UNIQUE INDEX "CashMovement_customerMovementId_key" ON "CashMovement"("customerMovementId");

-- CreateIndex

CREATE UNIQUE INDEX "CashMovement_reversesId_key" ON "CashMovement"("reversesId");

-- CreateIndex

CREATE INDEX "CashMovement_tenantId_cashAccountId_movementDate_idx" ON "CashMovement"("tenantId", "cashAccountId", "movementDate");

-- CreateIndex

CREATE INDEX "CashMovement_tenantId_movementDate_idx" ON "CashMovement"("tenantId", "movementDate");

-- CreateIndex

CREATE INDEX "CashMovement_tenantId_refType_refId_idx" ON "CashMovement"("tenantId", "refType", "refId");

-- CreateIndex

CREATE INDEX "CashMovement_tenantId_status_idx" ON "CashMovement"("tenantId", "status");

-- CreateIndex

CREATE INDEX "CashMovement_customerId_idx" ON "CashMovement"("customerId");

-- CreateIndex

CREATE INDEX "CashMovement_reversesId_idx" ON "CashMovement"("reversesId");

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerMovement" ADD CONSTRAINT "CustomerMovement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerMovement" ADD CONSTRAINT "CustomerMovement_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerMovement" ADD CONSTRAINT "CustomerMovement_reversesId_fkey" FOREIGN KEY ("reversesId") REFERENCES "CustomerMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashAccount" ADD CONSTRAINT "CashAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "CashAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_reversesId_fkey" FOREIGN KEY ("reversesId") REFERENCES "CashMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
