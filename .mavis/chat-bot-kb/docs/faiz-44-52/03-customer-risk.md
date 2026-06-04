# FAZ 46 — Müşteri Risk Sistemi

## Amaç
Müşterilerin ödeme/alışveriş davranışına göre risk seviyesi hesapla, erken uyarı ver.

## Risk Seviyeleri
- **LOW** (Düşük) — skor 0-19
- **MEDIUM** (Orta) — skor 20-39
- **HIGH** (Yüksek) — skor 40-69
- **CRITICAL** (Kritik) — skor 70+

## Risk Skoru Formülü
```
riskScore = 0
if (balance > balanceCritical) +40
else if (balance > balanceWarning) +20
if (daysSinceOrder > daysSinceOrderCrit) +30
else if (daysSinceOrder > daysSinceOrderWarn) +15
if (daysSincePayment > daysSincePaymentCrit) +30
```

## Default Config Eşikleri
```ts
{
  balanceWarning: 10000,      // TRY
  balanceCritical: 50000,    // TRY
  daysSinceOrderWarn: 60,    // gün
  daysSinceOrderCrit: 120,   // gün
  daysSincePaymentWarn: 45,
  daysSincePaymentCrit: 90
}
```

## Backend

### CustomerRiskService
- `computeForCustomer(tenantId, customerId)` — tek müşteri hesapla
- `refreshAll(tenantId)` — tüm tenant müşterilerini tara, snapshot oluştur
- `listAtRisk(tenantId, level, minBalance, page, pageSize)` — riskli müşteri listesi
- `getDashboard(tenantId)` — KPI dashboard (low/medium/high/critical counts)
- `listConfigs(tenantId)`, `upsertConfig(tenantId, input)` — config yönetimi

### Endpoint'ler
- `GET /customer-risk/dashboard` → KPI counts
- `GET /customer-risk/at-risk?level=&minBalance=&page=&pageSize=` → liste
- `POST /customer-risk/refresh` → tüm tenant'ı tara
- `GET /customer-risk/configs` → config listesi
- `POST /customer-risk/configs` → config oluştur/güncelle

## Tablolar
- `CustomerRiskConfig` (id, tenantId, name, balanceWarning, balanceCritical, daysSinceOrderWarn, daysSinceOrderCrit, daysSincePaymentWarn, daysSincePaymentCrit, overdue30Warn, overdue60Warn, overdue90Crit, isDefault, isActive)
- `CustomerRiskSnapshot` (id, tenantId, customerId, customerName, riskLevel, balance, overdue30, overdue60, overdue90, daysSinceOrder, daysSincePayment, riskScore, reasons, snapshotAt)

## Frontend
- `CustomerRiskPage` — dashboard + filtreli liste (level bazlı)
- `RiskConfigPage` — config düzenleme formu

## Permission Key'leri
- `customer_risk.view`
- `customer_risk.manage`
- `customer_risk.report`

## Sık Sorulan Sorular

**S: "Risk nasıl hesaplanıyor?"**
C: Bakiye + son sipariş günü + son ödeme günü. Her faktör ağırlıklı puan, 70+ kritik, 40+ yüksek.

**S: "Bakiye nereden geliyor?"**
C: Event sourcing'den — `SUM(CustomerMovement.amount)` ile hesaplanır, SAKLANMAZ.

**S: "Snapshot ne zaman alınır?"**
C: Manuel (refresh butonu) veya cron ile. Configurable. Mevcut: sadece manuel tetikleme.

**S: "Risk seviyesi düşürülebilir mi?"**
C: Config eşikleri değiştirilerek evet. Veya müşteri ödeme yapar/sipariş verirse otomatik düşer.

**S: "Critical müşteri için ne yapılmalı?"**
C: Dashboard'da kırmızı badge, ayrı sayfa, mail bildirimi (opsiyonel, FAZ 32 notification rule ile entegre edilebilir).

**S: "Tüm tenant'ı refresh etmek ne kadar sürer?"**
C: 1000 müşteri için ~10s. 10.000 müşteri için ~2dk. BullMQ'ya alınabilir (FAZ 54'te queue mevcut).
