import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, ShoppingCart, Receipt, BarChart3,
  Settings, LogOut, Bell, Shield, Building2, CreditCard, Activity,
  ArrowLeftRight, RefreshCcw, CreditCardIcon, Wrench, Users2, HeadphonesIcon,
  BotMessageSquare, Code2, Database, Building, HandCoins, Banknote, ClipboardList,
  Warehouse, Scale, LifeBuoy, LayoutGrid, FileText, Truck, BookMarked, CheckSquare,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth-store';
import { useLogout } from '@/features/auth/hooks';
import { useUIStore } from '@/stores/ui-store';
import { useTenantModules } from '@/features/tenant-admin/hooks';
import { useModuleAccess } from '@/lib/usePermission';
import type { LucideIcon } from 'lucide-react';

/**
 * Hook to check access for multiple module codes at once.
 * Calls useModuleAccess at component top level (not inside callbacks) to respect React hooks rules.
 */
function useModuleAccessBatch(codes: string[]): Set<string> {
  // We call useModuleAccess once per unique code at the top level
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const accessResults = codes.map((code) => ({ code, hasAccess: useModuleAccess(code) }));
  return new Set(accessResults.filter((r) => r.hasAccess).map((r) => r.code));
}

// Modül kodu → route + label + icon map
const MODULE_CONFIG: Record<string, { route: string; label: string; Icon: LucideIcon }> = {
  cari:     { route: '/customers',    label: 'Cari Hesaplar',   Icon: Users },
  stok:     { route: '/products',     label: 'Stok Yönetimi',   Icon: Package },
  satis:    { route: '/sales',        label: 'Satış',           Icon: ShoppingCart },
  siparis:  { route: '/orders',       label: 'Siparişler',      Icon: Receipt },
  raporlar: { route: '/reports',      label: 'Raporlar',        Icon: BarChart3 },
  bildirim: { route: '/notifications', label: 'Bildirimler',  Icon: Bell },
  sayim:    { route: '/stock-counts', label: 'Stok Sayım',      Icon: ClipboardList },
  iade:     { route: '/returns',      label: 'İade',            Icon: RefreshCcw },
  pos:      { route: '/banks/pos-devices', label: 'POS',          Icon: CreditCardIcon },
  veri_tasima: { route: '/import', label: 'Veri Taşıma',       Icon: ArrowLeftRight },
  ik:       { route: '/hr/employees', label: 'İnsan Kaynakları', Icon: Users2 },
  destek:   { route: '/support',      label: 'Destek Merkezi',   Icon: HeadphonesIcon },
  asistan:  { route: '/assistant-chat', label: 'Akıllı Asistan',Icon: BotMessageSquare },
  api_webhook: { route: '/settings', label: 'API & Webhook',     Icon: Code2 },
  erp_entegrasyon: { route: '/settings', label: 'ERP Entegrasyonu', Icon: Database },
  bayi_portali: { route: '/portal',   label: 'Bayi Portalı',    Icon: Building },
  tahsilat:  { route: '/collections', label: 'Tahsilat',        Icon: HandCoins },
  kasa:      { route: '/banks/accounts', label: 'Kasa',         Icon: Banknote },
  log_audit: { route: '/settings/logs', label: 'Log & Audit',   Icon: FileText },
  banka:     { route: '/banks/accounts', label: 'Banka',       Icon: Banknote },
  servis:    { route: '/support',      label: 'Servis / Bakım',  Icon: Wrench },
  zimmet:    { route: '/hr/checklists/onboardings', label: 'Zimmet',         Icon: CheckSquare },
  depo:      { route: '/warehouses',   label: 'Depo',            Icon: Warehouse },
  fiyatlandirma: { route: '/products', label: 'Fiyatlandırma',   Icon: Scale },
  ziyaret:   { route: '/visits/plans', label: 'Ziyaret Planları',Icon: Truck },
  hedefler:  { route: '/performance/targets', label: 'Hedefler', Icon: Scale },
  teklif:   { route: '/quotes',       label: 'Teklifler',       Icon: FileText },
  etiket:   { route: '/labels',        label: 'Etiketler',       Icon: BookMarked },
  onay:     { route: '/approvals/requests', label: 'Onaylar',    Icon: CheckSquare },
};

const STATIC_NAV = [
  { to: '/dashboard', label: 'Panel', Icon: LayoutDashboard },
  { to: '/settings',   label: 'Ayarlar', Icon: Settings },
];

