#!/bin/bash
set -e
cd /workspace
git add -A
git commit -m "feat(faz4): paket/modül/kullanıcı yönetimi — tenant admin kendi ortamını yönetir

FAZ 4 — Paket/Modül/Kullanıcı Yönetimi (kullanıcı tarafı)

@backend:
- /tenant-admin/me (GET/PATCH): tenant bilgisi
- /tenant-admin/subscription: plan + kullanım (userCount, modül, storage)
- /tenant-admin/modules: aktif + kullanılabilir + kategori
- /tenant-admin/modules/:code/toggle: modül aç/kapat (override)
  → Tüm tenant kullanıcılarına bildirim gönderir
- /tenant-admin/users (GET/POST): kullanıcı listele/davet et
  → Limit kontrolü + davet bildirimi
- /tenant-admin/users/:id (PATCH/DELETE): güncelle/sil
- /tenant-admin/users/:id/role: rol ata
- /tenant-admin/roles (GET/POST): rol listele/oluştur
- /tenant-admin/roles/:id/permissions (PUT): yetki güncelle
- Bildirim entegrasyonu: modül değişikliği + kullanıcı daveti otomatik bildirim üretir

@frontend:
- SettingsLayout: sidebar'lı ayarlar ortamı (Genel, Paket, Modüller, Kullanıcılar, Roller)
- /settings (genel): firma bilgileri kartı + 4 quick link
- /settings/subscription: M3 plan kartı (gradient) + kullanım barları + limitler
- /settings/modules: aktif/kullanılabilir modüller + toggle + kategori rozetleri
- /settings/users: tablo + davet modal (RHF + Zod) + rol atama dropdown
- /settings/roles: sistem/özel rozetleri + tablo (basit)
- Real-time bildirim entegrasyonu: modül toggle ve kullanıcı davetinde otomatik bildirim

@ui-test:
- 5 yeni screenshot: settings-overview/subscription/modules/users/roles
- Build temiz (PWA 39 entry — önceki 26)
- Typecheck geçti

Sıradaki: FAZ 5 — Log & Audit UI (tenant bazlı log görüntüleme)" 2>&1 | tail -3
git log --oneline | head -8
