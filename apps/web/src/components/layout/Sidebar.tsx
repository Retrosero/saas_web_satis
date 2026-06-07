import { NavLink } from 'react-router-dom';
import {
  ArrowLeftRight,
  Banknote,
  BarChart3,
  Bell,
  BookMarked,
  BotMessageSquare,
  Building,
  Building2,
  CheckSquare,
  ClipboardList,
  Code2,
  CreditCard,
  CreditCardIcon,
  Database,
  FileText,
  HandCoins,
  HeadphonesIcon,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  RefreshCcw,
  Scale,
  Settings,
  Shield,
  ShoppingCart,
  Truck,
  Users,
  Users2,
  Warehouse,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth-store';
import { useLogout } from '@/features/auth/hooks';
import { useUIStore } from '@/stores/ui-store';
import { useTenantModules } from '@/features/tenant-admin/hooks';

const MODULE_CONFIG: Record<string, { route: string; label: string; Icon: LucideIcon }> = {
  cari: { route: '/customers', label: 'Cari Hesaplar', Icon: Users },
  stok: { route: '/products', label: 'Stok Yönetimi', Icon: Package },
  satis: { route: '/sales', label: 'Satış', Icon: ShoppingCart },
  siparis: { route: '/orders', label: 'Siparişler', Icon: Receipt },
  raporlar: { route: '/reports', label: 'Raporlar', Icon: BarChart3 },
  bildirim: { route: '/notifications', label: 'Bildirimler', Icon: Bell },
  sayim: { route: '/stock-counts', label: 'Stok Sayım', Icon: ClipboardList },
  iade: { route: '/returns', label: 'İade', Icon: RefreshCcw },
  pos: { route: '/banks/pos-devices', label: 'POS', Icon: CreditCardIcon },
  veri_tasima: { route: '/import', label: 'Veri Taşıma', Icon: ArrowLeftRight },
  ik: { route: '/hr/employees', label: 'İnsan Kaynakları', Icon: Users2 },
  destek: { route: '/support', label: 'Destek Merkezi', Icon: HeadphonesIcon },
  asistan: { route: '/assistant-chat', label: 'Akıllı Asistan', Icon: BotMessageSquare },
  api_webhook: { route: '/settings', label: 'API & Webhook', Icon: Code2 },
  erp_entegrasyon: { route: '/settings', label: 'ERP Entegrasyonu', Icon: Database },
  bayi_portali: { route: '/portal', label: 'Bayi Portalı', Icon: Building },
  tahsilat: { route: '/collections', label: 'Tahsilat', Icon: HandCoins },
  kasa: { route: '/banks/accounts', label: 'Kasa', Icon: Banknote },
  log_audit: { route: '/settings/logs', label: 'Log & Audit', Icon: FileText },
  banka: { route: '/banks/accounts', label: 'Banka', Icon: Banknote },
  servis: { route: '/support', label: 'Servis / Bakım', Icon: Wrench },
  zimmet: { route: '/hr/checklists/onboardings', label: 'Zimmet', Icon: CheckSquare },
  depo: { route: '/warehouses', label: 'Depo', Icon: Warehouse },
  fiyatlandirma: { route: '/products', label: 'Fiyatlandırma', Icon: Scale },
  ziyaret: { route: '/visits/plans', label: 'Ziyaret Planları', Icon: Truck },
  hedefler: { route: '/performance/targets', label: 'Hedefler', Icon: Scale },
  teklif: { route: '/quotes', label: 'Teklifler', Icon: FileText },
  etiket: { route: '/labels', label: 'Etiketler', Icon: BookMarked },
  onay: { route: '/approvals/requests', label: 'Onaylar', Icon: CheckSquare },
};

const STATIC_NAV = [
  { to: '/dashboard', label: 'Panel', Icon: LayoutDashboard },
  { to: '/settings', label: 'Ayarlar', Icon: Settings },
];

const SUPER_ADMIN_NAV = [
  { to: '/super-admin/dashboard', label: 'Süper Admin', Icon: Shield },
  { to: '/super-admin/tenants', label: 'Firmalar', Icon: Building2 },
  { to: '/super-admin/users', label: 'Kullanıcılar', Icon: Users },
  { to: '/super-admin/plans', label: 'Paketler', Icon: CreditCard },
  { to: '/super-admin/modules', label: 'Modüller', Icon: LayoutGrid },
];

const CATEGORY_LABELS = {
  general: 'Genel',
  operations: 'Operasyon',
  finance: 'Finans',
  hr: 'İnsan Kaynakları',
  integration: 'Entegrasyon',
  support: 'Destek',
  other: 'Diğer',
} as const;

const MODULE_CATEGORIES: Record<string, keyof typeof CATEGORY_LABELS> = {
  cari: 'operations',
  stok: 'operations',
  satis: 'operations',
  siparis: 'operations',
  raporlar: 'operations',
  sayim: 'operations',
  iade: 'operations',
  servis: 'operations',
  depo: 'operations',
  fiyatlandirma: 'operations',
  ziyaret: 'operations',
  hedefler: 'operations',
  teklif: 'operations',
  etiket: 'operations',
  onay: 'operations',
  tahsilat: 'finance',
  kasa: 'finance',
  banka: 'finance',
  pos: 'finance',
  ik: 'hr',
  zimmet: 'hr',
  veri_tasima: 'integration',
  api_webhook: 'integration',
  erp_entegrasyon: 'integration',
  bayi_portali: 'integration',
  bildirim: 'support',
  destek: 'support',
  asistan: 'support',
  log_audit: 'support',
};

type NavCategory = keyof typeof CATEGORY_LABELS;

type NavItem = {
  to: string;
  label: string;
  Icon: LucideIcon;
  module?: string;
  category: NavCategory;
};

function resolveModuleRoute(code: string, backendRoute?: string) {
  const fallbackRoute = MODULE_CONFIG[code]?.route;
  if (!fallbackRoute) return backendRoute ?? '/dashboard';

  const knownBrokenRoutes: Record<string, string> = {
    banka: '/bank',
    pos: '/pos',
    servis: '/service',
  };

  if (!backendRoute || knownBrokenRoutes[code] === backendRoute) {
    return fallbackRoute;
  }

  return backendRoute;
}

export function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const collapsed = useUIStore((state) => state.sidebarCollapsed);
  const toggle = useUIStore((state) => state.toggleSidebar);
  const logout = useLogout();
  const { data: moduleData } = useTenantModules();

  const activeCodes = user?.activeModules ?? [];
  const dynamicNav = activeCodes
    .map((code) => {
      const config = MODULE_CONFIG[code];
      if (!config) return null;

      const backendModule =
        moduleData?.active.find((item) => item.code === code) ??
        moduleData?.available.find((item) => item.code === code);

      return {
        to: resolveModuleRoute(code, backendModule?.defaultRoute),
        label: backendModule?.name ?? config.label,
        Icon: config.Icon,
        module: code,
        category: MODULE_CATEGORIES[code] ?? 'other',
      };
    })
    .filter((item): item is Exclude<typeof item, null> => item !== null);

  const allNav: NavItem[] = [
    ...STATIC_NAV.map((item) => ({ ...item, module: undefined, category: 'general' as const })),
    ...dynamicNav,
  ];

  const navGroups = (Object.keys(CATEGORY_LABELS) as NavCategory[])
    .map((category) => ({
      key: category,
      label: CATEGORY_LABELS[category],
      items: allNav.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0);

  const isSuperAdmin = user?.roles?.some((role) => role.roleCode === 'super_admin') ?? false;

  return (
    <aside
      className={cn(
        'hidden h-screen sticky top-0 z-30 md:flex flex-col bg-primary text-primary-foreground transition-all duration-200',
        collapsed ? 'w-[76px]' : 'w-[272px]',
      )}
    >
      <div className="border-b border-white/10 px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            {isSuperAdmin ? 'SA' : 'S'}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">
                {isSuperAdmin ? 'Süper Admin' : 'SaaS Panel'}
              </div>
              <div className="truncate text-[11px] uppercase tracking-[0.18em] text-white/50">
                {isSuperAdmin ? 'Sistem Yönetimi' : 'İşletme Yönetimi'}
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {isSuperAdmin && (
          <div className="mb-3 flex flex-col gap-0.5">
            {!collapsed && (
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Süper Admin
              </div>
            )}
            {SUPER_ADMIN_NAV.map((item) => {
              const Icon = item.Icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                        : 'text-white/72 hover:bg-white/10 hover:text-white',
                    )
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
            <div className="mx-3 mt-3 border-b border-white/10" />
          </div>
        )}

        <div className="flex flex-col gap-3">
          {navGroups.map((group) => (
            <div key={group.key} className="flex flex-col gap-0.5">
              {!collapsed && (
                <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  {group.label}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.Icon;
                return (
                  <NavLink
                    key={`${group.key}-${item.to}`}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                          : 'text-white/72 hover:bg-white/10 hover:text-white',
                      )
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        {user && !collapsed && (
          <div className="mb-2 rounded-xl bg-white/5 px-3 py-2 text-xs text-white/60">
            <div className="truncate font-semibold text-white">{user.fullName}</div>
            <div className="truncate">{user.email}</div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggle()}
            className={cn(
              'flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white',
              collapsed ? 'mx-auto w-10' : 'w-10 shrink-0',
            )}
            title={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
            aria-label={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
          {!collapsed && <span className="text-xs text-white/55">Menüyü daralt</span>}
        </div>

        <button
          onClick={() => logout.mutate()}
          className="mt-2 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm text-white/72 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && 'Çıkış Yap'}
        </button>
      </div>
    </aside>
  );
}
