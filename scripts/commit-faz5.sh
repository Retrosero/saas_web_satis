#!/bin/bash
set -e
cd /workspace
git add -A
git commit -m "feat(faz5): log ve audit UI — süper admin sistem logları + tenant firma logları

FAZ 5 — Log & Audit UI (read-only, tablolar zaten vardı)

@backend:
- /super-admin/logs/audit: tüm tenant audit logları (modül/aksiyon/risk filtresi)
- /super-admin/logs/audit/stats: son 24 saat istatistikleri
- /super-admin/logs/error: hata logları (seviye/path/status filtresi)
- /super-admin/logs/security: güvenlik olayları (event/IP filtresi)
- /settings/logs/audit: tenant kendi audit logları
- /settings/logs/security: tenant kendi güvenlik logları
- LogsService: tarih aralığı, çoklu filtre, ilişkili user/tenant include

@frontend:
- /super-admin/logs: 3 tab'lı sayfa (Audit, Hatalar, Güvenlik)
  + KPI bantları (son 24 saat, yüksek risk, kritik)
  + filtre çubuğu (modül, aksiyon, risk seviyesi)
  + CSV export (UTF-8 BOM ile Excel uyumlu)
- /settings/logs: 2 tab'lı sayfa (Audit, Güvenlik)
  + tenant bazlı filtre
  + CSV export
- /lib/export.ts: ortak CSV export utility (frontend-only)

@ui-test:
- 5 yeni screenshot: sa-logs-audit/error/security + settings-logs-audit/security
- Build temiz (PWA 43 entry — önceki 39)
- Typecheck geçti

Sıradaki: FAZ 6 — Cari Modülü (operasyonel tablolar + applyCollection entegrasyonu)" 2>&1 | tail -3
git log --oneline | head -8
