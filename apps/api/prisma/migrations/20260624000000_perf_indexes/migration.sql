-- ============================================================================
-- FAZ 55: DB Index Optimizasyonu
-- 29 modelde eksik olan tenantId+isDeleted composite index'leri ekle
-- Foreign key index'leri (FK lookup hızlanması)
-- Partial index'ler (status=ACTIVE, isDeleted=false için)
-- ============================================================================

-- 1) Tüm tenantId'li ama @@index olmayan modeller için composite index
CREATE INDEX IF NOT EXISTS "TenantSettings_tenantId_idx" ON "TenantSettings"("tenantId");
CREATE INDEX IF NOT EXISTS "ImportBatch_tenantId_status_idx" ON "ImportBatch"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "ImportBatch_tenantId_createdAt_idx" ON "ImportBatch"("tenantId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "NotificationChannel_tenantId_isActive_idx" ON "NotificationChannel"("tenantId", "isActive");
CREATE INDEX IF NOT EXISTS "NotificationRule_tenantId_isActive_idx" ON "NotificationRule"("tenantId", "isActive");
CREATE INDEX IF NOT EXISTS "NotificationLog_tenantId_createdAt_idx" ON "NotificationLog"("tenantId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "NotificationLog_tenantId_status_idx" ON "NotificationLog"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "NotificationLog_userId_isRead_idx" ON "NotificationLog"("userId", "isRead");

CREATE INDEX IF NOT EXISTS "NotificationPreferences_userId_idx" ON "NotificationPreferences"("userId");

CREATE INDEX IF NOT EXISTS "ApprovalRule_tenantId_isActive_idx" ON "ApprovalRule"("tenantId", "isActive");
CREATE INDEX IF NOT EXISTS "ApprovalRequest_tenantId_status_idx" ON "ApprovalRequest"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "ApprovalRequest_tenantId_createdAt_idx" ON "ApprovalRequest"("tenantId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "ApprovalRequest_entityType_entityId_idx" ON "ApprovalRequest"("entityType", "entityId");

CREATE INDEX IF NOT EXISTS "DataCheckRule_tenantId_isActive_idx" ON "DataCheckRule"("tenantId", "isActive");
CREATE INDEX IF NOT EXISTS "DataCheckRun_tenantId_status_idx" ON "DataCheckRun"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "DataCheckRun_tenantId_startedAt_idx" ON "DataCheckRun"("tenantId", "startedAt" DESC);
CREATE INDEX IF NOT EXISTS "DataCheckResult_runId_status_idx" ON "DataCheckResult"("runId", "status");

CREATE INDEX IF NOT EXISTS "TenantLLMConfig_tenantId_idx" ON "TenantLLMConfig"("tenantId");

CREATE INDEX IF NOT EXISTS "AssistantConversation_tenantId_userId_idx" ON "AssistantConversation"("tenantId", "userId");
CREATE INDEX IF NOT EXISTS "AssistantConversation_tenantId_isActive_idx" ON "AssistantConversation"("tenantId", "isActive");
CREATE INDEX IF NOT EXISTS "AssistantMessage_conversationId_createdAt_idx" ON "AssistantMessage"("conversationId", "createdAt");

CREATE INDEX IF NOT EXISTS "AIAuditLog_tenantId_createdAt_idx" ON "AIAuditLog"("tenantId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AIAuditLog_userId_action_idx" ON "AIAuditLog"("userId", "action");
CREATE INDEX IF NOT EXISTS "AITrainingEntry_tenantId_status_idx" ON "AITrainingEntry"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "AITrainingEntry_datasetId_idx" ON "AITrainingEntry"("datasetId");

-- 2) FAZ 39-43 modülleri (eksik olanlar)
CREATE INDEX IF NOT EXISTS "IndustryTemplate_isActive_idx" ON "IndustryTemplate"("isActive");
CREATE INDEX IF NOT EXISTS "TenantIndustryApplication_tenantId_idx" ON "TenantIndustryApplication"("tenantId");
CREATE INDEX IF NOT EXISTS "DemoCompany_tenantId_idx" ON "DemoCompany"("tenantId");
CREATE INDEX IF NOT EXISTS "Visit_tenantId_status_idx" ON "Visit"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "Visit_tenantId_plannedDate_idx" ON "Visit"("tenantId", "plannedDate");
CREATE INDEX IF NOT EXISTS "Visit_assigneeId_status_idx" ON "Visit"("assigneeId", "status");
CREATE INDEX IF NOT EXISTS "VisitPlan_tenantId_plannedDate_idx" ON "VisitPlan"("tenantId", "plannedDate");
CREATE INDEX IF NOT EXISTS "PerformanceTarget_tenantId_status_idx" ON "PerformanceTarget"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "PerformanceTarget_tenantId_assigneeId_idx" ON "PerformanceTarget"("tenantId", "assigneeId");
CREATE INDEX IF NOT EXISTS "PerformanceTarget_periodStart_periodEnd_idx" ON "PerformanceTarget"("periodStart", "periodEnd");
CREATE INDEX IF NOT EXISTS "CommissionRule_tenantId_isActive_idx" ON "CommissionRule"("tenantId", "isActive");
CREATE INDEX IF NOT EXISTS "CommissionCalculation_tenantId_periodStart_idx" ON "CommissionCalculation"("tenantId", "periodStart");

-- 3) FAZ 44-52 (UX-Bulk) — bu zaten eklendi, ek composite
CREATE INDEX IF NOT EXISTS "Quote_tenantId_status_quoteDate_idx" ON "Quote"("tenantId", "status", "quoteDate" DESC);
CREATE INDEX IF NOT EXISTS "Quote_customerId_isDeleted_idx" ON "Quote"("customerId", "isDeleted");
CREATE INDEX IF NOT EXISTS "CustomerRiskSnapshot_tenantId_riskLevel_idx" ON "CustomerRiskSnapshot"("tenantId", "riskLevel");
CREATE INDEX IF NOT EXISTS "BulkOperation_tenantId_status_idx" ON "BulkOperation"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "BulkOperation_tenantId_createdAt_idx" ON "BulkOperation"("tenantId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "ProductImage_productId_isDeleted_idx" ON "ProductImage"("productId", "isDeleted");
CREATE INDEX IF NOT EXISTS "CustomerSegment_tenantId_isDeleted_idx" ON "CustomerSegment"("tenantId", "isDeleted");

-- 4) Critical table: Sale — composite index
CREATE INDEX IF NOT EXISTS "Sale_tenantId_saleDate_idx" ON "Sale"("tenantId", "saleDate" DESC) WHERE "isDeleted" = false;
CREATE INDEX IF NOT EXISTS "Sale_tenantId_status_idx" ON "Sale"("tenantId", "status") WHERE "isDeleted" = false;
CREATE INDEX IF NOT EXISTS "Sale_tenantId_customerId_idx" ON "Sale"("tenantId", "customerId") WHERE "isDeleted" = false;

-- 5) Customer — partial index for active customers
CREATE INDEX IF NOT EXISTS "Customer_tenantId_isActive_idx" ON "Customer"("tenantId", "isActive") WHERE "isDeleted" = false;
CREATE INDEX IF NOT EXISTS "Customer_tenantId_name_idx" ON "Customer"("tenantId", "name") WHERE "isDeleted" = false;

-- 6) Product — partial index
CREATE INDEX IF NOT EXISTS "Product_tenantId_status_idx" ON "Product"("tenantId", "status") WHERE "isDeleted" = false;
CREATE INDEX IF NOT EXISTS "Product_tenantId_categoryId_idx" ON "Product"("tenantId", "categoryId") WHERE "isDeleted" = false;

