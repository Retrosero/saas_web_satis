# OpenAI Codex Instructions
# https://openai.com/index/codex/

## Project: SaaS Web Satış
Türkçe multi-tenant SaaS işletme yönetim platformu. Monorepo (pnpm).

### Stack
- **Frontend** (`apps/web`): React 18 + TypeScript + Vite + TanStack Query + Tailwind
- **Backend** (`apps/api`): NestJS + Prisma + PostgreSQL + Redis + BullMQ
- **Shared** (`packages/shared`): Types & enums (used by both)

---

## Hard Rules (DO NOT VIOLATE)

### 1. Language
- **UI text**: ALWAYS Turkish (Türkçe) — zorunlu
- **Code** (variables, functions, files): English
- **Commit messages**: Turkish
- ❌ English UI text in user-facing strings

### 2. Multi-Tenant
- Every Prisma model MUST have `tenantId String` field
- Every backend endpoint MUST use `req.user.tenantId` (NEVER trust body)
- Index pattern: `@@index([tenantId, isDeleted])`

### 3. Soft Delete (Mandatory)
- `isDeleted Boolean @default(false)` + `deletedAt DateTime?`
- **NEVER** hard delete. Use soft delete + reverse movement for money/stock.

### 4. Event Sourcing (Money & Stock)
- Balance is COMPUTED, not stored.
- Tables: `CustomerMovement`, `StockMovement`, `BankTransaction`
- Query: `SUM(movements)` to compute balance
- ❌ Never store `balance` field

### 5. Money = Decimal
- ALWAYS `Decimal` type, NEVER `Float`
- Convert to `Number(...)` only at API response time

### 6. Prisma Enum Syntax (CRITICAL)
```prisma
// ✅ CORRECT (multi-line)
enum QuoteStatus {
  DRAFT
  SENT
  ACCEPTED
}

// ❌ WRONG — parse error
```

---

## Frontend Component Library (REUSE — don't invent)

| Component | Location | Props |
|-----------|----------|-------|
| `DataTable<T>` | `apps/web/src/components/data/DataTable.tsx` | `columns: DataTableColumn<T>[]`, `rowKey`, `onRowClick?` |
| `MobileCardList<T>` | `apps/web/src/components/data/MobileCardList.tsx` | `data`, `keyFn`, `onItemClick?`, `header`, `subtitle?`, `rightBadge?` |
| `ConfirmModal` | `apps/web/src/components/data/ConfirmModal.tsx` | `open`, `title`, `description?`, `confirmText`, `variant`, `onClose`, `onConfirm` |
| `PageHeader` | `apps/web/src/components/layout/PageHeader.tsx` | `title`, `description?` (NOT `subtitle`!), `actions?` |
| `EmptyState` | `apps/web/src/components/data/EmptyState.tsx` | `title`, `icon?`, `action?: ReactNode` (NOT `{label, onClick}`!) |
| `LoadingState` | `apps/web/src/components/data/LoadingState.tsx` | — |
| `ErrorState` | `apps/web/src/components/data/ErrorState.tsx` | — |
| `PageGuard` | `apps/web/src/components/guard/PageGuard.tsx` | `allowed: boolean` |

---

## Frontend API Pattern (TanStack Query)
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useXxx(params?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: ['xxx', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: Xxx[]; total: number }>('/xxx', { params });
      return data;
    },
  });
}
```

---

## Backend Module Pattern (NestJS)
```
apps/api/src/modules/{domain}/
  {domain}.module.ts       — NestJS @Module
  {domain}.controller.ts   — @Controller + @UseGuards(JwtAuthGuard, TenantGuard)
  {domain}.service.ts      — Business logic, Prisma access
  {domain}.service.spec.ts — Jest unit tests
```

### Controller
```ts
@ApiTags('xxx') @ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('xxx')
export class XxxController {
  @Get() list(@Req() req: any, @Query() q: any) { return this.svc.list(req.user.tenantId, q); }
  @Get(':id') get(@Req() req: any, @Param('id') id: string) { return this.svc.get(req.user.tenantId, id); }
  @Post() create(@Req() req: any, @Body() body: any) { return this.svc.create(req.user.tenantId, body, req.user.id); }
}
```

### Service
```ts
@Injectable()
export class XxxService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, params: any) {
    // tenantId ALWAYS first param
    return this.prisma.client.xxx.findMany({
      where: { tenantId, isDeleted: false, ...params },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

---

## Database & Migrations
- Schema: `apps/api/prisma/schema.prisma`
- Migrations: `apps/api/prisma/migrations/{YYYYMMDDHHMMSS}_{name}/migration.sql`
- Write migrations MANUALLY. NEVER `prisma migrate dev` in production.
- NOT NULL columns MUST have default value.
- Indexes: `@@index([tenantId, isDeleted, createdAt(sort: Desc)])`

---

## File Structure
```
apps/
  api/src/modules/{domain}/
    {domain}.module.ts
    {domain}.controller.ts
    {domain}.service.ts
    {domain}.service.spec.ts
  web/src/
    pages/{domain}/{Name}Page.tsx
    features/{domain}/api.ts
    components/{data,layout,header,error,chat,guard}/
    lib/  (api-client, sentry, socket-client, use-debounce, query-client, storage, cn)
    stores/  (Zustand)
packages/shared/src/
  enums/{domain}.enum.ts
  types/{domain}.ts
```

---

## Commands
- `pnpm test:api` — backend Jest tests
- `pnpm test:web` — frontend Vitest
- `pnpm test:e2e` — Playwright
- `pnpm build` — full monorepo build
- `npx tsc --noEmit` — type check
- `npx prisma validate` — schema validate

---

## Forbidden
- ❌ Redux (use TanStack Query + Zustand)
- ❌ Float for money (use Decimal)
- ❌ Hard delete (always soft delete)
- ❌ tenantId from request body
- ❌ Single-line Prisma enum
- ❌ English UI text
- ❌ Re-inventing existing components
- ❌ N+1 queries (always `include` relations)
- ❌ Inline `style={{}}` (use Tailwind classes)
- ❌ Empty `catch {}` (always log error)

## Color Tokens (Tailwind)
- `bg-primary text-on-primary` — primary buttons
- `bg-surface border-outline` — cards
- `bg-surface-variant` — secondary surfaces
- Semantic: green=success, amber=warning, red=danger, blue=info
