# FAZ 60-61 — Test Stratejisi

## 3 Test Katmanı

### 1) Backend Unit/Integration (Jest)
- **35 test, %100 geçiyor**
- Framework: Jest (zaten kurulu, FAZ 1'den beri)
- Test dosyası: `{module}.service.spec.ts` (her service'in yanında)
- Prisma mocklanır (gerçek DB'ye dokunmaz)

### 2) Frontend Component (Vitest + RTL)
- **7 test**
- Framework: Vitest + @testing-library/react
- Test dosyası: `{component}.test.tsx` (kaynak dosyanın yanında)
- jsdom environment

### 3) E2E (Playwright)
- **4 kritik akış testi**
- Framework: Playwright
- Test dizini: `apps/web/e2e/`
- chromium headless, baseURL config

## Test Komutları

```bash
# Backend
pnpm test:api              # Jest
pnpm test:api --watch      # Watch mode
pnpm test:api --coverage   # Coverage report

# Frontend
pnpm test:web              # Vitest
pnpm test:web --watch      # Watch mode

# E2E
pnpm test:e2e              # Playwright
```

## Mevcut Test Coverage

### Backend (35 test)
- `customers.service.spec.ts` (13 test) — event sourcing, soft delete
- `quotes.service.spec.ts` (12 test) — FAZ 45 modülü
- `cache.service.spec.ts` (5 test) — FAZ 53
- `search.service.spec.ts` (4 test) — FAZ 56

### Frontend (7 test)
- `lib/use-debounce.test.ts` (1)
- `components/data/EmptyState.test.tsx` (3)
- `components/data/ConfirmModal.test.tsx` (3)

### E2E (4 test)
- Login sayfası
- Login → Dashboard
- Sistem sayfaları
- API health

## Test Pattern'leri

### Backend (Jest + Mock)
```ts
describe('CustomersService', () => {
  let service: CustomersService;
  let mockPrisma: any;
  
  beforeEach(async () => {
    mockPrisma = { client: { customer: { findFirst: jest.fn() } } };
    const module = await Test.createTestingModule({
      providers: [CustomersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(CustomersService);
  });
  
  it('should throw NotFound', async () => {
    mockPrisma.client.customer.findFirst.mockResolvedValue(null);
    await expect(service.get('t1', 'missing')).rejects.toThrow(NotFoundException);
  });
});
```

### Frontend (Vitest + RTL)
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

describe('ConfirmModal', () => {
  it('should call onConfirm', () => {
    const onConfirm = vi.fn();
    render(<ConfirmModal open={true} title="T" confirmText="OK" onClose={() => {}} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('OK'));
    expect(onConfirm).toHaveBeenCalled();
  });
});
```

### E2E (Playwright)
```ts
import { test, expect } from '@playwright/test';

test('login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type=email]', 'admin@demo.local');
  await page.click('button[type=submit]');
  await expect(page).toHaveURL(/dashboard/);
});
```

## CI Workflow
- `.github/workflows/test.yml`
- Her PR'da backend + frontend test

## Hedefler
- %60+ services, %40+ controllers
- Tüm kritik akışlar E2E

## Sık Sorulan Sorular

**S: "Test nerede çalışır?"**
C: Backend Jest: local + CI. Frontend Vitest: local + CI. E2E Playwright: CI'da browser install gerekli.

**S: "Coverage nasıl görülür?"**
C: `pnpm test:api --coverage` → coverage/ klasörü.

**S: "Yeni modül için test zorunlu mu?"**
C: Pratikte evet, refactor güvenliği için. CI'da test yoksa merge engellenebilir.

**S: "Test database?"**
C: Şu an Prisma mock. Gerçek DB test DB'si TODO (Postgres ayrı schema).

**S: "E2E testler paralel çalışır mı?"**
C: Playwright config'te `workers: 1, fullyParallel: false`. CI'da sıralı.

**S: "Hangi test framework daha hızlı?"**
C: Vitest (frontend) — native ESM, hızlı. Jest (backend) — stable, iyi ecosystem.

**S: "Snapshot test var mı?"**
C: Yok, gerek duyulmadı. Component davranış testi (render) yeterli.
