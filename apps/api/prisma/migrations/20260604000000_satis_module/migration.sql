-- =====================================================================
-- FAZ 8 — SATIŞ MODÜLÜ MIGRATION
-- Eklenen: 4 enum + 2 tablo (Sale, SaleItem) + FK
-- Event-sourcing: Sale.confirm() otomatik cari DEBIT + stok OUT üretir
-- =====================================================================

CREATE TYPE "SaleType" AS ENUM ('SALE', 'RETURN', 'PROFORMA', 'CONSIGNMENT_OUT', 'CONSIGNMENT_IN');
CREATE TYPE "SaleStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'PARTIALLY_SHIPPED', 'SHIPPED', 'DELIVERED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'CLOSED');
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID');
CREATE TYPE "SaleItemStatus" AS ENUM ('ACTIVE', 'CANCELLED');

CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "saleNumber" TEXT NOT NULL,
    "saleDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "type" "SaleType" NOT NULL DEFAULT 'SALE',
    "status" "SaleStatus" NOT NULL DEFAULT 'DRAFT',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "warehouseId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "exchangeRate" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "subTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "vatTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "customerName" TEXT NOT NULL,
    "customerTaxNumber" TEXT,
    "customerAddress" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "notes" TEXT,
    "internalNotes" TEXT,
    "cancelsSaleId" TEXT,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tenant_code_key" ON "Tenant"("code");
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");
CREATE INDEX "Tenant_isDeleted_idx" ON "Tenant"("isDeleted");
CREATE UNIQUE INDEX "TenantSettings_tenantId_key" ON "TenantSettings"("tenantId");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_tenantId_isDeleted_idx" ON "User"("tenantId", "isDeleted");
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");
CREATE INDEX "Role_tenantId_isDeleted_idx" ON "Role"("tenantId", "isDeleted");
CREATE UNIQUE INDEX "Role_tenantId_code_key" ON "Role"("tenantId", "code");
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");
CREATE INDEX "Permission_module_idx" ON "Permission"("module");
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");
CREATE INDEX "UserRole_tenantId_idx" ON "UserRole"("tenantId");
CREATE UNIQUE INDEX "UserRole_userId_roleId_tenantId_key" ON "UserRole"("userId", "roleId", "tenantId");
CREATE UNIQUE INDEX "Module_code_key" ON "Module"("code");
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");
CREATE UNIQUE INDEX "PlanModule_planId_moduleId_key" ON "PlanModule"("planId", "moduleId");
CREATE INDEX "TenantModule_tenantId_isActive_idx" ON "TenantModule"("tenantId", "isActive");
CREATE UNIQUE INDEX "TenantModule_tenantId_moduleId_key" ON "TenantModule"("tenantId", "moduleId");
CREATE INDEX "Subscription_tenantId_status_idx" ON "Subscription"("tenantId", "status");
CREATE INDEX "Subscription_endAt_idx" ON "Subscription"("endAt");
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_riskLevel_idx" ON "AuditLog"("riskLevel");
CREATE INDEX "ErrorLog_tenantId_createdAt_idx" ON "ErrorLog"("tenantId", "createdAt");
CREATE INDEX "ErrorLog_level_idx" ON "ErrorLog"("level");
CREATE INDEX "SecurityLog_tenantId_createdAt_idx" ON "SecurityLog"("tenantId", "createdAt");
CREATE INDEX "SecurityLog_event_idx" ON "SecurityLog"("event");
CREATE INDEX "Notification_tenantId_createdAt_idx" ON "Notification"("tenantId", "createdAt");
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX "Notification_tenantId_isRead_idx" ON "Notification"("tenantId", "isRead");
CREATE INDEX "Notification_category_idx" ON "Notification"("category");
CREATE INDEX "Notification_expiresAt_idx" ON "Notification"("expiresAt");
CREATE INDEX "PaymentMethod_tenantId_isActive_idx" ON "PaymentMethod"("tenantId", "isActive");
CREATE INDEX "PaymentMethod_tenantId_type_idx" ON "PaymentMethod"("tenantId", "type");
CREATE UNIQUE INDEX "PaymentMethod_tenantId_code_key" ON "PaymentMethod"("tenantId", "code");
CREATE INDEX "Customer_tenantId_isDeleted_idx" ON "Customer"("tenantId", "isDeleted");
CREATE INDEX "Customer_tenantId_type_idx" ON "Customer"("tenantId", "type");
CREATE INDEX "Customer_tenantId_status_idx" ON "Customer"("tenantId", "status");
CREATE INDEX "Customer_tenantId_name_idx" ON "Customer"("tenantId", "name");
CREATE INDEX "Customer_tenantId_taxNumber_idx" ON "Customer"("tenantId", "taxNumber");
CREATE INDEX "Customer_tenantId_phone_idx" ON "Customer"("tenantId", "phone");
CREATE UNIQUE INDEX "Customer_tenantId_code_key" ON "Customer"("tenantId", "code");
CREATE UNIQUE INDEX "CustomerMovement_reversesId_key" ON "CustomerMovement"("reversesId");
CREATE INDEX "CustomerMovement_tenantId_customerId_movementDate_idx" ON "CustomerMovement"("tenantId", "customerId", "movementDate");
CREATE INDEX "CustomerMovement_tenantId_movementDate_idx" ON "CustomerMovement"("tenantId", "movementDate");
CREATE INDEX "CustomerMovement_tenantId_refType_refId_idx" ON "CustomerMovement"("tenantId", "refType", "refId");
CREATE INDEX "CustomerMovement_tenantId_status_idx" ON "CustomerMovement"("tenantId", "status");
CREATE INDEX "CustomerMovement_tenantId_dueDate_idx" ON "CustomerMovement"("tenantId", "dueDate");
CREATE INDEX "CustomerMovement_customerId_status_idx" ON "CustomerMovement"("customerId", "status");
CREATE INDEX "CustomerMovement_reversesId_idx" ON "CustomerMovement"("reversesId");
CREATE INDEX "CashAccount_tenantId_isDeleted_idx" ON "CashAccount"("tenantId", "isDeleted");
CREATE INDEX "CashAccount_tenantId_type_idx" ON "CashAccount"("tenantId", "type");
CREATE INDEX "CashAccount_tenantId_status_idx" ON "CashAccount"("tenantId", "status");
CREATE UNIQUE INDEX "CashAccount_tenantId_code_key" ON "CashAccount"("tenantId", "code");
CREATE UNIQUE INDEX "CashMovement_customerMovementId_key" ON "CashMovement"("customerMovementId");
CREATE UNIQUE INDEX "CashMovement_reversesId_key" ON "CashMovement"("reversesId");
CREATE INDEX "CashMovement_tenantId_cashAccountId_movementDate_idx" ON "CashMovement"("tenantId", "cashAccountId", "movementDate");
CREATE INDEX "CashMovement_tenantId_movementDate_idx" ON "CashMovement"("tenantId", "movementDate");
CREATE INDEX "CashMovement_tenantId_refType_refId_idx" ON "CashMovement"("tenantId", "refType", "refId");
CREATE INDEX "CashMovement_tenantId_status_idx" ON "CashMovement"("tenantId", "status");
CREATE INDEX "CashMovement_customerId_idx" ON "CashMovement"("customerId");
CREATE INDEX "CashMovement_reversesId_idx" ON "CashMovement"("reversesId");
CREATE INDEX "Unit_tenantId_isActive_idx" ON "Unit"("tenantId", "isActive");
CREATE INDEX "Unit_tenantId_type_idx" ON "Unit"("tenantId", "type");
CREATE UNIQUE INDEX "Unit_tenantId_code_key" ON "Unit"("tenantId", "code");
CREATE INDEX "Brand_tenantId_isDeleted_idx" ON "Brand"("tenantId", "isDeleted");
CREATE UNIQUE INDEX "Brand_tenantId_code_key" ON "Brand"("tenantId", "code");
CREATE INDEX "ProductCategory_tenantId_parentId_idx" ON "ProductCategory"("tenantId", "parentId");
CREATE INDEX "ProductCategory_tenantId_isDeleted_idx" ON "ProductCategory"("tenantId", "isDeleted");
CREATE UNIQUE INDEX "ProductCategory_tenantId_code_key" ON "ProductCategory"("tenantId", "code");
CREATE INDEX "Warehouse_tenantId_isDeleted_idx" ON "Warehouse"("tenantId", "isDeleted");
CREATE INDEX "Warehouse_tenantId_status_idx" ON "Warehouse"("tenantId", "status");
CREATE UNIQUE INDEX "Warehouse_tenantId_code_key" ON "Warehouse"("tenantId", "code");
CREATE INDEX "Product_tenantId_isDeleted_idx" ON "Product"("tenantId", "isDeleted");
CREATE INDEX "Product_tenantId_type_idx" ON "Product"("tenantId", "type");
CREATE INDEX "Product_tenantId_status_idx" ON "Product"("tenantId", "status");
CREATE INDEX "Product_tenantId_name_idx" ON "Product"("tenantId", "name");
CREATE INDEX "Product_tenantId_brandId_idx" ON "Product"("tenantId", "brandId");
CREATE INDEX "Product_tenantId_categoryId_idx" ON "Product"("tenantId", "categoryId");
CREATE INDEX "Product_tenantId_primaryBarcode_idx" ON "Product"("tenantId", "primaryBarcode");
CREATE UNIQUE INDEX "Product_tenantId_code_key" ON "Product"("tenantId", "code");
CREATE INDEX "ProductBarcode_tenantId_productId_idx" ON "ProductBarcode"("tenantId", "productId");
CREATE INDEX "ProductBarcode_productId_isPrimary_idx" ON "ProductBarcode"("productId", "isPrimary");
CREATE UNIQUE INDEX "ProductBarcode_tenantId_barcode_key" ON "ProductBarcode"("tenantId", "barcode");
CREATE INDEX "ProductPrice_tenantId_productId_type_idx" ON "ProductPrice"("tenantId", "productId", "type");
CREATE INDEX "ProductPrice_tenantId_type_idx" ON "ProductPrice"("tenantId", "type");
CREATE INDEX "ProductPrice_productId_validFrom_idx" ON "ProductPrice"("productId", "validFrom");
CREATE UNIQUE INDEX "StockMovement_reversesId_key" ON "StockMovement"("reversesId");
CREATE INDEX "StockMovement_tenantId_productId_warehouseId_movementDate_idx" ON "StockMovement"("tenantId", "productId", "warehouseId", "movementDate");
CREATE INDEX "StockMovement_tenantId_productId_movementDate_idx" ON "StockMovement"("tenantId", "productId", "movementDate");
CREATE INDEX "StockMovement_tenantId_warehouseId_movementDate_idx" ON "StockMovement"("tenantId", "warehouseId", "movementDate");
CREATE INDEX "StockMovement_tenantId_refType_refId_idx" ON "StockMovement"("tenantId", "refType", "refId");
CREATE INDEX "StockMovement_tenantId_status_idx" ON "StockMovement"("tenantId", "status");
CREATE INDEX "StockMovement_reversesId_idx" ON "StockMovement"("reversesId");
CREATE UNIQUE INDEX "Sale_cancelsSaleId_key" ON "Sale"("cancelsSaleId");
CREATE INDEX "Sale_tenantId_customerId_saleDate_idx" ON "Sale"("tenantId", "customerId", "saleDate");
CREATE INDEX "Sale_tenantId_status_idx" ON "Sale"("tenantId", "status");
CREATE INDEX "Sale_tenantId_saleDate_idx" ON "Sale"("tenantId", "saleDate");
CREATE INDEX "Sale_tenantId_paymentStatus_idx" ON "Sale"("tenantId", "paymentStatus");
CREATE INDEX "Sale_tenantId_type_idx" ON "Sale"("tenantId", "type");
CREATE INDEX "Sale_cancelsSaleId_idx" ON "Sale"("cancelsSaleId");
CREATE UNIQUE INDEX "Sale_tenantId_saleNumber_key" ON "Sale"("tenantId", "saleNumber");
CREATE INDEX "SaleItem_tenantId_saleId_idx" ON "SaleItem"("tenantId", "saleId");
CREATE INDEX "SaleItem_tenantId_productId_idx" ON "SaleItem"("tenantId", "productId");
CREATE INDEX "SaleItem_saleId_sortOrder_idx" ON "SaleItem"("saleId", "sortOrder");

ALTER TABLE "Sale" ADD CONSTRAINT "Sale_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_cancelsSaleId_fkey" FOREIGN KEY ("cancelsSaleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
