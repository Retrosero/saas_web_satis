---
name: security-checklist
description: |
  Yeni controller, endpoint, sayfa veya modül eklerken güvenlik kontrolü yap.
  Tetikleyen ifadeler: "yeni modül ekle", "yeni controller", "yeni sayfa", "endpoint ekle",
  "yeni özellik ekle", "add a new module", "yeni bir controller oluştur", "yeni bir sayfa ekle".
  Ayrıca: kullanıcı "güvenlik kontrolü yap", "permission ekle", "yetki kontrolü" derse de tetiklenir.
  Tetiklemez: mevcut kodu okuma/düzeltme, migration, test yazma, sadece "backend build" veya "frontend build".
---

# Security Checklist — Yeni Kod Ekleme Güvenlik Kontrolü

Yeni bir controller, endpoint, sayfa veya modül eklerken bu prosedürü uygula.
Amaç: hiçbir yeni kodun yetki kontrolü olmadan kalmaması.

## Inputs to collect

Aşağıdakilerden herhangi biri eksikse eklemeden önce sor:

- Bu endpoint hangi HTTP method + path?
- Kimlerin erişmesi gerekiyor? (tüm kullanıcılar / sadece admin / sadece belirli rol)
- Hangi permission kodu uygun? (mevcut kodları kontrol et: `packages/shared/src/constants/permissions.ts`)
- Frontend'de hangi sayfada/butonda kullanılacak?
- Hassas veri (TC Kimlik, IBAN, şifre, bakiye) içeriyor mu?

## Procedure

### 1. Backend — Controller

**Her yeni controller için zorunlu:**

```
a) @UseGuards annotation'ı kontrol et veya ekle:
   @UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
   Tüm endpoint'ler için geçerli. Tek istisna: /auth/* (login, register, refresh).

b) Permission decorator'ı ekle:
   Her endpoint için @RequirePermission('modul:resource:action')

   Permission kodu bulma sırası:
   1. packages/shared/src/constants/permissions.ts → mevcut kod var mı?
   2. Yoksa: modul:resource:action formatında yeni kod ekle
   3. Enum'lar: packages/shared/src/enums/ altında uygun enum var mı kontrol et
```

**Örnek (doğru):**
```typescript
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
@Controller('new-module')
export class NewModuleController {
  @Post()
  @RequirePermission('newmod:item:create')   // ← her create endpoint'e
  create() { ... }

  @Get()
  @RequirePermission('newmod:item:view')     // ← her read endpoint'e
  list() { ... }
}
```

**Örnek (yanlış):**
```typescript
// ❌ Guard eksik — herkes erişir!
@Controller('new-module')
export class NewModuleController { ... }

// ❌ Permission eksik — sadece JwtAuthGuard var, tenant izole ama yetki kontrolü yok
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('new-module')
export class NewModuleController { ... }
```

**Özel durum — Hassas veri:**
TC Kimlik, IBAN, bakiye, şifre hash'i gibi alanlar için:
- Backend: `ik:sensitive_data:view` permission gerekli (mevcut pattern: `hr-permission.guard.ts`)
- Frontend: `usePermission('ik:sensitive_data:view')` kontrolü ekle

---

### 2. Backend — Endpoint İçi Validasyon

**Her POST/PUT/PATCH için:**
```
a) @Body() DTO'su class-validator ile annotate edilmiş mi?
b) Eksik alan kontrolü (null check, required field validation)
c) ID parametre kontrolü: @Param('id') gerçekten bu tenant'a mı ait?
d) Yetki kontrolü: kullanıcı sadece kendi verisini mi görüyor? (tenantId kontrolü zorunlu)
```

---

### 3. Frontend — Sayfa

**Her yeni sayfa için:**
```
a) Write butonları (Ekle, Düzenle, Sil, Onayla, İptal, Gönder) →
   usePermission() kontrolü ekle

b) Sayfa bazlı yetki gerekli mi? (ör: sadece admin görebilsin) →
   erişim yoksa "Yetkiniz yok" mesajı göster ve return et

c) Hassas veri gösterimi →
   usePermission('ik:sensitive_data:view') ile maskele/gizle
```

**Örnek (doğru):**
```tsx
const NewModulePage = () => {
  const canCreate = usePermission('newmod:item:create');
  const canDelete = usePermission('newmod:item:delete');

  return (
    <div>
      <h1>Yeni Modül</h1>
      {canCreate && <Button onClick={create}>Ekle</Button>}
      {/* ... */}
    </div>
  );
};
```

**Örnek (yanlış):**
```tsx
// ❌ Yetki kontrolü yok — herkes butonu görür ama backend reddeder (kötü UX)
const NewModulePage = () => (
  <Button onClick={create}>Ekle</Button>
);
```

---

### 4. Frontend — Sidebar / Navigasyon

**Yeni modül eklendiğinde:**
```
a) Sidebar'da modül görünür mü? → useModuleAccess('module-code') kontrolü
b) Modül kodu ve adı packages/shared/src/constants/modules.ts'e eklendi mi?
c) Modül kodu ve icon'u permission definitions'a eklendi mi?
```

---

### 5. Permission Kodu Standartları

```
Format: modul:resource:action

Modül kodları (ModuleCode enum):
  cari | stok | satis | siparis | tahsilat | kasa | banka | depo
  iade | raporlar | ik | ayarlar | bildirim | asistan | log_audit

Action'lar (PermissionAction enum):
  view | read | create | update | delete | approve | cancel | export | import | print | manage

Hassas: her zaman 'view' + ayrı sensitive_data kontrolü gerekli
```

---

### 6. Soft Delete Standardı

**Silme endpoint'leri için:**
```
✅ DO: soft delete (isDeleted + deletedAt)
❌ DON'T: hard delete (fiziksel silme)

İstisna: sadece migration/sıfırlama gibi teknik işlemler için
```

---

### 7. Seed — Yeni Permission

**Yeni permission kodu eklendiyse:**
```
a) packages/shared/src/constants/permissions.ts'e PERMS() çağrısı ekle
b) Tenant Admin > Rol Yetkileri sayfasında yeni kod görünür mü? (frontend permission yapısı kontrol et)
c) Seed script'te yeni permission INSERT edildi mi?
```

## Output contract

Her yeni controller/sayfa eklendiğinde, commit mesajında şu satır bulunmalı:
```
security: [backend|frontend|both] — permission kontrolleri eklendi
```

Eğer hiçbir permission gerekmeyen bir endpoint ekleniyorsa (örn. public docs), bunu commit mesajında açıkça belirt.

## Failure handling

**Yeni bir permission kodu için endpoint yazıldı ama kod veritabanında yok:**
→ Sistem çalışır ama kullanıcı 403 alır. `permissions.ts` + seed kontrolü yap.

**Frontend'de buton var ama backend reddediyor:**
→ Bu bir UX bug'ıdır — her iki tarafı da aynı anda güncelle.

**Hangi modüle ait olduğu belli değil:**
→ En yakın mevcut modüle bağla. Yeni modül gerekiyorsa ModuleCode enum'a ekle.

## Referans Dosyalar

Mevcut doğru örnekler:
- Backend guard: `apps/api/src/common/guards/permission.guard.ts`
- Decorator: `apps/api/src/common/guards/require-permission.decorator.ts`
- Frontend hook: `apps/web/src/lib/usePermission.ts`
- Permission tanımları: `packages/shared/src/constants/permissions.ts`
- Modül kodları: `packages/shared/src/enums/module.enum.ts`
- HR sensitive data örneği: `apps/web/src/pages/hr/EmployeeDetailPage.tsx`