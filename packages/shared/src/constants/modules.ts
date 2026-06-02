import { ModuleCode, ModuleCategory } from '../enums/module.enum.js';

/**
 * Modül kataloğu (sistem genelinde). Seed sırasında `modules` tablosuna
 * bu liste ile birlikte INSERT yapılır.
 */
export interface ModuleDefinition {
  code: ModuleCode;
  name: string;
  category: ModuleCategory;
  defaultRoute: string;
  icon: string;
  sortOrder: number;
  description: string;
}

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  {
    code: ModuleCode.DASHBOARD,
    name: 'Panel',
    category: ModuleCategory.CORE,
    defaultRoute: '/dashboard',
    icon: 'dashboard',
    sortOrder: 10,
    description: 'Ana kontrol paneli ve KPI özetleri',
  },
  {
    code: ModuleCode.CARI,
    name: 'Cari Hesaplar',
    category: ModuleCategory.OPERATIONS,
    defaultRoute: '/customers',
    icon: 'group',
    sortOrder: 20,
    description: 'Müşteri ve tedarikçi cari hesap yönetimi',
  },
  {
    code: ModuleCode.STOK,
    name: 'Stok Yönetimi',
    category: ModuleCategory.OPERATIONS,
    defaultRoute: '/products',
    icon: 'inventory_2',
    sortOrder: 30,
    description: 'Ürün, barkod, marka, kategori ve stok takibi',
  },
  {
    code: ModuleCode.SATIS,
    name: 'Satış',
    category: ModuleCategory.OPERATIONS,
    defaultRoute: '/sales',
    icon: 'point_of_sale',
    sortOrder: 40,
    description: 'Satış işlemleri, sepet ve fiş yönetimi',
  },
  {
    code: ModuleCode.SIPARIS,
    name: 'Siparişler',
    category: ModuleCategory.OPERATIONS,
    defaultRoute: '/orders',
    icon: 'shopping_cart',
    sortOrder: 50,
    description: 'Müşteri ve tedarik sipariş takibi',
  },
  {
    code: ModuleCode.TAHSILAT,
    name: 'Tahsilat',
    category: ModuleCategory.FINANCE,
    defaultRoute: '/collections',
    icon: 'payments',
    sortOrder: 60,
    description: 'Cari tahsilat ve ödeme kayıtları',
  },
  {
    code: ModuleCode.KASA,
    name: 'Kasa',
    category: ModuleCategory.FINANCE,
    defaultRoute: '/cash',
    icon: 'account_balance_wallet',
    sortOrder: 70,
    description: 'Kasa tanımları ve nakit hareketleri',
  },
  {
    code: ModuleCode.BANKA,
    name: 'Banka',
    category: ModuleCategory.FINANCE,
    defaultRoute: '/bank',
    icon: 'account_balance',
    sortOrder: 75,
    description: 'Banka hesapları ve hareketleri',
  },
  {
    code: ModuleCode.RAPORLAR,
    name: 'Raporlar',
    category: ModuleCategory.OPERATIONS,
    defaultRoute: '/reports',
    icon: 'analytics',
    sortOrder: 100,
    description: 'Günlük satış, cari bakiye, stok ve tahsilat raporları',
  },
  {
    code: ModuleCode.LOG_AUDIT,
    name: 'Log ve Audit',
    category: ModuleCategory.CORE,
    defaultRoute: '/logs',
    icon: 'history',
    sortOrder: 200,
    description: 'Sistem işlem ve hata logları',
  },
  {
    code: ModuleCode.BILDIRIM,
    name: 'Bildirimler',
    category: ModuleCategory.CORE,
    defaultRoute: '/notifications',
    icon: 'notifications',
    sortOrder: 210,
    description: 'Sistem bildirimleri ve görevler',
  },
  {
    code: ModuleCode.AYARLAR,
    name: 'Ayarlar',
    category: ModuleCategory.CORE,
    defaultRoute: '/settings',
    icon: 'settings',
    sortOrder: 900,
    description: 'Firma, kullanıcı ve sistem ayarları',
  },
];
