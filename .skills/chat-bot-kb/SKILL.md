---
name: chat-bot-kb
description: Geliştirilen her modül/sayfa için chat bot bilgi tabanını otomatik günceller. "Bu müşteriye ne kadarlık satış yaptık?", "Stokta ne var?", "Bu hafta ciro?" gibi kullanıcı sorularını cevaplayacak bot için sorgulanabilir bilgi haritası oluşturur. Load when: yeni modül/sayfa eklendiğinde, yeni API endpoint tanımlandığında, yeni tablo/migration oluşturulduğında, FAZ tamamlandığında, kullanıcı "bilgi tabanı", "knowledge base", "chat bot", "bot" derse.
---

# Chat Bot Bilgi Tabanı Skill'i

## Amaç
Türkçe SaaS ERP projesinde geliştirilen her modül/sayfa için **sorgulanabilir bilgi haritası** oluşturmak. Gelecekteki chat bot bu haritayı kullanarak kullanıcı sorularını doğrudan API/DB sorgusuna çevirebilecek.

## Tetiklendiğinde Yapılacaklar

### 1. Modül/sayfayı analiz et
- Hangi Prisma modeli kullanıyor?
- Hangi API endpointleri var?
- Hangi enum'lar var?
- Hangi sayfalar bu veriyi gösteriyor?
- Hangi hesaplamalar yapılıyor (event-sourced vs snapshot)?

### 2. Sorgulanabilir bilgi noktalarını çıkar
- **Veri noktaları**: Müşteri bakiyesi, ürün stoğu, kasa bakiyesi, satış toplamı, tahsilat toplamı, ...
- **Filtreler**: Müşteri, ürün, tarih aralığı, durum, ...
- **Metrikler**: Toplam, ortalama, max, min, trend
- **Gruplamalar**: Müşteri bazında, ürün bazında, ay bazında, ...

### 3. Örnek sorular üret
- "X müşterisinin bakiyesi ne?"
- "Bu hafta ne kadar satış yaptık?"
- "Stokta hangi ürünler tükeniyor?"
- "En çok borçlu cariler?"
- "Müşteri X'in son 30 gündeki alımları?"

### 4. Veri kaynağını eşle
Her soru için:
- **Endpoint**: `GET /api/v1/sales?customerId=X&from=...`
- **Tablo**: `sales`, `customer_movements`, `stock_movements`, ...
- **Hesaplama**: SUM, COUNT, GROUP BY, event-sourced
- **Parametreler**: customerId, from, to, type, status

### 5. Yanıt şablonu oluştur
Türkçe doğal dil cevabı:
- "Müşteri X'in cari bakiyesi: 12.450 TL (borçlu). Son 30 günde 3 satış toplam 45.200 TL."

### 6. Dokümante et
Tüm çıkarımları `docs/CHAT-BOT-KNOWLEDGE.md` dosyasına **yapılandırılmış format** ile yaz.

## Bilgi Tabanı Formatı (her modül için)

```markdown
## Modül: {Modül Adı}
**Prisma model:** Customer, CustomerMovement, ...
**API base:** /customers, /reports/top-debtors
**Frontend sayfaları:** /customers, /customers/:id

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Tip | Kaynak | Hesaplama |
|---|------|-----|--------|-----------|
| 1 | Müşteri bakiyesi | number | CustomerMovement | SUM(DEBIT) - SUM(CREDIT) |
| 2 | Son 30 gün alış | number | Sale | WHERE customerId=X AND saleDate >= 30d |

### Örnek Sorular → Cevap
| Soru | Endpoint/Query | Yanıt Şablonu |
|------|----------------|---------------|
| "X'in bakiyesi ne?" | /customers/:id, /reports/dashboard | "X'in cari bakiyesi: 12.450 TL (borçlu)" |
| "En borçlular?" | /reports/top-debtors | "Top 5 borçlu: A (45K), B (32K), ..." |
```

## Kullanım

1. **Yeni modül geliştirirken**: Skill'i çağır, modül bittikten sonra knowledge base'e ekle
2. **Mevcut modül sorulduğunda**: İlgili modülün knowledge base bölümünü oku, soruyu cevapla
3. **API geliştirirken**: Yeni endpoint'leri knowledge base'e otomatik ekle

## Örnek Çıktı (gerçek FAZ 6 müşteri modülü)

`docs/CHAT-BOT-KNOWLEDGE.md` dosyasındaki "Cari Modülü" bölümüne bak.

## Önemli Notlar

- **Event-sourcing korunmalı**: Bakiyeler asla `customer.balance` alanından değil, hareketlerden hesaplanmalı
- **Multi-tenant**: Tüm sorgular `tenant_id` filtresi ile
- **Türkçe yanıtlar**: Bot cevapları Türkçe, para birimi "TL" veya "₺"
- **Veri yoksa**: "Henüz X verisi yok" gibi samimi cevaplar
- **Eksik bilgi**: "Müşteri ID'si gerekli" gibi net yönlendirme

## Hata Yönetimi

Kullanıcı sorusu anlaşılmadığında:
- Açık ve net sor: "Hangi müşteriyi sormak istiyorsunuz?"
- Olası soruları listele: "Belki şunlardan birini mi arıyorsunuz: cari bakiye, son satışlar, tahsilat geçmişi?"

Yanlış yorumlamada:
- Cevabı doğrula: "Müşteri X'in cari bakiyesi 12.450 TL olarak anladım, doğru mu?"

## API Bot Endpoint'i (gelecek için)

Tasarlanması önerilen ortak endpoint:
```
POST /bot/query
{
  "question": "müşteri X'in bakiyesi ne?",
  "context": { "customerId": "..." }
}
→ {
  "answer": "Müşteri X'in bakiyesi 12.450 TL (borçlu).",
  "data": { ... },
  "source": "customer_movements"
}
```

Şimdilik bu yok, knowledge base'den seedlenebilir.
