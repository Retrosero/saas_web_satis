# Chat-Bot Bilgi Bankası (Knowledge Base)

Bu klasör, AI chat botun (Mavis) proje hakkında doğru ve detaylı cevap verebilmesi için yapılandırılmış bilgi bankasıdır.

## İçerik Haritası

### 📁 docs/architecture/
- `tech-stack.md` — Kullanılan teknolojiler (Frontend, Backend, DB, Cache, Queue)
- `multi-tenant.md` — Multi-tenant mimari detayları
- `event-sourcing.md` — Bakiye hesaplama, hareket tabloları
- `soft-delete.md` — Silme stratejisi, audit
- `permissions.md` — Permission sistemi, modül/tenant kontrolü

### 📁 docs/modules/ (Tüm 40+ modül özeti)
- `hr.md` — **İK modülü (HR-1 personel + HR-2 checklist)**, HR-3..HR-7 yol haritası
- `finance.md` — Cari, kasa, tahsilat, banka (4 modül)
- `sales.md` — Stok, depo, satış, sipariş, teklif, iade (6 modül)
- `system.md` — Onay, denetim, toplu işlem, temizleme, komut paleti, müşteri risk, segment, global arama, içe aktarım, sektör şablonu, bildirim (11 modül)
- `ai.md` — Asistan, AI sohbet, performans, müşteri portalı, fiyatlandırma, ürün görsel/öneri, etiket, şablonlar, ziyaret (9 modül)
- `admin.md` — Demo firma, onboarding wizard, beyaz etiket, super admin, dashboard, settings, api, system, monitoring (8 modül)

### 📁 docs/faiz-44-52/ (10 Yeni Modül — Kullanıcı Deneyimi & Operasyonel Hız)
- `00-overview.md` — Genel bakış
- `01-global-search.md` — Global arama + Komut paleti
- `02-quotes.md` — Teklif modülü
- `03-customer-risk.md` — Müşteri risk sistemi
- `04-product-recommendations.md` — Ürün öneri
- `05-bulk-operations.md` — Toplu işlemler
- `06-labels.md` — Etiket/barkod
- `07-product-images.md` — Ürün görsel
- `08-customer-segments.md` — Müşteri segment
- `09-cleanup.md` — Arşivleme

### 📁 docs/faiz-53-61/ (9 İyileştirme — Performans & Güvenilirlik)
- `00-overview.md` — Genel bakış
- `01-redis-cache.md` — Redis cache katmanı
- `02-bullmq-queue.md` — BullMQ queue + workers
- `03-db-indexes.md` — DB index optimizasyonu
- `04-meilisearch.md` — Meilisearch full-text search
- `05-websocket.md` — WebSocket gateway
- `06-rate-limit-idempotency.md` — Rate limiting + idempotency
- `07-sentry-otel.md` — Sentry + OpenTelemetry
- `08-testing.md` — Test stratejisi (Jest + Vitest + Playwright)

### 📁 docs/integrations/
- `third-party-services.md` — Redis, Meilisearch, Sentry, OpenTelemetry
- `docker-services.md` — Docker compose servisleri

### 📁 docs/common-questions/
- `troubleshooting.md` — Sık karşılaşılan hatalar
- `code-patterns.md` — En çok kullanılan kod pattern'leri
- `best-practices.md` — Best practice'ler

## Kullanım

Chat bot bu klasörü okuyarak sorulara cevap verir. Yeni modül eklenince ilgili `docs/faiz-X-Y/` altına detaylı dosya eklenir.

**Cevaplanabilecek soru tipleri:**
- "FAZ 44-52'de hangi modüller var?"
- "Redis cache nasıl çalışıyor?"
- "Customer risk nasıl hesaplanıyor?"
- "Toplu işlem rollback yapabilir mi?"
- "Arama Meilisearch mi Prisma mı kullanıyor?"
- "Rate limit değerleri plan bazlı ne?"
- "Test komutları neler?"
- "Yeni modül eklemek için hangi adımlar var?"
