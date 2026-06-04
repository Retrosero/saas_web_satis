# FAZ 51 — Müşteri Segmentleri

## Amaç
Müşterileri manuel veya otomatik kurallarla grupla. Pazarlama, raporlama, kampanya.

## 2 Segment Tipi
- **MANUAL** — Kullanıcı elle ekler (customerIds)
- **AUTOMATIC** — Kural motoru, periyodik refresh

## Kural Motoru
- Şu an: balance karşılaştırma (>, <, >=, <=, =)
- İleride: son sipariş günü, sipariş sayısı, şehir, vb.

```ts
{
  field: 'balance',
  operator: '>=',  // '>' | '<' | '>=' | '<=' | '='
  value: 10000
}
```

## Otomatik Refresh
- Manuel: "Yenile" butonu
- Gece cron (TODO): her gece 03:00'te tüm otomatik segmentleri refresh

## Backend

### CustomerSegmentsService
- `list(tenantId)` → tüm segmentler
- `get(tenantId, id)` → detay + üyeler
- `create(tenantId, input, userId)` → yeni
- `update(tenantId, id, input)` → güncelle
- `delete(tenantId, id)` → soft delete
- `addMember(tenantId, segmentId, customerId)` → üye ekle
- `removeMember(tenantId, segmentId, customerId)` → üye çıkar
- `refreshSegment(tenantId, id)` → otomatik segment hesapla

### Endpoint'ler
- `GET /customer-segments` → liste
- `GET /customer-segments/:id` → detay
- `POST /customer-segments` → oluştur
- `PUT /customer-segments/:id` → güncelle
- `DELETE /customer-segments/:id` → sil
- `POST /customer-segments/:id/members` → üye ekle
- `DELETE /customer-segments/:id/members/:customerId` → üye çıkar
- `POST /customer-segments/:id/refresh` → otomatik refresh

## Refresh Algoritması (balance kuralı)
```ts
const customers = await prisma.customer.findMany({
  where: { tenantId, isDeleted: false },
  include: { movements: true }
});
for (const c of customers) {
  const balance = c.movements.reduce((s, m) => s + Number(m.amount ?? 0), 0);
  let match = true;
  for (const rule of segment.rules) {
    if (rule.field === 'balance') {
      if (rule.operator === '>=' && balance < Number(rule.value)) match = false;
      if (rule.operator === '<=' && balance > Number(rule.value)) match = false;
      if (rule.operator === '>' && balance <= Number(rule.value)) match = false;
      if (rule.operator === '<' && balance >= Number(rule.value)) match = false;
      if (rule.operator === '=' && balance !== Number(rule.value)) match = false;
    }
    if (!match) break;
  }
  if (match) matched.push(c.id);
}
// Üyeleri güncelle
```

## Tablolar
- `CustomerSegment` (id, tenantId, name, description, type, rules JSON, color, icon, memberCount, lastRefreshAt, createdById)
- `CustomerSegmentRule` (id, segmentId, field, operator, value, conjunction 'AND'|'OR', sortOrder)
- `CustomerSegmentMember` (id, segmentId, customerId, addedBy 'MANUAL'|'AUTO_REFRESH', addedAt)

## Frontend
- `SegmentsPage` — liste, yeni segment modal, refresh/delete butonları

## Permission Key'leri
- `customer_segments.view`, `.create`, `.update`, `.delete`

## Sık Sorulan Sorular

**S: "Manuel ve otomatik segment farkı ne?"**
C: Manuel: kullanıcı üye ekler/çıkarır. Otomatik: kural motoru, refresh edildiğinde üyeler yeniden hesaplanır.

**S: "Refresh ne sıklıkta?"**
C: Şu an sadece manuel. Cron job TODO (gece 03:00 planlanıyor).

**S: "Kural karmaşık olabilir mi?"**
C: Şu an sadece balance. İleride AND/OR conjunction + çoklu kural (FAZ 52+).

**S: "Üye sayısı nerede tutuluyor?"**
C: `memberCount` alanı. Refresh/add/remove sonrası güncellenir (denormalize).

**S: "Segment silinirse üyeler ne olur?"**
C: Soft delete (isDeleted). CustomerSegmentMember kayıtları kalır, geri alma mümkün.

**S: "Kampanya ile entegre edilebilir mi?"**
C: Evet, FAZ 29 (Campaign) CustomerSegmentId ile bağlanabilir. Kapsam olarak bu roadmap'te.
