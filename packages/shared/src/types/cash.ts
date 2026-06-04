import type { CashAccountType, CashAccountStatus, CashMovementType } from '../enums/common.enum.js';

export interface CashAccount {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  type: CashAccountType;
  status: CashAccountStatus;
  currency: string;
  iban: string | null;
  bankName: string | null;
  bankBranch: string | null;
  accountHolder: string | null;
  isDefault: boolean;
  notes: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  /** Bakiye: SUM(IN - OUT) tüm CONFIRMED hareketlerden hesaplanır */
  balance?: number;
  movementCount?: number;
}

export interface CashMovement {
  id: string;
  tenantId: string;
  cashAccountId: string;
  type: CashMovementType;
  amount: number;
  currency: string;
  exchangeRate: number;
  amountTry: number;
  movementDate: string;
  refType: string;
  refId: string | null;
  refNumber: string | null;
  description: string | null;
  status: 'DRAFT' | 'POSTED' | 'PENDING' | 'CANCELLED';
  transferToAccountId: string | null;
  customerId: string | null;
  customerMovementId: string | null;
  paymentMethodId: string | null;
  reversesId: string | null;
  isDeleted: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}