# FAZ 44 — Global Arama + Komut Paleti

## Modüller
- **GlobalSearch** — Header'da Ctrl+K ile açılan arama
- **CommandPalette** — Ctrl+/ ile açılan komut listesi

## Backend
### GlobalSearchService
- 7 modülde paralel `Promise.all` arama: Customer, Product, Sale, Order, Collection, Quote, User
- Her modülde max 5 sonuç
- Toplam response: `{ results, byModule, totalCount, durationMs }`
- Search history `GlobalSearchHistory` tablosuna kaydedilir (tenant + user scoped)

### CommandPaletteService
- 12 hazır komut (onModuleInit'te seed)
- Static komutlar:
  - new_sale, new_customer, new_product, new_collection, new_order, new_quote
  - stock_count, weekly_sales, customer_balance, add_user, log_center, ai_assistant
- Her komut: `code, name, description, category, targetRoute, requiredPermission, requiredModule, icon, shortcut`

### Endpoint'ler
- `GET /global-search?q=&limit=5` → multi-modül arama
- `GET /global-search/history?limit=10` → son aramalar
- `GET /command-palette/commands` → tüm komutlar
- `GET /command-palette/commands?category=CREATE&search=...` → filtreli

## Frontend
### GlobalSearchBar (Header component)
- Input + Ctrl+K kısayolu
- Debounced (250ms) arama
- Sonuçlar modül bazlı gruplanır
- Tıklanınca ilgili sayfaya navigate
- Recent searches gösterimi

### CommandPalette (Header component)
- Ctrl+/ kısayolu
- Modal (backdrop click ile kapanır)
- Komutlar kategori bazlı (CREATE, NAVIGATION, ACTION)
- Filtrelenebilir (search input)
- Klavye ile seçilebilir

## Tablolar
- `GlobalSearchHistory` (id, tenantId, userId, query, createdAt)
- `CommandDefinition` (id, code, name, description, category, targetRoute, requiredPermission, requiredModule, icon, shortcut, isActive, sortOrder)

## Permission Key'leri
- `global_search.use`
- `command_palette.use`

## Sık Sorulan Sorular

**S: "Arama hangi tablolarda çalışıyor?"**
C: Customer, Product, Sale, Order, Collection, Quote, User — 7 modül paralel aranır.

**S: "Arama ne kadar hızlı?"**
C: FAZ 56'da Meilisearch entegrasyonu var. Önce Meilisearch kullanılır, bağlı değilse Prisma fallback. Sub-50ms hedef.

**S: "Komut paletinde custom komut eklenebilir mi?"**
C: Evet, CommandDefinition tablosuna INSERT ile eklenebilir. `requiredPermission` alanı ile yetki kontrolü.

**S: "Sonuçlar nasıl sıralanıyor?"**
C: Meilisearch'te relevance score, Prisma'da createdAt DESC. Her modül için 5 sonuç.

**S: "Global arama için arama motoru optimize edildi mi?"**
C: Evet, FAZ 56'da Meilisearch eklendi. Multi-tenant izolasyon (tenantId filter), typo-tolerant.
