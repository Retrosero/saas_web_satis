# HR / İK Modülü

## Genel Bakış
İK / Bordro Hazırlık Modülü, **bordro hesaplaması yapmaz** — sadece muhasebeci için gerekli olan **veri girişini organize eder ve hazırlar**. Muhasebeci kendi dış yazılımıyla (Logo, Mikro, e-Beyanname vb.) bordroyu oluşturur; bu modül ona "temiz veri" sunar.

## Modül Fazları (HR-1 .. HR-10 tamamlandı ✅)

| FAZ | Modül | Tablolar | Endpoint | Sayfa | Durum |
|-----|-------|----------|----------|-------|-------|
| HR-1 | Personel Özlük Kartı | 3 | 13 | 3 | ✅ |
| HR-2 | İşe Giriş/Çıkış Checklist | 4 | 11 | 4 | ✅ |
| HR-3 | İzin Yönetimi | 4 | 11 | 4 | ✅ |
| HR-4 | Bordro Hazırlık | 3 | 9 | 2 | ✅ |
| HR-5 | Bordro Parametreleri | 1 | 5 | 1 | ✅ |
| HR-6 | Devamsızlık + Disiplin | 2 | 6 | 1 | ✅ |
| HR-7 | Kariyer + Eğitim + Performans | 5 | 10 | 1 | ✅ |
| **HR-8** | **Puantaj (Yoklama)** | **1** | **9** | **1** | **✅** |
| **HR-9** | **Avans Yönetimi** | **2** | **8** | **1** | **✅** |
| **HR-10** | **Excel Export** | **0** | **1** | **1** | **✅** |

---

## HR-1: Personel Özlük Kartı

### Prisma Modelleri
- `HrEmployee` — Ana personel kartı
- `HrEmployeeEmploymentInfo` — İstihdam bilgisi (1-1 ilişki, ayrı tablo — sık güncellenir)
- `HrEmployeeDocument` — Evrak yönetimi (Sözleşme, KVKK, diploma vb.)

### API Base
```
/hr/employees           # Liste, oluştur
/hr/employees/:id       # Detay, güncelle, sil
/hr/employees/:id/employment  # İstihdam bilgisi
/hr/employees/:id/documents   # Evraklar
```

### Frontend
- `/hr/employees` — Liste (DataTable + MobileCardList)
- `/hr/employees/new` — Yeni personel
- `/hr/employees/:id` — Detay (tab yapısı: Kişisel / İstihdam / Evraklar)
- `/hr/employees/:id/edit` — Düzenle

### Önemli Kurallar
- **TC Kimlik ve IBAN** backend'de maskelenir (sadece `ik:sensitive_data:view` izni olan görebilir)
- **Soft delete** kullanılır (`isDeleted` + `deletedAt`)
- **Multi-tenant**: her personel `tenantId` ile izole
- **Audit log**: oluşturma/güncelleme/silme hepsi `SecurityLog`'a yazılır

### Enum'lar
- `EmployeeStatus`: `ACTIVE, INACTIVE, ON_LEAVE, SUSPENDED, TERMINATED`
- `Gender`: `MALE, FEMALE, OTHER`
- `MaritalStatus`: `SINGLE, MARRIED, DIVORCED, WIDOWED`
- `EducationLevel`: `PRIMARY, HIGH_SCHOOL, ASSOCIATE, BACHELOR, MASTER, PHD`
- `EmploymentType`: `PERMANENT, TEMPORARY, PART_TIME, CONTRACT, INTERN`
- `DocumentType`: `IDENTITY, PASSPORT, DIPLOMA, CONTRACT, KVKK, HEALTH_REPORT, BANK_INFO, OTHER`

### Permission Key'leri
- `ik:hr:view` — Tüm İK modülünü görme
- `ik:personnel:view` — Personel listesi
- `ik:personnel:create` — Yeni personel
- `ik:personnel:update` — Personel güncelle
- `ik:personnel:delete` — Personel sil
- `ik:documents:view` — Evrakları görme
- `ik:documents:upload` — Evrak yükleme
- `ik:documents:delete` — Evrak silme
- `ik:sensitive_data:view` — TC/IBAN maskelenmemiş görme

---

