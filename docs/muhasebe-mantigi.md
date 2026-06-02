# Muhasebe Mantığı — Proje Referans Dokümanı

> **⚠️ Bu doküman projenin en kritik referansıdır. Tüm backend modülleri (Cari, Stok, Satış, Sipariş, Tahsilat, Kasa, Banka, POS, Depo, Sayım, İade) bu kurallara göre implemente edilmelidir.**

---

## 1. TEMEL FELSEFE: Event Sourcing (Olay Kaynaklama)

Bu projede **bakiyeler, miktarlar ve tutarlar ASLA doğrudan güncellenmez**. Mevcut değer her zaman hareketlerden (movements) hesaplanır.

```
                    ┌────────────────────────────────────────┐
                    │          Mevcut Bakiye / Miktar        │
                    │         (Hesaplanır, SAKLANMAZ)       │
                    └─────────────▲──────────────────────────┘
                                  │  hesapla(movements)
                                  │
   ┌──────────────────────────────┴──────────────────────────────┐
   │                                                             │
   │    customer_movements    stock_movements    cash_movements  │
   │    (borç/alacak)         (giriş/çıkış)      (in/out)        │
   │                                                             │
   │    DEBIT/                IN/OUT/             IN/OUT/         │
   │    CREDIT                TRANSFER/ADJUST     TRANSFER        │
   │                                                             │
   └─────────────────────────────────────────────────────────────┘
                          ▲
                          │  ekle (insert only, soft delete yok)
                          │
                ┌─────────┴──────────┐
                │  Business Action   │
                │  (sale, collection,│
                │   cancel, return)  │
                └────────────────────┘
```

**Neden böyle?**

- **Geçmiş raporlar tutarlı kalır** — eski hareket değişmez.
- **İptal/iptal-iptali mümkün** — her iptal yeni bir ters hareket ekler, orijinal kayıt kalır.
- **Audit trail doğal olarak oluşur** — tüm değişiklikler hareket tablosunda.
- **ERP entegrasyonu kolay** — external sistemden gelen hareket de aynı yapıya yazılır.
- **Hata düzeltme güvenli** — hatalı bir hareket "düzeltilmez", yeni bir ters hareket eklenir.

---

## 2. CARİ (MÜŞTERİ/TEDARİKÇİ) BAKİYESİ

### 2.1 Hareket Türleri

| Tür                 | Yön                              | Anlam                       | Örnek                            |
| ------------------- | -------------------------------- | --------------------------- | -------------------------------- |
| **DEBIT** (Borç)    | Müşterinin bize borcu **ARTAR**  | Satış, vadeli satış, hizmet | Müşteriye 1000 TL'lik mal sattık |
| **CREDIT** (Alacak) | Müşterinin bize borcu **AZALIR** | Tahsilat, iade, iptal       | Müşteriden 500 TL tahsil ettik   |

### 2.2 Bakiye Hesaplama

```typescript
function calculateCustomerBalance(movements): number {
  return movements.reduce((sum, m) => (m.type === 'DEBIT' ? sum + m.amount : sum - m.amount), 0);
}
```

### 2.3 Bakiye Yorumu

| Bakiye   | Anlam                                                |
| -------- | ---------------------------------------------------- |
| `+₺1000` | Müşteri bize 1000 TL borçlu                          |
| `₺0`     | Hesap kapalı                                         |
| `-₺100`  | Biz müşteriye 100 TL borçluyuz (avans, iade fazlası) |

### 2.4 Hareket Örnekleri

| İşlem                         | Hareket    | Açıklama             |
| ----------------------------- | ---------- | -------------------- |
| Müşteriye 1000 TL'lik satış   | DEBIT 1000 | Müşteri borçlandı    |
| Müşteriden 300 TL tahsilat    | CREDIT 300 | Müşteri ödedi        |
| Satıştan 200 TL iade          | CREDIT 200 | Müşteri alacaklandı  |
| 500 TL'lik satışın tam iptali | CREDIT 500 | refType: SALE_CANCEL |

### 2.5 Bütünlük Kuralları

