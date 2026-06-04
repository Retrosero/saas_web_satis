# AI, Asistan & Gelişmiş Modüller

## 12. Asistan / Bilgi Bankası (Assistant)

**Backend:** `apps/api/src/modules/assistant/`
**Frontend:** `/assistant/articles`, `/assistant/tools`
**Prisma:** `AssistantArticle`, `AssistantCategory`, `AssistantTag`

### Endpoint'ler
- `GET /assistant/articles` — Makaleler
- `POST /assistant/articles` — Yeni makale
- `GET /assistant/articles/:id` — Detay
- `PATCH /assistant/articles/:id` — Güncelle
- `GET /assistant/tools` — AI tool tanımları
- `POST /assistant/tools` — Yeni tool

### Amaç
Sektörel bilgi bankası — AI asistan bunlardan bilgi çekerek cevap verir.

---

## 13. Asistan / Sohbet (Assistant Chat)

**Backend:** `apps/api/src/modules/assistant-chat/` (3 controller)
**Frontend:** `/assistant-chat`, `/assistant-chat/sessions/:id`, `/assistant-chat/llm-config`
**Prisma:** `ChatSession`, `ChatMessage`, `LLMConfig`

### Endpoint'ler
- `GET /assistant-chat/sessions` — Oturumlar
- `POST /assistant-chat/sessions` — Yeni oturum
- `GET /assistant-chat/sessions/:id/messages` — Mesajlar
- `POST /assistant-chat/sessions/:id/messages` — Mesaj gönder
- `GET /assistant-chat/llm-config` — LLM ayarı
- `PATCH /assistant-chat/llm-config` — Model değiştir
- `GET /assistant-chat/stats` — İstatistikler

### LLM Konfigürasyonu
- **Provider**: OpenAI, Anthropic, Azure OpenAI, Local (Ollama)
- **Model**: gpt-4o, claude-3.5-sonnet, llama3 vb.
- **Temperature**, **max_tokens**, **system_prompt**

---

## 30. Performans / Hedef (Performance)

**Backend:** `apps/api/src/modules/performance/`
**Frontend:** `/performance/targets`, `/performance/commissions`
**Prisma:** `Target`, `Commission`

### Endpoint'ler
- `GET /performance/targets` — Hedefler
- `POST /performance/targets` — Yeni hedef
- `GET /performance/commissions` — Primler
- `POST /performance/commissions/calculate` — Hesapla

### Hedef Tipleri
- **Ciro hedefi** (satış temsilcisi bazlı)
- **Adet hedefi** (ürün bazlı)
- **Müşteri kazanımı**
- **Tahsilat oranı**

---

## 31. Müşteri Portalı (Portal)

**Backend:** `apps/api/src/modules/portal/`
**Frontend:** `/portal/*` (müşteri kendi paneli)
**Prisma:** `PortalUser`, `PortalSession`

### Endpoint'ler
- `POST /portal/auth/login` — Müşteri giriş
- `GET /portal/dashboard` — Müşteri özeti
- `GET /portal/orders` — Müşteri siparişleri
- `POST /portal/orders` — Yeni sipariş
- `GET /portal/catalog` — Ürün kataloğu
- `GET /portal/cart` — Sepet
- `GET /portal/profile` — Profil
- `GET /portal/statement` — Ekstre
- `PATCH /portal/profile` — Profil güncelle

### Özellik
- **Tenant-scoped**: her tenant kendi portal temasını görür
- **Multi-language**: i18n desteği

---

## 32. Fiyatlandırma (Pricing)

**Backend:** `apps/api/src/modules/pricing/`
**Frontend:** `/pricing/lists`, `/pricing/groups`, `/pricing/campaigns`
**Prisma:** `PriceList`, `CustomerGroup`, `Campaign`