## HR-2: İşe Giriş / İşten Çıkış Checklist

### Prisma Modelleri
- `HrOnboardingChecklist` — İşe giriş süreç başlığı
- `HrOnboardingChecklistItem` — 12 onboarding maddesi
- `HrOffboardingChecklist` — Çıkış süreci
- `HrOffboardingChecklistItem` — 9 offboarding maddesi

### API Base
```
/hr/checklists/onboardings                   # Liste, başlat
/hr/checklists/onboardings/:id               # Detay
/hr/checklists/onboardings/:id/complete      # Süreci tamamla
/hr/checklists/onboardings/:id/cancel        # İptal
/hr/checklists/onboardings/:cid/items/:iid   # Madde durumu güncelle (PATCH)
/hr/checklists/offboardings                   # Liste, başlat
/hr/checklists/offboardings/:id              # Detay
... (aynı yapı)
```

### Frontend
- `/hr/checklists/onboardings` — Liste
- `/hr/checklists/onboardings/:id` — 12 maddelik checklist
- `/hr/checklists/offboardings` — Liste
- `/hr/checklists/offboardings/:id` — 9 maddelik checklist

### Önemli Kurallar
- **Template-based**: checklist başlatılınca template'ten (12/9) madde otomatik oluşur
- **Mükerrer engeli**: aynı personelin aktif onboarding/offboarding'i varsa yeni başlatılamaz
- **Complete koşulu**: tüm `isRequired` maddeler `DONE` veya `NOT_APPLICABLE` olmalı
- **Offboarding complete**: personel status otomatik `TERMINATED` yapılır

### Template Maddeleri

**ONBOARDING (12 madde):** identity_info, contact_info, bank_info, contract, kvkk, sgk_entry, department, role, inventory, osh_training, health_report, probation

**OFFBOARDING (9 madde):** termination_date, reason, sgk_exit_code, unused_leave, advance_debt, inventory_return, last_work_day, exit_documents, access_revoked

### Enum'lar
- `HrOnboardingStatus`: `NOT_STARTED, IN_PROGRESS, PENDING_DOCS, COMPLETED, CANCELLED`
- `HrOnboardingItemStatus`: `PENDING, IN_PROGRESS, DONE, BLOCKED, NOT_APPLICABLE`

---

## HR-3: İzin Yönetimi

### Prisma Modelleri
- `HrLeaveType` — İzin türleri (ANNUAL, WEEKLY, UNPAID, MATERNITY, PATERNITY, SICK, DEATH, EXCUSE, COMPENSATION, MARRIAGE)
- `HrLeaveBalance` — Personel/yıl bazlı bakiye (`tenantId_employeeId_leaveTypeId_year` unique)
- `HrLeaveRequest` — İzin talepleri (PENDING → APPROVED/REJECTED/CANCELLED)
- `HrLeaveAdjustment` — Manuel bakiye düzeltme logları

### API Base
```
/hr/leave/types              # Liste, oluştur, güncelle
/hr/leave/balances           # Tüm bakiyeler (filtreli)
/hr/leave/balances/:empId    # Personel bakiyesi (yıl bazlı)
/hr/leave/balances/initialize  # Yıl başı bakiye oluştur (toplu)
/hr/leave/balances/adjust    # Manuel düzeltme
/hr/leave/requests           # Talepler listesi, oluştur
/hr/leave/requests/:id       # Talep detay
/hr/leave/requests/:id/approve   # Onayla
/hr/leave/requests/:id/reject    # Reddet
/hr/leave/requests/:id/cancel   # İptal et
```

### Frontend
- `/hr/leave/types` — İzin türü CRUD + modal form
- `/hr/leave/requests` — Talep listesi + filtre
- `/hr/leave/requests/new` — Yeni talep formu
- `/hr/leave/requests/:id` — Detay + onay/reddet/iptal

### Bakiye Hesaplama
```
availableDays = accruedDays + carriedOverDays - usedDays - pendingDays
```
- `accruedDays`: biriken gün (yıl başında tam veya aylık eşit)
- `carriedOverDays`: önceki yıldan devir (max carryOverDays kadar)
- `usedDays`: onaylanan kullanılmış
- `pendingDays`: onay bekleyen (rezerve)

