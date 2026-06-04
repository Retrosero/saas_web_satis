-- =====================================================================
-- FAZ 29 — KAMPANYA / FİYAT LİSTESİ / İSKONTO MİGRATİONU
-- =====================================================================
CREATE TYPE "PriceListStatus" AS ENUM ('ACTIVE', 'PASSIVE', 'EXPIRED', 'DRAFT');
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'AMOUNT', 'FIXED_PRICE');
CREATE TYPE "CampaignType" AS ENUM ('PRODUCT', 'BRAND', 'CATEGORY', 'CUSTOMER_GROUP', 'CART_AMOUNT', 'QUANTITY', 'DATE_RANGE');
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PASSIVE', 'EXPIRED', 'CANCELLED');

CREATE TABLE "price_lists" (
    "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL, "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "validFrom" TIMESTAMP(3), "validTo" TIMESTAMP(3),
    "customerGroupId" TEXT,
    "description" TEXT,
    "status" "PriceListStatus" NOT NULL DEFAULT 'DRAFT',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false, "deletedAt" TIMESTAMP(3),
    "createdById" TEXT, "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "price_lists_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "price_lists_tenantId_code_key" ON "price_lists"("tenantId", "code");
CREATE INDEX "price_lists_tenantId_status_idx" ON "price_lists"("tenantId", "status");
CREATE INDEX "price_lists_tenantId_isDeleted_idx" ON "price_lists"("tenantId", "isDeleted");
ALTER TABLE "price_lists" ADD CONSTRAINT "price_lists_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

CREATE TABLE "price_list_items" (
    "id" TEXT NOT NULL, "priceListId" TEXT NOT NULL, "productId" TEXT NOT NULL,
    "oldPrice" DECIMAL(65,30) DEFAULT 0, "newPrice" DECIMAL(65,30) NOT NULL,
    "vatRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "minQuantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "maxDiscountRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    CONSTRAINT "price_list_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "price_list_items_priceListId_productId_key" ON "price_list_items"("priceListId", "productId");
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "price_lists"("id") ON DELETE CASCADE;
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT;

CREATE TABLE "customer_price_groups" (
    "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL, "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultPriceListId" TEXT,
    "defaultDiscountRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false, "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "customer_price_groups_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "customer_price_groups_tenantId_code_key" ON "customer_price_groups"("tenantId", "code");
CREATE INDEX "customer_price_groups_tenantId_isActive_idx" ON "customer_price_groups"("tenantId", "isActive");
CREATE INDEX "customer_price_groups_tenantId_isDeleted_idx" ON "customer_price_groups"("tenantId", "isDeleted");
ALTER TABLE "customer_price_groups" ADD CONSTRAINT "customer_price_groups_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

CREATE TABLE "customer_price_group_members" (
    "id" TEXT NOT NULL, "groupId" TEXT NOT NULL, "customerId" TEXT NOT NULL,
    "customDiscountRate" DECIMAL(65,30) DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_price_group_members_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "customer_price_group_members_groupId_customerId_key" ON "customer_price_group_members"("groupId", "customerId");
ALTER TABLE "customer_price_group_members" ADD CONSTRAINT "customer_price_group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "customer_price_groups"("id") ON DELETE CASCADE;
ALTER TABLE "customer_price_group_members" ADD CONSTRAINT "customer_price_group_members_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE;

CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL, "name" TEXT NOT NULL,
    "campaignType" "CampaignType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL, "endDate" TIMESTAMP(3) NOT NULL,
    "customerGroupId" TEXT, "customerId" TEXT,
    "productId" TEXT,
    "minQuantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "minCartAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discountType" "DiscountType" NOT NULL,
    "discountRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "maxUsageCount" INTEGER NOT NULL DEFAULT 0,
    "perUserLimit" INTEGER NOT NULL DEFAULT 1,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false, "deletedAt" TIMESTAMP(3),
    "createdById" TEXT, "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "campaigns_tenantId_code_key" ON "campaigns"("tenantId", "code");
CREATE INDEX "campaigns_tenantId_status_idx" ON "campaigns"("tenantId", "status");
CREATE INDEX "campaigns_tenantId_startDate_endDate_idx" ON "campaigns"("tenantId", "startDate", "endDate");
CREATE INDEX "campaigns_tenantId_campaignType_idx" ON "campaigns"("tenantId", "campaignType");
CREATE INDEX "campaigns_tenantId_isDeleted_idx" ON "campaigns"("tenantId", "isDeleted");
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
