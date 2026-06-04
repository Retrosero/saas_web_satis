# FAZ HR-3: İzin Yönetimi

## Tablolar

### HrLeaveType
İzin türleri tanımı (sistem + custom).

| Alan | Tip | Açıklama |
|------|-----|---------|
| id | String | PK |
| tenantId | String | Çoklu-tenant |
| name | String | "Yıllık İzin", "Haftalık İzin", "Ücretsiz İzin" |
| code | String | "ANNUAL", "WEEKLY", "UNPAID", "MATERNITY", "PATERNITY", "SICK", "DEATH" |
| color | String | CSS color hex |
| icon | String | emoji veya icon name |
| accrualMethod | Enum | STANDARD, MONTHLY, NONE |
| defaultDaysPerYear | Int | Yıllık hak (örn. 14, 18, 24) |
| requiresApproval | Boolean | Yönetici onayı gerekiyor mu |
| requiresDocument | Boolean | Belge gerektiriyor mu |
| minDaysNotice | Int | Kaç gün önce başvuru |
| maxConsecutiveDays | Int | Maks ardışık gün (0 = sınırsız) |
| canCarryOver | Boolean | Yıl sonra devir edebilir mi |
| carryOverDays | Int | Devir edilecek max gün (0 = sınırsız) |
| isPaid | Boolean | Ücretli mi |
| isActive | Boolean | Aktif mi |

### HrLeaveBalance
Personel bazında izin bakiyesi.

| Alan | Tip | Açıklama |
|------|-----|---------|
| id | String | PK |
| tenantId | String | |
| employeeId | String | FK → HrEmployee |
| leaveTypeId | String | FK → HrLeaveType |
| year | Int | Hangi yıl (2026) |
| entitledDays | Int | Yıllık hak |
| accruedDays | Int | Kullanılabilir (accrual'dan) |
| usedDays | Decimal | Kullanılmış gün |
| pendingDays | Decimal | Bekleyen (onayda) |
| carriedOverDays | Int | Devir edilen |
| expiresAt | DateTime | Bakiyenin geçersiz olduğu tarih |

### HrLeaveRequest
İzin talebi.

| Alan | Tip | Açıklama |
|------|-----|---------|
| id | String | PK |
| tenantId | String | |
| employeeId | String | FK → HrEmployee |
| leaveTypeId | String | FK → HrLeaveType |
| startDate | DateTime | İzin başlangıcı |
| endDate | DateTime | İzin bitişi |
| totalDays | Decimal | Toplam gün (hafta sonu dahil) |
| workingDays | Decimal | İş günü (hafta sonu hariç) |
| reason | String? | Açıklama |
| status | Enum | PENDING, APPROVED, REJECTED, CANCELLED |
| approverId | String? | Onaylayan kullanıcı |
| approvedAt | DateTime? | |
| rejectedAt | DateTime? | |
| rejectionReason | String? | Red nedeni |
| documentUrl | String? | Belge URL |
| replacementEmployeeId | String? | Yerine bakacak kişi |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### HrLeaveApproval
Çoklu onay adımı (varsa).

| Alan | Tip | Açıklama |
|------|-----|---------|
| id | String | PK |
| tenantId | String | |
| requestId | String | FK → HrLeaveRequest |
| approverId | String | Kullanıcı |
| step | Int | Adım sırası |
| status | Enum | PENDING, APPROVED, REJECTED |
| comment | String? | Yorum |
| actionAt | DateTime? | |

---

## İş Kuralları

1. **Başvuru yaparken:**
   - `totalDays` = (endDate - startDate) + 1
   - `workingDays` = hafta içi gün sayısı (Cumartesi+Pazar hariç)
   - `pendingDays` += workingDays (bakiyeden önce rezerve)
   - `canCarryOver` kontrolü

2. **Onaylandığında:**
   - `pendingDays` → `usedDays` geçer
   - `balance.accruedDays` düşer

3. **Reddedildiğinde:**
   - `pendingDays` sıfırlanır

4. **İptal edildiğinde:**
   - `pendingDays` sıfırlanır (onaylanmadıysa)
   - `usedDays` iade edilir (onaylandıysa)

5. **Accrual (birikim):**
   - `STANDARD`: Yıl başında `defaultDaysPerYear` kadar hak
   - `MONTHLY`: Her ay `defaultDaysPerYear / 12` kadar birikir
   - `NONE`: Sınırsız (ücretsiz izin gibi)

6. **Devir:**
   - Yıl sonunda `canCarryOver` kontrolü
   - `carriedOverDays` = min(kullanılmayan, carryOverDays)

---

## Enpoints

```
GET    /hr/leave-types          → İzin türleri listesi
POST   /hr/leave-types          → Yeni izin türü oluştur
PATCH  /hr/leave-types/:id      → Güncelle

GET    /hr/leave-balances       → Tüm bakiyeler (?employeeId=, ?year=)
GET    /hr/leave-balances/:employeeId → Personelin bakiyeleri
POST   /hr/leave-balances/adjust → Manuel bakiye düzeltme

GET    /hr/leave-requests       → Talepler (?status=, ?employeeId=, ?start=, ?end=)
POST   /hr/leave-requests       → Yeni talep
GET    /hr/leave-requests/:id   → Detay
PATCH  /hr/leave-requests/:id    → Güncelle (iptal)
POST   /hr/leave-requests/:id/approve → Onayla
POST   /hr/leave-requests/:id/reject  → Reddet

GET    /hr/leave-approvals       → Bekleyen onaylar (yönetici için)
```

---

## Frontend Sayfaları

1. `/hr/leave-types` — İzin türleri yönetimi (admin)
2. `/hr/leave-balances` — Personel bakiyeleri (admin)
3. `/hr/leave-requests` — Talepler listesi
4. `/hr/leave-requests/new` — Yeni talep formu
5. `/hr/leave-requests/:id` — Talep detay + onay/red butonu

---

## Accrual Template (shared)

Her yıl Ocak'ta otomatik:
```typescript
ACCURAL_TEMPLATE = [
  { code: 'ANNUAL', years: 1-5, days: 14 },
  { code: 'ANNUAL', years: 6-15, days: 20 },
  { code: 'ANNUAL', years: 16+, days: 26 },
]
```
Kıdem yılına göre gün hesaplanır. Bu shared/constant'ta tutulur.