# Multi-Tenant Mimari

## Temel Prensip
**Her tablo `tenantId` alanına sahip. Her sorgu `req.user.tenantId` kullanır. Asla body'den alma.**

## Tenant İzolasyonu

### Prisma Schema
```prisma
model Customer {
  id        String   @id @default(cuid())
  tenantId  String   // ZORUNLU
  name      String
  // ...
  
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@index([tenantId, isDeleted])
  @@unique([tenantId, code])  // code tenant içinde unique
}
```

### Backend Guard
```ts
@ApiTags('customers') @ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('customers')
export class CustomersController {
  @Get() list(@Req() req: any, @Query() q: any) {
    return this.svc.list(req.user.tenantId, q);  // tenantId her zaman req.user'dan
  }
}
```

### Service Pattern
```ts
async list(tenantId: string, params: any) {
  // tenantId İLK parametre
  return this.prisma.client.customer.findMany({
    where: { tenantId, isDeleted: false, ...params },
  });
}
```

## Tenant Lifecycle
- **Oluşturma**: Super admin tarafından
- **Aktif/Pasif**: Settings → Subscription
- **Migration**: Her tenant kendi şemasında, ama ortak DB (Postgres'te `tenantId` filter)
- **Yedekleme**: Per-tenant export (FAZ 24 veri taşıma)

## Tenant-Scoped Cache
```
key: tenant:{tenantId}:{module}:{key}
```
Örnek: `tenant:abc-123:customers:list:status=ACTIVE`

CacheService.invalidateTenant(tenantId, module) ile pattern scan + delete.

## Tenant-Scoped Meilisearch
```ts
filter: [`tenantId = "${tenantId}"`]
```

## Tenant-Scoped WebSocket
- JWT'ten tenantId alınır
- `socket.join('tenant:' + tenantId)`
- emitToTenant(tenantId, ...) ile broadcast

## Tenant-Scoped File Storage
- R2 path: `tenants/{tenantId}/{folder}/{filename}`
- Signed URL sadece o tenant için

## Tenant-Scoped AI/Agent
- AI tool çağrılarında tenantId context
- Agent plan'da tenantId geçirilir

## Cross-Tenant Erişim
- **Super admin**: tüm tenant'lara erişim (impersonate)
- **Normal user**: sadece kendi tenant'ı
- **Audit log**: her cross-tenant erişim kaydedilir

## Tenant Silme (Soft)
- Tenant.isDeleted = true
- Tüm alt tablolar soft delete
- Restore: TODO
- Hard delete: GDPR uyumluluğu için (TODO, audit log)

## Tenant Migration
- Subscription tier değişince modül aktif/pasif
- Tenant.modulePermissions tablosu
- Middleware: ModuleGuard kontrol eder

## Performans
- `@@index([tenantId, ...])` her tabloda (FAZ 55)
- N+1 sorgu YASAK (always include)
- Connection pool: 5-10 per tenant (TODO, PgBouncer)

## Güvenlik
- JWT'te tenantId ZORUNLU
- Body'den tenantId KABUL EDILMEZ
- `req.user.tenantId` source of truth

## Test
- Test'te sabit tenantId kullan
- Multi-tenant test: farklı tenant'lar izole olmalı
- Permission test: yetkisiz tenant verisi GÖRÜNMEMELI
