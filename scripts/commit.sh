#!/bin/bash
set -e
cd /workspace
git add -A
git status --short | head -20
echo "---"
git commit -m "feat(iskelet): monorepo iskeleti — backend, frontend ve shared paketleri

FAZ 1 — Proje İskeleti tamamlandı.

Eklenenler:
- @saas/shared: ortak tipler, enumlar, DTOlar, Zod şemaları
- @saas/api: NestJS + Prisma 12 SaaS çekirdek tablo, JWT auth,
  tenant/süper admin controller'ları, guard/interceptor/filter altyapısı,
  seed script (süper admin, modül/plan/permission kataloğu)
- @saas/web: Vite + React 18 + TS + M3 token sistemi, shadcn-ui tarzı
  componentler (Button, Input, Card, Stat, Form, EmptyState, LoadingState, ErrorState),
  layoutlar (AppLayout, AuthLayout), login + dashboard + süper admin
  tenant placeholder, PWA (Workbox), Türkçe arayüz

Tüm paketler:
- pnpm install, typecheck, build geçer
- shared/api CJS, shared/web ESM (Vite alias ile)
- Turkish UI metinleri
- ESLint + Prettier hazır

Sıradaki: FAZ 2 (DB & Migration) ve FAZ 3 (Auth & Süper Admin)
" 2>&1 | tail -10
echo "---"
git log --oneline
