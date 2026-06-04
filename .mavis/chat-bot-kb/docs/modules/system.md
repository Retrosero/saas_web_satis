# Sistem, Performans & Operasyon Modülleri

## 11. Onay (Approvals)

**Backend:** `apps/api/src/modules/approvals/`
**Frontend:** `/approvals`, `/approvals/rules`, `/approvals/:id`
**Prisma:** `ApprovalRequest`, `ApprovalRule`, `ApprovalStep`

### Endpoint'ler
- `GET /approvals/requests` — Bekleyen onaylar
- `POST /approvals/requests` — Yeni onay talebi
- `GET /approvals/requests/:id` — Detay
- `POST /approvals/requests/:id/approve` → Onayla
- `POST /approvals/requests/:id/reject` → Reddet
- `GET /approvals/rules` — Kural tanımları
- `POST /approvals/rules` — Kural oluştur

### Kural Motoru
Koşullar (örn. `tutar > 10000 AND kategori = "satın alma"`) → onaylayan kişi(ler).

---

## 14. Denetim (Audit)

**Backend:** `apps/api/src/modules/audit/`
**Frontend:** `/audit`, `/audit/rules`, `/audit/runs`, `/audit/results`, `/audit/schedules`
**Prisma:** `AuditRule`, `AuditRun`, `AuditResult`

### Endpoint'ler
- `GET /audit/rules` — Kurallar
- `POST /audit/rules` — Yeni kural
- `GET /audit/runs` — Çalıştırma geçmişi
- `POST /audit/runs` — Manuel çalıştırma
- `GET /audit/results` — Bulgular
- `GET /audit/schedules` — Zamanlama

### Denetim Türleri
- **Veri tutarlılığı** (cari bakiye vs hareketler)
- **Yetki kontrolü** (rol atamaları)
- **İş kuralları** (örn. negatif stok var mı)
- **Compliance** (KVKK, e-Fatura zorunlulukları)

---

## 15. Toplu İşlem (Bulk Operations)

**Backend:** `apps/api/src/modules/bulk-operations/`
**Frontend:** `/bulk-operations`
**Prisma:** `BulkOperation`, `BulkOperationItem`, `BulkOperationError`

### Endpoint'ler
- `GET /bulk-operations` — Geçmiş
- `POST /bulk-operations/upload` — CSV yükle
- `POST /bulk-operations/:id/execute` — Çalıştır
- `POST /bulk-operations/:id/cancel` — İptal
- `GET /bulk-operations/:id/errors` — Hata raporu
- `GET /bulk-operations/:id/download-template` — Şablon

### Desteklenen Varlıklar
- Customers, Products, Prices, Stock
- Quotes, Sales, Orders

---

## 17. Temizleme (Cleanup)

**Backend:** `apps/api/src/modules/cleanup/`
**Frontend:** `/cleanup`
**Prisma:** `CleanupPolicy`, `CleanupJob`

### Politika Tipleri
- **Soft delete → hard delete** (N gün sonra)
- **Log rotasyonu** (eski log'ları arşivle)
- **Geçici dosya temizliği** (upload edilen ama kullanılmayan)
- **Eski bildirim temizliği**

---

## 19. Komut Paleti (Command Palette)

**Backend:** `apps/api/src/modules/command-palette/`
**Frontend:** Global klavye kısayolu (`Cmd+K` / `Ctrl+K`)

### Endpoint'ler
- `GET /command-palette/commands` — Tüm komutlar
- `GET /command-palette/search?q=...` — Arama
- `POST /command-palette/usage` — Kullanım logla

---

## 20. Müşteri Risk (Customer Risk)

**Backend:** `apps/api/src/modules/customer-risk/`
**Frontend:** `/customer-risk`, `/customer-risk/config`
**Prisma:** `RiskScore`, `RiskRule`

### Risk Hesaplama
**Skor = Ödeme gecikmesi (40%) + Bakiye/yetki (30%) + Sipariş sıklığı (20%) + Dış veri (10%)**

### Endpoint'ler
- `GET /customer-risk/scores` — Risk skorları (sıralı)
- `GET /customer-risk/scores/:customerId` — Müşteri detay
- `GET /customer-risk/rules` — Kural konfigürasyonu
- `POST /customer-risk/calculate` — Yeniden hesapla
- `POST /customer-risk/limits` — Limit tanımla

---

## 21. Müşteri Segment (Customer Segments)

**Backend:** `apps/api/src/modules/customer-segments/`
**Frontend:** `/customer-segments`
**Prisma:** `CustomerSegment`, `SegmentMember`

### Segment Tipleri
- **Manuel** — kullanıcı seçer
- **Otomatik** — kural bazlı (örn. "son 30 günde 5+ sipariş veren")

### Endpoint'ler
- `GET /customer-segments` — Liste
- `POST /customer-segments` — Yeni segment
- `GET /customer-segments/:id/members` — Üyeler
- `POST /customer-segments/:id/refresh` — Otomatik segmenti güncelle

---

## 23. Global Arama (Global Search)

**Backend:** `apps/api/src/modules/global-search/`
**Frontend:** Header arama component

### Endpoint'ler
- `GET /global-search?q=...` — Çapraz arama
- `GET /global-search/recent` — Son aramalar
- `GET /global-search/popular` — Popüler

### Arama Motoru
- **Prisma ILIKE** (küçük veri)
- **Meilisearch** (FAZ 53+ büyük veri, fuzzy match)

---

## 24. İçe Aktarım (Import)

**Backend:** `apps/api/src/modules/import/`
**Frontend:** `/import`, `/import/wizard`, `/import/history`
**Prisma:** `ImportJob`, `ImportRow`, `ImportError`

### Akış
1. Şablon indir (CSV/Excel)
2. Veri doldur, yükle
3. Önizleme + mapping
4. Validate (hata varsa düzelt)
5. Çalıştır (background job)

### Endpoint'ler
- `POST /import/upload` — Dosya yükle
- `POST /import/:id/validate` — Doğrula
- `POST /import/:id/execute` — Çalıştır
- `GET /import/history` — Geçmiş
- `GET /import/:id/errors` — Hatalar

---

## 25. Sektör Şablonları (Industry Templates)

**Backend:** `apps/api/src/modules/industry-templates/`
**Frontend:** `/industry-templates`

### Endpoint'ler
- `GET /industry-templates` — Liste (sector bazlı)
- `GET /industry-templates/:id` — Şablon detay
- `POST /industry-templates/:id/apply` — Tenant'a uygula

### Sektörler
- Perakende, Toptan, İnşaat, Üretim, Hizmet, Restoran, E-ticaret

---

## 27. Bildirimler (Notifications)

**Backend:** `apps/api/src/modules/notifications/`
**Frontend:** `/notifications`, `/notifications/center`, `/notifications/rules`, `/notifications/channels`, `/notifications/logs`
**Prisma:** `NotificationRule`, `NotificationChannel`, `NotificationLog`

### Endpoint'ler
- `GET /notifications` — Kullanıcı bildirimleri
- `POST /notifications/:id/read` — Okundu işaretle
- `GET /notifications/rules` — Kurallar
- `POST /notifications/rules` — Yeni kural
- `GET /notifications/channels` — Kanallar
- `POST /notifications/channels` — Kanal ekle (email, sms, push, webhook)
- `GET /notifications/logs` — Gönderim logları

### Kural Yapısı
**Event** (örn. `sale.completed`) → **Koşul** (örn. `tutar > 5000`) → **Kanal** (örn. email) → **Alıcı** (örn. yönetici)
