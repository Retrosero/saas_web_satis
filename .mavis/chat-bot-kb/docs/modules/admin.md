# Yönetim, Tenant & Sistem Modülleri

## 22. Demo Firma (Demo Company)

**Backend:** `apps/api/src/modules/demo-company/`
**Frontend:** `/demo-company`
**Prisma:** `DemoCompany`, `DemoScenario`

### Endpoint'ler
- `GET /demo-company` — Demo firmalar
- `POST /demo-company` — Yeni demo oluştur
- `POST /demo-company/:id/reset` → Demo verisini sıfırla
- `GET /demo-company/scenarios` — Senaryo listesi
- `POST /demo-company/scenarios` — Yeni senaryo

### Amaç
- **Sales demo**: Potansiyel müşteriye canlı sistem göstermek için
- **Eğitim**: Yeni kullanıcıların öğrenmesi için
- **Test**: Geliştiriciler için temiz veri

---

## 28. Müşteri Karşılama (Onboarding Wizard)

**Backend:** `apps/api/src/modules/onboarding/`
**Frontend:** `/onboarding/wizard`
**Prisma:** `OnboardingStep`, `OnboardingProgress`

### Endpoint'ler
- `GET /onboarding/steps` — Adım listesi
- `GET /onboarding/progress` — İlerleme
- `POST /onboarding/progress/:stepId` — Adımı tamamla
- `POST /onboarding/skip/:stepId` — Atla

### Adımlar (Genelde)
1. Şirket bilgileri
2. Sektör seçimi
3. İlk müşteri/tedarikçi
4. İlk ürün
5. Kullanıcı davet
6. Şablon seçimi
7. Tamamlandı ✅

> ⚠️ **HR-2 onboarding checklist ile karıştırılmamalı** — bu yeni tenant kurulum, HR-2 yeni personel onboarding'i.

---

## 44. Beyaz Etiket (White Label)

**Backend:** `apps/api/src/modules/white-label/`
**Frontend:** `/white-label`
**Prisma:** `WhiteLabelConfig`, `WhiteLabelDomain`

### Endpoint'ler
- `GET /white-label/config` — Aktif konfigürasyon
- `POST /white-label/config` — Yeni konfig (logo, renk, font)
- `GET /white-label/domains` — Özel domainler
- `POST /white-label/domains` — Domain ekle
- `POST /white-label/domains/:id/verify` → DNS doğrulama

### Özelleştirme Seviyeleri
1. **Logo + Renk** (kolay)
2. **Domain** (orta)
3. **Tam branding** (zor, SSO gerekli)

---

## 45. Üst Düzey Yönetim (Super Admin)

**Backend modülleri:** `apps/api/src/modules/tenants/`, `users/`, `plans/`
**Frontend:** `/super-admin/*`

### Endpoint'ler (Tenants)
- `GET /super-admin/tenants` — Tüm tenantlar
- `GET /super-admin/tenants/:id` — Detay
- `POST /super-admin/tenants` — Yeni oluştur
- `PATCH /super-admin/tenants/:id` — Güncelle
- `POST /super-admin/tenants/:id/suspend` → Askıya al
- `DELETE /super-admin/tenants/:id` → Sil (hard)

### Endpoint'ler (Plans)
- `GET /super-admin/plans` — Planlar
- `POST /super-admin/plans` — Yeni plan
- `PATCH /super-admin/plans/:id` — Güncelle
- `GET /super-admin/plans/:id/usage` — Kullanım istatistikleri

### Endpoint'ler (AI)
- `GET /super-admin/ai/conversations` — Tüm AI sohbetler
- `GET /super-admin/ai/conversations/:id` — Detay
- `GET /super-admin/ai/dashboard` — AI kullanım dashboard
- `GET /super-admin/ai/training-data` — Eğitim verileri
- `POST /super-admin/ai/training-data` — Yeni veri

### Sayfalar
- `/super-admin/dashboard`
- `/super-admin/tenants`, `/super-admin/tenants/:id`
- `/super-admin/users`
- `/super-admin/plans`
- `/super-admin/modules`
- `/super-admin/logs`
- `/super-admin/ai/dashboard`, `/super-admin/ai/conversations`, `/super-admin/ai/conversations/:id`, `/super-admin/ai/training-data`

---

## Sistem Sayfaları (FRONTEND ONLY)

Bu sayfalar backend'de doğrudan modül değil, super-admin/observability endpoint'lerine bağlanır.

### `/dashboard`
- **Amaç**: Ana sayfa özet dashboard'u
- **Veri**: bugünkü satış, tahsilat, stok uyarıları, AI kullanımı, hatırlatıcılar

### `/settings/*`
- `/settings/overview` — Tenant özet
- `/settings/users` — Kullanıcılar ve davetler
- `/settings/roles` — Roller ve izinler
- `/settings/modules` — Modül açma/kapama
- `/settings/subscription` — Plan ve fatura
- `/settings/logs` — Aktivite logları
- `/settings/company-profile` — Şirket bilgileri
- `/settings/sections/company-profile`

### `/api/*` (API Yönetimi)
- `/api/keys` — API anahtarları
- `/api/webhooks` — Webhook konfigürasyonu
- `/api/deliveries` — Webhook teslimat geçmişi
- `/api/usage-logs` — API kullanım istatistikleri

### `/system/*` (Sistem Yönetimi)
- `/system/cache-admin` — Redis cache yönetimi
- `/system/queue-admin` — BullMQ queue
- `/system/search-admin` — Meilisearch index yönetimi
- `/system/realtime-admin` — WebSocket gateway
- `/system/perf-admin` — Performans metrikleri
- `/system/observability` — Sentry/OpenTelemetry

### `/monitoring/*`
- `/monitoring` — Sistem monitoring
- `/monitoring/error-logs` — Hata logları

### `/tasks/*`
- `/tasks` — Yapılacaklar (kullanıcı kişisel)

### `/storage/*`
- `/storage` — Depolama yönetimi

### `/support/*`
- `/support` — Destek merkezi
