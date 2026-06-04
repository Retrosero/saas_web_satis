name: frontend-rules
description: React + TypeScript + Vite + TanStack Query frontend kuralları. Yeni sayfa, component veya feature API yazarken bu kurallara uy.
when_to_use: >
  Yeni bir sayfa, component, hook, veya feature API oluştururken.
  Frontend kod review/review istendiğinde.
  Mimari kararlarında (data fetching, state, routing).

rules:
  components:
    reuse_first: Önce mevcut bileşenleri kullan. Yeni component eklemeden önce /components/ klasörüne bak.
    required_components:
      - DataTable<T>: Generic tablo, columns: DataTableColumn<T>[], rowKey, onRowClick?
      - MobileCardList<T>: data, keyFn, onItemClick?, header, subtitle, rightBadge
      - ConfirmModal: open, title, description?, confirmText, variant, onClose, onConfirm
      - PageHeader: title, description? (NOT subtitle!), actions?
      - PageGuard: sadece allowed: boolean + early-return
      - EmptyState: action?: ReactNode (NOT {label, onClick})
      - LoadingState, ErrorState
    never_invent_props: "Mevcut component'lerin prop'larını değiştirme, yenisini ekle veya genişlet."
    page_layout: |
      Her sayfa: <PageHeader /> + içerik + <ConfirmModal />'lar (state varsa).
      Türkçe UI: tüm kullanıcıya görünen metin Türkçe olmalı.

  api_layer:
    location: Her domain için src/features/{domain}/api.ts
    pattern: |
      import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
      import { apiClient } from '@/lib/api-client';
      export function useXxx() { return useQuery({ queryKey: [...], queryFn: async () => { const { data } = await apiClient.get('/endpoint'); return data; } }); }
    types: Tüm type'lar @saas/shared paketinden import et. Yeni type ekle → packages/shared/src/ altına.
    errors: 401 → auth-store logout + redirect /login. 5xx → toast.error. 409 → uyarı.
    query_keys: ["domain", "entity", params] hiyerarşik. Invalidation: qc.invalidateQueries({ queryKey: ['domain'] })

  routing:
    file: src/router.tsx (lazy import pattern)
    pattern: |
      const XxxPage = lazy(() => import('@/pages/path/XxxPage').then((m) => ({ default: m.XxxPage })));
      // Route:
      { path: 'xxx', element: withSuspense(<XxxPage />) }
    guards: Yetkisiz kullanıcı için <PageGuard> kullan, sayfa render etme.

  state:
    server_state: TanStack Query (api'den gelen veri)
    local_state: useState (form, modal, filter)
    global_state: Zustand (auth, ui preferences)
    no_redux: Redux kullanma.

  forms:
    library: react-hook-form + zod
    pattern: |
      const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
    validation: Zod schema ile, error mesajları Türkçe.

  styling:
    library: Tailwind CSS
    pattern: |
      utility-first, mobile-first
      sm: 640px, md: 768px, lg: 1024px, xl: 1280px
      breakpoint: hidden md:block (mobilde gizle, desktop'ta göster)
    theme_colors: primary, surface, surface-variant, on-surface, on-surface-variant, outline, outline-variant
    no_inline_styles: Inline style sadece dinamik değerler için (width: %50 gibi).

  i18n:
    default: Türkçe (varsayılan)
    copy: Tüm UI metni Türkçe. Kod (değişken, fonksiyon) İngilizce.
    never: "İngilizce UI metni (Türkçe yazılmalı)"

  typescript:
    strict: true
    no_any: any kullanmaktan kaçın, tip belirsizse unknown + cast
    enum: @saas/shared'tan import et, lokal enum oluşturma
    generic: DataTable<T>, MobileCardList<T> gibi generic component'lerde tip belirt

  testing:
    location: src/**/*.{test,spec}.{ts,tsx}
    framework: Vitest + @testing-library/react
    patterns: |
      - Hook testleri: renderHook
      - Component testleri: render, screen
      - Test dosyaları kaynak dosyanın yanında

  common_pitfalls:
    - "EmptyState action={{ label, onClick }} → ReactNode JSX buton"
    - "PageHeader subtitle → description"
    - "r implicit any → (r: any) explicit cast"
    - "TS '>' JSX'te → '&gt;'"
    - "MobileCardList renderItem prop'u yok → header/subtitle/rightBadge kullan"

examples:
  new_page: |
    // 1) src/pages/customers/CustomerListPage.tsx
    import { useState } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { Users, Plus } from 'lucide-react';
    import { PageHeader } from '@/components/layout/PageHeader';
    import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
    import { LoadingState } from '@/components/data/LoadingState';
    import { EmptyState } from '@/components/data/EmptyState';
    import { useCustomers } from '@/features/customers/api';

    export function CustomerListPage() {
      const navigate = useNavigate();
      const { data, isLoading } = useCustomers();
      const columns: DataTableColumn<any>[] = [
        { key: 'name', label: 'Cari Adı', render: (c) => <span className="font-semibold">{c.name}</span> },
      ];
      return (
        <div className="space-y-4">
          <PageHeader title="Cariler" actions={<button onClick={() => navigate('/customers/new')} className="..."><Plus /> Yeni Cari</button>} />
          {isLoading ? <LoadingState /> : !data?.items?.length ? <EmptyState icon={<Users />} title="Henüz cari yok" action={<button>+</button>} /> : <DataTable columns={columns} data={data.items} rowKey={(c) => c.id} />}
        </div>
      );
    }
  new_api: |
    // src/features/orders/api.ts
    import { useQuery } from '@tanstack/react-query';
    import { apiClient } from '@/lib/api-client';
    export function useOrders(params?: { status?: string }) {
      return useQuery({ queryKey: ['orders', params], queryFn: async () => { const { data } = await apiClient.get<any>('/orders', { params }); return data; } });
    }
