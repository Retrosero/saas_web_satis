# AGENTS.md — Universal Agent Rules
# Bu dosya tüm agent tabanlı editörler için ortak bağlam sağlar:
# - Google Antigravity
# - Codex (OpenAI)
# - VSCode Cline
# - Claude Code, Aider, vb.

## Project: SaaS Web Satış (Turkish Multi-tenant SaaS)

### Monorepo Structure
```
apps/
  api/        — NestJS + Prisma + PostgreSQL + Redis backend
  web/        — React 18 + TypeScript + Vite frontend
packages/
  shared/     — Common types & enums (used by both)
```

### Critical Rules (DO NOT VIOLATE)

#### 1. Language
- **UI text**: ALWAYS Turkish (Türkçe)
- **Code** (variables, functions, files): English
- **Commit messages**: Turkish

#### 2. Multi-Tenant
- Every Prisma model MUST have `tenantId String` field
- Every backend endpoint MUST use `req.user.tenantId` (never trust body)
- Index pattern: `@@index([tenantId, isDeleted])`

#### 3. Soft Delete (Mandatory)
- `isDeleted Boolean @default(false)`
- `deletedAt DateTime?`
- **NEVER** hard delete. Use soft delete + reverse movement for money/stock.

#### 4. Event Sourcing (Money & Stock)
- Balance is COMPUTED, not stored.
- Use `CustomerMovement`, `StockMovement`, `BankTransaction` tables.
- Query: `SUM(movements)` to get balance.

#### 5. Money
- **ALWAYS** `Decimal` type, **NEVER** `Float`
- Convert to `Number(...)` only at API response time

#### 6. Enum Syntax (Prisma)
```prisma
// CORRECT (multi-line)
enum QuoteStatus {
  DRAFT
  SENT
  ACCEPTED
}

// WRONG (parse error) — never write single-line
```

#### 7. Component Library (REUSE — don't reinvent)
Frontend (`apps/web/src/components/`):
- `DataTable<T>` — generic table (`data/DataTable.tsx`)
- `MobileCardList<T>` — mobile card list (`data/MobileCardList.tsx`)
- `ConfirmModal` — confirm dialog (`data/ConfirmModal.tsx`)
- `PageHeader` — page header (`layout/PageHeader.tsx`)
- `EmptyState` — empty state (`data/EmptyState.tsx`)
- `LoadingState` / `ErrorState` / `PageGuard`

#### 8. API Pattern (Frontend)
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useXxx(params) {
  return useQuery({
    queryKey: ['xxx', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/xxx', { params });
      return data;
    },
  });
}
```

#### 9. Backend Module Pattern
```
apps/api/src/modules/{domain}/
  {domain}.module.ts       — NestJS module
  {domain}.controller.ts   — HTTP endpoints
  {domain}.service.ts      — Business logic
  {domain}.service.spec.ts — Unit tests (Jest)
```

Controller:
```ts
@ApiTags('xxx') @ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('xxx')
export class XxxController {
  @Get() list(@Req() req, @Query() q) { return this.svc.list(req.user.tenantId, q); }
  @Get(':id') get(@Req() req, @Param('id') id) { return this.svc.get(req.user.tenantId, id); }
}
```

Service:
```ts
async list(tenantId: string, params): Promise<...> {
  // tenantId ALWAYS first param
}
```

#### 10. Migration Rules
- Location: `apps/api/prisma/migrations/{YYYYMMDDHHMMSS}_{name}/migration.sql`
- Write MANUALLY. NEVER use `prisma migrate dev` in production.
- Add NOT NULL columns WITH default value.

### Forbidden
- ❌ Redux (use TanStack Query + Zustand)
- ❌ Float for money
- ❌ Hard delete (always soft)
- ❌ tenantId from request body
- ❌ Single-line enum
- ❌ English UI text
- ❌ Re-inventing existing components
- ❌ N+1 queries (always `include` relations)
- ❌ Inline `style={{}}` (use Tailwind)
- ❌ `catch {}` empty handler (log it)

### Commands
- `pnpm test:api` — backend Jest tests
- `pnpm test:web` — frontend Vitest
- `pnpm test:e2e` — Playwright
- `pnpm build` — full monorepo build
- `npx tsc --noEmit` — type check
- `npx prisma validate` — schema validate
- `npx prisma generate` — generate client

### Color Tokens (Tailwind)
- `bg-primary text-on-primary` — primary buttons
- `bg-surface border-outline` — cards
- `bg-surface-variant` — secondary surfaces
- Semantic: success (green), warning (amber), danger (red), info (blue)
