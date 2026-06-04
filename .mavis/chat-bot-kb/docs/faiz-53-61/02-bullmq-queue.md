# FAZ 54 — BullMQ Queue + Workers

## Amaç
Zaman alan işleri (mail, PDF, rapor, bulk) arka planda çalıştır. API response süresini sabit tut.

## Stack
- **@nestjs/bullmq**
- **bullmq** (Redis-backed queue)

## 3 Queue

### 1. MAIL Queue (concurrency: 5)
- Şifre sıfırlama
- Kullanıcı davet
- Quote gönderildi bildirimi
- Ödeme hatırlatma
- Toplu mail

### 2. REPORT Queue (concurrency: 2)
- Haftalık/aylık raporlar
- PDF üretimi
- Excel export
- Pivot raporlar

### 3. BULK Queue (concurrency: 1)
- 100+ kayıtlık toplu işlemler
- Büyük import'lar
- Toplu mail/SMS gönderimi

## Default Job Options
```ts
{
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: { age: 7 * 24 * 3600, count: 1000 },
  removeOnFail: { age: 30 * 24 * 3600, count: 5000 }
}
```

## 3 Processor (Worker)

### MailProcessor
- `process(job)`: mail gönder (simülasyon), return sentAt
- `onFailed(job, err)`: log error

### ReportProcessor
- `process(job)`: rapor üret, return reportKey + size

### BulkProcessor
- `process(job)`: 5 batch'te işle, `updateProgress` ile ilerleme

## API

### QueueService
- `enqueueMail(payload)` → `{ jobId, queue }`
- `enqueueReport(payload)` → `{ jobId, queue }`
- `enqueueBulk(payload)` → `{ jobId, queue }`
- `getAllQueues()` → counts (waiting/active/completed/failed/delayed)
- `getJobs(queueName, status, start, end)` → job listesi
- `retryJob(queueName, jobId)`, `removeJob(queueName, jobId)`

## Endpoint'ler (8)
- `GET /queue-admin/queues` → 3 queue counts
- `GET /queue-admin/queues/:name/jobs?status=...` → job listesi
- `POST /queue-admin/queues/:name/jobs/:jobId/retry` → retry
- `DELETE /queue-admin/queues/:name/jobs/:jobId` → sil
- `POST /queue-admin/mail/enqueue` → test mail
- `POST /queue-admin/report/enqueue` → test rapor
- `POST /queue-admin/bulk/enqueue` → test bulk

## Frontend
- `/system/queues` sayfası — 3 queue kartı + 5 status tab + job listesi + 3 test paneli

## Sık Sorulan Sorular

**S: "Queue nerede çalışıyor?"**
C: Redis (BullMQ Redis-backed). Worker'lar NestJS process'inin içinde.

**S: "Failed job ne olur?"**
C: 3 deneme (exponential backoff). Hâlâ failed ise 30 gün saklanır, manuel retry yapılabilir.

**S: "Job progress UI'da görünür mü?"**
C: BulkProcessor'da `job.updateProgress((i/5)*100)` ile. QueueService.getJobs'tan okunabilir.

**S: "Worker restart edilirse?"**
C: Redis'te job'lar duruyor, worker geri gelince otomatik devam eder. "At-least-once" delivery.

**S: "Queue uzunluğu nereden bakılır?"**
C: Admin paneli `/system/queues` veya endpoint `GET /queue-admin/queues`.

**S: "Cron + queue?"**
C: `@nestjs/schedule` ile cron tanımla, içinden `queueService.enqueueReport()` çağır.

**S: "DLQ (Dead Letter Queue)?"**
C: Şu an yok. failed job'lar 30 gün Redis'te kalır. DLQ TODO.
