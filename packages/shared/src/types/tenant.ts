import type { TenantStatus, WorkingMode } from '../enums/index.js';
import type { SubscriptionStatus } from '../enums/plan.enum.js';

export interface Tenant {
  id: string;
  code: string;
  name: string;
  workingMode: WorkingMode;
  status: TenantStatus;
  planId: string | null;
  subscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSettings {
  id: string;
  tenantId: string;
  companyInfo: Record<string, unknown>;
  currency: string;
  taxOffice: string | null;
  taxNumber: string | null;
  defaultWarehouseId: string | null;
  locale: string;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  startAt: string;
  endAt: string | null;
  trialEndAt: string | null;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}