### Accrual Methods
- `STANDARD`: Yıl başında tam birikir
- `MONTHLY`: Her ay eşit (defaultDaysPerYear/12)
- `NONE`: Sınırsız (ücretli izin vb.)

### İzin Türleri (Seed)
| Kod | Ad | Birikim | Ücretli | Devir |
|-----|----|--------|---------|-------|
| ANNUAL | Yıllık İzin | STANDARD | ✅ | 14 gün |
| WEEKLY | Haftalık İzin | STANDARD | ✅ | ❌ |
| UNPAID | Ücretsiz İzin | NONE | ❌ | ❌ |
| MATERNITY | Doğum İzni | STANDARD | ✅ | ❌ |
| PATERNITY | Babalık İzni | STANDARD | ✅ | ❌ |
| SICK | Hastalık İzni | NONE | ✅ | ❌ |
| DEATH | Ölüm İzni | STANDARD | ✅ | ❌ |
| EXCUSE | Mazeret İzni | STANDARD | ✅ | ❌ |
| COMPENSATION | İzin Kullanımı | STANDARD | ✅ | ❌ |

### Enum'lar
- `HrLeaveTypeCode`: ANNUAL, WEEKLY, UNPAID, MATERNITY, PATERNITY, SICK, DEATH, EXCUSE, COMPENSATION, MARRIAGE
- `HrLeaveAccrualMethod`: STANDARD, MONTHLY, NONE
- `HrLeaveRequestStatus`: PENDING, APPROVED, REJECTED, CANCELLED

---

## HR-4: Bordro Hazırlık

### Prisma Modelleri
- `HrPayrollPeriod` — Bordro dönemi (ay/hafta başına, unique tenant+year+period+periodType)
- `HrPayrollRecord` — Personel başına bordro satırı (veri girişi)
- `HrPayrollSupplement` — Ek kalemler (prim, ikramiye, kesinti)

### API Base
```
/hr/payroll/periods              # Liste, oluştur, güncelle
/hr/payroll/periods/:id           # Detay
/hr/payroll/periods/:id/confirm   # Onayla (DRAFT→CONFIRMED)
/hr/payroll/periods/:id/export    # Dışa aktar (muhasebeye gönder)
/hr/payroll/periods/:id/close     # Kapat (EXPORTED→CLOSED)
/hr/payroll/periods/:id/initialize # Tüm personeller için satır oluştur
/hr/payroll/records               # Dönem bordro satırları (upsert)
/hr/payroll/supplements           # Ek kalemler (ekle/sil)
```

### Frontend
- `/hr/payroll` — Dönem listesi + yıl filtre + oluşturma modalı
- `/hr/payroll/:id` — Bordro satırları listesi + düzenleme modalı + onay/export/kapat

### Akış
```
DRAFT → REVIEW → CONFIRMED → EXPORTED → CLOSED
```
- **DRAFT**: Veri girişi açık
- **REVIEW**: İnceleme aşaması
- **CONFIRMED**: Onaylandı, dışa aktarıma hazır
- **EXPORTED**: Muhasebeye gönderildi
- **CLOSED**: Kapatıldı, değişiklik yok

### Bordro Veri Girişi Alanları
- `workingDays` — Çalışma günü
- `absentDays` — Devamsız gün (maaştan düşülür)
- `overtimeHours` — Fazla mesai saat
- `lateHours` — Geç kalma saat
- `baseSalary` — Aylık brüt ücret
- `grossPay` — Brüt toplam
- `sgkEmployee` — SGK çalışan payı
- `unemploymentEmployee` — İşsizlik sigortası çalışan
- `incomeTax` — Gelir vergisi
- `netPay` — Net ödenen

### NOT: Hesaplama yapılmaz
Bu modül sadece veri girişi sunar. Hesaplamayı muhasebe kendisi yapar. Bu modülün amacı muhasebeye "temiz, organize veri" sunmaktır.

### Enum'lar
- `PayrollPeriodType`: MONTHLY, WEEKLY
- `PayrollPeriodStatus`: DRAFT, REVIEW, CONFIRMED, EXPORTED, CLOSED
- `PayrollRecordStatus`: DRAFT, REVIEW, CONFIRMED, EXPORTED
- `SupplementType`: BONUS, INCENTIVE, ALLOWANCE, DEDUCTION, SOCIAL_SEC, TAX, OTHER

