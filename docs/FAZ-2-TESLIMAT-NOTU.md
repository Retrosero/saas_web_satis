# FAZ 2 — Teslimat Notu

> **Tarih:** 2026-06-01
> **Durum:** ✅ Muhasebe kütüphanesi + test'ler + migration + demo seed hazır
> **Önceki faz:** FAZ 1 iskelet
> **Commit:** `1a61547` (Türkçe mesajlı)

---

## 🎯 Bu Fazda Ne Yapıldı?

### 1. Muhasebe Kütüphanesi (`@saas/shared/src/utils/accounting.ts`)

Projenin **en kritik parçası**. Event sourcing felsefesiyle yazıldı.

**Hesaplama fonksiyonları:**

- `calculateCustomerBalance(movements)` — DEBIT/CREDIT hareketlerden cari bakiye
- `calculateStockQuantity(movements)` — IN/OUT/TRANSFER/ADJUST'tan stok miktarı
- `calculateCashBalance(movements)` — IN/OUT'tan kasa bakiyesi
- `buildInventorySnapshot / buildCustomerBalanceSnapshot / buildCashBalanceSnapshot` — toplu snapshot

**Business action fonksiyonları:**

- `applySale(input)` — satış için 1 cari DEBIT + N stok OUT (peşinse + kasa IN) üretir
- `applySaleCancel(input)` — iptal için 1 cari CREDIT + N stok IN üretir (ters kayıt)
- `applyCollection(input)` — tahsilat için 1 cari CREDIT + 1 kasa IN üretir
- `applyStockTransfer(input)` — depo A→B için 2 hareket (kaynak OUT, hedef IN)
- `applyStockAdjust(input)` — sayım düzeltme için ADJUST (signed) üretir

**Validasyon:**

- `AccountingError` sınıfı (INSUFFICIENT_STOCK, OVERPAYMENT, AMOUNT_MISMATCH, ...)
- Stok yeterlilik kontrolü (applySale öncesi)
- Tutar bütünlüğü kontrolü (grandTotal = subTotal + vat)
- Para/miktar yuvarlama (`roundMoney` 2 ondalık, `roundQuantity` 4 ondalık)
- Tahsilat > cari borç kontrolü

### 2. Unit Test'ler (46 test, 100% geçti)

`packages/shared/src/utils/__tests__/accounting.test.ts`:

- ✅ Bakiye hesaplama doğruluğu (DEBIT/CREDIT)
- ✅ Stok miktarı hesaplama (IN/OUT/ADJUST/TRANSFER)
- ✅ Kasa bakiyesi
- ✅ applySale: cari DEBIT + stok OUT üretimi, peşin tahsilat, OVERPAYMENT
- ✅ applySaleCancel: ters kayıt simetrisi
- ✅ **SİMETRİ KONTROLÜ**: applySale + applySaleCancel = sıfır etki
- ✅ applyCollection: tahsilat > borç reddi, negatif reddi
- ✅ applyStockTransfer: kaynak/hedef ayrımı, aynı depo reddi
- ✅ applyStockAdjust: signed quantity, sıfır reddi
- ✅ validateSaleTotal, computeSaleGrandTotal
- ✅ Snapshot fonksiyonları
- ✅ Property-based: yuvarlama hatası birikmez, çoklu tahsilat = satış

```bash
pnpm --filter @saas/shared test
# ✓ 46 tests passed
```

### 3. Muhasebe Dokümanı (`docs/muhasebe-mantigi.md`, 12 KB)

Proje genelinde referans olacak **tek doküman**:

- Event sourcing felsefesi (neden bakiyeleri tutmuyoruz)
- Tüm hareket türleri ve yönleri
- İptal simetrisi açıklaması
- Çoklu para birimi stratejisi (ileride)
- Soft delete ve iptal politikası
- Audit ve log kuralları
- **Backend kod organizasyonu** (her modülün yapısı)
- **Test zorunlulukları** (5 katmanlı test)
- Somut örnekler (satış, iptal)
- Gelecekteki genişletmeler

### 4. İlk Prisma Migration (`apps/api/prisma/migrations/20260601000000_init/migration.sql`)

- 458 satır SQL
- 12 SaaS çekirdek tablo + 3 log tablosu
- Tüm enum'lar (12 enum)
- Index'ler (PK, unique, FK, soft delete)

**Lokal'de uygulamak için:**