-- 7) Order & OrderItem
CREATE INDEX IF NOT EXISTS "Order_tenantId_status_orderDate_idx" ON "Order"("tenantId", "status", "orderDate" DESC) WHERE "isDeleted" = false;
CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "OrderItem_productId_idx" ON "OrderItem"("productId");

-- 8) Collection & Bank
CREATE INDEX IF NOT EXISTS "Collection_tenantId_collectionDate_idx" ON "Collection"("tenantId", "collectionDate" DESC) WHERE "isDeleted" = false;
CREATE INDEX IF NOT EXISTS "Collection_tenantId_status_idx" ON "Collection"("tenantId", "status") WHERE "isDeleted" = false;
CREATE INDEX IF NOT EXISTS "BankTransaction_tenantId_transactionDate_idx" ON "BankTransaction"("tenantId", "transactionDate" DESC) WHERE "isDeleted" = false;
CREATE INDEX IF NOT EXISTS "BankTransaction_bankAccountId_transactionDate_idx" ON "BankTransaction"("bankAccountId", "transactionDate" DESC);

-- 9) CustomerMovement (event sourcing) — KRİTİK
CREATE INDEX IF NOT EXISTS "CustomerMovement_tenantId_customerId_idx" ON "CustomerMovement"("tenantId", "customerId");
CREATE INDEX IF NOT EXISTS "CustomerMovement_tenantId_createdAt_idx" ON "CustomerMovement"("tenantId", "createdAt" DESC);

-- 10) StockMovement
CREATE INDEX IF NOT EXISTS "StockMovement_tenantId_productId_idx" ON "StockMovement"("tenantId", "productId");
CREATE INDEX IF NOT EXISTS "StockMovement_tenantId_warehouseId_idx" ON "StockMovement"("tenantId", "warehouseId");
CREATE INDEX IF NOT EXISTS "StockMovement_tenantId_createdAt_idx" ON "StockMovement"("tenantId", "createdAt" DESC);

-- 11) Audit & Logs
CREATE INDEX IF NOT EXISTS "SecurityLog_tenantId_createdAt_idx" ON "SecurityLog"("tenantId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "SecurityLog_event_createdAt_idx" ON "SecurityLog"("event", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "SecurityLog_userId_idx" ON "SecurityLog"("userId");

-- 12) GIN index for JSONB columns (advanced filtering)
CREATE INDEX IF NOT EXISTS "CustomerMetadata_gin_idx" ON "Customer" USING GIN ("metadata") WHERE "metadata" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "ProductMetadata_gin_idx" ON "Product" USING GIN ("metadata") WHERE "metadata" IS NOT NULL;
