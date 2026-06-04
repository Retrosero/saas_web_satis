-- FAZ 36: AI İzleme & Eğitim Verisi

CREATE TYPE "AIFeedbackType" AS ENUM ('POSITIVE', 'NEGATIVE', 'NEUTRAL', 'CORRECTED');
CREATE TYPE "AIAuditAction" AS ENUM ('CONVERSATION_STARTED', 'CONVERSATION_DELETED', 'MESSAGE_SENT', 'MESSAGE_RATED', 'TOOL_CALLED', 'TOOL_FAILED', 'RAG_RETRIEVED', 'LLM_API_ERROR', 'RATE_LIMITED', 'BUDGET_EXCEEDED', 'CONFIG_UPDATED');

CREATE TABLE "AIAuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "conversationId" TEXT,
    "messageId" TEXT,
    "action" "AIAuditAction" NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AITrainingEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT,
    "userQuery" TEXT NOT NULL,
    "assistantAnswer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "toolCalls" JSONB NOT NULL DEFAULT '[]',
    "sources" JSONB NOT NULL DEFAULT '[]',
    "feedback" "AIFeedbackType",
    "feedbackNote" TEXT,
    "correctedAnswer" TEXT,
    "rating" INTEGER,
    "tokens" INTEGER,
    "costUSD" DOUBLE PRECISION,
    "latencyMs" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "isExported" BOOLEAN NOT NULL DEFAULT false,
    "exportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AITrainingEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AITrainingDataset" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "format" TEXT NOT NULL DEFAULT 'OPENAI_JSONL',
    "entryCount" INTEGER NOT NULL DEFAULT 0,
    "includeOnlyPositive" BOOLEAN NOT NULL DEFAULT false,
    "includeCorrected" BOOLEAN NOT NULL DEFAULT true,
    "filterModel" TEXT,
    "filterFrom" TIMESTAMP(3),
    "filterTo" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3),
    "fileUrl" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AITrainingDataset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AIAuditLog_tenantId_createdAt_idx" ON "AIAuditLog"("tenantId", "createdAt");
CREATE INDEX "AIAuditLog_userId_createdAt_idx" ON "AIAuditLog"("userId", "createdAt");
CREATE INDEX "AIAuditLog_conversationId_idx" ON "AIAuditLog"("conversationId");
CREATE INDEX "AIAuditLog_action_createdAt_idx" ON "AIAuditLog"("action", "createdAt");
CREATE INDEX "AIAuditLog_severity_createdAt_idx" ON "AIAuditLog"("severity", "createdAt");
CREATE INDEX "AITrainingEntry_tenantId_createdAt_idx" ON "AITrainingEntry"("tenantId", "createdAt");
CREATE INDEX "AITrainingEntry_feedback_createdAt_idx" ON "AITrainingEntry"("feedback", "createdAt");
CREATE INDEX "AITrainingEntry_model_createdAt_idx" ON "AITrainingEntry"("model", "createdAt");
CREATE INDEX "AITrainingEntry_isExported_createdAt_idx" ON "AITrainingEntry"("isExported", "createdAt");
CREATE INDEX "AITrainingEntry_rating_idx" ON "AITrainingEntry"("rating");
CREATE INDEX "AITrainingDataset_tenantId_createdAt_idx" ON "AITrainingDataset"("tenantId", "createdAt");
CREATE INDEX "AITrainingDataset_generatedAt_idx" ON "AITrainingDataset"("generatedAt");
