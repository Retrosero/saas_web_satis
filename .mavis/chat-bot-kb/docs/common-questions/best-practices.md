# Best Practices

## Multi-Tenant
✅ **Yap:**
- Her tabloya `tenantId String` (FK Tenant)
- Her endpoint'te `req.user.tenantId` kullan
- Index: `@@index([tenantId, ...])`
- `@@unique([tenantId, code])` — kod tenant içinde unique

❌ **Yapma:**
- Body'den `tenantId` alma
- Global sorgu yazma
- Cache key'inde tenantId atlama

## Para & Stok
✅ **Yap:**
- `Decimal` tip kullan (Float ASLA)
- Bakiyeyi hareketten hesapla (event sourcing)
- Para işleminde transaction kullan
- Ters kayıt ile iptal
- Audit log (kimin ne zaman ne yaptığı)

❌ **Yapma:**
- `balance` alanı güncelleme
- Float para
- Fiziksel silme
- Boş catch

## Soft Delete
✅ **Yap:**
- `isDeleted + deletedAt` alanları
- Her sorguda `isDeleted: false` filter
- Cleanup için arşivle (FAZ 52)

❌ **Yapma:**
- `prisma.delete()` ASLA
- Sadece status='DELETED' kullanma
- Filtresiz findUnique

## Performance
✅ **Yap:**
- Index ekle (tenantId, isDeleted, createdAt)
- Composite index kullan
- Pagination (skip+take veya cursor)
- N+1 sorgudan kaçın (always `include`)
- Redis cache (5dk-1h TTL)
- BullMQ queue (zaman alan işler)
- Sentry + OTEL ile monitoring

❌ **Yapma:**
- SELECT * (specific fields)
- Raw SQL (sadece çok kritik performans)
- Bakiye cache'leme (her hesapla, 5dk cache yeterli)
- Tüm kayıtları tek sorguda çekme

## Frontend
✅ **Yap:**
- Component kütüphanesi kullan (DataTable, MobileCardList, ConfirmModal)
- Türkçe UI metni
- react-hook-form + zod
- TanStack Query
- Mobile-first responsive (md: breakpoint)
- Loading/Empty/Error state
- Toast feedback

❌ **Yapma:**
- Redux
- İngilizce UI
- Yeni component (mevcut varken)
- Tailwind inline style
- Boş catch

## API Design
✅ **Yap:**
- RESTful endpoint'ler
- Pagination: `{ items, total, page, pageSize }`
- Filter via query params
- JWT auth
- Swagger/OpenAPI dokümantasyon
- Idempotency-Key header (write)
- Versioning: `/api/v1/...`

❌ **Yapma:**
- Body'den tenantId
- GET'te body kullan
- Response'ta şifre/token
- Verbose endpoint: `/api/v1/getCustomerById/{id}` (YERİNE `/customers/{id}`)

## Error Handling
✅ **Yap:**
- Specific exception: `NotFoundException`, `BadRequestException`
- Error message Türkçe + actionable
- Frontend'de toast.error
- Sentry'ye 5xx gönder
- Log: error + stack trace

❌ **Yapma:**
- Generic `Error` fırlat
- Boş catch
- 4xx'i Sentry'ye gönder
- Hassas bilgiyi error message'da (şifre, kart no)

## Security
✅ **Yap:**
- JWT (access + refresh)
- bcrypt password (cost 10+)
- HTTPS (production)
- CORS whitelist
- Rate limiting (FAZ 58)
- Idempotency (FAZ 58)
- Input validation (zod / class-validator)
- SQL injection önleme (Prisma parameterized)

❌ **Yapma:**
- JWT secret'ı hard-code
- Plain text password
- HTTP (production)
- CORS: '*' (production)
- Raw SQL injection
- eval/Function kullanımı

## Code Quality
✅ **Yap:**
- TypeScript strict mode
- Tip belirsizse `unknown` + cast
- Generic component'lerde tip
- Naming: İngilizce (kod), Türkçe (UI)
- Single responsibility
- DRY (component reuse)

❌ **Yapma:**
- `any` kullanma
- Magic number (constant yap)
- God object (büyük service)
- Duplicate code

## Test
✅ **Yap:**
- Unit test (her service)
- Component test (her page/component)
- E2E (kritik akışlar)
- Prisma mock
- Coverage > %60 service
- CI'da her PR'da çalıştır

❌ **Yapma:**
- Test yazmadan PR
- Gerçek DB test
- Snapshot test (gerekmedikçe)
- Flaky test

## Git
✅ **Yap:**
- Türkçe commit message
- Feature branch
- PR description
- Small commits
- Rebase before merge

❌ **Yapma:**
- İngilizce commit ("Fix bug")
- 100+ satır commit
- Direct push to main
- Force push (public branch)

## DevOps
✅ **Yap:**
- Environment variables (.env.example)
- Docker compose (lokal)
- CI/CD (GitHub Actions)
- Health check endpoint
- Log aggregation (Sentry + OTEL)
- Backup (DB)

❌ **Yapma:**
- Secret'ları git'e commit
- Production'da console.log
- Migration'ı otomatik deploy etmeden

## Dokümantasyon
✅ **Yap:**
- README.md (kurulum, çalıştırma)
- API docs (Swagger)
- CHANGELOG.md
- Inline comment (ne yapar, neden)
- Type definitions (TS)

❌ **Yapma:**
- Self-explanatory code yorumu (// increment i)
- Outdated docs
- TODO comment (issue oluştur)
