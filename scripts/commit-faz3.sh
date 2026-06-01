#!/bin/bash
set -e
cd /workspace
git add -A
git status --short | head -20
echo "---"
git commit -m "feat(faz3): süper admin paneli — dashboard, firmalar, kullanıcılar, paketler, modüller

FAZ 3 — Auth & Tenant & Süper Admin kapsamında:

@backend:
- /super-admin/overview: detaylı özet (firma/kullanıcı/modül/paket sayıları
  + son firmalar, son kullanıcılar, son hatalar)
- /super-admin/tenants: liste + detay (ayar/abonelik/istatistik)
- /super-admin/tenants (POST): yeni firma + plan atama
- /super-admin/tenants/:id/status: aktif/pasif
- /super-admin/tenants/:id/assign-plan: plan değiştir + modül senkron
- /super-admin/tenants/:id/modules/toggle: manuel modül aç/kapat
  (override + tarihli + not)
- /super-admin/plans: plan listesi (modül/abone sayılarıyla)
- /super-admin/modules: modül kataloğu
- /super-admin/users: tüm kullanıcılar (cross-tenant + tenant filtreleme)

@frontend:
- Sidebar: super_admin rolü için ayrı menü bölümü (Süper Admin + İşletme)
- Login sonrası role-based redirect (super_admin → /super-admin/dashboard,
  diğerleri → /dashboard)
- 5 yeni sayfa: SuperAdminDashboard, Tenants, TenantDetail, Plans, Modules, Users
- Her sayfada filterbar + arama + tablo + EmptyState + LoadingState
- Yeni firma oluşturma modal'ı (kod otomatik upper, plan seçimi)
- Plan kartları + modül karşılaştırma tablosu
- Modül kataloğu kategoriye göre gruplanmış
- Kullanıcı tablosu (tenant + rol + durum rozetli)

@ui-test:
- 6 yeni screenshot: sa-dashboard, sa-tenants, sa-users, sa-plans, sa-modules
- Build temiz (PWA 24 entry), typecheck geçti

Sıradaki: FAZ 4 — Paket/Modül Sistemi (UI) + FAZ 5 — Log/Audit Altyapısı" 2>&1 | tail -3
echo "---"
git log --oneline
