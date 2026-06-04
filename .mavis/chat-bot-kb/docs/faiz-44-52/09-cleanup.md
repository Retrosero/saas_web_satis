# FAZ 52 — Arşivleme & Temizlik

## Kritik Kural
**Fiziksel silme YOKTUR.** Tüm temizlik işlemleri önce arşive alır, sonra soft delete yapar. Arşivden geri dönüş mümkün.

## 6 Temizlik Tipi
1. **INACTIVE_CUSTOMERS** — Pasif cariler (isActive=false)
2. **INACTIVE_PRODUCTS** — Pasif ürünler (status=PASSIVE)
3. **OLD_LOGS** — Eski security log'lar (>1 yıl)
4. **UNUSED_IMAGES** — Soft-delete'lenmiş görseller
5. **OLD_IMPORTS** — Eski import batch'leri (>6 ay)
6. **ARCHIVED_RECORDS** — Genel arşiv listesi

## Arşiv Akışı
```
1. Preview → eşleşen kayıt sayısı + örnekler
2. Run → her kayıt için:
   - ArchiveRecord tablosuna snapshot (archivedData JSON)
   - Soft delete (isDeleted=true, deletedAt=now())
   - 4 alan: tenantId, entityType, entityId, archivedData, reason, archivedById
3. Restore (TODO) → arşivden geri yükleme
```

## Backend

### CleanupService
- `getDashboard(tenantId)` → her tipte kaç tane var
- `listJobs(tenantId)` → son cleanup job'ları
- `preview(tenantId, type, filters)` → eşleşen sayı + örnekler
- `runJob(tenantId, type, filters, archive, userId)` → çalıştır

### Endpoint'ler
- `GET /cleanup/dashboard` → KPI
- `GET /cleanup/jobs` → job listesi
- `POST /cleanup/preview` → önizleme
- `POST /cleanup/run` → çalıştır

## Tablolar
- `CleanupJob` (id, tenantId, type, filters JSON, totalMatched, totalFreedMB, totalArchived, totalDeleted, status, errorMessage, preview JSON, createdById, startedAt, completedAt)
- `CleanupJobItem` (id, jobId, entityType, entityId, action, beforeState, afterState, status, error)
- `CleanupLog` (id, jobId, action, count, sizeMB, actorId, details JSON)
- `ArchiveRecord` (id, tenantId, entityType, entityId, archivedData JSON, reason, archivedById, archivedAt, restoredAt)

## Job Status
- `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`

## Frontend
- `CleanupPage` — dashboard (5 KPI kartı), tip seçici, preview, run butonu, job listesi

## Permission Key'leri
- `cleanup.view`, `cleanup.run`, `cleanup.archive`, `cleanup.delete_files`

## Sık Sorulan Sorular

**S: "Gerçekten hiç fiziksel silme yok mu?"**
C: Hayır. Tüm silme soft delete. Cleanup önce arşivler, sonra soft delete yapar.

**S: "Arşivden geri dönülebilir mi?"**
C: Restore endpoint'i TODO. Şu an manuel SQL gerekir (ArchiveRecord'tan alıp geri INSERT).

**S: "Arşiv bakiyeyi etkiler mi?"**
C: Hayır! Arşivlenen kayıtlar event sourcing sorgusundan `isDeleted: false` filtresi nedeniyle çıkarılır. Bakiye etkilenmez (FAZ 24 prensibi).

**S: "Eski log ne kadar eski?"**
C: 1 yıl. `createdAt < now() - 365 days`.

**S: "Toplam kaç kayıt arşivlenebilir?"**
C: Sınırsız. 10.000+ arşiv için BullMQ kullan (FAZ 54).

**S: "S3/R2 dosyaları siliniyor mu?"**
C: Şu an hayır. Image için R2 delete TODO. Log cleanup soft delete.

**S: "Job iptal edilebilir mi?"**
C: Şu an hayır (status CANCELLED tanımlı ama UI yok). TODO.

**S: "Audit log?"**
C: CleanupLog tablosunda her job için action + count + actor. Audit trail.
