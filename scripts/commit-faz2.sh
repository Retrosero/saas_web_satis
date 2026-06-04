#!/bin/bash
set -e
cd /workspace
git add -A
git status --short | head -20
echo "---"
git commit -m "feat(faz2): muhasebe kütüphanesi + ilk migration + demo tenant seed

FAZ 2 — Veritabanı & Migration kapsamında:

@muhasebe:
- @saas/shared/src/utils/accounting.ts: bakiye/stok/kasa hesaplama
  fonksiyonları (calculateCustomerBalance, calculateStockQuantity,
  calculateCashBalance) + business action uygulama fonksiyonları
  (applySale, applySaleCancel, applyCollection, applyStockTransfer,
  applyStockAdjust) + yardımcılar (validateSaleTotal, snapshot, yuvarlama)
- 46 adet unit test (vitest, 100% geçti) — bakiye simetrisi, iptal/iptali,
  stok yeterlilik, tutar bütünlüğü, yuvarlama kontrolü
- docs/muhasebe-mantigi.md: 12KB detaylı referans dokümanı (event sourcing
  felsefesi, tüm hareket türleri, iptal simetrisi, kurallar, örnekler)

@veritabanı:
- İlk Prisma migration SQL (458 satır): 12 SaaS çekirdek tablo + 3 log tablo
  + tüm enum'lar + index'ler
- migration SQL hazır, kullanıcı 'prisma migrate deploy' ile uygulayacak

@seed:
- Demo tenant (kod: demo, ad: Demo Firma A.Ş.) + 2 örnek kullanıcı
  (admin@demo.local, muhasebe@demo.local) + 2 örnek rol
  (tenant_admin, accountant) + standard plan + aktif abonelik

Doğrulamalar:
- 46/46 vitest test geçti
- shared, api, web build temiz
- Tüm typecheck geçti

Sıradaki: FAZ 3 — Auth & Tenant & Süper Admin Panel" 2>&1 | tail -5
echo "---"
git log --oneline
