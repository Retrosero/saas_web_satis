import type { CustomerStatus, CustomerType } from '../enums/common.enum';

/**
 * Cari hesap (müşteri + tedarikçi tek tip).
 * Frontend'de Customer, Supplier, BOTH olarak görüntülenir.
 */
export interface Customer {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  contactName: string | null;
  type: CustomerType;
  status: CustomerStatus;
  taxNumber: string | null;
  taxOffice: string | null;
  identityNumber: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  phone2: string | null;
  email: string | null;
  website: string | null;
  iban: string | null;
  /** Açık hesap limiti (negatifse sınır yok) */
  creditLimit: number;
  /** Vade gün sayısı */
  paymentTermDays: number;
  notes: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cari hareket (event-sourced).
 * Bakiye bu kayıtlardan hesaplanır.
 */
export interface CustomerMovement {
  id: string;
  tenantId: string;
  customerId: string;
  type: 'DEBIT' | 'CREDIT';
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
  reversesId: string | null;
  paymentMethodId: string | null;
  cashAccountId: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
