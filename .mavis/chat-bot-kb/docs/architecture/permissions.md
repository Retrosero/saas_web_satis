# Permission Sistemi

## Yapı

### Tenant Tabanlı
- Her user'ın bir tenant'ı var
- Tenant içinde role'ler var (admin, user, viewer)
- Role'ler permission'lara sahip

### Permission Key Formatı
```
{module}.{action}
{module}.{sub_module}.{action}
```

Örnekler:
- `customers.view`, `customers.create`, `customers.update`, `customers.delete`
- `sales.view`, `sales.create`, `sales.approve`
- `quotes.view`, `quotes.convert_to_order`
- `customer_risk.view`, `customer_risk.manage`
- `bulk_operations.view`, `bulk_operations.create`, `bulk_operations.approve`, `bulk_operations.rollback`

## Tablolar

### Permission
```prisma
model Permission {
  id          String   @id @default(cuid())
  key         String   @unique  // 'customers.view'
  module      String
  action      String   // VIEW | CREATE | UPDATE | DELETE | APPROVE | ...
  description String?
}
```

### Role
```prisma
model Role {
  id          String   @id @default(cuid())
  tenantId    String?
  name        String
  isSystem    Boolean  @default(false)  // super_admin, admin, user
  permissions String[]  // ['customers.view', 'sales.create', ...]
  
  @@unique([tenantId, name])
}
```

### UserRole
```ts
model UserRole {
  userId    String
  roleId    String
  tenantId  String
  
  @@id([userId, roleId, tenantId])
}
```

## Yetki Kontrolü

### Backend (NestJS Guard)
```ts
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
@Controller('customers')
export class CustomersController {
  @Get()
  @RequirePermission('customers.view')
  list() { ... }
}
```

### PermissionGuard
```ts
@Injectable()
export class PermissionGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const required = this.reflector.get('permission', ctx.getHandler());
    if (!required) return true;
    return req.user.permissions?.includes(required);
  }
}
```

### Frontend (PageGuard)
```tsx
function CustomerListPage() {
  return (
    <PageGuard allowed={hasPermission('customers.view')}>
      <PageHeader title="Cariler" />
      <DataTable ... />
    </PageGuard>
  );
}
```

`hasPermission` Zustand'tan veya auth context'ten gelir.

## Süper Admin
- Tüm permission'lar otomatik
- Tüm tenant'lara erişim
- Tenant impersonate (TODO, FAZ 32 admin tools)
- Audit log

## Modül Bazlı Kontrol
Bazı modüller tenant'lar için opsiyonel (plan bazlı):
- AI Chat (Pro+ plan)
- E-Fatura (Enterprise)
- Multi-currency (Pro+)

Modül aktif değilse → 403 Forbidden.

## Audit Trail
- Kritik işlemler SecurityLog tablosuna
- Kullanıcı, action, target, timestamp, IP

## Permission'lar Listesi (FAZ 44-52 örneği)
- `global_search.use`
- `command_palette.use`
- `quotes.view`, `.create`, `.update`, `.delete`, `.convert_to_order`, `.convert_to_sale`, `.export_pdf`
- `customer_risk.view`, `.manage`, `.report`
- `product_recommendations.view`, `.manage`
- `bulk_operations.view`, `.create`, `.approve`, `.rollback`
- `labels.view`, `.create`, `.update`, `.print`
- `product_images.view`, `.upload`, `.update`, `.delete`
- `customer_segments.view`, `.create`, `.update`, `.delete`
- `cleanup.view`, `.run`, `.archive`, `.delete_files`

## Sık Sorulan Sorular

**S: "Yeni permission nasıl eklenir?"**
C: `Permission` tablosuna INSERT. Migration veya seed.

**S: "Role nasıl atanır?"**
C: UserRole tablosuna. Bir user birden fazla role alabilir.

**S: "Süper admin tenant'lar arası geçiş?"**
C: TODO — impersonate endpoint (FAZ 32).

**S: "Permission cache'lenir mi?"**
C: Şu an JWT'te var. Değişince token yenilenir. Redis cache TODO (FAZ 53).

**S: "Tüm permission'lar nerede listelenmiş?"**
C: Backend seed (`prisma/seed.ts` veya `permissions.seed.ts`).
