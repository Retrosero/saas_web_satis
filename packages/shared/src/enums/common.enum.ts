/**
 * Genel enumlar.
 */

export const CustomerType = {
  CUSTOMER: 'CUSTOMER',
  SUPPLIER: 'SUPPLIER',
  BOTH: 'BOTH',
} as const;
export type CustomerType = (typeof CustomerType)[keyof typeof CustomerType];

export const SaleStatus = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
} as const;
export type SaleStatus = (typeof SaleStatus)[keyof typeof SaleStatus];

export const OrderStatus = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  CLOSED: 'CLOSED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentType = {
  CASH: 'CASH',
  CARD: 'CARD',
  BANK: 'BANK',
  EFT: 'EFT',
  CHECK: 'CHECK',
  OTHER: 'OTHER',
} as const;
export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType];

export const CashAccountType = {
  CASH: 'CASH',
  BANK: 'BANK',
  POS: 'POS',
} as const;
export type CashAccountType = (typeof CashAccountType)[keyof typeof CashAccountType];

export const StockMovementType = {
  IN: 'IN',
  OUT: 'OUT',
  TRANSFER: 'TRANSFER',
  ADJUST: 'ADJUST',
} as const;
export type StockMovementType = (typeof StockMovementType)[keyof typeof StockMovementType];

export const CustomerMovementType = {
  DEBIT: 'DEBIT',
  CREDIT: 'CREDIT',
} as const;
export type CustomerMovementType = (typeof CustomerMovementType)[keyof typeof CustomerMovementType];

export const CashMovementType = {
  IN: 'IN',
  OUT: 'OUT',
  TRANSFER: 'TRANSFER',
} as const;
export type CashMovementType = (typeof CashMovementType)[keyof typeof CashMovementType];

export const SyncStatus = {
  SYNCED: 'SYNCED',
  PENDING: 'PENDING',
  CONFLICT: 'CONFLICT',
  IGNORED: 'IGNORED',
} as const;
export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus];

export const SourceSystem = {
  SAAS: 'SAAS',
  MICRO: 'MICRO',
  LOGO: 'LOGO',
  NETSIS: 'NETSIS',
  PARASUT: 'PARASUT',
  OTHER: 'OTHER',
} as const;
export type SourceSystem = (typeof SourceSystem)[keyof typeof SourceSystem];
