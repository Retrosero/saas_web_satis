-- FAZ 35: AI Chat & LLM Konfigürasyon

CREATE TYPE "LLMProvider" AS ENUM ('OPENROUTER', 'OPENAI', 'ANTHROPIC', 'DEEPSEEK', 'OLLAMA', 'CUSTOM');
CREATE TYPE "AssistantMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL');
CREATE TYPE "AssistantConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

CREATE TABLE "TenantLLMConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" "LLMProvider" NOT NULL DEFAULT 'OPENROUTER',
    "apiKey" TEXT NOT NULL,
    "baseUrl" TEXT,
    "defaultModel" TEXT NOT NULL DEFAULT 'deepseek/deepseek-chat',
    "fallbackModel" TEXT,
    "maxTokens" INTEGER NOT NULL DEFAULT 2048,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "topP" DOUBLE PRECISION NOT NULL DEFAULT 0.9,
    "systemPrompt" TEXT,
    "enabledModules" JSONB NOT NULL DEFAULT '[]',
    "rateLimitPerHour" INTEGER NOT NULL DEFAULT 100,
    "monthlyBudgetUSD" DOUBLE PRECISION,
    "monthlyUsageUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "toolPermissions" JSONB NOT NULL DEFAULT '[]',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TenantLLMConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssistantConversation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "AssistantConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "context" JSONB NOT NULL DEFAULT '{}',
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "totalCostUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "llmConfigId" TEXT,
    CONSTRAINT "AssistantConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssistantMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "role" "AssistantMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "toolCalls" JSONB NOT NULL DEFAULT '[]',
    "tokens" INTEGER,
    "costUSD" DOUBLE PRECISION,
    "model" TEXT,
    "latencyMs" INTEGER,
    "feedbackRating" INTEGER,
    "feedbackNote" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssistantMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssistantToolCall" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT,
    "tenantId" TEXT NOT NULL,
    "toolCode" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "arguments" JSONB NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssistantToolCall_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssistantUsageStats" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "model" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalCostUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "toolCallCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "AssistantUsageStats_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TenantLLMConfig_tenantId_key" ON "TenantLLMConfig"("tenantId");
CREATE UNIQUE INDEX "AssistantUsageStats_tenantId_userId_date_model_key" ON "AssistantUsageStats"("tenantId", "userId", "date", "model");

CREATE INDEX "TenantLLMConfig_tenantId_isActive_idx" ON "TenantLLMConfig"("tenantId", "isActive");
CREATE INDEX "AssistantConversation_tenantId_userId_status_idx" ON "AssistantConversation"("tenantId", "userId", "status");
CREATE INDEX "AssistantConversation_tenantId_lastMessageAt_idx" ON "AssistantConversation"("tenantId", "lastMessageAt");
CREATE INDEX "AssistantConversation_userId_status_idx" ON "AssistantConversation"("userId", "status");
CREATE INDEX "AssistantMessage_conversationId_createdAt_idx" ON "AssistantMessage"("conversationId", "createdAt");
CREATE INDEX "AssistantMessage_tenantId_role_idx" ON "AssistantMessage"("tenantId", "role");
CREATE INDEX "AssistantToolCall_conversationId_createdAt_idx" ON "AssistantToolCall"("conversationId", "createdAt");
CREATE INDEX "AssistantToolCall_toolCode_status_idx" ON "AssistantToolCall"("toolCode", "status");
CREATE INDEX "AssistantToolCall_tenantId_createdAt_idx" ON "AssistantToolCall"("tenantId", "createdAt");
CREATE INDEX "AssistantUsageStats_tenantId_date_idx" ON "AssistantUsageStats"("tenantId", "date");

ALTER TABLE "TenantLLMConfig" ADD CONSTRAINT "TenantLLMConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "AssistantConversation" ADD CONSTRAINT "AssistantConversation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "AssistantConversation" ADD CONSTRAINT "AssistantConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "AssistantConversation" ADD CONSTRAINT "AssistantConversation_llmConfigId_fkey" FOREIGN KEY ("llmConfigId") REFERENCES "TenantLLMConfig"("id") ON DELETE SET NULL;
ALTER TABLE "AssistantMessage" ADD CONSTRAINT "AssistantMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AssistantConversation"("id") ON DELETE CASCADE;
ALTER TABLE "AssistantToolCall" ADD CONSTRAINT "AssistantToolCall_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AssistantConversation"("id") ON DELETE CASCADE;
ALTER TABLE "AssistantUsageStats" ADD CONSTRAINT "AssistantUsageStats_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
