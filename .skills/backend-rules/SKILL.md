name: backend-rules
description: NestJS + Prisma + PostgreSQL + Redis backend kuralları. Yeni modül, service, controller veya migration yazarken uygula.
when_to_use: >
  Yeni bir backend modül, service, controller yazarken.
  Prisma schema değişikliği veya migration oluştururken.
  API endpoint tasarlarken.
  Code review yaparken.

rules:
  architecture:
    pattern: "Module per domain: src/modules/{domain}/{domain}.{module,controller,service}.ts"
    structure: |
      src/modules/customers/
        customers.module.ts       (NestJS module)
        customers.controller.ts   (HTTP endpoints, @UseGuards(JwtAuthGuard, TenantGuard))
        customers.service.ts      (business logic, Prisma erişimi)
        customers.service.spec.ts (unit test — her modülde olmalı)
    global_modules:
      - AppCacheModule (Redis cache)
      - QueueModule (BullMQ)
      - PerfModule (query logger)
      - SearchModule (Meilisearch)
      - RealtimeModule (WebSocket)
      - ThrottlerConfigModule (rate limit)
      - IdempotencyModule
      - ObservabilityModule (Sentry + OTEL)

  prisma:
    multi_tenant: HER TABLO tenantId alanına sahip (zorunlu). Index: @@index([tenantId, isDeleted])
    soft_delete: "Fiziksel silme YOK. isDeleted + deletedAt. Para/stok işlemlerinde soft delete + ters kayıt."
    event_sourcing: "Bakiyeler SAKLANMAZ, hareketlerden hesaplanır. CustomerMovement, StockMovement tabloları."
    migrations: "Her schema değişikliği için apps/api/prisma/migrations/{timestamp}_{name}/migration.sql. Asla prisma migrate dev ile otomatik üretme — manuel yaz."
    relations: "Tenant modelinde back-relation field'lar (labelPrintJobs, ruleSegment) elle eklenmeli. Prisma format yetmez."
    enums: "Multi-line ZORUNLU. enum QuoteStatus { DRAFT SENT ACCEPTED ... } — tek satır parse hatası verir."
    indexes: "Yüksek okuma yapan kolonlar için composite index: (tenantId, status), (tenantId, createdAt DESC)"

  controller:
    guards: "Her controller: @UseGuards(JwtAuthGuard, TenantGuard)"
    decorator_pattern: |
      @ApiTags('customers') @ApiBearerAuth()
      @Controller('customers')
      export class CustomersController {
        @Get() list(@Req() req: any, @Query() q: any) { return this.svc.list(req.user.tenantId, q); }
        @Get(':id') get(@Req() req: any, @Param('id') id: string) { return this.svc.get(req.user.tenantId, id); }
        @Post() create(@Req() req: any, @Body() body: any) { return this.svc.create(req.user.tenantId, body, req.user.id); }
        @Put(':id') update(...) { ... }
        @Delete(':id') delete(...) { ... }
      }
    tenant_id: "req.user.tenantId'den al, body'den alma!"

  service:
    signature: "İlk parametre her zaman tenantId: string"
    errors:
      - NotFoundException (id ile bulunamayan)
      - BadRequestException (validasyon hatası)
      - ForbiddenException (yetki yok)
      - ConflictException (unique constraint)
    transactions: "Çoklu yazma varsa prisma.$transaction kullan"
    cache: "@Cacheable({ module: 'customers', ttl: 60 }) decorator (read endpoint'ler)"
    invalidation: "Write sonrası cacheService.invalidateTenant(tenantId, 'customers')"
    queue: "Zaman alan işler queueService.enqueueXxx(...) ile arka plana"

  shared_types:
    location: packages/shared/src/{types,enums}/
    usage: "Backend ve frontend'de import { QuoteStatus } from '@saas/shared'"
    new_type: "Backend'de kullanılacak type önce packages/shared/src/ altına eklenmeli"

  security:
    jwt: "JWT secret: process.env.JWT_SECRET ?? 'dev-secret' — asla hard-code"
    password: "bcrypt ile hash'le. Plain text asla DB'ye yazma"
    sql_injection: "Prisma parameterized queries kullan. Raw SQL kaçın ($queryRaw yalnızca performans kritik)."
    rate_limit: "@Throttle() decorator (FAZ 58'de eklendi)"

  testing:
    framework: Jest (zaten kurulu)
    location: src/modules/{domain}/{domain}.service.spec.ts
    pattern: |
      - Her service için en az 5 test (happy path, not found, validation, business rule)
      - Prisma'yı mockla (gerçek DB'ye dokunma)
      - @testing-library/jest-dom yerine Jest matcher
    run: "pnpm test:api"
    coverage: "%60+ services, %40+ controllers hedefi"

  common_patterns:
    pagination: "{ items: T[], total: number, page: number, pageSize: number }"
    filter: "where: any = { tenantId, isDeleted: false, ...filters }"
    sort: "orderBy: { createdAt: 'desc' } default"
    error_log: "logger.error(err.message, err.stack)"
    audit: "Kritik işlemlerde audit log (customerId, action, userId, timestamp)"

  common_pitfalls:
    - "tenantId body'den alınır → GÜVENLİK AÇIĞI. Her zaman req.user.tenantId"
    - "isDeleted kontrolsüz findUnique → soft delete'leri de getirir"
    - "Raw body casting → Zod validation pipe kullan"
    - "Decimal field'ı number olarak dönmek → Number(...) ile dönüştür"
    - "Migration'da veri kaybı → yeni kolon default değer + index ayrı"
