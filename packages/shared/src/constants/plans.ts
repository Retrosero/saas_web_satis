/**
 * Paket (plan) tanımları. Seed sırasında `plans` tablosuna bu liste ile birlikte INSERT yapılır.
 *
 * Yeni plan eklemek için:
 * 1) PlanCode enum'una ekle
 * 2) Burada bir PlanDefinition objesi ekle
 * 3) PLAN_MODULES ile modül eşleştirmesini yap
 */
import { PlanCode, Currency } from '../enums/plan.enum';
import { ModuleCode } from '../enums/module.enum';

export interface PlanDefinition {
  code: PlanCode;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: Currency;
  userLimit: number;
  branchLimit: number;
  warehouseLimit: number;
  apiKeyLimit: number;
  webhookLimit: number;
  storageMbLimit: number;
  includedModules: ModuleCode[];
}

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    code: PlanCode.STARTER,
    name: 'Başlangıç',
    description: 'Küçük işletmeler için temel modüller',
    monthlyPrice: 499,
    yearlyPrice: 4990,
    currency: Currency.TRY,
    userLimit: 3,
    branchLimit: 1,
    warehouseLimit: 1,
    apiKeyLimit: 0,
    webhookLimit: 0,
    storageMbLimit: 2048, // 2 GB
    includedModules: [
      ModuleCode.DASHBOARD,
      ModuleCode.CARI,
      ModuleCode.STOK,
      ModuleCode.SATIS,
      ModuleCode.TAHSILAT,
      ModuleCode.KASA,
      ModuleCode.RAPORLAR,
    ],
  },
  {
    code: PlanCode.STANDARD,
    name: 'Standart',
    description: 'Büyüyen işletmeler için genişletilmiş özellikler',
    monthlyPrice: 999,
    yearlyPrice: 9990,
    currency: Currency.TRY,
    userLimit: 10,
    branchLimit: 3,
    warehouseLimit: 3,
    apiKeyLimit: 2,
    webhookLimit: 5,
    storageMbLimit: 10240, // 10 GB
    includedModules: [
      ModuleCode.DASHBOARD,
      ModuleCode.CARI,
      ModuleCode.STOK,
      ModuleCode.SATIS,
      ModuleCode.SIPARIS,
      ModuleCode.TAHSILAT,
      ModuleCode.KASA,
      ModuleCode.BANKA,
      ModuleCode.RAPORLAR,
      ModuleCode.BILDIRIM,
    ],
  },
  {
    code: PlanCode.PROFESSIONAL,
    name: 'Profesyonel',
    description: 'Kurumsal operasyonlar için tam özellik seti',
    monthlyPrice: 2499,
    yearlyPrice: 24990,
    currency: Currency.TRY,
    userLimit: 50,
    branchLimit: 10,
    warehouseLimit: 10,
    apiKeyLimit: 10,
    webhookLimit: 25,
    storageMbLimit: 51200, // 50 GB
    includedModules: [
      ModuleCode.DASHBOARD,
      ModuleCode.CARI,
      ModuleCode.STOK,
      ModuleCode.SATIS,
      ModuleCode.SIPARIS,
      ModuleCode.TAHSILAT,
      ModuleCode.KASA,
      ModuleCode.BANKA,
      ModuleCode.POS,
      ModuleCode.DEPO,
      ModuleCode.SAYIM,
      ModuleCode.IADE,
      ModuleCode.RAPORLAR,
      ModuleCode.API_WEBHOOK,
      ModuleCode.BILDIRIM,
      ModuleCode.LOG_AUDIT,
    ],
  },
  {
    code: PlanCode.ENTERPRISE,
    name: 'Kurumsal',
    description: 'Büyük ölçekli firmalar için sınırsız entegrasyon',
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: Currency.TRY,
    userLimit: 9999,
    branchLimit: 9999,
    warehouseLimit: 9999,
    apiKeyLimit: 9999,
    webhookLimit: 9999,
    storageMbLimit: 512000, // 500 GB
    includedModules: Object.values(ModuleCode),
  },
];