- **Tahsilat tutarı cari borcundan büyük olamaz** (MVP'de avans kavramı yok, ileride eklenebilir).
- **Negatif tahsilat/reddiye** yapılamaz (iptal için ayrı fonksiyon).
- **Para yuvarlama** her zaman `roundMoney(value, 2)` ile 2 ondalık.

---

## 3. STOK MİKTARI

### 3.1 Hareket Türleri

| Tür          | Etki                              | Kullanım                                          |
| ------------ | --------------------------------- | ------------------------------------------------- |
| **IN**       | `+quantity`                       | Mal kabul, alış, üretim çıkışı (yarı mamul→mamul) |
| **OUT**      | `-quantity`                       | Satış çıkışı, fire, sayım eksiği (ADJUST ile)     |
| **TRANSFER** | **yansız** (depo bazında bakılır) | Depo A → Depo B transferi                         |
| **ADJUST**   | **signed** (`+` veya `-`)         | Sayım sonucu düzeltme                             |

### 3.2 Depo Bazında Hesaplama

Stok miktarı **ürün@depo** bazında hesaplanır. Aynı ürün farklı depolarda farklı miktarlarda olabilir.

```typescript
const inventory = {
  'p-1@wh-A': 50,
  'p-1@wh-B': 30,
  'p-2@wh-A': 100,
};
// p-1 toplam: 80, p-2 toplam: 100
```

### 3.3 Transfer Mantığı

Transfer tek bir işlemdir ama **iki hareket** üretir:

- Kaynak depoda: `type: TRANSFER, quantity: -X` (çıkış)
- Hedef depoda: `type: TRANSFER, quantity: +X` (giriş)

Bu sayede:

- `calculateStockQuantity(depoA_movements)` kaynak depoda azalmayı gösterir
- `calculateStockQuantity(depoB_movements)` hedef depoda artışı gösterir
- `refId` aynı olduğu için birbirine bağlı oldukları anlaşılır

### 3.4 Stok Kuralları

- **Satış öncesi yeterlilik kontrolü zorunlu** — `applySale()` içinde `currentStockQuantities` ile kontrol edilir.
- **Stok negatif olamaz** — `applySale` ve `applyStockTransfer` hata fırlatır.
- **Stok düzeltme sıfır olamaz** — sayım sıfır fark çıkarsa düzeltme yapılmaz.

---

## 4. KASA / BANKA BAKİYESİ

### 4.1 Hareket Türleri

| Tür          | Etki                              | Kullanım                                        |
| ------------ | --------------------------------- | ----------------------------------------------- |
| **IN**       | `+amount`                         | Tahsilat, satış tahsilatı, banka havalesi gelen |
| **OUT**      | `-amount`                         | Tediye (ödeme), gider, banka havalesi giden     |
| **TRANSFER** | **yansız** (kasa bazında bakılır) | Kasa A → Kasa B transferi                       |

### 4.2 Kasa Açılış Bakiyesi

Kasa/banka tanımı oluşturulurken `opening_balance` verilir. Bu değer, kasaya ait ilk hareket olarak kabul edilir (gerçek bir hareket satırı olarak değil, hesaplama snapshot'ında baz alınır).

### 4.3 Bakiye Hesaplama

```typescript
balance = opening_balance
        + sum(IN amount)
        - sum(OUT amount)
        // TRANSFER yansız (kaynak: OUT, hedef: IN ayrı kaydedilir)
```

---

## 5. SATIŞ İŞLEMİ

### 5.1 Üretilen Hareketler

Bir satış onaylandığında `applySale()` şu hareketleri üretir:

| #           | Hareket Tablosu      | Tür   | Yön                          | Açıklama                  |
| ----------- | -------------------- | ----- | ---------------------------- | ------------------------- |
| 1           | `customer_movements` | DEBIT | `+grandTotal`                | Müşteri borçlandı         |
| 2-N+1       | `stock_movements`    | OUT   | `-quantity` (her kalem için) | Her ürün için stok çıkışı |
| (opsiyonel) | `cash_movements`     | IN    | `+paidAmount`                | Peşin tahsilat varsa      |

### 5.2 Satış İptali (applySaleCancel)

İptal edildiğinde **orijinal satış kaydı silinmez**, sadece:

- `sales.status = CANCELLED`
- `sales.cancelled_at`, `cancelled_by`, `cancel_reason` set edilir
- Ters hareketler eklenir:

| #     | Hareket Tablosu      | Tür    | Yön                            | Açıklama            |
| ----- | -------------------- | ------ | ------------------------------ | ------------------- |
| 1     | `customer_movements` | CREDIT | `-grandTotal` (orijinal tutar) | Müşteri alacaklandı |
| 2-N+1 | `stock_movements`    | IN     | `+quantity` (her kalem için)   | Stok geri giriş     |

### 5.3 Simetri (FaZ 2 Unit Test ile doğrulandı)

```
Satış sonrası:     müşteri +180 TL, stok -3
İptal sonrası:     müşteri ±0,   stok 0
Sonuç:             BAŞLANGIÇ DURUMUNA DÖNÜŞ ✅
```

---

## 6. TAHSİLAT İŞLEMİ

### 6.1 Üretilen Hareketler

`applyCollection()` şu hareketleri üretir:

| #   | Hareket Tablosu      | Tür    | Yön       | Açıklama                  |
| --- | -------------------- | ------ | --------- | ------------------------- |
| 1   | `customer_movements` | CREDIT | `-amount` | Müşterinin borcu azaldı   |
| 2   | `cash_movements`     | IN     | `+amount` | Kasa/banka bakiyesi arttı |

### 6.2 Kurallar

- Tahsilat tutarı **müşterinin güncel borcundan büyük olamaz** (MVP).
- Negatif tutar reddedilir.
- Tahsilat sonrası cari bakiye 0 ise hesap "kapalı" sayılır.

---

## 7. STOK TRANSFERİ

### 7.1 Üretilen Hareketler

`applyStockTransfer()` 2 hareket üretir:

| #   | Depo            | Tür      | Miktar | Yön         |
| --- | --------------- | -------- | ------ | ----------- |
| 1   | Kaynak (source) | TRANSFER | `-X`   | Stok azalır |
| 2   | Hedef (target)  | TRANSFER | `+X`   | Stok artar  |

### 7.2 Kurallar

- Kaynak ve hedef depo **aynı olamaz**.
- Kaynak depoda **yeterli stok olmalı** (kontrol zorunlu).
- Transfer miktarı **pozitif olmalı**.

---

## 8. STOK DÜZELTME (SAYIM)

### 7.1 Üretilen Hareketler

`applyStockAdjust()` tek bir ADJUST hareketi üretir:

| Tür    | Miktar                      | Yön                                      |
| ------ | --------------------------- | ---------------------------------------- |
| ADJUST | **signed** (`+5` veya `-3`) | Pozitif: fazla stok; Negatif: eksik stok |

### 7.2 Kurallar

- Sıfır düzeltme reddedilir.
- Düzeltme nedeni zorunlu (audit için).
- Sayım sonucu onay sürecinde ise düzeltme henüz oluşturulmaz.

---

## 9. ÇOKLU PARA BİRİMİ (MULTI-CURRENCY)

MVP'de **tek para birimi** (tenant_default_currency, varsayılan TRY) desteklenir.

**İleride (FAZ sonrası):**

- Dövizli cari/stok/kasa hesabı
- Günlük kur ile TRY'ye çevirme
- Kur farkı hareketi (otomatik)

---

## 10. SOFT DELETE VE İPTAL POLİTİKASI

| Varlık                   | Silme Politikası                                                    |
| ------------------------ | ------------------------------------------------------------------- |
| Cari (`customers`)       | Soft delete: `is_deleted=true`. İlişkili hareketler kalır.          |
| Ürün (`products`)        | Soft delete. Stok hareketleri kalır.                                |
| Satış (`sales`)          | İptal: `status=CANCELLED` + `cancelled_at`. Asla `is_deleted=true`. |
| Tahsilat (`collections`) | İptal: `status=CANCELLED`. Ters hareket.                            |
| Cari hareket             | Asla silinmez. Düzeltme = yeni ters hareket.                        |
| Stok hareket             | Asla silinmez. Düzeltme = yeni ters hareket.                        |

---

## 11. AUDIT VE LOG

Tüm `applySale / applySaleCancel / applyCollection / applyStockTransfer / applyStockAdjust` çağrıları:

1. **Audit log** tablosuna `old_values`, `new_values` ile yazılır.
2. **Hassas alanlar maskelenir** (şifre, token, kart bilgisi).
3. **Risk seviyesi** belirlenir:
   - `applySale` → `LOW`
   - `applySaleCancel` → `MEDIUM`
   - `applyCollection > 10000 TL` → `MEDIUM`
   - `applyStockAdjust` → `LOW`
   - `applyStockTransfer` → `LOW`

---

## 12. YAPISAL KURALLAR (Backend İçin)

### 12.1 İşlem Akışı (Her business action)

```
1. Validasyon (Zod, class-validator)
2. Muhasebe utility çağrısı (applySale vs.)
   - Hareketler üretilir
   - Validasyonlar yapılır (stok yeterlilik, tutar bütünlüğü)
3. Prisma transaction başlat
4. Ana kayıt oluştur (sales / collections / ...)
5. Hareketleri ekle (customer_movements, stock_movements, cash_movements)
6. Audit log ekle
7. Transaction commit
8. Hata durumunda rollback + AccountingError
```

### 12.2 Kod Organizasyonu

Her modül (sales, collections, ...) şu yapıda olmalı:

```
modules/sales/
├── sales.controller.ts        # HTTP endpoint
├── sales.service.ts           # İş mantığı (Prisma transaction burada)
├── sales.repository.ts        # DB erişim katmanı
├── dto/
│   ├── create-sale.dto.ts     # İstek validasyonu (Zod)
│   └── sale-response.dto.ts   # Response tipleri
├── movements/                 # Hareket yardımcıları (gerekirse)
└── __tests__/                 # Modül-spesifik testler
    ├── sales.service.spec.ts  # Muhasebe senaryoları
    └── sales.controller.spec.ts # HTTP testleri
```

### 12.3 Test Zorunlulukları

Her modül için:

- ✅ Unit test: muhasebe senaryoları (bakiye, stok, kasa)
- ✅ Integration test: Prisma transaction (test DB ile)
- ✅ E2E test: HTTP endpoint → muhasebe etkisi
- ✅ Tenant izolasyon testi: başka tenant verisine erişemez
- ✅ Yetki testi: modül kapalıyken 403

---

## 13. ÖRNEKLER

### 13.1 Tipik Satış Akışı (Senaryo)

```
Müşteri: Ahmet Ticaret (borç: 0)
Stok:    50 adet "Ürün A" @ Depo-1
Satış:   3 adet × 100 TL = 300 TL + %20 KDV = 360 TL (peşin, nakit)

1. applySale(...) çağrısı:
   - Stok kontrolü: 50 ≥ 3 ✓
   - Toplam: 360 TL ✓
   - Üretilen hareketler:
     • customer_movements: DEBIT 360 (Ahmet borçlandı)
     • stock_movements: OUT 3 (Ürün A @ Depo-1)
     • cash_movements: IN 360 (Kasa-1)

2. Sonuç:
   - Ahmet'in bakiyesi: +360 TL (borçlu)
   - Ürün A @ Depo-1: 47 adet
   - Kasa-1 bakiyesi: +360 TL
```

### 13.2 Tipik Satış İptali

```
Aynı satış, müşteri 2 gün sonra iptal istedi.

1. applySaleCancel(...) çağrısı (orijinal tutar: 360 TL):
   - Üretilen hareketler:
     • customer_movements: CREDIT 360 refType=SALE_CANCEL
     • stock_movements: IN 3 refType=SALE_CANCEL

2. Sonuç:
   - Ahmet'in bakiyesi: 0 TL
   - Ürün A @ Depo-1: 50 adet
   - Kasa-1 bakiyesi: 360 TL (peşin tahsilat iade EDİLMEZ, manuel iade gerekir)
   - sales.status = CANCELLED, cancel_reason = "Müşteri talebi"
```

> ⚠️ **Peşin tahsilat iptali:** Satış iptal edildiğinde kasa hareketi otomatik geri alınmaz. Manuel iade (kasa OUT) gerekir. İleride "tam iade" flow'u eklenecek.

---

## 14. GELECEKTEKİ GENİŞLETME

- **Çoklu para birimi** (TRY + USD + EUR)
- **KDV oranı farklı satırlar**
- **KDV muafiyet / istisna** senaryoları
- **Taksitli satış** (vade farkı, planlı tahsilat)
- **Kur farkı** hareketi
- **Kar/zarar raporu** (ürün maliyeti vs. satış fiyatı)
- **Yıl sonu devir** (devir kaydı, açılış bakiyesi)
- **Banka mutabakat**
- **Çek/senet** takibi
