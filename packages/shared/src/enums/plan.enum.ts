/**
 * Paket (Plan) ve abonelik ile ilgili enumlar.
 */

export const PlanCode = {
  STARTER: 'starter',
  STANDARD: 'standard',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
  CUSTOM: 'custom',
} as const;
export type PlanCode = (typeof PlanCode)[keyof typeof PlanCode];

export const SubscriptionStatus = {
  TRIAL: 'TRIAL',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const Currency = {
  TRY: 'TRY',
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
} as const;
export type Currency = (typeof Currency)[keyof typeof Currency];
