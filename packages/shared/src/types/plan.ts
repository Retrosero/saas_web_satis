import type { PlanCode, Currency } from '../enums/plan.enum';

export interface Plan {
  id: string;
  code: PlanCode;
  name: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: Currency;
  limits: PlanLimits;
  isActive: boolean;
}

export interface PlanLimits {
  userLimit: number;
  branchLimit: number;
  warehouseLimit: number;
  apiKeyLimit: number;
  webhookLimit: number;
  storageMbLimit: number;
}

export interface PlanModule {
  id: string;
  planId: string;
  moduleId: string;
  isIncluded: boolean;
  customLimit: Record<string, unknown> | null;
}

export interface TenantModule {
  id: string;
  tenantId: string;
  moduleId: string;
  isActive: boolean;
  source: 'plan' | 'manual_override';
  limitOverride: Record<string, unknown> | null;
  validUntil: string | null;
  note: string | null;
}
