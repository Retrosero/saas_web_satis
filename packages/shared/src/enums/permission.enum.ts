/**
 * Permission (yetki) enumları.
 *
 * Permission code formatı: <module>:<resource>:<action>
 * Örnek: cari:customer:read, satis:sale:cancel
 */

export const PermissionAction = {
  VIEW: 'view',
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  EXPORT: 'export',
  IMPORT: 'import',
  PRINT: 'print',
  APPROVE: 'approve',
  CANCEL: 'cancel',
  MANAGE: 'manage',
} as const;
export type PermissionAction = (typeof PermissionAction)[keyof typeof PermissionAction];

export const RiskLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];
