-- FAZ 44-52: Kullanıcı Deneyimi & Operasyonel Hız

-- CreateTable
CREATE TABLE "GlobalSearchHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlobalSearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommandDefinition" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "targetRoute" TEXT NOT NULL,
    "requiredPermission" TEXT NOT NULL,
    "requiredModule" TEXT,
    "icon" TEXT NOT NULL DEFAULT '⚡',
    "shortcut" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommandDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "quoteDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "exchangeRate" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "subTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discountRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "vatTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paymentTerms" TEXT,
    "deliveryTerms" TEXT,
    "notes" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "convertedAt" TIMESTAMP(3),
    "convertedRefType" TEXT,
    "convertedRefId" TEXT,
    "preparedById" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "unitId" TEXT,
    "unitName" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "discountRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "vatRate" DECIMAL(65,30) NOT NULL,
    "vatAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(65,30) NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteStatusLog" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "fromStatus" "QuoteStatus",
    "toStatus" "QuoteStatus" NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT,
    "note" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteStatusLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerRiskConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "balanceWarning" DECIMAL(65,30) NOT NULL DEFAULT 10000,
    "balanceCritical" DECIMAL(65,30) NOT NULL DEFAULT 50000,
    "overdue30Warn" DECIMAL(65,30) NOT NULL DEFAULT 5000,
    "overdue60Warn" DECIMAL(65,30) NOT NULL DEFAULT 10000,
    "overdue90Crit" DECIMAL(65,30) NOT NULL DEFAULT 20000,
    "daysSinceOrderWarn" INTEGER NOT NULL DEFAULT 60,
    "daysSinceOrderCrit" INTEGER NOT NULL DEFAULT 120,
    "daysSincePaymentWarn" INTEGER NOT NULL DEFAULT 45,
    "daysSincePaymentCrit" INTEGER NOT NULL DEFAULT 90,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerRiskConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerRiskSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "riskLevel" "CustomerRiskLevel" NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL,
    "overdue30" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "overdue60" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "overdue90" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "daysSinceOrder" INTEGER,
    "daysSincePayment" INTEGER,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "reasons" JSONB NOT NULL DEFAULT '[]',
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerRiskSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductRecommendationRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "RecommendationType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductRecommendationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductRecommendationLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "productId" TEXT NOT NULL,
    "type" "RecommendationType" NOT NULL,
    "userId" TEXT,
    "context" TEXT,
    "addedToCart" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductRecommendationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkOperation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BulkOperationType" NOT NULL,
    "status" "BulkOperationStatus" NOT NULL DEFAULT 'DRAFT',
    "filters" JSONB NOT NULL DEFAULT '{}',
    "update" JSONB NOT NULL DEFAULT '{}',
    "totalMatched" INTEGER NOT NULL DEFAULT 0,
    "totalProcessed" INTEGER NOT NULL DEFAULT 0,
    "totalSuccess" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "batchId" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rolledBackAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BulkOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkOperationItem" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeState" JSONB NOT NULL,
    "afterState" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "BulkOperationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkOperationLog" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BulkOperationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabelTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "type" "LabelType" NOT NULL,
    "pageSize" "LabelPageSize" NOT NULL DEFAULT 'A4',
    "widthMm" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "heightMm" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "layout" JSONB NOT NULL DEFAULT '{}',
    "previewSvg" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabelTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabelPrintJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "productIds" JSONB NOT NULL DEFAULT '[]',
    "copies" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "printedById" TEXT NOT NULL,
    "printedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabelPrintJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "altText" TEXT,
    "uploadedById" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageUploadBatch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "totalFiles" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "matchBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ImageUploadBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageMatchLog" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "matched" BOOLEAN NOT NULL DEFAULT false,
    "productId" TEXT,
    "errorReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageMatchLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSegment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "SegmentType" NOT NULL DEFAULT 'MANUAL',
    "rules" JSONB NOT NULL DEFAULT '[]',
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "lastRefreshAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "icon" TEXT NOT NULL DEFAULT '👥',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CustomerSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSegmentRule" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "joinWith" TEXT DEFAULT 'AND',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CustomerSegmentRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSegmentMember" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedBy" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "CustomerSegmentMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleanupJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "type" "CleanupType" NOT NULL,
    "status" "CleanupStatus" NOT NULL DEFAULT 'PENDING',
    "filters" JSONB NOT NULL DEFAULT '{}',
    "totalMatched" INTEGER NOT NULL DEFAULT 0,
    "totalArchived" INTEGER NOT NULL DEFAULT 0,
    "totalDeleted" INTEGER NOT NULL DEFAULT 0,
    "totalFreedMB" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "preview" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleanupJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleanupJobItem" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sizeMB" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "CleanupJobItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleanupLog" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "sizeMB" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actorId" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CleanupLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "archivedData" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "archivedById" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isRestored" BOOLEAN NOT NULL DEFAULT false,
    "restoredAt" TIMESTAMP(3),

    CONSTRAINT "ArchiveRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CashMovementToCollection" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_code_key" ON "Tenant"("code");

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");

