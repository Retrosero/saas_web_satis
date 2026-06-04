-- FAZ 58: Idempotency Keys tablosu
CREATE TABLE IF NOT EXISTS "IdempotencyKey" (
  id          TEXT PRIMARY KEY DEFAULT (cuid()),
  "key"       TEXT NOT NULL UNIQUE,
  "tenantId"  TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  method      TEXT NOT NULL,
  url         TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'PROCESSING',
  "statusCode" INTEGER,
  response    JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  CONSTRAINT "IdempotencyKey_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IdempotencyKey_tenantId_expiresAt_idx" ON "IdempotencyKey"("tenantId", "expiresAt");
CREATE INDEX IF NOT EXISTS "IdempotencyKey_createdAt_idx" ON "IdempotencyKey"("createdAt");