---

## HR-5: Bordro Parametreleri

### Prisma Modelleri
- `HrPayrollParam` — SGK oranları, vergi dilimleri, asgari ücret (unique tenant+year+paramKey)

### API Base
```
/hr/payroll-params          # Liste (yıl bazlı)
/hr/payroll-params/map      # Yılın tüm parametreleri (key→value map)
/hr/payroll-params          # Upsert (parametre güncelle/oluştur)
/hr/payroll-params/bulk     # Toplu güncelle
/hr/payroll-params/seed     # Varsayılanları yükle (yeni tenant/yıl için)
```

### Parametre Anahtarları (Defaults — yıl 2025)
| Parametre | Değer | Açıklama |
|-----------|-------|---------|
| `min_wage` | 42600 | Asgari ücret (brüt, günlük) |
| `sgk_employee_rate` | 0.14 | SGK çalışan primi oranı |
| `sgk_employer_rate` | 0.155 | SGK işveren payı oranı |
| `unemployment_employee_rate` | 0.01 | İşsizlik çalışan |
| `unemployment_employer_rate` | 0.02 | İşsizlik işveren |
| `agc_rate` | 0.15 | AGCV kesinti oranı |
| `agc_exemption_limit` | 15000 | AGCV istisna tutarı |
| `meal_allowance_daily` | 272 | Yemek ücreti (günlük) |
| `transport_allowance_monthly` | 10000 | Yol ücreti (aylık) |

---

## HR-6: Devamsızlık ve Disiplin

### Prisma Modelleri
- `HrAbsenceRecord` — Devamsızlık kayıtları (ücretsiz izin, hastalık, izinsiz, geç kalma, erken çıkış)
- `HrDisciplinaryCase` — Disiplin dosyaları (DISC-YYYY-NNN formatında caseNo)

### API Base
```
/hr/absences                    # Liste, oluştur, güncelle, sil
/hr/disciplinary                # Liste, oluştur
/hr/disciplinary/:id/close      # Dosyayı kapat (yaptırım uygula)
```

### Frontend
- `/hr/hr567` — Tek sayfa, 5 tab (devamsızlık, disiplin, kariyer, eğitim, performans)

### Devamsızlık Türleri
| Kod | Ad | Açıklama |
|-----|----|---------|
| UNPAID_LEAVE | Ücretsiz İzin | İzinli devamsızlık |
| SICK | Hastalık | Sağlık raporu ile |
| UNAUTHORIZED | İzinsiz Devamsızlık | Mazeretsiz |
| LATE | Geç Kalma | Belirli saatten sonra geliş |
| EARLY_LEAVE | Erken Çıkış | İzin almadan ayrılma |
| OTHER | Diğer | |

### Disiplin Yaptırım Türleri
| Kod | Ad |
|-----|----|
| WARNING | Uyarı |
| SUSPENSION | Tecil/Mesai Durdurma |
| SALARY_CUT | Maaş Kesintisi |
| TERMINATION | İşten Çıkarma |
| OTHER | Diğer |

---

## HR-7: Kariyer, Eğitim, Performans

### Prisma Modelleri
- `HrCareerRecord` — Terfi, transfer, maaş değişikliği, unvan değişikliği
- `HrTraining` — Eğitim programları
- `HrTrainingParticipant` — Eğitime katılımcılar
- `HrPerformanceReview` — Performans değerlendirmeleri

### API Base
```
/hr/career              # Kariyer kayıtları listesi, oluştur
/hr/trainings           # Eğitim listesi, oluştur
/hr/trainings/:id/participants  # Katılımcı ekle
/training-participants/:id     # Katılımcı puan/sertifika güncelle
/hr/performance         # Performans listesi, upsert
/hr/performance/:id/complete    # Değerlendirmeyi tamamla
```

### Frontend
- `/hr/hr567` — 5 tab, kariyer/eğitim/performans ayrı sekmelerde

