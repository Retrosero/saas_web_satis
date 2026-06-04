/**
 * Tenant (Firma) ile ilgili enumlar.
 */

export const TenantStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  TRIAL: 'TRIAL',
  PENDING: 'PENDING',
  CANCELLED: 'CANCELLED',
} as const;
export type TenantStatus = (typeof TenantStatus)[keyof typeof TenantStatus];

export const WorkingMode = {
  SAAS_MASTER: 'SAAS_MASTER',
  ERP_MASTER: 'ERP_MASTER',
} as const;
export type WorkingMode = (typeof WorkingMode)[keyof typeof WorkingMode];

export const TenantModuleSource = {
  PLAN: 'plan',
  MANUAL_OVERRIDE: 'manual_override',
} as const;
export type TenantModuleSource = (typeof TenantModuleSource)[keyof typeof TenantModuleSource];
