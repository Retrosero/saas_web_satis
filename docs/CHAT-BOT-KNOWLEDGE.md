# Chat Bot Bilgi Tabanı

> 🤖 **Amaç:** Kullanıcı sorularını API/DB sorgusuna çevirmek için sorgulanabilir bilgi haritası.
> Her modül kendi bölümünde: veri noktaları, örnek sorular, kaynak endpoint'ler, yanıt şablonları.
> Bu doküman `chat-bot-kb` skill'i tarafından güncellenir.

---

## 🗂️ Modül İndeksi

| # | Modül | Tablolar | API Base | Sayfa |
|---|-------|----------|----------|-------|
| 1 | [Cari (Müşteri/Tedarikçi)](#1-cari-modülü) | customers, customer_movements, payment_methods | `/customers`, `/reports/top-debtors` | `/customers/*` |
| 2 | [Stok/Ürün](#2-stok-modülü) | products, product_barcodes, product_prices, units, brands, product_categories | `/products`, `/reports/stock-alerts` | `/products/*` |
| 3 | [Depo](#3-depo-modülü) | warehouses, stock_movements | `/warehouses`, `/stock/movements` | `/warehouses`, `/stock/movements` |
| 4 | [Satış](#4-satış-modülü) | sales, sale_items | `/sales`, `/reports/sales-trend` | `/sales/*` |
| 5 | [Sipariş](#5-sipariş-modülü) | orders, order_items | `/orders` | `/orders/*` |
| 6 | [Tahsilat](#6-tahsilat-modülü) | collections | `/collections`, `/reports/collections-trend` | `/collections/*` |
| 7 | [Kasa/Banka](#7-kasabanka-modülü) | cash_accounts, cash_movements | `/cash/accounts`, `/cash/movements` | `/cash/*` |
| 8 | [Raporlar/Dashboard](#8-raporlar) | (tüm tablolardan aggregate) | `/reports/*` | `/reports` |
| 9 | [İK / Personel (HR-1)](#9-ik-personel-hr-1) | hr_employees, hr_employee_employment_info, hr_employee_documents | `/hr/employees` | `/hr/employees/*` |
| 10 | [İK / Checklist (HR-2)](#10-ik-checklist-hr-2) | hr_onboarding_checklist, hr_offboarding_checklist | `/hr/checklists/*` | `/hr/checklists/*` |
| 11 | [İK / İzin Yönetimi (HR-3)](#11-ik-izin-yönetimi-hr-3) | hr_leave_types, hr_leave_balances, hr_leave_requests | `/hr/leave/*` | `/hr/leave/*` |
| 12 | [İK / Bordro Hazırlık (HR-4)](#12-ik-bordro-hazırlık-hr-4) | hr_payroll_periods, hr_payroll_records, hr_payroll_supplements | `/hr/payroll/*` | `/hr/payroll/*` |
| 13 | [İK / Parametre, Devamsızlık, Kariyer, Eğitim, Performans (HR-5/6/7)](#13-ik-bordro-parametreleri-devamsızlık-kariyer-eğitim-performans-hr-567) | hr_payroll_params, hr_absence_records, hr_disciplinary_cases, hr_career_records, hr_trainings, hr_performance_reviews | `/hr/payroll-params`, `/hr/absences`, `/hr/disciplinary`, `/hr/career`, `/hr/trainings`, `/hr/performance` | `/hr/payroll-params`, `/hr/hr567` |

---

## 1. Cari Modülü

**Prisma modelleri:** `Customer`, `CustomerMovement`, `PaymentMethod`
**API base:** `/customers`, `/customers/:id`, `/customers/:id/statement`, `/reports/top-debtors`
**Frontend:** `/customers`, `/customers/new`, `/customers/:id`
**Event-sourcing:** ✅ Bakiye = `SUM(DEBIT) - SUM(CREDIT)` (tüm hareketlerden)

### Sorgulanabilir Bilgi Noktaları

| # | Veri | Tip | Hesaplama |
|---|------|-----|-----------|
| 1.1 | Müşteri bakiyesi | number | `SUM(DEBIT) - SUM(CREDIT)` per customer |
| 1.2 | Borçlu/Alacaklı durumu | enum | bakiye > 0 → borçlu, < 0 → alacaklı |
| 1.3 | Toplam borçlu alacak | number | `SUM(alacaklar)` tüm aktif müşteriler |
| 1.4 | Hareket sayısı | number | COUNT(customer_movements) per customer |
| 1.5 | Açık hesap (borç) | number | CustomerMovement tip=DEBIT eksi CREDIT, pozitif olanlar |
| 1.6 | Son hareket tarihi | date | MAX(movementDate) per customer |
| 1.7 | Tahsilat geçmişi | array | CustomerMovement WHERE refType='COLLECTION' |
| 1.8 | Dönemsel ciro (satış) | number | SUM(sales.grandTotal) WHERE customerId=X AND dateRange |

### Örnek Sorular → Cevap

| # | Kullanıcı Sorusu | Sorgu | Yanıt Şablonu |
|---|------------------|-------|---------------|
| Q1.1 | "ABC Ltd'nin bakiyesi ne?" | `CustomerMovement` aggregate | "ABC Ltd'nin cari bakiyesi **12.450 ₺ (borçlu)**. Son hareket: 02.06.2026." |
| Q1.2 | "Müşteri X'in son 30 günde ne kadar alış yaptı?" | `Sale` WHERE customerId=X AND saleDate >= 30d | "Müşteri X son 30 günde **5 satış / 45.200 ₺** toplam yaptı." |
| Q1.3 | "En çok borçlu 5 müşteri kimler?" | `/reports/top-debtors?limit=5` | "Top 5 borçlu: ABC (45K), DEF (32K), ..." |
| Q1.4 | "ABC Ltd'nin açık faturası var mı?" | `Sale` WHERE customerId=X AND paidAmount < grandTotal | "ABC Ltd'nin **3 açık faturası** toplam **12.450 ₺**." |
| Q1.5 | "ABC Ltd'nin tahsilat geçmişi nasıl?" | `Collection` WHERE customerId=X | "Son tahsilatlar: 01.06 (5K), 15.05 (3.2K)..." |
| Q1.6 | "Toplam alacaklarımız ne kadar?" | `/reports/dashboard` | "Toplam alacağımız **125.450 ₺**, borçlarımız **45.200 ₺**, net pozisyon **+80.250 ₺**." |
| Q1.7 | "Bu ay yeni müşteri eklenmiş mi?" | `Customer` WHERE createdAt >= 1.month | "Bu ay **3 yeni müşteri** eklendi." |
| Q1.8 | "ABC Ltd blokeli mi?" | Customer.status = BLOCKED | "ABC Ltd blokeli. Yeni satış yapılamaz." |
| Q1.9 | "ABC Ltd'nin hareketlerini göster" | `/customers/:id/statement?from=...&to=...` | (ekstre tablosu) |
| Q1.10 | "Tedarikçi X'e ne kadar borçluyuz?" | Customer.type=SUPPLIER, balance < 0 | "X tedarikçisine **8.500 ₺** borçluyuz." |

---

## 2. Stok/Ürün Modülü

**Prisma modelleri:** `Product`, `ProductBarcode`, `ProductPrice`, `Unit`, `Brand`, `ProductCategory`
**API base:** `/products`, `/products/:id`, `/reports/stock-alerts`
**Frontend:** `/products`, `/products/new`, `/products/:id`
**Event-sourcing:** ✅ Stok = `SUM(IN) - SUM(OUT) + SUM(ADJUST)` (tüm hareketlerden)

### Sorgulanabilir Bilgi Noktaları

| # | Veri | Tip | Hesaplama |
|---|------|-----|-----------|
| 2.1 | Ürün anlık stoğu | number | `SUM(IN) - SUM(OUT) + SUM(ADJUST)` per product per warehouse |
| 2.2 | Toplam stok (tüm depolar) | number | Tüm warehouse'lar toplamı |
| 2.3 | Min/Max stok uyarıları | array | `totalStock < minStock` olan ürünler |
| 2.4 | Birim fiyat (KDV hariç/dahil) | number | Product tablosu + ProductPrice tablosu |
| 2.5 | KDV oranı | number | Product.vatRate |
| 2.6 | Barkod | string | ProductBarcode.barcode |
| 2.7 | Stok değeri (maliyet) | number | totalStock × unitCost (yaklaşık) |
| 2.8 | Aktif/pasif ürün sayısı | number | COUNT(Product) WHERE status |
| 2.9 | Hareket sayısı (30 gün) | number | COUNT(StockMovement) WHERE productId=X AND date >= 30d |

### Örnek Sorular → Cevap

| # | Kullanıcı Sorusu | Sorgu | Yanıt Şablonu |
|---|------------------|-------|---------------|
| Q2.1 | "Ürün X'in stoğu ne?" | `StockMovement` aggregate per warehouse | "Ürün X: Ana depo 45 adet, Şube 12 adet, **toplam 57 adet**." |
| Q2.2 | "Hangi ürünler tükeniyor?" | `/reports/stock-alerts` | "5 ürün minimum altında: A (3/10), B (0/5), ..." |
| Q2.3 | "Ürün X'in fiyatı ne?" | Product.unitPrice, vatRate | "Ürün X: 100 ₺ (KDV hariç), 118 ₺ (KDV dahil, %18)." |
| Q2.4 | "Ürün X'i kim tedarik ediyor?" | (FAZ'da yok) | "Tedarikçi modülü henüz yok. FAZ 16+ planlanıyor." |
| Q2.5 | "Depo Y'de hangi ürünler var?" | StockMovement aggregate per product WHERE warehouse=Y | (tablo) |
| Q2.6 | "Ürün X'in son 30 gündeki satışı?" | SaleItem aggregate | "Ürün X son 30 günde **23 satış / 124 adet**." |
| Q2.7 | "Stoğu sıfır olan ürünler?" | StockMovement aggregate WHERE totalStock = 0 | "3 ürünün stoğu sıfır: A, B, C." |
| Q2.8 | "Toplam stok değeri ne?" | SUM(stock × unitCost) | "Toplam stok değeri yaklaşık **456.000 ₺**." |
| Q2.9 | "Ürün X barkod 8691234500011 mi?" | ProductBarcode WHERE barcode=... | "Evet, bu barkod Ürün X'e ait." |
| Q2.10 | "Aktif olmayan ürünler neler?" | Product WHERE status != 'ACTIVE' | "3 ürün pasif: X, Y, Z." |

---

## 3. Depo Modülü

**Prisma modelleri:** `Warehouse`, `StockMovement`
**API base:** `/warehouses`, `/stock/movements`
**Frontend:** `/warehouses`, `/stock/movements`

### Sorgulanabilir Bilgi Noktaları

| # | Veri | Tip | Hesaplama |
|---|------|-----|-----------|
| 3.1 | Depo adı, kodu, türü | string | Warehouse tablosu |
| 3.2 | Depo bazlı stok | number | StockMovement aggregate per warehouse |
| 3.3 | Hareket tipleri | enum | IN / OUT / TRANSFER / ADJUST |
| 3.4 | Hareket tarihi | date | StockMovement.movementDate |
| 3.5 | Hareket referansı | string | refType + refId (SALE / COLLECTION / ADJUST) |

### Örnek Sorular → Cevap

| # | Kullanıcı Sorusu | Sorgu | Yanıt Şablonu |
|---|------------------|-------|---------------|
| Q3.1 | "Ana depodaki ürünler neler?" | StockMovement per product WHERE warehouse=ANA | (tablo) |
| Q3.2 | "Bugünkü stok hareketleri?" | StockMovement WHERE date=today | "Bugün **12 hareket**: 5 IN, 6 OUT, 1 TRANSFER." |
| Q3.3 | "Geçen hafta kaç adet ürün çıktı?" | SUM(OUT) WHERE date >= 7d | "Geçen hafta **234 adet** ürün depodan çıktı." |
| Q3.4 | "X ürünü hangi depolara transfer edildi?" | TRANSFER hareketleri | (hareket listesi) |
| Q3.5 | "En çok hareket gören depolar?" | COUNT(StockMovement) per warehouse | (sıralı liste) |
| Q3.6 | "Pasif depolar neler?" | Warehouse WHERE status != ACTIVE | "2 depo pasif: X, Y." |

---

## 4. Satış Modülü

**Prisma modelleri:** `Sale`, `SaleItem`
**API base:** `/sales`, `/sales/:id`, `/sales/:id/confirm`, `/sales/:id/cancel`, `/reports/sales-trend`
**Frontend:** `/sales`, `/sales/new`, `/sales/:id`

### Sorgulanabilir Bilgi Noktaları

| # | Veri | Tip | Hesaplama |
|---|------|-----|-----------|
| 4.1 | Satış toplamı | number | `SUM(grandTotal)` per filter |
| 4.2 | Satış adedi | number | COUNT(Sale) |
| 4.3 | Dönemsel satış trendi | array | GROUP BY month |
| 4.4 | En çok satış yapılan müşteri | array | GROUP BY customerId, ORDER BY SUM DESC |
| 4.5 | En çok satılan ürünler | array | GROUP BY productId, ORDER BY SUM(quantity) DESC |
| 4.6 | Açık satış (ödenmemiş) | number | SUM(grandTotal - paidAmount) |
| 4.7 | İptal edilen satışlar | number | COUNT(Sale) WHERE status=CANCELLED |
| 4.8 | KDV toplamı | number | SUM(vatTotal) |
| 4.9 | Ortalama satış tutarı | number | AVG(grandTotal) |
| 4.10 | Ödeme durumu | enum | PAID / PARTIALLY_PAID / UNPAID |

### Örnek Sorular → Cevap

| # | Kullanıcı Sorusu | Sorgu | Yanıt Şablonu |
|---|------------------|-------|---------------|
| Q4.1 | "Bu hafta ne kadar satış yaptık?" | Sale WHERE date >= 7d AND status in (CONFIRMED, PAID, ...) | "Bu hafta **15 satış / 87.500 ₺**." |
| Q4.2 | "Bu ay ciro ne?" | Sale WHERE month=current | "Bu ay **65 satış / 312.000 ₺** (KDV dahil)." |
| Q4.3 | "Müşteri X'in tüm satışları neler?" | Sale WHERE customerId=X | (liste) |
| Q4.4 | "En çok satış yaptığımız 5 müşteri?" | GROUP BY customerId ORDER BY SUM DESC LIMIT 5 | (top 5) |
| Q4.5 | "En çok satılan ürünler?" | SaleItem GROUP BY productId ORDER BY SUM DESC | (top 10) |
| Q4.6 | "Açık faturalar toplamı ne?" | Sale WHERE paidAmount < grandTotal | "**12 açık fatura / 45.300 ₺** (ödenmemiş)." |
| Q4.7 | "Bugün yapılan satışlar?" | Sale WHERE date=today | (liste) |
| Q4.8 | "İptal edilen satışlar bu ay?" | Sale WHERE status=CANCELLED AND date >= 1m | "Bu ay **2 iptal satış / 8.500 ₺**." |
| Q4.9 | "Satış S-2026-0001 ne durumda?" | Sale.findById | (detay) |
| Q4.10 | "ABC Ltd'ye son sattığımız ne?" | Sale WHERE customerId=X ORDER BY date DESC LIMIT 1 | "Son satış: 15.05.2026, **3 kalem / 12.400 ₺**." |

---

## 5. Sipariş Modülü

**Prisma modelleri:** `Order`, `OrderItem`
**API base:** `/orders`, `/orders/:id`, `/orders/:id/confirm`, `/orders/:id/cancel`
**Frontend:** `/orders`, `/orders/new`, `/orders/:id`

### Sorgulanabilir Bilgi Noktaları

| # | Veri | Tip | Hesaplama |
|---|------|-----|-----------|
| 5.1 | Bekleyen sipariş sayısı | number | COUNT(Order) WHERE status=PENDING |
| 5.2 | Sipariş toplamı | number | `SUM(grandTotal)` |
| 5.3 | Sevk edilmeyen siparişler | array | status NOT IN (SHIPPED, DELIVERED) |
| 5.4 | Teslimat tarihi yaklaşan | array | deliveryDate <= 7d AND status not in (...) |
| 5.5 | Sipariş türleri | enum | SALES_ORDER, PROFORMA, RETURN_ORDER, CONSIGNMENT_OUT |
| 5.6 | Satışa dönüşmüş sipariş | boolean | linkedSaleId IS NOT NULL |

### Örnek Sorular → Cevap

| # | Kullanıcı Sorusu | Sorgu | Yanıt Şablonu |
|---|------------------|-------|---------------|
| Q5.1 | "Bekleyen siparişlerim neler?" | Order WHERE status=PENDING | (liste) |
| Q5.2 | "Bu hafta teslim edilecek siparişler?" | Order WHERE deliveryDate <= 7d AND status IN (CONFIRMED, ...) | (liste) |
| Q5.3 | "Müşteri X'in açık siparişleri?" | Order WHERE customerId=X AND status IN (PENDING, CONFIRMED) | (liste) |
| Q5.4 | "Bu ay kaç sipariş aldık?" | Order WHERE month=current | "Bu ay **23 sipariş / 156.700 ₺**." |
| Q5.5 | "Hangi siparişler satışa dönüştü?" | Order WHERE linkedSaleId IS NOT NULL | (liste) |
| Q5.6 | "İptal edilen siparişler?" | Order WHERE status=CANCELLED | (liste) |
| Q5.7 | "Sipariş OR-2026-0012'de neler var?" | Order.findById | (detay) |
| Q5.8 | "Müşteri X'in en son siparişi?" | Order WHERE customerId=X ORDER BY date DESC LIMIT 1 | (detay) |

---

## 6. Tahsilat Modülü

**Prisma modelleri:** `Collection`
**API base:** `/collections`, `/collections/:id`, `/collections/:id/confirm`, `/collections/:id/cancel`
**Frontend:** `/collections`, `/collections/new`, `/collections/:id`
**Event-sourcing:** ✅ Onaylanan tahsilat otomatik `CustomerMovement(CREDIT)` + `CashMovement(IN)` oluşturur

### Sorgulanabilir Bilgi Noktaları

| # | Veri | Tip | Hesaplama |
|---|------|-----|-----------|
| 6.1 | Tahsilat toplamı | number | SUM(amount) |
| 6.2 | Bugünkü tahsilat | number | SUM(amount) WHERE date=today |
| 6.3 | Tahsilat türü dağılımı | array | GROUP BY type |
| 6.4 | Bekleyen tahsilatlar | number | COUNT WHERE status=PENDING |
| 6.5 | İptal edilen tahsilatlar | number | COUNT WHERE status=CANCELLED |
| 6.6 | Müşteri tahsilat geçmişi | array | Collection WHERE customerId=X |
| 6.7 | Aylık tahsilat trendi | array | GROUP BY month |

### Örnek Sorular → Cevap

| # | Kullanıcı Sorusu | Sorgu | Yanıt Şablonu |
|---|------------------|-------|---------------|
| Q6.1 | "Bugün ne kadar tahsil ettik?" | Collection WHERE date=today AND status=CONFIRMED | "Bugün **4 tahsilat / 12.300 ₺**." |
| Q6.2 | "Bu ay tahsilat toplamı?" | Collection WHERE month=current AND status=CONFIRMED | "Bu ay **87.500 ₺** tahsil edildi." |
| Q6.3 | "ABC Ltd'nin bu ay ödediği tutar?" | Collection WHERE customerId=X AND month=current | "ABC Ltd bu ay **3 tahsilat / 15.400 ₺** ödedi." |
| Q6.4 | "Bekleyen tahsilatlar?" | Collection WHERE status=PENDING | (liste) |
| Q6.5 | "Nakit vs banka tahsilat dağılımı?" | GROUP BY type | "Nakit: 45K (%52), EFT: 32K (%36), POS: 9.5K (%12)." |
| Q6.6 | "İptal edilen tahsilatlar neden?" | Collection WHERE status=CANCELLED, internalNotes | (sebepli liste) |
| Q6.7 | "Bu hafta en yüksek tahsilat?" | Collection WHERE date >= 7d ORDER BY amount DESC LIMIT 5 | (top 5) |

---

## 7. Kasa/Banka Modülü

**Prisma modelleri:** `CashAccount`, `CashMovement`
**API base:** `/cash/accounts`, `/cash/accounts/:id`, `/cash/movements`, `/cash/movements/:id/reverse`
**Frontend:** `/cash`, `/cash/:id`
**Event-sourcing:** ✅ Bakiye = `SUM(IN) - SUM(OUT)` (tüm hareketlerden)

### Sorgulanabilir Bilgi Noktaları

| # | Veri | Tip | Hesaplama |
|---|------|-----|-----------|
| 7.1 | Kasa anlık bakiyesi | number | `SUM(IN) - SUM(OUT)` per cashAccount |
| 7.2 | Tüm kasalar toplam bakiye | number | Tüm aktif kasalar bakiyesi |
| 7.3 | Kasa hareketleri (tarih aralığı) | array | CashMovement WHERE cashAccountId=X AND dateRange |
| 7.4 | Hareket türü dağılımı | array | GROUP BY type (IN/OUT/TRANSFER) |
| 7.5 | Günlük kasa özeti | object | IN/OUT/Net per day |
| 7.6 | Kasa bakiyesi tarihsel | array | Bakiye per day (son 30 gün) |
| 7.7 | Negatif bakiye | array | Bakiye < 0 olan kasalar |
| 7.8 | Kasa hesap türü | enum | CASH / BANK / POS |

### Örnek Sorular → Cevap

| # | Kullanıcı Sorusu | Sorgu | Yanıt Şablonu |
|---|------------------|-------|---------------|
| Q7.1 | "Ana kasamızın bakiyesi ne?" | CashAccount.findById + balance | "Ana Kasa bakiyesi: **23.450 ₺**." |
| Q7.2 | "Tüm kasaların toplam bakiyesi?" | SUM(balance) WHERE status=ACTIVE | "Tüm kasalar toplam **125.300 ₺**." |
| Q7.3 | "Bugünkü kasa hareketleri?" | CashMovement WHERE date=today | (liste) |
| Q7.4 | "Bu hafta kasadan ne kadar çıkt?" | SUM(OUT) WHERE date >= 7d | "Bu hafta **12 işlem / 8.500 ₺** çıkış." |
| Q7.5 | "Garanti Bankası hesabında ne var?" | CashAccount WHERE bankName LIKE '%Garanti%' | "Garanti Bankası: **85.200 ₺** (TRY)." |
| Q7.6 | "Hangi kasalar negatife düştü?" | CashAccount WHERE balance < 0 | "X kasası eksi: -1.200 ₺" |
| Q7.7 | "POS cihazından bugün ne geçti?" | CashMovement WHERE cashAccountId=POS AND date=today | (detay) |
| Q7.8 | "Bankaya yatırılan haftalık tutar?" | CashMovement WHERE type=TRANSFER AND date >= 7d | "Bu hafta **3 transfer / 25.000 ₺**." |

---

## 8. Raporlar

**Prisma modelleri:** (tüm tablolardan aggregate)
**API base:** `/reports/dashboard`, `/reports/top-debtors`, `/reports/stock-alerts`, `/reports/sales-trend`, `/reports/collections-trend`
**Frontend:** `/reports`

### Sorgulanabilir Bilgi Noktaları

| # | Veri | Tip | Hesaplama |
|---|------|-----|-----------|
| 8.1 | Dashboard özet (5 kart) | object | counts + receivables + thisMonth |
| 8.2 | Toplam alacak / borç / net | number | CustomerMovement aggregate |
| 8.3 | Bu ay özet (satış, tahsilat) | number | Sale/Collection aggregate |
| 8.4 | Aktif/pasif sayılar | number | Her model COUNT WHERE status |
| 8.5 | Aylık satış trendi (12 ay) | array | Sale GROUP BY month |
| 8.6 | Aylık tahsilat trendi (12 ay) | array | Collection GROUP BY month |

### Örnek Sorular → Cevap

| # | Kullanıcı Sorusu | Sorgu | Yanıt Şablonu |
|---|------------------|-------|---------------|
| Q8.1 | "Firmamızın genel durumu?" | `/reports/dashboard` | "**X müşteri, Y ürün, Z kasa** aktif. Toplam alacak 125K, borç 45K. Bu ay 65 satış / 312K ₺, 87K ₺ tahsilat." |
| Q8.2 | "Bu ay kaç yeni müşteri geldi?" | Customer WHERE createdAt >= 1m | "Bu ay **3 yeni müşteri**." |
| Q8.3 | "Hangi ürün tükeniyor?" | `/reports/stock-alerts` | "5 ürün minStok altında." |
| Q8.4 | "Ciro trendi nasıl?" | `/reports/sales-trend` | (12 aylık grafik verisi) |
| Q8.5 | "Tahsilat trendi?" | `/reports/collections-trend` | (12 aylık grafik verisi) |
| Q8.6 | "En kârlı müşteriler?" | (top customers - aggregate) | "Top 5: X (45K), Y (32K), ..." |
| Q8.7 | "Stok değerim ne?" | SUM(stock × unitCost) | "Toplam stok değeri **456.000 ₺**." |
| Q8.8 | "Aylık net pozisyon?" | monthly aggregation | (zaman serisi) |

---

## 9. İK / Personel (HR-1)

**Prisma modelleri:** `HrEmployee`, `HrEmployeeEmploymentInfo`, `HrEmployeeDocument`
**API base:** `/hr/employees`, `/hr/employees/:id`, `/hr/employees/:id/employment`, `/hr/employees/:id/documents`
**Frontend:** `/hr/employees`, `/hr/employees/new`, `/hr/employees/:id`
**Detay:** [`.mavis/chat-bot-kb/docs/modules/hr.md`](../.mavis/chat-bot-kb/docs/modules/hr.md) (HR-1 ve HR-2 birlikte)

### Sorgulanabilir Bilgi Noktaları

| # | Veri | Tip | Hesaplama |
|---|------|-----|-----------|
| 9.1 | Aktif personel sayısı | number | COUNT(hr_employees WHERE status=ACTIVE AND isDeleted=false) |
| 9.2 | Personel yaşı | number | (NOW - birthDate) yıl olarak |
| 9.3 | Kıdem yılı | number | (NOW - hireDate) yıl olarak |
| 9.4 | Toplam evrak sayısı | number | COUNT(hr_employee_documents) per employee |
| 9.5 | Departman dağılımı | group | GROUP BY employment.department |
| 9.6 | İstihdam tipi dağılımı | group | GROUP BY employment.employmentType |
| 9.7 | TC Kimlik (hassas) | string | **maskeleme var**, `ik:sensitive_data:view` izni olmadan "********" |
| 9.8 | IBAN (hassas) | string | **maskeleme var**, aynı izin |

### Örnek Bot Sorguları

| Soru | Yanıt |
|---|---|
| "Kaç aktif personelimiz var?" | "**42 aktif** personeliniz var." |
| "Personel listesi nasıl görürüm?" | "`/hr/employees` adresinden erişebilirsiniz." |
| "Yeni personel nasıl eklerim?" | "`/hr/employees/new` sayfasından, TC, iletişim, banka bilgisi ile." |
| "Personel TC'sini neden göremiyorum?" | "`ik:sensitive_data:view` izni gerekiyor. Yönetici ile görüşün." |
| "Personel dosyaları nerede?" | "`/hr/employees/:id` → Evraklar sekmesi." |

### Örnek SQL Sorguları

**Aktif personel sayısı:** `SELECT COUNT(*) FROM hr_employees WHERE status='ACTIVE' AND isDeleted=false`
**Departman dağılımı:** `SELECT employment->>'department' as dept, COUNT(*) FROM hr_employees GROUP BY dept`

---

## 10. İK / Checklist (HR-2)

**Prisma modelleri:** `HrOnboardingChecklist`, `HrOnboardingChecklistItem`, `HrOffboardingChecklist`, `HrOffboardingChecklistItem`
**API base:** `/hr/checklists/onboardings`, `/hr/checklists/offboardings`
**Frontend:** `/hr/checklists/onboardings`, `/hr/checklists/onboardings/:id`, `/hr/checklists/offboardings`, `/hr/checklists/offboardings/:id`
**Detay:** [`.mavis/chat-bot-kb/docs/modules/hr.md`](../.mavis/chat-bot-kb/docs/modules/hr.md)

### Sorgulanabilir Bilgi Noktaları

| # | Veri | Tip | Hesaplama |
|---|------|-----|-----------|
| 10.1 | Aktif onboarding sayısı | number | COUNT WHERE status=IN_PROGRESS |
| 10.2 | Tamamlanan onboarding | number | COUNT WHERE status=COMPLETED |
| 10.3 | Checklistsız aktif personel | array | employees NOT IN onboarding |
| 10.4 | Ortalama onboarding tamamlanma | number | AVG(completedAt - startDate) gün |
| 10.5 | Bekleyen zorunlu madde | number | COUNT items WHERE isRequired AND NOT isCompleted |
| 10.6 | Checklists yüzde ilerleme | number | (completedItems / totalItems) * 100 |
| 10.7 | Son 30 gün onboarding trendi | array | GROUP BY DATE(startDate) |
| 10.8 | Engellenen maddeler | array | items WHERE status=BLOCKED |
| 10.9 | Aktif offboarding sayısı | number | COUNT WHERE status=IN_PROGRESS |
| 10.10 | Son 90 gün işten çıkış trendi | array | GROUP BY DATE(terminationDate) |

### Örnek Bot Sorguları

| Soru | Yanıt |
|---|---|
| "Kaç onboarding devam ediyor?" | "**3 onboarding** devam ediyor: X (%60), Y (%40), Z (%80)." |
| "Tüm onboarding tamamlandı mı?" | "3 onboarding tamamlandı, 1'i hâlâ devam ediyor." |
| "İşe giriş checklist'i nasıl başlatırım?" | "`/hr/checklists/onboardings` → 'Yeni İşe Giriş' butonu." |
| "Onboarding tamamlamak için ne lazım?" | "Tüm **zorunlu** maddeler DONE olmalı." |
| "Offboarding tamamlanınca ne olur?" | "Personel status otomatik **TERMINATED** olur." |
| "Yeni çıkış süreci nasıl açarım?" | "`/hr/checklists/offboardings` → 'Yeni İşten Çıkış' butonu." |
| "Bu personelin onboarding'i var mı?" | "GET `/hr/checklists/onboardings?employeeId=<id>` ile sorgulayın." |

### Örnek API Çağrıları

**Yeni onboarding:**
```
POST /hr/checklists/onboardings
{ employeeId, startDate, targetCompletionDate?, notes? }
```
**Madde güncelle:**
```
PATCH /hr/checklists/onboardings/:cid/items/:iid
{ status: "DONE" | "IN_PROGRESS" | "BLOCKED" | "NOT_APPLICABLE", notes? }
```
**Süreci tamamla:**
```
POST /hr/checklists/onboardings/:id/complete
```

---

## 11. İK / İzin Yönetimi (HR-3)

**Prisma modelleri:** `HrLeaveType`, `HrLeaveBalance`, `HrLeaveRequest`, `HrLeaveAdjustment`
**API base:** `/hr/leave/types`, `/hr/leave/balances`, `/hr/leave/requests`
**Frontend:** `/hr/leave/types`, `/hr/leave/requests`, `/hr/leave/requests/:id`

### Sorgulanabilir Bilgi Noktaları

| # | Veri | Tip | Hesaplama |
|---|------|-----|-----------|
| 11.1 | İzin türü sayısı | number | COUNT(hr_leave_types WHERE isActive=true) |
| 11.2 | Personel yıllık bakiyesi | number | accruedDays + carriedOverDays - usedDays - pendingDays |
| 11.3 | Bekleyen izin talepleri | number | COUNT WHERE status=PENDING |
| 11.4 | Onaylanan izinler (dönem) | number | COUNT WHERE status=APPROVED AND dateRange |
| 11.5 | Reddedilen talepler | number | COUNT WHERE status=REJECTED |
| 11.6 | Kullanılan izin günü (personel/yıl) | number | SUM(workingDays) WHERE employeeId=X AND leaveType=Y AND year=Z |
| 11.7 | Devir eden gün | number | min(unused, carryOverDays) yıl sonunda |
| 11.8 | Yarın izinli personel | array | WHERE startDate <= tomorrow AND endDate >= today AND status=APPROVED |
| 11.9 | İzin türü birikim yöntemi | enum | STANDARD / MONTHLY / NONE |
| 11.10 | Toplam bakiye (tüm personel) | number | SUM(availableDays) WHERE year=currentYear |

### Örnek Bot Sorguları

| Soru | Yanıt |
|---|---|
| "Kaç izin talebi bekliyor?" | "**7 izin talebi** onayınızı bekliyor." |
| "Ayşe'nin yıllık izni ne kadar kaldı?" | "Ayşe'nin yıllık izni: **14 gün** kullanıldı, **6 gün** kaldı." |
| "Bu ay kimler izinli?" | "Bu ay **5 personel** onaylı izinli. Yarın başlayan: Mehmet (3 gün)." |
| "İzin talebi nasıl onaylarım?" | "`/hr/leave/requests/:id` → 'Onayla' butonu." |
| "Hangi izin türleri tanımlı?" | "9 izin türü: Yıllık, Haftalık, Ücretsiz, Doğum, Babalık, Hastalık, Ölüm, Mazeret, İkramiye." |
| "Personel izni ne zaman devreder?" | "Yıllık izin kullanılmayan günler, yıl sonunda max **14 gün** devreder." |
| "İzin bakiyesi nasıl hesaplanır?" | "Kullanılabilir = Biriken + Devir - Kullanılan - Bekleyen" |
| "Mazeret izni gün sayısı nedir?" | "`GET /hr/leave/types` ile sorgulayın, default 3 gün." |

### Örnek API Çağrıları

**İzin talepleri listesi:**
```
GET /hr/leave/requests?status=PENDING
```
**Talep onayla:**
```
POST /hr/leave/requests/:id/approve
```
**Personel bakiyesi:**
```
GET /hr/leave/balances/:employeeId?year=2025
```
**İzin türü oluştur:**
```
POST /hr/leave/types
{ name, code, color, icon, accrualMethod, defaultDaysPerYear, isPaid }
```

---

## 12. İK / Bordro Hazırlık (HR-4)

**Prisma modelleri:** `HrPayrollPeriod`, `HrPayrollRecord`, `HrPayrollSupplement`
**API base:** `/hr/payroll/periods`, `/hr/payroll/records`, `/hr/payroll/supplements`
**Frontend:** `/hr/payroll`, `/hr/payroll/:id`, `/hr/payroll-params`
**Not:** Hesaplama yapılmaz — veri girişi + muhasebeye export.

### Sorgulanabilir Bilgi Noktaları

| # | Veri | Tip | Hesaplama |
|---|------|-----|-----------|
| 12.1 | Açık bordro dönemi | object | WHERE status=DRAFT OR REVIEW OR CONFIRMED |
| 12.2 | Dönem personel sayısı | number | COUNT records WHERE periodId=X |
| 12.3 | Toplam brüt (dönem) | number | SUM(grossPay) WHERE periodId=X |
| 12.4 | Toplam net (dönem) | number | SUM(netPay) WHERE periodId=X |
| 12.5 | Devamsızlık günü (personel/dönem) | number | SUM(absentDays) WHERE periodId=X AND employeeId=Y |
| 12.6 | Fazla mesai saati (personel/dönem) | number | SUM(overtimeHours) WHERE periodId=X AND employeeId=Y |
| 12.7 | Ek kalemler (prim, ikramiye) | number | SUM(amount) WHERE periodId=X AND isDeduction=false |
| 12.8 | Kesintiler | number | SUM(amount) WHERE periodId=X AND isDeduction=true |
| 12.9 | Dışa aktarılan dönemler | array | WHERE status=EXPORTED OR CLOSED |
| 12.10 | Onaylanmış ama export edilmemiş | array | WHERE status=CONFIRMED |

### Örnek Bot Sorguları

| Soru | Yanıt |
|---|---|
| "Haziran bordrosu hazır mı?" | "Haziran 2025 dönemi **ONAYLANDI** — dışa aktarılmaya hazır." |
| "Bu dönem kaç personelin bordrosu var?" | "Mayıs 2025 döneminde **38 personel** bordro satırı var." |
| "Toplam brüt ne kadar?" | "Aktif dönem toplam brüt: **892.450 ₺**, net: **645.200 ₺**." |
| "Ahmet'in bordrosunu nasıl girerim?" | "`/hr/payroll/:id` → Personel seç → Gün, ücret, kesinti gir → Kaydet." |
| "Muhasebeye nasıl gönderirim?" | "Dönemi onayla (REVİEW→CONFIRMED) → 'Dışa Aktar' butonu." |
| "Fazla mesai nasıl eklerim?" | "Bordro satırında 'Fazla Mesai (saat)' alanını doldurun." |
| "Bordro parametreleri nerede?" | "`/hr/payroll-params` — SGK oranları, asgari ücret, agi vs." |
| "Prim eklemek için ne yaparım?" | "Ek Kalemler → 'Prim' seç → Tutar + personel seç." |

### Örnek API Çağrıları

**Dönemler:**
```
GET /hr/payroll/periods?year=2025
```
**Dönem detay:**
```
GET /hr/payroll/periods/:id
→ { status, employeeCount, totalGross, totalNet }
```
**Bordro satırı güncelle:**
```
POST /hr/payroll/records
{ periodId, employeeId, workingDays, baseSalary, grossPay, sgkEmployee, incomeTax, netPay }
```
**Dönem dışa aktar:**
```
POST /hr/payroll/periods/:id/export
→ { status: 'EXPORTED', exportedAt, totalGross, totalNet }
```

---

## 13. İK / Bordro Parametreleri, Devamsızlık, Kariyer, Eğitim, Performans (HR-5/6/7)

**Prisma modelleri:** `HrPayrollParam`, `HrAbsenceRecord`, `HrDisciplinaryCase`, `HrCareerRecord`, `HrTraining`, `HrTrainingParticipant`, `HrPerformanceReview`
**API base:** `/hr/payroll-params`, `/hr/absences`, `/hr/disciplinary`, `/hr/career`, `/hr/trainings`, `/hr/performance`
**Frontend:** `/hr/payroll-params`, `/hr/hr567`

### 13-A: Bordro Parametreleri (HR-5)

| # | Veri | Hesaplama |
|---|------|-----------|
| 13.1 | Asgari ücret (yıl) | paramKey=min_wage, paramValue per year |
| 13.2 | SGK çalışan oranı | paramKey=sgk_employee_rate |
| 13.3 | İşsizlik sigortası oranı | paramKey=unemployment_*_rate |
| 13.4 | AGI/AGCV istisna limiti | paramKey=agc_exemption_limit |
| 13.5 | Yemek/ulaşım allowance | paramKey=meal_allowance_daily, transport_allowance_monthly |

**Örnek sorgu:** "2025 asgari ücret ne?" → `GET /hr/payroll-params/map?year=2025` → { min_wage: 42600 }

### 13-B: Devamsızlık (HR-6)

| # | Veri | Hesaplama |
|---|------|-----------|
| 13.6 | Toplam devamsızlık günü (personel/yıl) | SUM(totalDays) WHERE absenceType=UNAUTHORIZED AND year |
| 13.7 | Mazeretli devamsızlık | WHERE isJustified=true |
| 13.8 | Geç kalma sayısı (30 gün) | COUNT WHERE absenceType=LATE AND startDate >= 30d |
| 13.9 | Kesinti tutarı | SUM(deductionAmount) WHERE employeeId=X AND periodId=Y |
| 13.10 | Devamsızlık trendi (departman) | GROUP BY department, COUNT absences |

### 13-C: Disiplin (HR-6)

| # | Veri | Hesaplama |
|---|------|-----------|
| 13.11 | Açık disiplin dosyası | COUNT WHERE isClosed=false |
| 13.12 | Kapatılan dosya sayısı (yıl) | COUNT WHERE isClosed=true AND closedAt.year=Y |
| 13.13 | Son disiplin işlemi | ORDER BY createdAt DESC LIMIT 1 |
| 13.14 | Yaptırım türü dağılımı | GROUP BY actionType |

**Örnek:** "Mehmet hakkında disiplin dosyası var mı?" → `GET /hr/disciplinary?employeeId=<id>`

### 13-D: Kariyer (HR-7)

| # | Veri | Hesaplama |
|---|------|-----------|
| 13.15 | Terfi sayısı (yıl) | COUNT WHERE recordType=PROMOTION AND year |
| 13.16 | Son maaş değişikliği | WHERE recordType=SALARY_CHANGE ORDER BY effectiveDate DESC LIMIT 1 |
| 13.17 | Departmanlar arası transfer | COUNT WHERE recordType=TRANSFER AND year |
| 13.18 | Kariyer geçmişi (personel) | ORDER BY effectiveDate WHERE employeeId=X |

**Örnek:** "Ayşe son terfi ne zaman aldı?" → `GET /hr/career?employeeId=<id>&recordType=PROMOTION`

### 13-E: Eğitim (HR-7)

| # | Veri | Hesaplama |
|---|------|-----------|
| 13.19 | Aktif eğitim sayısı | COUNT WHERE status=PLANNED OR IN_PROGRESS |
| 13.20 | Tamamlanan eğitim (yıl) | COUNT WHERE status=COMPLETED AND endDate.year=Y |
| 13.21 | Eğitim katılım oranı | COUNT participants WHERE status=ATTENDED / total * 100 |
| 13.22 | Personel eğitim geçmişi | WHERE employeeId=X ORDER BY createdAt DESC |
| 13.23 | Sertifika alan personel | COUNT WHERE certificateUrl IS NOT NULL |

### 13-F: Performans (HR-7)

| # | Veri | Hesaplama |
|---|------|-----------|
| 13.24 | Tamamlanan değerlendirme (dönem) | COUNT WHERE status=COMPLETED AND period=X |
| 13.25 | Ortalama genel puan | AVG(overallScore) WHERE period=X |
| 13.26 | Bekleyen değerlendirme | COUNT WHERE status=PENDING OR SELF_REVIEW |
| 13.27 | En yüksek/düşük puan | MAX/MIN(overallScore) WHERE period=X |
| 13.28 | Değerlendirme kapsamı | COUNT employees - COUNT completed reviews |

### Örnek Bot Sorguları (HR-5/6/7)

| Soru | Yanıt |
|---|---|
| "Bu ay kaç devamsızlık var?" | "Bu ay **12 devamsızlık kaydı**, 2'si mazeretsiz." |
| "Kimler geç kaldı?" | "Son 7 günde **3 kişi** geç kaldı: Mehmet (2), Ayşe (1)." |
| "Disiplin dosyası nasıl açarım?" | "`/hr/hr567` → Disiplin tabı → 'Yeni Dosya' butonu." |
| "Eğitim programları neler?" | "**2 aktif** eğitim: Excel İleri Seviye, İş Sağlığı." |
| "Performans değerlendirmesi ne zaman yapılır?" | "Yıllık (Ocak) veya 6 aylık periyotlarla yapılır." |
| "Kariyer geçmişimi nasıl görürüm?" | "`GET /hr/career?employeeId=<id>` ile tüm terfi ve transferleri görürsünüz." |
| "2025 SGK oranları neler?" | "SGK çalışan: %14, işveren: %15.5, işsizlik: %1 çalışan, %2 işveren." |

### Örnek API Çağrıları

**Devamsızlık kaydı:**
```
POST /hr/absences
{ employeeId, absenceType, startDate, endDate, totalDays, isJustified }
```
**Disiplin dosyası:**
```
POST /hr/disciplinary
{ employeeId, incidentDate, incidentDesc, actionType }
```
**Eğitim oluştur:**
```
POST /hr/trainings
{ name, trainer, startDate, endDate, trainingType, maxParticipants }
```
**Performans değerlendirmesi:**
```
POST /hr/performance
{ employeeId, period, taskCompletion, teamwork, communication, problemSolving, leadership }
```

---

## 11. Onay (Approvals) Modülü

**Modül:** `apps/api/src/modules/approvals` (1 controller)
**Prisma modelleri:** `ApprovalRequest`, `ApprovalRule`, `ApprovalStep`
**API base:** `/approvals/*`
**Frontend:** `/approvals`, `/approvals/rules`, `/approvals/:id`

### Sorgulanabilir Bilgi Noktaları

| # | Veri | Hesaplama |
|---|------|-----------|
| 11.1 | Bekleyen onay sayısı | COUNT WHERE status=PENDING |
| 11.2 | Onay gecikme süresi | NOW - createdAt, saat |
| 11.3 | Onaylayan kişi dağılımı | GROUP BY approverId |
| 11.4 | Red oranı (%) | COUNT(rejected) / COUNT(total) * 100 |
| 11.5 | Kural bazlı onay trendi | GROUP BY ruleId, MONTH |

### Örnek Bot Sorguları
- "Bekleyen onaylarım neler?" → `/approvals?assigneeId=me&status=PENDING`
- "Son onaylanan teklifler?" → status=APPROVED, ORDER BY approvedAt DESC
- "Onay kuralı nasıl tanımlanır?" → `/approvals/rules` → kural motoru

---

## 12. Asistan / Bilgi Bankası (Assistant) Modülü

**Modül:** `apps/api/src/modules/assistant` (1 controller)
**Prisma modelleri:** `AssistantArticle`, `AssistantCategory`, `AssistantTag`
**API base:** `/assistant/*`
**Frontend:** `/assistant/articles`, `/assistant/tools`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 12.1 | Toplam makale sayısı | COUNT(articles) |
| 12.2 | Kategori dağılımı | GROUP BY categoryId |
| 12.3 | En çok okunan makaleler | ORDER BY viewCount DESC LIMIT 10 |
| 12.4 | Etiket cloud'ı | GROUP BY tag, COUNT |

### Örnek Bot Sorguları
- "Bu konu hakkında makale var mı?" → `/assistant/articles?q=<sorgu>`
- "Bilgi bankası nasıl güncellerim?" → `/assistant/articles/new`

---

## 13. Asistan / Sohbet (Assistant-Chat) Modülü

**Modül:** `apps/api/src/modules/assistant-chat` (3 controller)
**Prisma modelleri:** `ChatSession`, `ChatMessage`, `LLMConfig`
**API base:** `/assistant-chat/*`
**Frontend:** `/assistant-chat`, `/assistant-chat/sessions/:id`, `/assistant-chat/llm-config`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 13.1 | Aktif oturum sayısı | COUNT WHERE status=ACTIVE |
| 13.2 | Toplam token kullanımı | SUM(tokens) per session |
| 13.3 | Ortalama yanıt süresi | AVG(responseTimeMs) per session |
| 13.4 | LLM model dağılımı | GROUP BY model |
| 13.5 | Tool çağrı sayısı | COUNT FROM tool_invocations |

### Örnek Bot Sorguları
- "Sohbet geçmişim nerede?" → `/assistant-chat/sessions`
- "Hangi LLM modeli kullanıyoruz?" → `/assistant-chat/llm-config`
- "Token kullanımı ne kadar?" → `/assistant-chat/stats`

---

## 14. Denetim (Audit) Modülü

**Modül:** `apps/api/src/modules/audit` (1 controller)
**Prisma modelleri:** `AuditRule`, `AuditRun`, `AuditResult`
**API base:** `/audit/*`
**Frontend:** `/audit`, `/audit/rules`, `/audit/runs`, `/audit/results`, `/audit/schedules`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 14.1 | Aktif kural sayısı | COUNT WHERE isActive=true |
| 14.2 | Son çalıştırma durumu | ORDER BY startedAt DESC LIMIT 1 |
| 14.3 | Bulgu sayısı | COUNT FROM audit_results per run |
| 14.4 | En çok bulgu üreten kurallar | GROUP BY ruleId, COUNT(results) |
| 14.5 | Zamanlanmış denetim sayısı | COUNT WHERE schedule IS NOT NULL |

### Örnek Bot Sorguları
- "Son denetim ne zaman çalıştı?" → `/audit/runs/latest`
- "Hangi kurallar aktif?" → `/audit/rules?isActive=true`
- "Bulgu var mı?" → `/audit/results?severity=HIGH`

---

## 15. Toplu İşlemler (Bulk Operations) Modülü

**Modül:** `apps/api/src/modules/bulk-operations` (1 controller)
**Prisma modelleri:** `BulkOperation`, `BulkOperationItem`, `BulkOperationError`
**API base:** `/bulk-operations/*`
**Frontend:** `/bulk-operations`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 15.1 | Toplam işlem sayısı | COUNT(operations) |
| 15.2 | Başarı oranı (%) | COUNT(success) / COUNT(total) * 100 |
| 15.3 | Hata tipleri | GROUP BY errorType |
| 15.4 | En çok işlem yapılan varlık | GROUP BY resource |

### Örnek Bot Sorguları
- "Toplu güncelleme nasıl yapılır?" → `/bulk-operations` → CSV yükleme
- "Son toplu işlem başarılı mı?" → `/bulk-operations?status=...`

---

## 16. Kasa (Cash) Modülü — Detay

> ⚠️ Bu bölüm 7 numaralı Kasa/Banka'nın **detaylı endpoint'leri**ni içerir. Kısa bilgi için Bkz. **§7**.

**Modül:** `apps/api/src/modules/cash` (1 controller)
**Prisma modelleri:** `CashAccount`, `CashMovement`
**API base:** `/cash/*`
**Frontend:** `/cash`, `/cash/:id`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 16.1 | Kasa bakiyesi | SUM(IN) - SUM(OUT) per account |
| 16.2 | Toplam nakit | SUM balance tüm kasalar |
| 16.3 | Günlük hareket | COUNT WHERE DATE(createdAt) = TODAY |
| 16.4 | Para birimi dağılımı | GROUP BY currency |

### Örnek Bot Sorguları
- "Kasamda ne kadar var?" → SUM(cash_movements) WHERE direction=IN - OUT
- "Bugünkü kasa hareketleri?" → `/cash/movements?date=today`

---

## 17. Temizleme / Arşivleme (Cleanup) Modülü

**Modül:** `apps/api/src/modules/cleanup` (1 controller)
**Prisma modelleri:** `CleanupPolicy`, `CleanupJob`
**API base:** `/cleanup/*`
**Frontend:** `/cleanup`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 17.1 | Aktif politika sayısı | COUNT WHERE isActive=true |
| 17.2 | Son temizlik zamanı | ORDER BY lastRunAt DESC |
| 17.3 | Silinen kayıt sayısı | SUM(deletedCount) per job |
| 17.4 | Tasarruf edilen alan | SUM(freedBytes) |

---

## 18. Tahsilat (Collections) Modülü — Detay

> ⚠️ Bu bölüm 6 numaralı Tahsilat'ın **detaylı endpoint'leri**ni içerir. Kısa bilgi için Bkz. **§6**.

**Modül:** `apps/api/src/modules/collections` (1 controller)
**Prisma modelleri:** `Collection`, `CollectionAllocation`
**API base:** `/collections/*`
**Frontend:** `/collections`, `/collections/new`, `/collections/:id`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 18.1 | Bugünkü tahsilat toplamı | SUM WHERE DATE(date)=TODAY |
| 18.2 | Vadeli tahsilat | COUNT WHERE dueDate > NOW() |
| 18.3 | Müşteri bazlı tahsilat | GROUP BY customerId |
| 18.4 | Tahsilat yöntemi dağılımı | GROUP BY paymentMethod |

### Örnek Bot Sorguları
- "Bugün ne kadar tahsil ettik?" → SUM(collections WHERE today)
- "Vadesi geçen tahsilatlar?" → WHERE dueDate < NOW() AND status != PAID

---

## 19. Komut Paleti (Command Palette) Modülü

**Modül:** `apps/api/src/modules/command-palette` (1 controller)
**Prisma modelleri:** (yok, hesaplanmış)
**API base:** `/command-palette/*`
**Frontend:** global klavye kısayolu (Cmd+K / Ctrl+K)

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 19.1 | Toplam komut sayısı | hardcoded (modüller + sayfalar) |
| 19.2 | En çok kullanılan komutlar | ORDER BY usageCount DESC |
| 19.3 | Son aramalar | ORDER BY lastUsedAt DESC |

### Örnek Bot Sorguları
- "Komut paletini nasıl açarım?" → `Cmd+K` veya `Ctrl+K`

---

## 20. Müşteri Risk (Customer Risk) Modülü

**Modül:** `apps/api/src/modules/customer-risk` (1 controller)
**Prisma modelleri:** `RiskScore`, `RiskRule`
**API base:** `/customer-risk/*`
**Frontend:** `/customer-risk`, `/customer-risk/config`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 20.1 | Yüksek riskli müşteri sayısı | COUNT WHERE score >= 70 |
| 20.2 | Risk skoru dağılımı | GROUP BY riskLevel (LOW/MEDIUM/HIGH) |
| 20.3 | Vadesi geçmiş bakiye | SUM WHERE overdueAmount > 0 |
| 20.4 | Risk değişim trendi (30 gün) | ORDER BY calculatedAt |

### Örnek Bot Sorguları
- "En riskli 10 müşteri kim?" → ORDER BY riskScore DESC
- "Risk limiti ne?" → RiskRule config
- "Bu müşterinin risk skoru kaç?" → customerId bazlı sorgu

---

## 21. Müşteri Segmentleri (Customer Segments) Modülü

**Modül:** `apps/api/src/modules/customer-segments` (1 controller)
**Prisma modelleri:** `CustomerSegment`, `SegmentMember`
**API base:** `/customer-segments/*`
**Frontend:** `/customer-segments`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 21.1 | Toplam segment sayısı | COUNT(segments) |
| 21.2 | Segment üye sayıları | COUNT(segment_members) per segment |
| 21.3 | Otomatik segment sayısı | COUNT WHERE rule IS NOT NULL |

### Örnek Bot Sorguları
- "VIP müşteriler segmenti kimde?" → segment name bazlı
- "Yeni segment nasıl oluştururum?" → `/customer-segments` → kural motoru

---

## 22. Demo Firma Modülü

**Modül:** `apps/api/src/modules/demo-company` (1 controller)
**Prisma modelleri:** `DemoCompany`, `DemoScenario`
**API base:** `/demo-company/*`
**Frontend:** `/demo-company`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 22.1 | Aktif demo firma sayısı | COUNT WHERE isActive=true |
| 22.2 | Senaryo sayısı | COUNT(scenarios) |
| 22.3 | Demo tenant yaşı | NOW - createdAt gün |

### Örnek Bot Sorguları
- "Demo firma nasıl sıfırlanır?" → `/demo-company/reset`
- "Hangi senaryolar mevcut?" → `/demo-company/scenarios`

---

## 23. Global Arama Modülü

**Modül:** `apps/api/src/modules/global-search` (1 controller)
**API base:** `/global-search/*`
**Frontend:** header arama component (her sayfada)

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 23.1 | Arama sonuç sayısı (modül bazlı) | COUNT per type |
| 23.2 | En çok aranan terimler | ORDER BY searchCount DESC |
| 23.3 | Arama motoru (Prisma / Meilisearch) | Config |

### Örnek Bot Sorguları
- "Global aramayı nasıl kullanırım?" → Header'daki arama kutusu
- "Arama motoru ne kullanıyor?" → Meilisearch (FAZ 53+)

---

## 24. İçe Aktarım (Import) Modülü

**Modül:** `apps/api/src/modules/import` (1 controller)
**Prisma modelleri:** `ImportJob`, `ImportRow`, `ImportError`
**API base:** `/import/*`
**Frontend:** `/import`, `/import/history`, `/import/wizard`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 24.1 | Aktif import sayısı | COUNT WHERE status=IN_PROGRESS |
| 24.2 | Başarı oranı | (success / total) * 100 |
| 24.3 | Hata tipi dağılımı | GROUP BY errorType |
| 24.4 | Son import tarihi | ORDER BY createdAt DESC |

### Örnek Bot Sorguları
- "CSV nasıl içe aktarırım?" → `/import/wizard` → adımlar
- "Son import hataları?" → `/import/history?status=FAILED`

---

## 25. Sektör Şablonları (Industry Templates) Modülü

**Modül:** `apps/api/src/modules/industry-templates` (1 controller)
**Prisma modelleri:** `IndustryTemplate`
**API base:** `/industry-templates/*`
**Frontend:** `/industry-templates`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 25.1 | Şablon sayısı (sektör) | GROUP BY sector |
| 25.2 | En çok kullanılan şablon | ORDER BY usageCount DESC |

### Örnek Bot Sorguları
- "Perakende şablonu var mı?" → sector=retail
- "Şablonu nasıl uygularım?" → /industry-templates/:id/apply

---

## 26. Etiket / Barkod (Labels) Modülü

**Modül:** `apps/api/src/modules/labels` (1 controller)
**Prisma modelleri:** `LabelTemplate`, `LabelPrintJob`
**API base:** `/labels/*`
**Frontend:** `/labels`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 26.1 | Şablon sayısı | COUNT(templates) |
| 26.2 | Son yazdırma sayısı | COUNT WHERE DATE=NOW() |
| 26.3 | Etiket tipi dağılımı | GROUP BY labelType (QR, barcode, etc) |

---

## 27. Bildirimler (Notifications) Modülü

**Modül:** `apps/api/src/modules/notifications` (1 controller)
**Prisma modelleri:** `NotificationRule`, `NotificationChannel`, `NotificationLog`
**API base:** `/notifications/*`
**Frontend:** `/notifications`, `/notifications/rules`, `/notifications/channels`, `/notifications/logs`, `/notifications/center`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 27.1 | Okunmamış bildirim sayısı | COUNT WHERE status=UNREAD |
| 27.2 | Kural dağılımı (event) | GROUP BY event |
| 27.3 | Kanal tipi dağılımı | GROUP BY channel (email, sms, push) |
| 27.4 | Başarısız bildirim sayısı | COUNT WHERE status=FAILED |
| 27.5 | Bugün gönderilen | COUNT WHERE DATE=今天 |

### Örnek Bot Sorguları
- "Okunmamış bildirimlerim neler?" → `/notifications/center?status=UNREAD`
- "Bildirim kuralı nasıl kurulur?" → `/notifications/rules` → tetikleyici seç
- "Email gitmedi, log nerede?" → `/notifications/logs?status=FAILED`

---

## 28. Müşteri Karşılama (Onboarding) Modülü

**Modül:** `apps/api/src/modules/onboarding` (1 controller)
**Prisma modelleri:** `OnboardingStep`, `OnboardingProgress`
**API base:** `/onboarding/*`
**Frontend:** `/onboarding/wizard`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 28.1 | Tamamlanan tenant sayısı | COUNT WHERE step=COMPLETED |
| 28.2 | Ortalama onboarding süresi | AVG(completedAt - createdAt) |
| 28.3 | En çok takılan adım | GROUP BY currentStep, COUNT |

> ⚠️ Bu modül tenant kurulum wizard'ıdır. **HR-2 onboarding checklist'ten farklı** — bu yeni firma kurarken, HR-2 yeni personel alırken.

---

## 29. Sipariş (Orders) Modülü — Detay

> ⚠️ Bu bölüm 5 numaralı Sipariş Modülü'nün **detaylı endpoint'leri**ni içerir. Kısa bilgi için Bkz. **§5**.

**Modül:** `apps/api/src/modules/orders` (1 controller)
**Prisma modelleri:** `Order`, `OrderItem`, `OrderStatusHistory`
**API base:** `/orders/*`
**Frontend:** `/orders`, `/orders/new`, `/orders/:id`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 29.1 | Bekleyen sipariş sayısı | COUNT WHERE status=PENDING |
| 29.2 | Bugünkü siparişler | COUNT WHERE DATE=今天 |
| 29.3 | Tedarikçi bazlı siparişler | GROUP BY supplierId |
| 29.4 | Teslim süresi ortalaması | AVG(deliveredAt - createdAt) gün |

### Örnek Bot Sorguları
- "Bekleyen siparişler?" → status=PENDING
- "Tedarikçi X'in bu ayki siparişleri?" → supplierId bazlı

---

## 30. Performans / Hedef (Performance) Modülü

**Modül:** `apps/api/src/modules/performance` (1 controller)
**Prisma modelleri:** `Target`, `Commission`
**API base:** `/performance/*`
**Frontend:** `/performance/targets`, `/performance/commissions`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 30.1 | Aktif hedef sayısı | COUNT WHERE isActive=true |
| 30.2 | Hedef gerçekleşme oranı | (actual / target) * 100 |
| 30.3 | Prim ödemesi toplamı | SUM(commissions WHERE period=...) |
| 30.4 | Dönemsel hedef performansı | GROUP BY period |

### Örnek Bot Sorguları
- "Bu ayki hedeflerim ne?" → `/performance/targets?assigneeId=me`
- "Prim ödemelerim?" → `/performance/commissions?userId=me`

---

## 31. Müşteri Portalı (Portal) Modülü

**Modül:** `apps/api/src/modules/portal` (1 controller)
**Prisma modelleri:** `PortalUser`, `PortalSession`
**API base:** `/portal/*`
**Frontend:** `/portal/*` (müşteri kendi paneli)

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 31.1 | Aktif portal kullanıcısı | COUNT WHERE status=ACTIVE |
| 31.2 | Son giriş zamanı | ORDER BY lastLoginAt |
| 31.3 | Portal sipariş sayısı | COUNT FROM orders WHERE customerId IN (portal customers) |

### Örnek Bot Sorguları
- "Müşteri portalı nasıl açılır?" → `/portal/login`
- "Portal üzerinden sipariş verebilir miyim?" → evet

---

## 32. Fiyatlandırma (Pricing) Modülü

**Modül:** `apps/api/src/modules/pricing` (1 controller)
**Prisma modelleri:** `PriceList`, `CustomerGroup`, `Campaign`
**API base:** `/pricing/*`
**Frontend:** `/pricing/lists`, `/pricing/groups`, `/pricing/campaigns`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 32.1 | Aktif fiyat listesi | COUNT WHERE isActive=true |
| 32.2 | Müşteri grup sayısı | COUNT(groups) |
| 32.3 | Aktif kampanya sayısı | COUNT WHERE validUntil > NOW() |
| 32.4 | İndirim oranı ortalaması | AVG(discountPercent) |

### Örnek Bot Sorguları
- "VIP grubunun fiyatı ne?" → groupId bazlı
- "Aktif kampanyalar?" → status=ACTIVE

---

## 33. Ürün Görsel (Product Images) Modülü

**Modül:** `apps/api/src/modules/product-images` (1 controller)
**Prisma modelleri:** `ProductImage`, `ImageVariant`
**API base:** `/product-images/*`
**Frontend:** `/product-images`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 33.1 | Görselsiz ürün sayısı | COUNT(products) NOT IN (product_images) |
| 33.2 | Çoklu görsel ürünler | GROUP BY productId HAVING COUNT > 1 |
| 33.3 | Toplam depolama (MB) | SUM(fileSize) / 1024 / 1024 |

---

## 34. Ürün Öneri (Product Recommendations) Modülü

**Modül:** `apps/api/src/modules/product-recommendations` (1 controller)
**Prisma modelleri:** `RecommendationRule`, `RecommendationLog`
**API base:** `/product-recommendations/*`
**Frontend:** (satış ekranında otomatik gösterilir)

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 34.1 | Kural sayısı | COUNT(rules) |
| 34.2 | Öneri kabul oranı | COUNT(accepted) / COUNT(shown) |
| 34.3 | En çok önerilen ürün | GROUP BY productId |

---

## 35. Teklif (Quotes) Modülü

**Modül:** `apps/api/src/modules/quotes` (1 controller)
**Prisma modelleri:** `Quote`, `QuoteItem`, `QuoteStatusHistory`
**API base:** `/quotes/*`
**Frontend:** `/quotes`, `/quotes/new`, `/quotes/:id`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 35.1 | Bekleyen teklif | COUNT WHERE status=PENDING |
| 35.2 | Onaylanma oranı | (approved / total) * 100 |
| 35.3 | Ortalama teklif tutarı | AVG(total) |
| 35.4 | Vadesi geçmiş teklif | COUNT WHERE validUntil < NOW() |

### Örnek Bot Sorguları
- "Müşteri X'in teklifleri?" → customerId
- "Bu ayki teklif tutarı?" → period bazlı SUM

---

## 36. Raporlar (Reports) Modülü

**Modül:** `apps/api/src/modules/reports` (1 controller)
**API base:** `/reports/*`
**Frontend:** `/reports`, `/reports/templates`, `/reports/scheduled`, `/reports/pivot-designer`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 36.1 | Şablon sayısı | COUNT(templates) |
| 36.2 | Zamanlanmış rapor sayısı | COUNT WHERE schedule IS NOT NULL |
| 36.3 | Pivot tablo desteği | evet (pivot-designer) |

### Örnek Bot Sorguları
- "Ciro trendi?" → `/reports/sales-trend`
- "Pivot rapor nasıl yaparım?" → `/reports/pivot-designer`

---

## 37. İade (Returns) Modülü

**Modül:** `apps/api/src/modules/returns` (1 controller)
**Prisma modelleri:** `Return`, `ReturnItem`, `ReturnReason`
**API base:** `/returns/*`
**Frontend:** `/returns`, `/returns/new`, `/returns/:id`, `/returns/:id/approve`

### Sorgulanabelir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 37.1 | Bekleyen iade | COUNT WHERE status=PENDING |
| 37.2 | İade nedeni dağılımı | GROUP BY reasonId |
| 37.3 | İade tutarı (aylık) | SUM WHERE MONTH=... |
| 37.4 | Onay oranı | (approved / total) * 100 |

---

## 38. Satış (Sales) Modülü

**Modül:** `apps/api/src/modules/sales` (1 controller)
**Prisma modelleri:** `Sale`, `SaleItem`, `SalePayment`
**API base:** `/sales/*`
**Frontend:** `/sales`, `/sales/new`, `/sales/:id`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 38.1 | Bugünkü satış toplamı | SUM WHERE DATE=今天 |
| 38.2 | Aylık ciro | SUM WHERE MONTH=... |
| 38.3 | En çok satan ürünler | GROUP BY productId ORDER BY SUM(qty) DESC |
| 38.4 | Satış kanali dağılımı | GROUP BY channel |
| 38.5 | Kâr marjı | (revenue - cost) / revenue * 100 |

### Örnek Bot Sorguları
- "Bugün ne kadar sattık?" → SUM(sales WHERE today)
- "En çok satan ürün?" → ORDER BY quantity DESC LIMIT 1
- "Bu ay ciro ne?" → SUM WHERE MONTH=...

---

## 39. Stok (Stock) Modülü

**Modül:** `apps/api/src/modules/stock` (1 controller)
**Prisma modelleri:** `StockMovement`, `StockCount`
**API base:** `/stock/*`
**Frontend:** `/stock/movements`, `/stock-count/*`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 39.1 | Toplam stok değeri | SUM(qty * cost) |
| 39.2 | Stokta olmayan ürün | COUNT WHERE qty=0 |
| 39.3 | Düşük stok uyarısı | COUNT WHERE qty < minStock |
| 39.4 | Hareket tipi dağılımı | GROUP BY type (IN, OUT, TRANSFER) |

### Örnek Bot Sorguları
- "Stok değerim ne?" → SUM(qty * cost)
- "Eksik stoklu ürünler?" → WHERE qty < minStock

---

## 40. Stok Sayım (Stock Count) Modülü

**Modül:** `apps/api/src/modules/stock-count` (özel controller yolu)
**Prisma modelleri:** `StockCount`, `StockCountLine`
**API base:** `/stock-count/*`
**Frontend:** `/stock-count`, `/stock-count/new`, `/stock-count/:id`, `/stock-count/differences`, `/stock-count/barcode`, `/stock-count/:id/approve`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 40.1 | Aktif sayım | COUNT WHERE status=IN_PROGRESS |
| 40.2 | Fark tutarı | SUM(abs(physicalQty - systemQty) * cost) |
| 40.3 | Onay bekleyen sayım | COUNT WHERE status=PENDING_APPROVAL |
| 40.4 | Barkod ile hızlı sayım | evet (mobile/tablet uyumlu) |

---

## 41. Şablonlar (Templates) Modülü

**Modül:** `apps/api/src/modules/templates` (1 controller)
**Prisma modelleri:** `Template`, `TemplateDefaults`
**API base:** `/templates/*`
**Frontend:** `/templates`, `/templates/new`, `/templates/:id`, `/templates/:id/preview`, `/templates/defaults`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 41.1 | Toplam şablon | COUNT(templates) |
| 41.2 | Tip dağılımı | GROUP BY type (email, sms, document) |

---

## 42. Ziyaret (Visits) Modülü

**Modül:** `apps/api/src/modules/visits` (1 controller)
**Prisma modelleri:** `VisitPlan`, `Visit`, `VisitTarget`
**API base:** `/visits/*`
**Frontend:** `/visits/plans`, `/visits/plans/new`, `/visits/plans/:id`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 42.1 | Planlanan ziyaret sayısı | COUNT WHERE status=PLANNED |
| 42.2 | Tamamlanan ziyaret | COUNT WHERE status=COMPLETED |
| 42.3 | Ziyaret sıklığı (müşteri başına) | GROUP BY customerId |
| 42.4 | Satış dönüşüm oranı | (orders FROM visits) / (visits) * 100 |

### Örnek Bot Sorguları
- "Bugünkü ziyaret planım?" → `/visits/plans?date=today`
- "Müşteri X'i en son ne zaman ziyaret ettim?" → ORDER BY date DESC

---

## 43. Depo (Warehouses) Modülü

**Modül:** `apps/api/src/modules/warehouses` (1 controller)
**Prisma modelleri:** `Warehouse`, `WarehouseStock`, `WarehouseTransfer`
**API base:** `/warehouses/*`
**Frontend:** `/warehouses`, `/warehouses/new`, `/warehouses/:id`, `/warehouses/:id/stock`, `/warehouses/:id/movements`, `/warehouses/transfers/new`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 43.1 | Depo sayısı | COUNT(warehouses) |
| 43.2 | Depo bazlı stok değeri | GROUP BY warehouseId, SUM(qty*cost) |
| 43.3 | Aktarım sayısı | COUNT(transfers WHERE period) |
| 43.4 | Depo doluluk oranı | qty / capacity * 100 |

### Örnek Bot Sorguları
- "Ana depo stok değeri?" → warehouseId bazlı
- "Depolar arası transfer nasıl yapılır?" → `/warehouses/transfers/new`

---

## 44. Beyaz Etiket (White Label) Modülü

**Modül:** `apps/api/src/modules/white-label` (1 controller)
**Prisma modelleri:** `WhiteLabelConfig`, `WhiteLabelDomain`
**API base:** `/white-label/*`
**Frontend:** `/white-label`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 44.1 | Aktif konfigürasyon | COUNT WHERE isActive=true |
| 44.2 | Domain sayısı | COUNT(domains) |
| 44.3 | Özelleştirme seviyesi | (logo + color + domain) / 3 |

### Örnek Bot Sorguları
- "Beyaz etiket nasıl aktifleştirilir?" → `/white-label`
- "Kendi domainimizi bağlayabilir miyiz?" → evet (DNS ayarı gerekli)

---

## 45. Üst Düzey Yönetim (Super Admin) Modülü

**Sayfalar:** `/super-admin/*` (FRONTEND ONLY, backend'de tenants/users modülleri)
**Modüller:** `tenants`, `users`, `plans` (apps/api/src/modules/)

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 45.1 | Toplam tenant | COUNT(tenants) |
| 45.2 | Aktif tenant | COUNT WHERE status=ACTIVE |
| 45.3 | Plan dağılımı | GROUP BY planId |
| 45.4 | Toplam kullanıcı | COUNT(users) |
| 45.5 | AI kullanımı (token) | SUM FROM ai_conversations |
| 45.6 | AI sohbet sayısı | COUNT FROM ai_conversations |
| 45.7 | Eğitim veri seti sayısı | COUNT FROM ai_training_data |

### Örnek Bot Sorguları
- "Kaç tenant var?" → COUNT(tenants)
- "Hangi plan en popüler?" → GROUP BY planId ORDER BY COUNT DESC
- "AI maliyeti ne kadar?" → SUM(tokens * costPerToken)

---

## 46. Banka (Banks) Modülü

**Frontend sayfaları:** `/banks/*`
**Modül:** `apps/api/src/modules/banks` (1 controller)
**Prisma modelleri:** `BankAccount`, `BankTransaction`, `PosDevice`, `PosCollection`, `PosCommission`

### Sorgulanabilir Bilgi Noktaları
| # | Veri | Hesaplama |
|---|------|-----------|
| 46.1 | Banka hesap sayısı | COUNT(bank_accounts) |
| 46.2 | Toplam banka bakiyesi | SUM(balance) tüm hesaplar |
| 46.3 | POS cihaz sayısı | COUNT(pos_devices) |
| 46.4 | POS komisyon toplamı | SUM(pos_commissions) |
| 46.5 | Vadeli mevduat | SUM WHERE type=DEPOSIT |
| 46.6 | Kredili mevduat | SUM WHERE type=LOAN |

### Örnek Bot Sorguları
- "Banka bakiyem ne?" → SUM(bank_accounts.balance)
- "Bu ay POS komisyonu?" → SUM WHERE MONTH=...
- "Tüm banka hesaplarım?" → /banks

---

## 🧠 Bot için Genel Kurallar

### Para formatı
- Yanıtlarda **₺** simgesi (TL yerine)
- Binlik ayracı **.**, ondalık **,** (Türkçe standard)
- Örnek: `12.450,00 ₺` veya kısa `12.450 ₺`

### Tarih formatı
- `GG.AA.YYYY` formatı (ör: `02.06.2026`)
- "Bugün", "dün", "bu hafta" gibi göreceli ifadeler kullanılabilir

### Olmayan/eksik veri
- "Henüz X verisi yok" gibi samimi cevap
- Belirsiz: "Müşteri ID'si gerekli" gibi net yönlendirme
- Multi-tenant gizliliği: Kendi tenant verileri dışındakine erişim yok

### Belirsiz sorgu
- Açık ve net sor: "Hangi müşteriyi sormak istiyorsunuz?"
- Olası soruları listele: "Belki şunlardan birini mi arıyorsunuz: cari bakiye, son satışlar, tahsilat geçmişi?"
- Müşteri adı yerine ID: Listele ve seçtir

### API kısıtları
- `/reports/top-debtors?limit=N` (default 20, max 100)
- `/reports/sales-trend?months=N` (default 12, max 24)
- Tüm listeleme endpointleri sayfalı (page, pageSize)

### Hesaplama doğruluğu
- Tüm rakamlar **event-sourced**: bakiyeler = SUM IN/OUT
- Multi-tenant izolasyonu: tüm sorgularda `tenant_id` filtresi
- Soft delete: `isDeleted=false` varsayılan

---

## 🔮 Gelecek: Bot API Endpoint'i

Tasarlanması önerilen endpoint (FAZ 13+):
```
POST /bot/query
{
  "question": "ABC Ltd'nin bakiyesi ne?",
  "context": { "customerId": "..." } // opsiyonel
}
→ {
  "answer": "ABC Ltd'nin cari bakiyesi 12.450 ₺ (borçlu).",
  "data": { "balance": 12450, "type": "DEBIT" },
  "source": "customer_movements",
  "confidence": 0.95,
  "followUp": ["Tahsilat geçmişi?", "Son satışlar?"]
}
```

Bu endpoint NL→SQL dönüşümü için LLM kullanabilir (GPT-4/Claude) veya rule-based intent classifier ile çalışabilir.

---

## 📝 Değişiklik Geçmişi

| Tarih | Editör | Değişiklik |
|-------|--------|------------|
| 2026-06-02 07:50 | Mavis | İlk kurulum — 8 modülün tam bilgi tabanı |