### Kariyer Kayıt Türleri
| Kod | Ad |
|-----|----|
| PROMOTION | Terfi |
| TRANSFER | Transfer |
| SALARY_CHANGE | Maaş Değişikliği |
| TITLE_CHANGE | Unvan Değişikliği |

### Eğitim Durumları
| Kod | Ad |
|-----|----|
| PLANNED | Planlandı |
| IN_PROGRESS | Devam Ediyor |
| COMPLETED | Tamamlandı |
| CANCELLED | İptal Edildi |

### Katılımcı Durumları
| Kod | Ad |
|-----|----|
| REGISTERED | Kayıtlı |
| ATTENDED | Katıldı |
| COMPLETED | Tamamladı |
| CANCELLED | İptal Etti |
| NO_SHOW | Gelmedi |

### Performans Değerlendirme Durumları
| Kod | Ad |
|-----|----|
| PENDING | Beklemede |
| SELF_REVIEW | Öz Değerlendirme |
| MANAGER_REVIEW | Yönetici Değerlendirmesi |
| COMPLETED | Tamamlandı |

### Performans Kriterleri (1-5 puan)
- `taskCompletion` — Görev tamamlama
- `teamwork` — Takım çalışması
- `communication` — İletişim
- `problemSolving` — Problem çözme
- `leadership` — Liderlik
- `overallScore` — Genel puan

---

## HR-8: Puantaj (Yoklama)

### Prisma Modelleri
- `HrPunchRecord` — Günlük giriş/çıkış kaydı (employeeId + punchDate unique)

### API Base
```
/hr/punch                          # Tarihe göre liste
/hr/punch                          # Upsert (giriş/çıkış kaydı)
/hr/punch/summary                 # Personel dönem özeti
/hr/punch/sync-to-payroll          # Bordro dönemine senkronizasyon
```

### Frontend
- `/hr/hr8910` — Puantaj tablosu (tarih seçici, tüm personel)

### Otomatik Hesaplamalar
- **totalHours** = (clockOut - clockIn) saat
- **overtimeHours** = max(0, totalHours - 8)
- **lateMinutes** = max(0, (clockIn - 09:00) dakika)
- **earlyMinutes** = max(0, (18:00 - clockOut) dakika)

### Enum'lar
- `PunchStatus`: `CLOCKED_IN, CLOCKED_OUT, ON_BREAK, ABSENT`

---

## HR-9: Avans Yönetimi

### Prisma Modelleri
- `HrAdvanceRequest` — Avans talepleri (PENDING → APPROVED/REJECTED/PAID/DEDUCTED)
- `HrAdvanceRepayment` — Bordroya mahsup kayıtları

### API Base
```
/hr/advances                       # Liste (employeeId, status filter)
/hr/advances                       # Yeni talep
/hr/advances/:id/approve          # Onayla
/hr/advances/:id/pay              # Öde (PAID + deductionMonth)
/hr/advances/:id/reject           # Reddet
/hr/advances/:id/deduct           # Bordroya mahsup et
/hr/advances/active-total         # Personelin aktif borç toplamı
```

### Frontend
- `/hr/hr8910` — Avanslar tab (filtreler, yeni talep modal, onay/ödeme butonları)

### Akış
```
PENDING → APPROVED → PAID → DEDUCTED
              ↓
          REJECTED
```

### Enum'lar
- `AdvanceStatus`: `PENDING, APPROVED, REJECTED, PAID, DEDUCTED`

---

## HR-10: Excel Export

### API Base
```
POST /hr/payroll/:periodId/export-excel
```

### Üretilen Excel Dosyası
- **5 sheet**: Puantaj, İzinler, Avanslar, Bordro, Özet
- **Otomatik toplamlar**: Brüt toplam, SGK toplam, vergi toplam, net toplam
- **Mali müşavir formatı**: Direkt Logo/Mikro/e-Beyanname sistemine aktarılabilir

### Frontend
- `/hr/hr8910` — Excel Export tab (yıl seçici, dönem listesi, "İndir" butonu)

### Sheet Detayları
| Sheet | Kolonlar |
|-------|----------|
| Puantaj | Personel No, Ad, Çalışma Günü, Devamsız, Saat, Mesai, Geç Kalma, Erken Çıkış |
| İzinler | Personel No, Ad, Tür, Kullanılan, Bekleyen, Kalan |
| Avanslar | Personel No, Ad, Aktif, Ödenen, Mahsup |
| Bordro | Tüm bordro satırları (brüt, SGK, vergi, net) |
| Özet | Dönem bilgisi, personel sayısı, toplam brüt/net |

