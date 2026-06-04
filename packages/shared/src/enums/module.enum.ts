/**
 * Modül kataloğu enumları.
 *
 * Yeni modül eklendiğinde:
 * 1) bu listeye code ekle
 * 2) packages/shared/src/constants/modules.ts içine TR adı + icon + route ekle
 * 3) packages/shared/src/constants/permissions.ts içine permission code'ları ekle
 * 4) prisma seed'de modules tablosuna INSERT
 */

export const ModuleCode = {
  DASHBOARD: 'dashboard',
  CARI: 'cari',
  STOK: 'stok',
  SATIS: 'satis',
  SIPARIS: 'siparis',
  TAHSILAT: 'tahsilat',
  KASA: 'kasa',
  BANKA: 'banka',
  POS: 'pos',
  DEPO: 'depo',
  SAYIM: 'sayim',
  IADE: 'iade',
  RAPORLAR: 'raporlar',
  IK: 'ik',
  ZIMMET: 'zimmet',
  SERVIS: 'servis',
  BAYI_PORTALI: 'bayi_portali',
  API_WEBHOOK: 'api_webhook',
  ERP_ENTEGRASYON: 'erp_entegrasyon',
  VERI_TASIMA: 'veri_tasima',
  LOG_AUDIT: 'log_audit',
  DESTEK: 'destek',
  BILDIRIM: 'bildirim',
  ASISTAN: 'asistan',
  AYARLAR: 'ayarlar',
} as const;
export type ModuleCode = (typeof ModuleCode)[keyof typeof ModuleCode];

export const ModuleCategory = {
  CORE: 'core',
  OPERATIONS: 'operations',
  FINANCE: 'finance',
  HR: 'hr',
  INTEGRATION: 'integration',
  ADDON: 'addon',
} as const;
export type ModuleCategory = (typeof ModuleCategory)[keyof typeof ModuleCategory];