### Endpoint'ler
- `GET /pricing/lists` — Fiyat listeleri
- `POST /pricing/lists` — Yeni liste
- `GET /pricing/groups` — Müşteri grupları
- `POST /pricing/groups` — Yeni grup
- `GET /pricing/campaigns` — Kampanyalar
- `POST /pricing/campaigns` — Yeni kampanya
- `POST /pricing/campaigns/:id/test` — Test senaryosu

### Kampanya Tipleri
- **Yüzde indirim** (örn. %10)
- **Sabit tutar indirim** (örn. 50₺)
- **Nx al M öde** (örn. 3 al 2 öde)
- **Birlikte al** (bundle)
- **Minimum sepet tutarı** üstü indirim

---

## 33. Ürün Görsel (Product Images)

**Backend:** `apps/api/src/modules/product-images/`
**Frontend:** `/product-images`

### Endpoint'ler
- `GET /product-images/:productId` — Ürün görselleri
- `POST /product-images/:productId` — Görsel yükle (multi)
- `PATCH /product-images/:id` — Sıralama/ana görsel
- `DELETE /product-images/:id` — Sil
- `POST /product-images/variants` — Otomatik varyant (thumb, medium, large)

### Storage
- **Local**: `/uploads/products/`
- **S3-compatible**: AWS, MinIO, DigitalOcean Spaces

---

## 34. Ürün Öneri (Product Recommendations)

**Backend:** `apps/api/src/modules/product-recommendations/`
**Frontend:** satış ekranında otomatik panel

### Endpoint'ler
- `GET /product-recommendations/rules` — Kurallar
- `POST /product-recommendations/rules` — Kural oluştur
- `GET /product-recommendations/for/:productId` — Ürün önerileri
- `POST /product-recommendations/log` — Gösterim/kabul log

### Kural Tipleri
- **Birlikte satılan** (cross-sell, market basket)
- **Benzer ürünler** (kategori bazlı)
- **Upsell** (üst model öner)
- **Stokta az** (aciliyet)

---

## 26. Etiket / Barkod (Labels)

**Backend:** `apps/api/src/modules/labels/`
**Frontend:** `/labels`

### Endpoint'ler
- `GET /labels/templates` — Şablonlar
- `POST /labels/templates` — Yeni şablon
- `POST /labels/print` — Yazdırma (queue)
- `GET /labels/print/:id` — Yazdırma durumu
- `GET /labels/:id/preview` — Önizleme

### Formatlar
- Code128, EAN13, QR Code, DataMatrix
- PDF, ZPL (Zebra), EPL

---

## 41. Şablonlar (Templates)

**Backend:** `apps/api/src/modules/templates/`
**Frontend:** `/templates`, `/templates/defaults`
**Prisma:** `Template`, `TemplateDefaults`

### Endpoint'ler
- `GET /templates` — Şablonlar
- `POST /templates` — Yeni şablon
- `GET /templates/:id/preview` — Önizleme (HTML/PDF)
- `GET /templates/defaults` — Varsayılanlar

### Şablon Tipleri
- **Email** (HTML)
- **SMS** (kısa metin)
- **PDF** (fatura, irsaliye, teklif, sözleşme)
- **Push notification**

---

## 42. Ziyaret (Visits)

**Backend:** `apps/api/src/modules/visits/`
**Frontend:** `/visits/plans`, `/visits/plans/new`, `/visits/plans/:id`
**Prisma:** `VisitPlan`, `Visit`, `VisitTarget`

### Endpoint'ler
- `GET /visits/plans` — Planlar
- `POST /visits/plans` — Yeni plan
- `GET /visits/plans/:id` — Detay (duraklar)
- `PATCH /visits/plans/:id` — Plan güncelle
- `POST /visits/plans/:id/complete` → Tamamla (notlar, sonuç)
- `GET /visits/today` — Bugünkü duraklar

### Plan Akışı
1. Temsilci müşteri listesi seçer
2. Tarih + sıralama
3. Sistem optimal rota önerir (harita entegrasyonu)
4. Sahada mobil/tablet ile durakları tamamlar