---

## Yeni HR Modülü Ekleme Adımları

1. **Prisma schema'ya tablo ekle** → `apps/api/prisma/schema.prisma`
2. **Migration oluştur**: `apps/api/prisma/migrations/<timestamp>_hr_X/`
3. **Shared enum/type ekle**: `packages/shared/src/enums/`, `packages/shared/src/types/`
4. **Shared index'e ekle**: `packages/shared/src/index.ts` (barrel export)
5. **Service yaz** (flat: `apps/api/src/modules/hr/hr-X.service.ts`)
6. **Controller yaz** (flat: `apps/api/src/modules/hr/hr-X.controller.ts`)
7. **Module'a ekle**: `apps/api/src/modules/hr/hr.module.ts`
8. **Permission key ekle** (gerekirse): `apps/api/src/modules/hr/common/`
9. **Frontend API hook'ları**: `apps/web/src/features/hr/api.ts`
10. **Frontend sayfaları**: `apps/web/src/pages/hr/`
11. **Router'a ekle**: `apps/web/src/router.tsx`
12. **CHAT-BOT-KNOWLEDGE.md güncelle**: docs/CHAT-BOT-KNOWLEDGE.md ve .mavis/chat-bot-kb/docs/modules/hr.md
13. **Commit + push**

## Sık Karşılaşılan Sorunlar

### "Cannot find module '../../common/guards/jwt-auth.guard.js'"
- **Neden**: TypeScript 6.0.3 + `moduleResolution: Node10` alt klasörlerde relative path çözemiyor
- **Çözüm**: HR dosyalarını **düz** tut (`modules/hr/*.ts`), alt klasör açma

### TC Kimlik / IBAN frontend'de boş geliyor
- **Neden**: Backend bu alanları maskeleyip dönüyor (güvenlik)
- **Çözüm**: `ik:sensitive_data:view` izni olmalı, yoksa "********" gösterilir

### Checklist item durum değiştirilemiyor
- **Neden**: Checklist `COMPLETED` veya `CANCELLED` durumunda ise kilitli
- **Çözüm**: Önce status güncellemesi gerekiyor (yeni bir checklist başlat)

### Bordro hesaplamıyor
- **Neden**: HR-4 sadece veri girişi sunar, hesaplama yapmaz
- **Çözüm**: Hesaplamayı muhasebe kendisi yapar; bu modül sadece veri organize eder

## Bot Sorgu Senaryoları (HR-1 .. HR-7)

| Soru | Modül | Endpoint / Mantık |
|---|---|---|
| "Kaç aktif personelimiz var?" | HR-1 | COUNT WHERE status=ACTIVE |
| "İzin talebi bekleyen var mı?" | HR-3 | COUNT WHERE status=PENDING |
| "Ayşe'nin yıllık izni ne kadar kaldı?" | HR-3 | Bakiye: accruedDays + carriedOverDays - usedDays - pendingDays |
| "Bu ay kimler izinli?" | HR-3 | WHERE startDate <= today AND endDate >= today AND status=APPROVED |
| "Haziran bordrosu hazır mı?" | HR-4 | GET /hr/payroll/periods?year=2025 → status kontrolü |
| "Toplam brüt ne kadar?" | HR-4 | SUM(grossPay) WHERE periodId=X |
| "Muhasebeye nasıl gönderirim?" | HR-4 | POST /hr/payroll/periods/:id/export |
| "Bu ay kaç devamsızlık var?" | HR-6 | COUNT WHERE startDate >= 1.month |
| "Disiplin dosyası nasıl açarım?" | HR-6 | POST /hr/disciplinary |
| "Eğitim programları neler?" | HR-7 | GET /hr/trainings?status=PLANNED |
| "2025 asgari ücret ne?" | HR-5 | GET /hr/payroll-params/map?year=2025 → min_wage |
| "Performans değerlendirmesi ne zaman?" | HR-7 | COUNT WHERE status=PENDING |