-- CreateIndex
CREATE INDEX "Tenant_isDeleted_idx" ON "Tenant"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSettings_tenantId_key" ON "TenantSettings"("tenantId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_isDeleted_idx" ON "User"("tenantId", "isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- CreateIndex
CREATE INDEX "Role_tenantId_isDeleted_idx" ON "Role"("tenantId", "isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "Role_tenantId_code_key" ON "Role"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "Permission_module_idx" ON "Permission"("module");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "UserRole_tenantId_idx" ON "UserRole"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_tenantId_key" ON "UserRole"("userId", "roleId", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Module_code_key" ON "Module"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PlanModule_planId_moduleId_key" ON "PlanModule"("planId", "moduleId");

-- CreateIndex
CREATE INDEX "TenantModule_tenantId_isActive_idx" ON "TenantModule"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TenantModule_tenantId_moduleId_key" ON "TenantModule"("tenantId", "moduleId");

-- CreateIndex
CREATE INDEX "Subscription_tenantId_status_idx" ON "Subscription"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Subscription_endAt_idx" ON "Subscription"("endAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_riskLevel_idx" ON "AuditLog"("riskLevel");

-- CreateIndex
CREATE INDEX "ErrorLog_tenantId_createdAt_idx" ON "ErrorLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ErrorLog_level_idx" ON "ErrorLog"("level");

-- CreateIndex
CREATE INDEX "SecurityLog_tenantId_createdAt_idx" ON "SecurityLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityLog_event_idx" ON "SecurityLog"("event");

-- CreateIndex
CREATE INDEX "Notification_tenantId_createdAt_idx" ON "Notification"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_tenantId_isRead_idx" ON "Notification"("tenantId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_category_idx" ON "Notification"("category");

-- CreateIndex
CREATE INDEX "Notification_expiresAt_idx" ON "Notification"("expiresAt");

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

-- CreateIndex
CREATE INDEX "Unit_tenantId_isActive_idx" ON "Unit"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "Unit_tenantId_type_idx" ON "Unit"("tenantId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_tenantId_code_key" ON "Unit"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Brand_tenantId_isDeleted_idx" ON "Brand"("tenantId", "isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_tenantId_code_key" ON "Brand"("tenantId", "code");

-- CreateIndex
CREATE INDEX "ProductCategory_tenantId_parentId_idx" ON "ProductCategory"("tenantId", "parentId");

-- CreateIndex
CREATE INDEX "ProductCategory_tenantId_isDeleted_idx" ON "ProductCategory"("tenantId", "isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_tenantId_code_key" ON "ProductCategory"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Warehouse_tenantId_isDeleted_idx" ON "Warehouse"("tenantId", "isDeleted");

-- CreateIndex
CREATE INDEX "Warehouse_tenantId_status_idx" ON "Warehouse"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_tenantId_code_key" ON "Warehouse"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Product_tenantId_isDeleted_idx" ON "Product"("tenantId", "isDeleted");

-- CreateIndex
CREATE INDEX "Product_tenantId_type_idx" ON "Product"("tenantId", "type");

-- CreateIndex
CREATE INDEX "Product_tenantId_status_idx" ON "Product"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Product_tenantId_name_idx" ON "Product"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Product_tenantId_brandId_idx" ON "Product"("tenantId", "brandId");

-- CreateIndex
CREATE INDEX "Product_tenantId_categoryId_idx" ON "Product"("tenantId", "categoryId");

-- CreateIndex
CREATE INDEX "Product_tenantId_primaryBarcode_idx" ON "Product"("tenantId", "primaryBarcode");

-- CreateIndex
CREATE UNIQUE INDEX "Product_tenantId_code_key" ON "Product"("tenantId", "code");

-- CreateIndex
CREATE INDEX "ProductBarcode_tenantId_productId_idx" ON "ProductBarcode"("tenantId", "productId");

-- CreateIndex
CREATE INDEX "ProductBarcode_productId_isPrimary_idx" ON "ProductBarcode"("productId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBarcode_tenantId_barcode_key" ON "ProductBarcode"("tenantId", "barcode");

-- CreateIndex
CREATE INDEX "ProductPrice_tenantId_productId_type_idx" ON "ProductPrice"("tenantId", "productId", "type");

-- CreateIndex
CREATE INDEX "ProductPrice_tenantId_type_idx" ON "ProductPrice"("tenantId", "type");

-- CreateIndex
CREATE INDEX "ProductPrice_productId_validFrom_idx" ON "ProductPrice"("productId", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "StockMovement_reversesId_key" ON "StockMovement"("reversesId");

-- CreateIndex
CREATE INDEX "StockMovement_tenantId_productId_warehouseId_movementDate_idx" ON "StockMovement"("tenantId", "productId", "warehouseId", "movementDate");

-- CreateIndex
CREATE INDEX "StockMovement_tenantId_productId_movementDate_idx" ON "StockMovement"("tenantId", "productId", "movementDate");

-- CreateIndex
CREATE INDEX "StockMovement_tenantId_warehouseId_movementDate_idx" ON "StockMovement"("tenantId", "warehouseId", "movementDate");

-- CreateIndex
CREATE INDEX "StockMovement_tenantId_refType_refId_idx" ON "StockMovement"("tenantId", "refType", "refId");

-- CreateIndex
CREATE INDEX "StockMovement_tenantId_status_idx" ON "StockMovement"("tenantId", "status");

-- CreateIndex
CREATE INDEX "StockMovement_reversesId_idx" ON "StockMovement"("reversesId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_cancelsSaleId_key" ON "Sale"("cancelsSaleId");

-- CreateIndex
CREATE INDEX "Sale_tenantId_customerId_saleDate_idx" ON "Sale"("tenantId", "customerId", "saleDate");

-- CreateIndex
CREATE INDEX "Sale_tenantId_status_idx" ON "Sale"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Sale_tenantId_saleDate_idx" ON "Sale"("tenantId", "saleDate");

-- CreateIndex
CREATE INDEX "Sale_tenantId_paymentStatus_idx" ON "Sale"("tenantId", "paymentStatus");

-- CreateIndex
CREATE INDEX "Sale_tenantId_type_idx" ON "Sale"("tenantId", "type");

-- CreateIndex
CREATE INDEX "Sale_cancelsSaleId_idx" ON "Sale"("cancelsSaleId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_tenantId_saleNumber_key" ON "Sale"("tenantId", "saleNumber");

-- CreateIndex
CREATE INDEX "SaleItem_tenantId_saleId_idx" ON "SaleItem"("tenantId", "saleId");

-- CreateIndex
CREATE INDEX "SaleItem_tenantId_productId_idx" ON "SaleItem"("tenantId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_linkedSaleId_key" ON "Order"("linkedSaleId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_cancelsOrderId_key" ON "Order"("cancelsOrderId");

-- CreateIndex
CREATE INDEX "Order_tenantId_customerId_orderDate_idx" ON "Order"("tenantId", "customerId", "orderDate");

-- CreateIndex
CREATE INDEX "Order_tenantId_status_idx" ON "Order"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Order_tenantId_orderDate_idx" ON "Order"("tenantId", "orderDate");

-- CreateIndex
CREATE INDEX "Order_tenantId_type_idx" ON "Order"("tenantId", "type");

-- CreateIndex
CREATE INDEX "Order_tenantId_linkedSaleId_idx" ON "Order"("tenantId", "linkedSaleId");

-- CreateIndex
CREATE INDEX "Order_cancelsOrderId_idx" ON "Order"("cancelsOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_tenantId_orderNumber_key" ON "Order"("tenantId", "orderNumber");

-- CreateIndex
CREATE INDEX "OrderItem_tenantId_orderId_idx" ON "OrderItem"("tenantId", "orderId");

-- CreateIndex
CREATE INDEX "OrderItem_tenantId_productId_idx" ON "OrderItem"("tenantId", "productId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_sortOrder_idx" ON "OrderItem"("orderId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_cancelsCollectionId_key" ON "Collection"("cancelsCollectionId");

-- CreateIndex
CREATE INDEX "Collection_tenantId_customerId_collectionDate_idx" ON "Collection"("tenantId", "customerId", "collectionDate");

-- CreateIndex
CREATE INDEX "Collection_tenantId_status_idx" ON "Collection"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Collection_tenantId_collectionDate_idx" ON "Collection"("tenantId", "collectionDate");

-- CreateIndex
CREATE INDEX "Collection_tenantId_type_idx" ON "Collection"("tenantId", "type");

-- CreateIndex
CREATE INDEX "Collection_tenantId_linkedSaleId_idx" ON "Collection"("tenantId", "linkedSaleId");

-- CreateIndex
CREATE INDEX "Collection_cancelsCollectionId_idx" ON "Collection"("cancelsCollectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_tenantId_collectionNumber_key" ON "Collection"("tenantId", "collectionNumber");

-- CreateIndex
CREATE INDEX "WarehouseTransfer_tenantId_transferDate_idx" ON "WarehouseTransfer"("tenantId", "transferDate");

-- CreateIndex
CREATE INDEX "WarehouseTransfer_tenantId_status_idx" ON "WarehouseTransfer"("tenantId", "status");

-- CreateIndex
CREATE INDEX "WarehouseTransfer_fromWarehouseId_idx" ON "WarehouseTransfer"("fromWarehouseId");

-- CreateIndex
CREATE INDEX "WarehouseTransfer_toWarehouseId_idx" ON "WarehouseTransfer"("toWarehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseTransfer_tenantId_transferNumber_key" ON "WarehouseTransfer"("tenantId", "transferNumber");

-- CreateIndex
CREATE INDEX "WarehouseTransferItem_tenantId_transferId_idx" ON "WarehouseTransferItem"("tenantId", "transferId");

-- CreateIndex
CREATE INDEX "WarehouseTransferItem_transferId_sortOrder_idx" ON "WarehouseTransferItem"("transferId", "sortOrder");

-- CreateIndex
CREATE INDEX "StockCount_tenantId_warehouseId_idx" ON "StockCount"("tenantId", "warehouseId");

-- CreateIndex
CREATE INDEX "StockCount_tenantId_status_idx" ON "StockCount"("tenantId", "status");

-- CreateIndex
CREATE INDEX "StockCount_tenantId_countType_idx" ON "StockCount"("tenantId", "countType");

-- CreateIndex
CREATE INDEX "StockCount_tenantId_startedAt_idx" ON "StockCount"("tenantId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StockCount_tenantId_countNumber_key" ON "StockCount"("tenantId", "countNumber");

-- CreateIndex
CREATE INDEX "StockCountItem_tenantId_countId_idx" ON "StockCountItem"("tenantId", "countId");

-- CreateIndex
CREATE INDEX "StockCountItem_countId_status_idx" ON "StockCountItem"("countId", "status");

-- CreateIndex
CREATE INDEX "StockCountItem_tenantId_productId_idx" ON "StockCountItem"("tenantId", "productId");

-- CreateIndex
CREATE INDEX "Return_tenantId_customerId_returnDate_idx" ON "Return"("tenantId", "customerId", "returnDate");

-- CreateIndex
CREATE INDEX "Return_tenantId_status_idx" ON "Return"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Return_tenantId_source_sourceId_idx" ON "Return"("tenantId", "source", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Return_tenantId_returnNumber_key" ON "Return"("tenantId", "returnNumber");

-- CreateIndex
CREATE INDEX "ReturnItem_tenantId_returnId_idx" ON "ReturnItem"("tenantId", "returnId");

-- CreateIndex
CREATE INDEX "ReturnItem_tenantId_productId_idx" ON "ReturnItem"("tenantId", "productId");

-- CreateIndex
CREATE INDEX "BankAccount_tenantId_status_idx" ON "BankAccount"("tenantId", "status");

-- CreateIndex
CREATE INDEX "BankAccount_tenantId_type_idx" ON "BankAccount"("tenantId", "type");

-- CreateIndex
CREATE INDEX "BankAccount_tenantId_isDeleted_idx" ON "BankAccount"("tenantId", "isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_tenantId_iban_key" ON "BankAccount"("tenantId", "iban");

-- CreateIndex
CREATE INDEX "BankTransaction_tenantId_bankAccountId_txnDate_idx" ON "BankTransaction"("tenantId", "bankAccountId", "txnDate");

-- CreateIndex
CREATE INDEX "BankTransaction_tenantId_type_idx" ON "BankTransaction"("tenantId", "type");

-- CreateIndex
CREATE INDEX "BankTransaction_tenantId_customerId_idx" ON "BankTransaction"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "BankTransaction_tenantId_txnDate_idx" ON "BankTransaction"("tenantId", "txnDate");

-- CreateIndex
CREATE INDEX "BankTransaction_tenantId_isDeleted_idx" ON "BankTransaction"("tenantId", "isDeleted");

-- CreateIndex
CREATE INDEX "PosDevice_tenantId_status_idx" ON "PosDevice"("tenantId", "status");

-- CreateIndex
CREATE INDEX "PosDevice_tenantId_isDeleted_idx" ON "PosDevice"("tenantId", "isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "PosDevice_tenantId_posCode_key" ON "PosDevice"("tenantId", "posCode");

-- CreateIndex
CREATE INDEX "PosCollection_tenantId_posDeviceId_collectionDate_idx" ON "PosCollection"("tenantId", "posDeviceId", "collectionDate");

-- CreateIndex
CREATE INDEX "PosCollection_tenantId_bankAccountId_collectionDate_idx" ON "PosCollection"("tenantId", "bankAccountId", "collectionDate");

-- CreateIndex
CREATE INDEX "PosCollection_tenantId_status_idx" ON "PosCollection"("tenantId", "status");

-- CreateIndex
CREATE INDEX "PosCollection_tenantId_customerId_idx" ON "PosCollection"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "PosCollection_tenantId_isDeleted_idx" ON "PosCollection"("tenantId", "isDeleted");

-- CreateIndex
CREATE INDEX "ImportBatch_tenantId_status_idx" ON "ImportBatch"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ImportBatch_tenantId_entityType_idx" ON "ImportBatch"("tenantId", "entityType");

-- CreateIndex
CREATE INDEX "ImportBatch_tenantId_createdAt_idx" ON "ImportBatch"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ImportBatch_tenantId_isDeleted_idx" ON "ImportBatch"("tenantId", "isDeleted");

-- CreateIndex
CREATE INDEX "ImportRow_tenantId_batchId_status_idx" ON "ImportRow"("tenantId", "batchId", "status");

-- CreateIndex
CREATE INDEX "ImportRow_tenantId_status_idx" ON "ImportRow"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_tenantId_status_idx" ON "ApiKey"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ApiKey_tenantId_isDeleted_idx" ON "ApiKey"("tenantId", "isDeleted");

-- CreateIndex
CREATE INDEX "ApiKeyUsageLog_tenantId_apiKeyId_createdAt_idx" ON "ApiKeyUsageLog"("tenantId", "apiKeyId", "createdAt");

-- CreateIndex
CREATE INDEX "ApiKeyUsageLog_tenantId_statusCode_idx" ON "ApiKeyUsageLog"("tenantId", "statusCode");

-- CreateIndex
CREATE INDEX "Webhook_tenantId_status_idx" ON "Webhook"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Webhook_tenantId_isDeleted_idx" ON "Webhook"("tenantId", "isDeleted");

-- CreateIndex
CREATE INDEX "WebhookDelivery_tenantId_webhookId_deliveredAt_idx" ON "WebhookDelivery"("tenantId", "webhookId", "deliveredAt");

-- CreateIndex
CREATE INDEX "WebhookDelivery_tenantId_status_idx" ON "WebhookDelivery"("tenantId", "status");

-- CreateIndex
CREATE INDEX "WebhookDelivery_tenantId_eventType_idx" ON "WebhookDelivery"("tenantId", "eventType");

-- CreateIndex
CREATE INDEX "HelpArticle_tenantId_module_idx" ON "HelpArticle"("tenantId", "module");

-- CreateIndex
CREATE INDEX "HelpArticle_tenantId_contentType_idx" ON "HelpArticle"("tenantId", "contentType");

-- CreateIndex
CREATE INDEX "HelpArticle_tenantId_status_idx" ON "HelpArticle"("tenantId", "status");

-- CreateIndex
CREATE INDEX "HelpArticle_tenantId_isDeleted_idx" ON "HelpArticle"("tenantId", "isDeleted");

-- CreateIndex
CREATE INDEX "AssistantTool_tenantId_status_idx" ON "AssistantTool"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AssistantTool_tenantId_module_idx" ON "AssistantTool"("tenantId", "module");

-- CreateIndex
CREATE UNIQUE INDEX "AssistantTool_tenantId_code_key" ON "AssistantTool"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "PriceList_customerGroupId_key" ON "PriceList"("customerGroupId");

-- CreateIndex
CREATE INDEX "PriceList_tenantId_status_idx" ON "PriceList"("tenantId", "status");

-- CreateIndex
CREATE INDEX "PriceList_tenantId_isDeleted_idx" ON "PriceList"("tenantId", "isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "PriceList_tenantId_code_key" ON "PriceList"("tenantId", "code");

-- CreateIndex
CREATE INDEX "PriceListItem_priceListId_idx" ON "PriceListItem"("priceListId");

-- CreateIndex
CREATE UNIQUE INDEX "PriceListItem_priceListId_productId_key" ON "PriceListItem"("priceListId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPriceGroup_defaultPriceListId_key" ON "CustomerPriceGroup"("defaultPriceListId");

-- CreateIndex
CREATE INDEX "CustomerPriceGroup_tenantId_isActive_idx" ON "CustomerPriceGroup"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "CustomerPriceGroup_tenantId_isDeleted_idx" ON "CustomerPriceGroup"("tenantId", "isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPriceGroup_tenantId_code_key" ON "CustomerPriceGroup"("tenantId", "code");

-- CreateIndex
CREATE INDEX "CustomerPriceGroupMember_groupId_idx" ON "CustomerPriceGroupMember"("groupId");

-- CreateIndex
CREATE INDEX "CustomerPriceGroupMember_customerId_idx" ON "CustomerPriceGroupMember"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPriceGroupMember_groupId_customerId_key" ON "CustomerPriceGroupMember"("groupId", "customerId");

-- CreateIndex
CREATE INDEX "Campaign_tenantId_status_idx" ON "Campaign"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Campaign_tenantId_startDate_endDate_idx" ON "Campaign"("tenantId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "Campaign_tenantId_campaignType_idx" ON "Campaign"("tenantId", "campaignType");

-- CreateIndex
CREATE INDEX "Campaign_tenantId_isDeleted_idx" ON "Campaign"("tenantId", "isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_tenantId_code_key" ON "Campaign"("tenantId", "code");

-- CreateIndex
CREATE INDEX "DocumentTemplate_tenantId_documentType_idx" ON "DocumentTemplate"("tenantId", "documentType");

-- CreateIndex
CREATE INDEX "DocumentTemplate_tenantId_isActive_idx" ON "DocumentTemplate"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "DocumentTemplate_tenantId_isDefault_idx" ON "DocumentTemplate"("tenantId", "isDefault");

-- CreateIndex
CREATE INDEX "DocumentTemplate_tenantId_isDeleted_idx" ON "DocumentTemplate"("tenantId", "isDeleted");

-- CreateIndex
CREATE INDEX "DocumentTemplate_isDeleted_idx" ON "DocumentTemplate"("isDeleted");

-- CreateIndex
CREATE INDEX "ReportTemplate_tenantId_isActive_idx" ON "ReportTemplate"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "ReportTemplate_tenantId_isDeleted_idx" ON "ReportTemplate"("tenantId", "isDeleted");

-- CreateIndex
CREATE INDEX "ReportTemplate_tenantId_isFavorite_idx" ON "ReportTemplate"("tenantId", "isFavorite");

-- CreateIndex
CREATE INDEX "ScheduledReport_tenantId_isActive_idx" ON "ScheduledReport"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "ScheduledReport_nextRunAt_idx" ON "ScheduledReport"("nextRunAt");

-- CreateIndex
CREATE INDEX "NotificationChannel_tenantId_isDeleted_idx" ON "NotificationChannel"("tenantId", "isDeleted");

-- CreateIndex
CREATE INDEX "NotificationChannel_tenantId_type_idx" ON "NotificationChannel"("tenantId", "type");

-- CreateIndex
CREATE INDEX "NotificationChannel_tenantId_isActive_idx" ON "NotificationChannel"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "NotificationChannelSecret_channelId_idx" ON "NotificationChannelSecret"("channelId");

-- CreateIndex
CREATE INDEX "NotificationRule_tenantId_isActive_idx" ON "NotificationRule"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "NotificationRule_tenantId_triggerType_idx" ON "NotificationRule"("tenantId", "triggerType");

-- CreateIndex
CREATE INDEX "NotificationRule_tenantId_isDeleted_idx" ON "NotificationRule"("tenantId", "isDeleted");

-- CreateIndex
CREATE INDEX "NotificationRule_lastTriggeredAt_idx" ON "NotificationRule"("lastTriggeredAt");

-- CreateIndex
CREATE INDEX "NotificationLog_tenantId_createdAt_idx" ON "NotificationLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationLog_tenantId_status_idx" ON "NotificationLog"("tenantId", "status");

-- CreateIndex
CREATE INDEX "NotificationLog_ruleId_createdAt_idx" ON "NotificationLog"("ruleId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationLog_channelId_createdAt_idx" ON "NotificationLog"("channelId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationLog_recipientId_idx" ON "NotificationLog"("recipientId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreferences_userId_key" ON "NotificationPreferences"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreferences_userId_idx" ON "NotificationPreferences"("userId");

-- CreateIndex
CREATE INDEX "ApprovalRule_tenantId_isActive_idx" ON "ApprovalRule"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "ApprovalRule_tenantId_isDeleted_idx" ON "ApprovalRule"("tenantId", "isDeleted");

-- CreateIndex
CREATE INDEX "ApprovalRule_triggerType_idx" ON "ApprovalRule"("triggerType");

-- CreateIndex
CREATE INDEX "ApprovalRule_lastTriggeredAt_idx" ON "ApprovalRule"("lastTriggeredAt");

-- CreateIndex
CREATE INDEX "ApprovalStep_ruleId_stepOrder_idx" ON "ApprovalStep"("ruleId", "stepOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalStep_ruleId_stepOrder_key" ON "ApprovalStep"("ruleId", "stepOrder");

-- CreateIndex
CREATE INDEX "ApprovalRequest_tenantId_status_idx" ON "ApprovalRequest"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_tenantId_createdAt_idx" ON "ApprovalRequest"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ApprovalRequest_requesterId_idx" ON "ApprovalRequest"("requesterId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_ruleId_status_idx" ON "ApprovalRequest"("ruleId", "status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_entityType_entityId_idx" ON "ApprovalRequest"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_expiresAt_idx" ON "ApprovalRequest"("expiresAt");

-- CreateIndex
CREATE INDEX "ApprovalAction_requestId_createdAt_idx" ON "ApprovalAction"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "ApprovalAction_actorId_idx" ON "ApprovalAction"("actorId");

-- CreateIndex
CREATE INDEX "ApprovalAction_stepId_idx" ON "ApprovalAction"("stepId");

-- CreateIndex
CREATE INDEX "DataCheckRule_tenantId_isActive_idx" ON "DataCheckRule"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "DataCheckRule_tenantId_isDeleted_idx" ON "DataCheckRule"("tenantId", "isDeleted");

-- CreateIndex
CREATE INDEX "DataCheckRule_checkType_idx" ON "DataCheckRule"("checkType");

-- CreateIndex
CREATE INDEX "DataCheckRun_tenantId_startedAt_idx" ON "DataCheckRun"("tenantId", "startedAt");

-- CreateIndex
CREATE INDEX "DataCheckRun_ruleId_startedAt_idx" ON "DataCheckRun"("ruleId", "startedAt");

-- CreateIndex
CREATE INDEX "DataCheckRun_status_idx" ON "DataCheckRun"("status");

-- CreateIndex
CREATE INDEX "DataCheckResult_tenantId_status_idx" ON "DataCheckResult"("tenantId", "status");

-- CreateIndex
CREATE INDEX "DataCheckResult_tenantId_severity_idx" ON "DataCheckResult"("tenantId", "severity");

-- CreateIndex
CREATE INDEX "DataCheckResult_tenantId_createdAt_idx" ON "DataCheckResult"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "DataCheckResult_ruleId_status_idx" ON "DataCheckResult"("ruleId", "status");

-- CreateIndex
CREATE INDEX "DataCheckResult_entityType_entityId_idx" ON "DataCheckResult"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "DataCheckResult_runId_idx" ON "DataCheckResult"("runId");

-- CreateIndex
CREATE INDEX "DataCheckSchedule_tenantId_isActive_idx" ON "DataCheckSchedule"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "DataCheckSchedule_nextRunAt_idx" ON "DataCheckSchedule"("nextRunAt");

-- CreateIndex
CREATE INDEX "DataCheckActionLog_tenantId_createdAt_idx" ON "DataCheckActionLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "DataCheckActionLog_resultId_idx" ON "DataCheckActionLog"("resultId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantLLMConfig_tenantId_key" ON "TenantLLMConfig"("tenantId");

-- CreateIndex
CREATE INDEX "TenantLLMConfig_tenantId_isActive_idx" ON "TenantLLMConfig"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "AssistantConversation_tenantId_userId_status_idx" ON "AssistantConversation"("tenantId", "userId", "status");

-- CreateIndex
CREATE INDEX "AssistantConversation_tenantId_lastMessageAt_idx" ON "AssistantConversation"("tenantId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "AssistantConversation_userId_status_idx" ON "AssistantConversation"("userId", "status");

-- CreateIndex
CREATE INDEX "AssistantMessage_conversationId_createdAt_idx" ON "AssistantMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "AssistantMessage_tenantId_role_idx" ON "AssistantMessage"("tenantId", "role");

-- CreateIndex
CREATE INDEX "AssistantToolCall_conversationId_createdAt_idx" ON "AssistantToolCall"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "AssistantToolCall_toolCode_status_idx" ON "AssistantToolCall"("toolCode", "status");

-- CreateIndex
CREATE INDEX "AssistantToolCall_tenantId_createdAt_idx" ON "AssistantToolCall"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AssistantUsageStats_tenantId_date_idx" ON "AssistantUsageStats"("tenantId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AssistantUsageStats_tenantId_userId_date_model_key" ON "AssistantUsageStats"("tenantId", "userId", "date", "model");

-- CreateIndex
CREATE INDEX "AIAuditLog_tenantId_createdAt_idx" ON "AIAuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AIAuditLog_userId_createdAt_idx" ON "AIAuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AIAuditLog_conversationId_idx" ON "AIAuditLog"("conversationId");

-- CreateIndex
CREATE INDEX "AIAuditLog_action_createdAt_idx" ON "AIAuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AIAuditLog_severity_createdAt_idx" ON "AIAuditLog"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "AITrainingEntry_tenantId_createdAt_idx" ON "AITrainingEntry"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AITrainingEntry_feedback_createdAt_idx" ON "AITrainingEntry"("feedback", "createdAt");

-- CreateIndex
CREATE INDEX "AITrainingEntry_model_createdAt_idx" ON "AITrainingEntry"("model", "createdAt");

-- CreateIndex
CREATE INDEX "AITrainingEntry_isExported_createdAt_idx" ON "AITrainingEntry"("isExported", "createdAt");

-- CreateIndex
CREATE INDEX "AITrainingEntry_rating_idx" ON "AITrainingEntry"("rating");

-- CreateIndex
CREATE INDEX "AITrainingDataset_tenantId_createdAt_idx" ON "AITrainingDataset"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AITrainingDataset_generatedAt_idx" ON "AITrainingDataset"("generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingProgress_tenantId_key" ON "OnboardingProgress"("tenantId");

-- CreateIndex
CREATE INDEX "OnboardingProgress_tenantId_status_idx" ON "OnboardingProgress"("tenantId", "status");

-- CreateIndex
CREATE INDEX "OnboardingStepLog_tenantId_step_idx" ON "OnboardingStepLog"("tenantId", "step");

-- CreateIndex
CREATE INDEX "OnboardingStepLog_progressId_idx" ON "OnboardingStepLog"("progressId");

-- CreateIndex
CREATE UNIQUE INDEX "IndustryTemplate_code_key" ON "IndustryTemplate"("code");

-- CreateIndex
CREATE INDEX "IndustryTemplate_code_idx" ON "IndustryTemplate"("code");

-- CreateIndex
CREATE INDEX "IndustryTemplate_isActive_idx" ON "IndustryTemplate"("isActive");

-- CreateIndex
CREATE INDEX "TenantAppliedTemplate_tenantId_idx" ON "TenantAppliedTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "TenantAppliedTemplate_templateId_idx" ON "TenantAppliedTemplate"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "DemoDataTemplate_code_key" ON "DemoDataTemplate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DemoCompany_tenantId_key" ON "DemoCompany"("tenantId");

-- CreateIndex
CREATE INDEX "DemoCompany_tenantId_idx" ON "DemoCompany"("tenantId");

-- CreateIndex
CREATE INDEX "DemoCompany_size_idx" ON "DemoCompany"("size");

-- CreateIndex
CREATE INDEX "DemoSeedLog_demoCompanyId_idx" ON "DemoSeedLog"("demoCompanyId");

-- CreateIndex
CREATE INDEX "VisitPlan_tenantId_planDate_idx" ON "VisitPlan"("tenantId", "planDate");

-- CreateIndex
CREATE INDEX "VisitPlan_tenantId_status_idx" ON "VisitPlan"("tenantId", "status");

-- CreateIndex
CREATE INDEX "VisitPlan_salespersonId_planDate_idx" ON "VisitPlan"("salespersonId", "planDate");

-- CreateIndex
CREATE INDEX "VisitPlanCustomer_planId_order_idx" ON "VisitPlanCustomer"("planId", "order");

-- CreateIndex
CREATE INDEX "VisitPlanCustomer_customerId_idx" ON "VisitPlanCustomer"("customerId");

-- CreateIndex
CREATE INDEX "VisitCheckin_planId_createdAt_idx" ON "VisitCheckin"("planId", "createdAt");

-- CreateIndex
CREATE INDEX "VisitCheckin_customerId_idx" ON "VisitCheckin"("customerId");

-- CreateIndex
CREATE INDEX "VisitNote_planId_createdAt_idx" ON "VisitNote"("planId", "createdAt");

-- CreateIndex
CREATE INDEX "VisitStatusLog_planId_createdAt_idx" ON "VisitStatusLog"("planId", "createdAt");

-- CreateIndex
CREATE INDEX "PerformanceTarget_tenantId_status_idx" ON "PerformanceTarget"("tenantId", "status");

-- CreateIndex
CREATE INDEX "PerformanceTarget_tenantId_type_idx" ON "PerformanceTarget"("tenantId", "type");

-- CreateIndex
CREATE INDEX "PerformanceTarget_assigneeId_status_idx" ON "PerformanceTarget"("assigneeId", "status");

-- CreateIndex
CREATE INDEX "PerformanceTarget_startDate_endDate_idx" ON "PerformanceTarget"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "TargetProgressLog_targetId_createdAt_idx" ON "TargetProgressLog"("targetId", "createdAt");

-- CreateIndex
CREATE INDEX "PerformanceSnapshot_tenantId_date_idx" ON "PerformanceSnapshot"("tenantId", "date");

-- CreateIndex
CREATE INDEX "PerformanceSnapshot_targetId_date_idx" ON "PerformanceSnapshot"("targetId", "date");

-- CreateIndex
CREATE INDEX "PerformanceSnapshot_userId_date_idx" ON "PerformanceSnapshot"("userId", "date");

-- CreateIndex
CREATE INDEX "CommissionRule_tenantId_isActive_idx" ON "CommissionRule"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "CommissionRule_targetType_idx" ON "CommissionRule"("targetType");

-- CreateIndex
CREATE INDEX "CommissionCalculationLog_tenantId_period_idx" ON "CommissionCalculationLog"("tenantId", "period");

-- CreateIndex
CREATE INDEX "CommissionCalculationLog_userId_period_idx" ON "CommissionCalculationLog"("userId", "period");

-- CreateIndex
CREATE INDEX "CommissionCalculationLog_ruleId_idx" ON "CommissionCalculationLog"("ruleId");

-- CreateIndex
CREATE INDEX "CommissionCalculationLog_status_idx" ON "CommissionCalculationLog"("status");

-- CreateIndex
CREATE INDEX "GlobalSearchHistory_tenantId_userId_createdAt_idx" ON "GlobalSearchHistory"("tenantId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "GlobalSearchHistory_tenantId_query_idx" ON "GlobalSearchHistory"("tenantId", "query");

-- CreateIndex
CREATE UNIQUE INDEX "CommandDefinition_code_key" ON "CommandDefinition"("code");

-- CreateIndex
CREATE INDEX "CommandDefinition_isActive_sortOrder_idx" ON "CommandDefinition"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Quote_tenantId_status_idx" ON "Quote"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Quote_tenantId_customerId_idx" ON "Quote"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "Quote_tenantId_quoteDate_idx" ON "Quote"("tenantId", "quoteDate");

-- CreateIndex
CREATE INDEX "Quote_tenantId_validUntil_idx" ON "Quote"("tenantId", "validUntil");

-- CreateIndex
CREATE INDEX "QuoteItem_quoteId_sortOrder_idx" ON "QuoteItem"("quoteId", "sortOrder");

-- CreateIndex
CREATE INDEX "QuoteStatusLog_quoteId_createdAt_idx" ON "QuoteStatusLog"("quoteId", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerRiskConfig_tenantId_isActive_idx" ON "CustomerRiskConfig"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "CustomerRiskSnapshot_tenantId_riskLevel_idx" ON "CustomerRiskSnapshot"("tenantId", "riskLevel");

-- CreateIndex
CREATE INDEX "CustomerRiskSnapshot_tenantId_customerId_snapshotAt_idx" ON "CustomerRiskSnapshot"("tenantId", "customerId", "snapshotAt");

-- CreateIndex
CREATE INDEX "ProductRecommendationRule_tenantId_isActive_idx" ON "ProductRecommendationRule"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "ProductRecommendationRule_type_idx" ON "ProductRecommendationRule"("type");

-- CreateIndex
CREATE INDEX "ProductRecommendationLog_tenantId_createdAt_idx" ON "ProductRecommendationLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductRecommendationLog_customerId_productId_idx" ON "ProductRecommendationLog"("customerId", "productId");

-- CreateIndex
CREATE INDEX "BulkOperation_tenantId_status_idx" ON "BulkOperation"("tenantId", "status");

-- CreateIndex
CREATE INDEX "BulkOperation_tenantId_type_idx" ON "BulkOperation"("tenantId", "type");

-- CreateIndex
CREATE INDEX "BulkOperation_tenantId_createdAt_idx" ON "BulkOperation"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "BulkOperationItem_operationId_idx" ON "BulkOperationItem"("operationId");

-- CreateIndex
CREATE INDEX "BulkOperationItem_entityType_entityId_idx" ON "BulkOperationItem"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "BulkOperationLog_operationId_createdAt_idx" ON "BulkOperationLog"("operationId", "createdAt");

-- CreateIndex
CREATE INDEX "LabelTemplate_tenantId_isActive_idx" ON "LabelTemplate"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "LabelTemplate_type_idx" ON "LabelTemplate"("type");

-- CreateIndex
CREATE INDEX "LabelPrintJob_tenantId_printedAt_idx" ON "LabelPrintJob"("tenantId", "printedAt");

-- CreateIndex
CREATE INDEX "ProductImage_tenantId_productId_isDeleted_idx" ON "ProductImage"("tenantId", "productId", "isDeleted");

-- CreateIndex
CREATE INDEX "ProductImage_tenantId_productId_sortOrder_idx" ON "ProductImage"("tenantId", "productId", "sortOrder");

-- CreateIndex
CREATE INDEX "ImageUploadBatch_tenantId_startedAt_idx" ON "ImageUploadBatch"("tenantId", "startedAt");

-- CreateIndex
CREATE INDEX "ImageMatchLog_batchId_idx" ON "ImageMatchLog"("batchId");

-- CreateIndex
CREATE INDEX "CustomerSegment_tenantId_isDeleted_idx" ON "CustomerSegment"("tenantId", "isDeleted");

-- CreateIndex
CREATE INDEX "CustomerSegment_tenantId_type_idx" ON "CustomerSegment"("tenantId", "type");

-- CreateIndex
CREATE INDEX "CustomerSegmentRule_segmentId_idx" ON "CustomerSegmentRule"("segmentId");

-- CreateIndex
CREATE INDEX "CustomerSegmentMember_segmentId_idx" ON "CustomerSegmentMember"("segmentId");

-- CreateIndex
CREATE INDEX "CustomerSegmentMember_customerId_idx" ON "CustomerSegmentMember"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSegmentMember_segmentId_customerId_key" ON "CustomerSegmentMember"("segmentId", "customerId");

-- CreateIndex
CREATE INDEX "CleanupJob_tenantId_type_status_idx" ON "CleanupJob"("tenantId", "type", "status");

-- CreateIndex
CREATE INDEX "CleanupJob_tenantId_createdAt_idx" ON "CleanupJob"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "CleanupJobItem_jobId_idx" ON "CleanupJobItem"("jobId");

-- CreateIndex
CREATE INDEX "CleanupLog_jobId_createdAt_idx" ON "CleanupLog"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "ArchiveRecord_tenantId_entityType_archivedAt_idx" ON "ArchiveRecord"("tenantId", "entityType", "archivedAt");

-- CreateIndex
CREATE INDEX "ArchiveRecord_tenantId_entityId_idx" ON "ArchiveRecord"("tenantId", "entityId");

-- CreateIndex
CREATE INDEX "ArchiveRecord_expiresAt_idx" ON "ArchiveRecord"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "_CashMovementToCollection_AB_unique" ON "_CashMovementToCollection"("A", "B");

-- CreateIndex
CREATE INDEX "_CashMovementToCollection_B_index" ON "_CashMovementToCollection"("B");

-- AddForeignKey
ALTER TABLE "TenantSettings" ADD CONSTRAINT "TenantSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanModule" ADD CONSTRAINT "PlanModule_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanModule" ADD CONSTRAINT "PlanModule_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantModule" ADD CONSTRAINT "TenantModule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantModule" ADD CONSTRAINT "TenantModule_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorLog" ADD CONSTRAINT "ErrorLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityLog" ADD CONSTRAINT "SecurityLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityLog" ADD CONSTRAINT "SecurityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_transferToAccountId_fkey" FOREIGN KEY ("transferToAccountId") REFERENCES "CashAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_reversesId_fkey" FOREIGN KEY ("reversesId") REFERENCES "CashMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_defaultWarehouseId_fkey" FOREIGN KEY ("defaultWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBarcode" ADD CONSTRAINT "ProductBarcode_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBarcode" ADD CONSTRAINT "ProductBarcode_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_transferToWarehouseId_fkey" FOREIGN KEY ("transferToWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_reversesId_fkey" FOREIGN KEY ("reversesId") REFERENCES "StockMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_cancelsSaleId_fkey" FOREIGN KEY ("cancelsSaleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_linkedSaleId_fkey" FOREIGN KEY ("linkedSaleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_cancelsOrderId_fkey" FOREIGN KEY ("cancelsOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_linkedSaleId_fkey" FOREIGN KEY ("linkedSaleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_cancelsCollectionId_fkey" FOREIGN KEY ("cancelsCollectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "CashAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseTransfer" ADD CONSTRAINT "WarehouseTransfer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseTransfer" ADD CONSTRAINT "WarehouseTransfer_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseTransfer" ADD CONSTRAINT "WarehouseTransfer_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseTransferItem" ADD CONSTRAINT "WarehouseTransferItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseTransferItem" ADD CONSTRAINT "WarehouseTransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "WarehouseTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseTransferItem" ADD CONSTRAINT "WarehouseTransferItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCount" ADD CONSTRAINT "StockCount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCount" ADD CONSTRAINT "StockCount_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCountItem" ADD CONSTRAINT "StockCountItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCountItem" ADD CONSTRAINT "StockCountItem_countId_fkey" FOREIGN KEY ("countId") REFERENCES "StockCount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCountItem" ADD CONSTRAINT "StockCountItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "Return"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_counterBankAccountId_fkey" FOREIGN KEY ("counterBankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_posCollectionId_fkey" FOREIGN KEY ("posCollectionId") REFERENCES "PosCollection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosDevice" ADD CONSTRAINT "PosDevice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosDevice" ADD CONSTRAINT "PosDevice_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosCollection" ADD CONSTRAINT "PosCollection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosCollection" ADD CONSTRAINT "PosCollection_posDeviceId_fkey" FOREIGN KEY ("posDeviceId") REFERENCES "PosDevice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosCollection" ADD CONSTRAINT "PosCollection_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRow" ADD CONSTRAINT "ImportRow_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRow" ADD CONSTRAINT "ImportRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKeyUsageLog" ADD CONSTRAINT "ApiKeyUsageLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKeyUsageLog" ADD CONSTRAINT "ApiKeyUsageLog_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpArticle" ADD CONSTRAINT "HelpArticle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantTool" ADD CONSTRAINT "AssistantTool_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceList" ADD CONSTRAINT "PriceList_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceList" ADD CONSTRAINT "PriceList_customerGroupId_fkey" FOREIGN KEY ("customerGroupId") REFERENCES "CustomerPriceGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPriceGroup" ADD CONSTRAINT "CustomerPriceGroup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPriceGroup" ADD CONSTRAINT "CustomerPriceGroup_defaultPriceListId_fkey" FOREIGN KEY ("defaultPriceListId") REFERENCES "PriceList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPriceGroupMember" ADD CONSTRAINT "CustomerPriceGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CustomerPriceGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPriceGroupMember" ADD CONSTRAINT "CustomerPriceGroupMember_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_customerGroupId_fkey" FOREIGN KEY ("customerGroupId") REFERENCES "CustomerPriceGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportTemplate" ADD CONSTRAINT "ReportTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledReport" ADD CONSTRAINT "ScheduledReport_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledReport" ADD CONSTRAINT "ScheduledReport_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ReportTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationChannel" ADD CONSTRAINT "NotificationChannel_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationChannelSecret" ADD CONSTRAINT "NotificationChannelSecret_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "NotificationChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRule" ADD CONSTRAINT "NotificationRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRuleChannel" ADD CONSTRAINT "NotificationRuleChannel_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "NotificationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRuleChannel" ADD CONSTRAINT "NotificationRuleChannel_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "NotificationChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "NotificationRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "NotificationChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRule" ADD CONSTRAINT "ApprovalRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ApprovalRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ApprovalRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalAction" ADD CONSTRAINT "ApprovalAction_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ApprovalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalAction" ADD CONSTRAINT "ApprovalAction_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "ApprovalStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataCheckRule" ADD CONSTRAINT "DataCheckRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataCheckRun" ADD CONSTRAINT "DataCheckRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataCheckRun" ADD CONSTRAINT "DataCheckRun_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "DataCheckRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataCheckResult" ADD CONSTRAINT "DataCheckResult_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataCheckResult" ADD CONSTRAINT "DataCheckResult_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "DataCheckRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataCheckResult" ADD CONSTRAINT "DataCheckResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "DataCheckRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataCheckSchedule" ADD CONSTRAINT "DataCheckSchedule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataCheckActionLog" ADD CONSTRAINT "DataCheckActionLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantLLMConfig" ADD CONSTRAINT "TenantLLMConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantConversation" ADD CONSTRAINT "AssistantConversation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantConversation" ADD CONSTRAINT "AssistantConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantConversation" ADD CONSTRAINT "AssistantConversation_llmConfigId_fkey" FOREIGN KEY ("llmConfigId") REFERENCES "TenantLLMConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantMessage" ADD CONSTRAINT "AssistantMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AssistantConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantToolCall" ADD CONSTRAINT "AssistantToolCall_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AssistantConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantUsageStats" ADD CONSTRAINT "AssistantUsageStats_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingStepLog" ADD CONSTRAINT "OnboardingStepLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingStepLog" ADD CONSTRAINT "OnboardingStepLog_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "OnboardingProgress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantAppliedTemplate" ADD CONSTRAINT "TenantAppliedTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantAppliedTemplate" ADD CONSTRAINT "TenantAppliedTemplate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "IndustryTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoCompany" ADD CONSTRAINT "DemoCompany_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoSeedLog" ADD CONSTRAINT "DemoSeedLog_demoCompanyId_fkey" FOREIGN KEY ("demoCompanyId") REFERENCES "DemoCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitPlan" ADD CONSTRAINT "VisitPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitPlanCustomer" ADD CONSTRAINT "VisitPlanCustomer_planId_fkey" FOREIGN KEY ("planId") REFERENCES "VisitPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitCheckin" ADD CONSTRAINT "VisitCheckin_planId_fkey" FOREIGN KEY ("planId") REFERENCES "VisitPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitNote" ADD CONSTRAINT "VisitNote_planId_fkey" FOREIGN KEY ("planId") REFERENCES "VisitPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitStatusLog" ADD CONSTRAINT "VisitStatusLog_planId_fkey" FOREIGN KEY ("planId") REFERENCES "VisitPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceTarget" ADD CONSTRAINT "PerformanceTarget_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetProgressLog" ADD CONSTRAINT "TargetProgressLog_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "PerformanceTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceSnapshot" ADD CONSTRAINT "PerformanceSnapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceSnapshot" ADD CONSTRAINT "PerformanceSnapshot_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "PerformanceTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionRule" ADD CONSTRAINT "CommissionRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionCalculationLog" ADD CONSTRAINT "CommissionCalculationLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionCalculationLog" ADD CONSTRAINT "CommissionCalculationLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "CommissionRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteStatusLog" ADD CONSTRAINT "QuoteStatusLog_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkOperationItem" ADD CONSTRAINT "BulkOperationItem_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "BulkOperation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkOperationLog" ADD CONSTRAINT "BulkOperationLog_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "BulkOperation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelPrintJob" ADD CONSTRAINT "LabelPrintJob_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelPrintJob" ADD CONSTRAINT "LabelPrintJob_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "LabelTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageMatchLog" ADD CONSTRAINT "ImageMatchLog_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImageUploadBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSegmentRule" ADD CONSTRAINT "CustomerSegmentRule_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "CustomerSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSegmentMember" ADD CONSTRAINT "CustomerSegmentMember_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "CustomerSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanupJobItem" ADD CONSTRAINT "CleanupJobItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "CleanupJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanupLog" ADD CONSTRAINT "CleanupLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "CleanupJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CashMovementToCollection" ADD CONSTRAINT "_CashMovementToCollection_A_fkey" FOREIGN KEY ("A") REFERENCES "CashMovement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CashMovementToCollection" ADD CONSTRAINT "_CashMovementToCollection_B_fkey" FOREIGN KEY ("B") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

