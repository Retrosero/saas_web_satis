#!/bin/bash
set -e
cd /workspace
git add -A
git commit -m "feat(faz3.5): bildirim sistemi (in-app) — merkez sayfası + topbar dropdown

FAZ 3.5 — Bildirim Sistemi (in-app, gerçek zamanlı polling)

@backend:
- /notifications: list (filtre + kategori + sayfalama)
- /notifications/unread-count: badge için
- /notifications/recent: son 5 (dropdown için)
- /notifications/:id/read: tek okundu işaretle
- /notifications/mark-all-read: toplu okundu
- /notifications/:id: sil
- NotificationsService.create() helper — diğer modüller bildirim üretebilir
- NotificationsModule global — tüm modüller kullanabilir
- Prisma schema: Notification tablosu + NotificationType/Category enum
- Migration SQL güncellendi (504 satır)
- Seed: 6 örnek bildirim (süper admin + demo tenant)

@frontend:
- /notifications sayfası: filtre (Tümü/Okunmamış) + kategori + tablo
  + okundu işaretle + toplu okundu + sil
- Topbar dropdown: 5 son bildirim + 'Tümünü Gör' linki
- Real-time polling: 30 saniye interval (refetchInterval)
- 5 farklı bildirim tipi ikonu (INFO/SUCCESS/WARNING/ERROR/SYSTEM)
- 12 kategori rozeti (SYSTEM/SECURITY/TENANT/PLAN/MODULE/...)
- Okunmamış badge (topbar'da kırmızı yuvarlak)
- Okunmamış inline dot (satır başında mavi nokta)

Doğrulamalar:
- shared/api/web build temiz
- PWA 26 entry (önceki 24)
- typecheck geçti
- 3 yeni screenshot: notif-page, notif-unread, notif-dropdown

Sıradaki: FAZ 4 — Paket/Modül Sistemi (UI)" 2>&1 | tail -3
git log --oneline