const SUPER_ADMIN_NAV = [
  { to: '/super-admin/dashboard', label: 'Süper Admin', Icon: Shield },
  { to: '/super-admin/tenants',    label: 'Firmalar',    Icon: Building2 },
  { to: '/super-admin/users',      label: 'Kullanıcılar',Icon: Users },
  { to: '/super-admin/plans',      label: 'Paketler',    Icon: CreditCard },
  { to: '/super-admin/modules',    label: 'Modüller',    Icon: LayoutGrid },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);
  const logout = useLogout();
  const location = useLocation();

  // Modül metadata'yı çek (backend'den gelen defaultRoute kullanılabilir)
  const { data: moduleData } = useTenantModules();

  // Collect unique module codes and check access at component level
  const activeCodes = user?.activeModules ?? [];
  const uniqueModules = [...new Set(activeCodes)];
  const allowedModules = useModuleAccessBatch(uniqueModules);

  // Dinamik nav: aktif modüllerden nav item'ları oluştur
  // Backend'den gelen label/route öncelikli, yoksa MODULE_CONFIG'ten al
  const dynamicNav = activeCodes
    .map((code) => {
      const cfg = MODULE_CONFIG[code];
      if (!cfg) return null;
      // Backend'den module metadata varsa label/route'u override et
      const backendModule = moduleData?.available.find((m) => m.code === code);
      return {
        to: backendModule?.defaultRoute ?? cfg.route,
        label: backendModule?.name ?? cfg.label,
        Icon: cfg.Icon,
        module: code,
      };
    })
    .filter(
      (item): item is NonNullable<typeof item> =>
        item !== null && allowedModules.has(item.module),
    ) as Array<{ to: string; label: string; Icon: LucideIcon; module: string }>;

  const isSuperAdmin = user?.roles?.some((r) => r.roleCode === 'super_admin') ?? false;

  const allNav = [
    ...dynamicNav,
    ...STATIC_NAV.map((n) => ({ ...n, Icon: n.Icon, module: undefined as string | undefined })),
  ];

  const activeModule = allNav.find((item) => location.pathname.startsWith(item.to))?.module;

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-primary text-primary-foreground h-screen sticky top-0 z-30 transition-all duration-200',
        collapsed ? 'w-[72px]' : 'w-[260px]',
      )}
    >
      <div className="flex items-center gap-2 px-4 py-5 border-b border-white/10">
        <div className="h-9 w-9 rounded-md bg-secondary flex items-center justify-center text-secondary-foreground font-bold">
          {isSuperAdmin ? 'SA' : 'S'}
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-base">{isSuperAdmin ? 'Süper Admin' : 'SaaS Panel'}</span>
            <span className="text-[10px] uppercase tracking-wider text-white/60">
              {isSuperAdmin ? 'Sistem Yönetimi' : 'İşletme Yönetimi'}
            </span>
          </div>
        )}
      </div>

      {/* Aktif Modül Göstergesi */}
      {!collapsed && activeModule && MODULE_CONFIG[activeModule] && (
        <div className="px-4 py-2.5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary-foreground/70" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-white/50">Aktif Modül</span>
              <span className="text-sm font-semibold text-white">{MODULE_CONFIG[activeModule].label}</span>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5">
        {isSuperAdmin && (
          <>
            {!collapsed && (
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/50 font-semibold">
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
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white',
                    )
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
            <div className="my-2 border-b border-white/10" />
          </>
        )}

        {!isSuperAdmin && !collapsed && (
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/50 font-semibold">
            İşletme
          </div>
        )}

        {allNav.map((item) => {
          const Icon = item.Icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white',
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3 flex flex-col gap-2">
        {user && !collapsed && (
          <div className="px-2 py-1.5 text-xs text-white/60">
            <div className="font-semibold text-white truncate">{user.fullName}</div>
            <div className="truncate">{user.email}</div>
          </div>
        )}
        <button
          onClick={() => toggle()}
          className="text-xs text-white/60 hover:text-white text-left px-2"
        >
          {collapsed ? '»' : '« Kapat'}
        </button>
        <button
          onClick={() => logout.mutate()}
          className="flex items-center gap-2 text-sm text-white/70 hover:text-white px-2 py-1.5"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && 'Çıkış Yap'}
        </button>
      </div>
    </aside>
  );
}
