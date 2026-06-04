-- =====================================================================
-- FAZ 30 — FATURA / BELGE / PDF ŞABLON MİGRATİONU
-- =====================================================================
CREATE TYPE "DocumentType" AS ENUM ('SALE', 'ORDER', 'COLLECTION', 'RETURN', 'CASH', 'STATEMENT', 'STOCK_REPORT', 'SALES_REPORT', 'QUOTE');
CREATE TYPE "PageFormat" AS ENUM ('A4_PORTRAIT', 'A4_LANDSCAPE', 'THERMAL_58', 'THERMAL_80', 'CUSTOM');

CREATE TABLE "document_templates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'tr',
    "pageFormat" "PageFormat" NOT NULL DEFAULT 'A4_PORTRAIT',
    "customWidth" INTEGER, "customHeight" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sections" JSONB NOT NULL DEFAULT '[]',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT, "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "document_templates_tenantId_documentType_idx" ON "document_templates"("tenantId", "documentType");
CREATE INDEX "document_templates_tenantId_isActive_idx" ON "document_templates"("tenantId", "isActive");
CREATE INDEX "document_templates_tenantId_isDefault_idx" ON "document_templates"("tenantId", "isDefault");
CREATE INDEX "document_templates_tenantId_isDeleted_idx" ON "document_templates"("tenantId", "isDeleted");
CREATE INDEX "document_templates_isDeleted_idx" ON "document_templates"("isDeleted");
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
