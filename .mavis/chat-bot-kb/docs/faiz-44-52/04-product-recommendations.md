# FAZ 47 — Ürün Öneri Motoru

## Amaç
Müşteriye satış sırasında otomatik ürün önerisi sun. Kural tabanlı, AI değil (ilk aşamada).

## 3 Öneri Tipi
1. **PREVIOUSLY_PURCHASED** — Bu müşteri son 6 ayda 2+ kez aldı
2. **TOP_SELLING** — Son 30 günde en çok satılan ürünler
3. **OVERSTOCK** — 30 gündür satılmayan ürünler (stok fazlası)

## Backend

### ProductRecommendationsService
- `listForCustomer(tenantId, customerId, limit=8)` — müşteriye özel öneri listesi
- `listRules(tenantId)` — kural listesi
- `createRule(tenantId, input, userId)` — yeni kural
- `deleteRule(tenantId, id)` — kural sil

### Endpoint'ler
- `GET /product-recommendations/for-customer/:customerId` → öneri listesi
- `GET /product-recommendations/rules` → kural listesi
- `POST /product-recommendations/rules` → yeni kural
- `DELETE /product-recommendations/rules/:id` → kural sil

## Recommendation Algoritması

### Previously Purchased
```ts
const since = new Date(); since.setMonth(since.getMonth() - 6);
const items = await saleItem.findMany({
  where: { tenantId, sale: { customerId, saleDate: { gte: since } } },
  include: { product: true }
});
const counts = new Map<string, { count: number; product: any }>();
for (const it of items) {
  const c = counts.get(it.productId) ?? { count: 0, product: it.product };
  c.count += Number(it.quantity);
  counts.set(it.productId, c);
}
return [...counts.entries()].filter(([_, v]) => v.count >= 2);
```

### Top Selling
```ts
const since30 = new Date(); since30.setDate(since30.getDate() - 30);
const topItems = await saleItem.findMany({
  where: { tenantId, sale: { saleDate: { gte: since30 } } }
});
// count, top 3 product
```

### Overstock (basit)
- 30 günde hiç satılmayanları rastgele örnekle (Math.random)

## Tablolar
- `ProductRecommendationRule` (id, tenantId, name, type, conditions, priority, isActive, createdById)
- `ProductRecommendationLog` (id, tenantId, customerId, productId, type, userId, shownAt, clickedAt, purchasedAt)

## Frontend
- `ProductRecommendationPanel` — satış ekranına entegre (müşteri seçilince sağda açılır)
- Müşteri seçildiğinde otomatik öneri yükleme
- "Sepete ekle" butonu ile doğrudan satışa ekleme

## Permission Key'leri
- `product_recommendations.view`
- `product_recommendations.manage`

## Confidence Score
- PREVIOUSLY_PURCHASED: `Math.min(1, count / 5)` — max 5 alım = 100%
- TOP_SELLING: sabit 0.7
- OVERSTOCK: sabit 0.5

## Sık Sorulan Sorular

**S: "Öneri AI mi kullanıyor?"**
C: Hayır, kural tabanlı. AI entegrasyonu sonraki aşamada (collaborative filtering, vb.).

**S: "Confidence score nedir?"**
C: Önerinin güvenilirliği. 0-1 arası. UI'da yüzde olarak gösterilir.

**S: "Log tutuluyor mu?"**
C: Evet, ProductRecommendationLog tablosunda. Hangi öneri gösterildi, tıklandı, satın alındı izlenir.

**S: "Satış panelinde nasıl görünür?"**
C: Müşteri seçilince otomatik açılır, ürün adı + sebep + güven + fiyat + "sepete ekle" butonu.

**S: "Yeni öneri tipi eklenebilir mi?"**
C: Evet, RecommendationType enum'una yeni değer + ProductRecommendationRule tablosuna kural.