```bash
# 1. Docker ile postgres başlat
docker compose up -d postgres

# 2. .env ayarla
cp .env.example .env

# 3. Migration uygula
pnpm --filter @saas/api exec prisma migrate deploy
# VEYA geliştirme modunda:
pnpm --filter @saas/api prisma:migrate

# 4. Seed çalıştır
pnpm --filter @saas/api prisma:seed
```

### 5. Seed Güçlendirmesi

- Modül kataloğu (25 modül)
- Plan kataloğu (4 plan: starter/standard/professional/enterprise)
- Permission kataloğu (40+ permission)
- Sistem rolleri (super_admin, tenant_admin, accountant)
- **Süper admin**: `admin@sistem.local` / `ChangeMe123!`
- **Demo tenant**: kod `demo`, ad "Demo Firma A.Ş."
- **Demo kullanıcılar**:
  - `admin@demo.local` / `Demo123!` (firma yöneticisi)
  - `muhasebe@demo.local` / `Demo123!` (muhasebeci)
- Standard plan + aktif abonelik + 25 modül tanımlı

> ⚠️ **Operasyonel tablolar** (cari, ürün, depo, kasa, satış, ...) henüz schema'da yok. Bunlar **FAZ 6+** sonrası eklenecek. Bu yüzden seed'in operasyonel veri kısmı şimdilik minimal.

---

## 📊 Doğrulamalar

| Kontrol                             | Sonuç                     |
| ----------------------------------- | ------------------------- |
| `pnpm --filter @saas/shared test`   | ✅ **46/46 geçti**        |
| `pnpm --filter @saas/shared build`  | ✅ Geçti (dist/)          |
| `pnpm --filter @saas/api typecheck` | ✅ Geçti                  |
| `pnpm --filter @saas/api build`     | ✅ Geçti                  |
| `pnpm --filter @saas/web typecheck` | ✅ Geçti                  |
| `pnpm --filter @saas/web build`     | ✅ Geçti (PWA)            |
| `prisma migrate diff`               | ✅ 458 satır SQL üretildi |

---

## 📦 Bundle

- **`saas-faz-2.bundle`** (258 KB, 3 commit, tam history)
- Önceki bundle (`saas-faz-1.bundle`) artık güncel değil — `faz-2` kullan

**Uygulama:**

```bash
# Önceki bundle'ı uyguladıysan:
git fetch /path/to/saas-faz-2.bundle main:faz-2
git checkout main  # veya feat/faz-1-monorepo
git merge --allow-unrelated-histories faz-2
# Çakışma olursa çöz, push et
```

---

## ⚠️ Bilinen Sınırlamalar (FAZ 3'te giderilecek)

1. **Operasyonel tablolar eksik** — cari/ürün/satış modülleri henüz DB tablolarına sahip değil. Bunlar FAZ 6+ (sırasıyla Cari, Stok, Satış) eklenecek. Şu an sadece SaaS yönetim altyapısı çalışıyor.
2. **Login flow test edilmedi** — JWT mantığı yazıldı ama gerçek DB ile uçtan uca test edilmedi. FAZ 3'te auth flow test edilecek.
3. **Migration sadece SQL üretildi** — DB'ye uygulanmadı (sandbox'ta docker olmadığı için). Kullanıcı lokalinde uygulayacak.

---

## 🎯 Sıradaki Faz (FAZ 3 — Auth & Tenant & Süper Admin)

Migration uygulandıktan sonra:

1. **Süper admin login flow** test et
2. **Süper admin dashboard** — toplam firma, aktif abonelik, depolama, son loglar (zaten `super-admin/overview` endpoint'i var)
3. **Süper admin tenant yönetimi** — oluştur, düzenle, pasifleştir, plan atama UI
4. **Kullanıcı yönetimi** — CRUD, rol atama
5. **Firma tarafı login** — `tenantCode` ile giriş
6. **Ajan onayları** — Güvenlik, Modül & Paket, Log & Audit, Test & QA

**Hazır olduğunda "devam" de, FAZ 3'e geçelim.**

---

## 📂 Bundle İçeriği

- `saas-faz-2.bundle` (258 KB) — 3 commit, tüm history
- `docs/FAZ-2-TESLIMAT-NOTU.md` (bu dosya)
- `docs/FAZ-1-TESLIMAT-NOTU.md` (önceki faz)
- `docs/FAZ-0-ANALIZ-VE-MIMARI.md` (mimari)
- `docs/muhasebe-mantigi.md` (12 KB — **projenin en kritik dokümanı**)
- `docs/db/00-tablo-ozet.md` (referans)
- `docs/db/02-schema-diagram.md` (referans)
