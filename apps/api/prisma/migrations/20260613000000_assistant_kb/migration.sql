-- =====================================================================
-- FAZ 26 — AKILLI ASISTAN BİLGİ TABANI
-- =====================================================================
CREATE TABLE "help_articles" (
    "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL,
    "module" TEXT NOT NULL, "page" TEXT,
    "title" TEXT NOT NULL, "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL, "permissionKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false, "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "help_articles_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "help_articles_tenantId_module_idx" ON "help_articles"("tenantId", "module");
CREATE INDEX "help_articles_tenantId_contentType_idx" ON "help_articles"("tenantId", "contentType");
CREATE INDEX "help_articles_tenantId_status_idx" ON "help_articles"("tenantId", "status");
CREATE INDEX "help_articles_tenantId_isDeleted_idx" ON "help_articles"("tenantId", "isDeleted");
ALTER TABLE "help_articles" ADD CONSTRAINT "help_articles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "assistant_tools" (
    "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL, "name" TEXT NOT NULL,
    "description" TEXT NOT NULL, "module" TEXT NOT NULL,
    "requiredPermission" TEXT NOT NULL, "apiEndpoint" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "assistant_tools_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "assistant_tools_tenantId_code_key" ON "assistant_tools"("tenantId", "code");
CREATE INDEX "assistant_tools_tenantId_status_idx" ON "assistant_tools"("tenantId", "status");
CREATE INDEX "assistant_tools_tenantId_module_idx" ON "assistant_tools"("tenantId", "module");
ALTER TABLE "assistant_tools" ADD CONSTRAINT "assistant_tools_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
