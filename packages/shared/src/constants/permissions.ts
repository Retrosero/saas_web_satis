/**
 * Tüm permission code'ları (modül:resource:action).
 * Seed sırasında `permissions` tablosuna bu liste ile birlikte INSERT yapılır.
 */
import { ModuleCode } from '../enums/module.enum.js';
import { PermissionAction } from '../enums/permission.enum.js';

export interface PermissionDefinition {
  code: string;
  module: ModuleCode;
  resource: string;
  action: PermissionAction;
  description: string;
}

const PERMS = (mod: ModuleCode, resource: string, action: PermissionAction): PermissionDefinition => ({
  code: `${mod}:${resource}:${action}`,
  module: mod,
  resource,
  action,
  description: '',
});

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Cari modülü
  PERMS(ModuleCode.CARI, 'customer', PermissionAction.VIEW),
  PERMS(ModuleCode.CARI, 'customer', PermissionAction.READ),
  PERMS(ModuleCode.CARI, 'customer', PermissionAction.CREATE),
  PERMS(ModuleCode.CARI, 'customer', PermissionAction.UPDATE),
  PERMS(ModuleCode.CARI, 'customer', PermissionAction.DELETE),
  PERMS(ModuleCode.CARI, 'customer', PermissionAction.EXPORT),
  PERMS(ModuleCode.CARI, 'customer', PermissionAction.IMPORT),
  PERMS(ModuleCode.CARI, 'customer', PermissionAction.PRINT),
  // Stok modülü
  PERMS(ModuleCode.STOK, 'product', PermissionAction.VIEW),
  PERMS(ModuleCode.STOK, 'product', PermissionAction.READ),
  PERMS(ModuleCode.STOK, 'product', PermissionAction.CREATE),
  PERMS(ModuleCode.STOK, 'product', PermissionAction.UPDATE),
  PERMS(ModuleCode.STOK, 'product', PermissionAction.DELETE),
  PERMS(ModuleCode.STOK, 'product', PermissionAction.EXPORT),
  PERMS(ModuleCode.STOK, 'product', PermissionAction.IMPORT),
  // Satış modülü
  PERMS(ModuleCode.SATIS, 'sale', PermissionAction.VIEW),
  PERMS(ModuleCode.SATIS, 'sale', PermissionAction.CREATE),
  PERMS(ModuleCode.SATIS, 'sale', PermissionAction.UPDATE),
  PERMS(ModuleCode.SATIS, 'sale', PermissionAction.CANCEL),
  PERMS(ModuleCode.SATIS, 'sale', PermissionAction.EXPORT),
  PERMS(ModuleCode.SATIS, 'sale', PermissionAction.PRINT),
  // Sipariş modülü
  PERMS(ModuleCode.SIPARIS, 'order', PermissionAction.VIEW),
  PERMS(ModuleCode.SIPARIS, 'order', PermissionAction.CREATE),
  PERMS(ModuleCode.SIPARIS, 'order', PermissionAction.UPDATE),
  PERMS(ModuleCode.SIPARIS, 'order', PermissionAction.APPROVE),
  PERMS(ModuleCode.SIPARIS, 'order', PermissionAction.CANCEL),
  // Tahsilat modülü
  PERMS(ModuleCode.TAHSILAT, 'collection', PermissionAction.VIEW),
  PERMS(ModuleCode.TAHSILAT, 'collection', PermissionAction.CREATE),
  PERMS(ModuleCode.TAHSILAT, 'collection', PermissionAction.CANCEL),
  // Kasa modülü
  PERMS(ModuleCode.KASA, 'cash_account', PermissionAction.VIEW),
  PERMS(ModuleCode.KASA, 'cash_account', PermissionAction.CREATE),
  PERMS(ModuleCode.KASA, 'cash_account', PermissionAction.UPDATE),
  PERMS(ModuleCode.KASA, 'cash_movement', PermissionAction.VIEW),
  PERMS(ModuleCode.KASA, 'cash_movement', PermissionAction.CREATE),
  // Raporlar modülü
  PERMS(ModuleCode.RAPORLAR, 'report', PermissionAction.VIEW),
  PERMS(ModuleCode.RAPORLAR, 'report', PermissionAction.EXPORT),
  // Log/Audit modülü
  PERMS(ModuleCode.LOG_AUDIT, 'audit_log', PermissionAction.VIEW),
  PERMS(ModuleCode.LOG_AUDIT, 'audit_log', PermissionAction.EXPORT),
  // Ayarlar modülü
  PERMS(ModuleCode.AYARLAR, 'user', PermissionAction.VIEW),
  PERMS(ModuleCode.AYARLAR, 'user', PermissionAction.CREATE),
  PERMS(ModuleCode.AYARLAR, 'user', PermissionAction.UPDATE),
  PERMS(ModuleCode.AYARLAR, 'user', PermissionAction.DELETE),
  PERMS(ModuleCode.AYARLAR, 'role', PermissionAction.VIEW),
  PERMS(ModuleCode.AYARLAR, 'role', PermissionAction.CREATE),
  PERMS(ModuleCode.AYARLAR, 'role', PermissionAction.UPDATE),
  PERMS(ModuleCode.AYARLAR, 'role', PermissionAction.DELETE),
  PERMS(ModuleCode.AYARLAR, 'role', PermissionAction.MANAGE),
  PERMS(ModuleCode.AYARLAR, 'tenant', PermissionAction.MANAGE),
  // Bildirimler
  PERMS(ModuleCode.BILDIRIM, 'notification', PermissionAction.VIEW),
  PERMS(ModuleCode.BILDIRIM, 'notification', PermissionAction.UPDATE),
  // FAZ HR-1: İK / Bordro Hazırlık
  PERMS(ModuleCode.IK, 'hr', PermissionAction.VIEW),
  PERMS(ModuleCode.IK, 'personnel', PermissionAction.VIEW),
  PERMS(ModuleCode.IK, 'personnel', PermissionAction.CREATE),
  PERMS(ModuleCode.IK, 'personnel', PermissionAction.UPDATE),
  PERMS(ModuleCode.IK, 'personnel', PermissionAction.DELETE),  // archive
  PERMS(ModuleCode.IK, 'documents', PermissionAction.VIEW),
  PERMS(ModuleCode.IK, 'documents', PermissionAction.CREATE),  // upload
  PERMS(ModuleCode.IK, 'documents', PermissionAction.READ),    // download
  PERMS(ModuleCode.IK, 'documents', PermissionAction.DELETE),  // arşiv
  PERMS(ModuleCode.IK, 'sensitive_data', PermissionAction.VIEW),  // TC/IBAN full
];
