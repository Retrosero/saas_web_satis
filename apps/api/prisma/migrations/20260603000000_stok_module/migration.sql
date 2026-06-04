-- =====================================================================
-- FAZ 7 — STOK MODÜLÜ MIGRATION
-- Eklenen: 7 enum + 8 tablo (Unit, Brand, ProductCategory, Warehouse,
--          Product, ProductBarcode, ProductPrice, StockMovement) + FK
-- Event-sourcing: Product tablosunda quantity YOK,
--                 miktar StockMovement tablosundan hesaplanır.
-- =====================================================================

CREATE TYPE "UnitType" AS ENUM ('PIECE', 'WEIGHT', 'LENGTH', 'VOLUME', 'TIME', 'AREA');
CREATE TYPE "ProductType" AS ENUM ('GOODS', 'SERVICE', 'RAW_MATERIAL', 'FINISHED_GOOD', 'CONSUMABLE');
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PASSIVE', 'DISCONTINUED');
CREATE TYPE "StockMovementRefType" AS ENUM ('SALE', 'SALE_CANCEL', 'PURCHASE', 'PURCHASE_CANCEL', 'TRANSFER', 'TRANSFER_CANCEL', 'ADJUST', 'COUNT', 'OPENING_BALANCE', 'RETURN', 'PRODUCTION', 'WASTE');
CREATE TYPE "WarehouseStatus" AS ENUM ('ACTIVE', 'PASSIVE');
CREATE TYPE "PriceType" AS ENUM ('PURCHASE', 'SALE', 'WHOLESALE', 'MIN_SALE', 'LIST_PRICE');
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'TRANSFER', 'ADJUST');

CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "UnitType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "WarehouseStatus" NOT NULL DEFAULT 'ACTIVE',
    "address" TEXT,
    "city" TEXT,
    "manager" TEXT,
    "phone" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "description" TEXT,
    "type" "ProductType" NOT NULL DEFAULT 'GOODS',
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "brandId" TEXT,
    "categoryId" TEXT,
    "defaultWarehouseId" TEXT,
    "unitId" TEXT NOT NULL,
    "primaryBarcode" TEXT,
    "trackStock" BOOLEAN NOT NULL DEFAULT true,
    "vatRate" DECIMAL(65,30) NOT NULL DEFAULT 20,
    "minStock" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "maxStock" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "weight" DECIMAL(65,30),
    "volume" DECIMAL(65,30),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductBarcode" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "unitId" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductBarcode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductPrice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "PriceType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductPrice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unitCost" DECIMAL(65,30),
    "movementDate" TIMESTAMP(3) NOT NULL,
    "refType" "StockMovementRefType" NOT NULL,
    "refId" TEXT,
    "refNumber" TEXT,
    "description" TEXT,
    "status" "MovementStatus" NOT NULL DEFAULT 'POSTED',
    "transferToWarehouseId" TEXT,
    "reversesId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
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

ALTER TABLE "Unit" ADD CONSTRAINT "Unit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_defaultWarehouseId_fkey" FOREIGN KEY ("defaultWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductBarcode" ADD CONSTRAINT "ProductBarcode_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductBarcode" ADD CONSTRAINT "ProductBarcode_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_transferToWarehouseId_fkey" FOREIGN KEY ("transferToWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_reversesId_fkey" FOREIGN KEY ("reversesId") REFERENCES "StockMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
