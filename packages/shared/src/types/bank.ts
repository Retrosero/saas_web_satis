import type {
  BankAccountStatus,
  BankAccountType,
  BankTransactionType,
  PosCollectionStatus,
  PosStatus,
} from '../enums/bank.enum.js';

export interface BankAccount {
  id: string;
  tenantId: string;
  bankName: string;        // "Ziraat Bankası"
  accountName: string;      // "Ana Vadesiz"
  iban: string | null;
  accountNumber: string | null;
  currency: string;         // TRY, USD, EUR
  type: BankAccountType;
  status: BankAccountStatus;
  branchCode: string | null;
  branchName: string | null;
  notes: string | null;
  isDefault: boolean;
  balance?: number;         // Hesaplanan bakiye (event-sourced)
  createdAt: string;
  updatedAt: string;
}

export interface BankTransaction {
  id: string;
  tenantId: string;
  bankAccountId: string;
  txnDate: string;
  type: BankTransactionType;
  amount: number;            // Pozitif = giriş, negatif = çıkış (signed)
  currency: string;
  exchangeRate: number;
  amountTry: number;         // TL karşılığı (amount * exchangeRate)
  customerId: string | null;
  supplierId: string | null;
  counterBankAccountId: string | null; // Transfer ise karşı hesap
  posCollectionId: string | null;
  description: string | null;
  refType: string | null;    // SALE | COLLECTION | MANUAL | ...
  refId: string | null;
  refNumber: string | null;  // Belge no (insan-okunabilir)
  isReconciled: boolean;
  reconciledAt: string | null;
  isDeleted: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PosDevice {
  id: string;
  tenantId: string;
  bankAccountId: string;     // Tahsilatın aktarılacağı banka hesabı
  name: string;              // "Mağaza 1 POS"
  posCode: string;           // Cihaz kodu
  commissionRate: number;    // %0-100
  blockDays: number;         // Bloke gün sayısı (genelde 1-7)
  status: PosStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PosCollection {
  id: string;
  tenantId: string;
  posDeviceId: string;
  bankAccountId: string;
  collectionDate: string;
  customerId: string | null;
  customerName: string | null;
  amount: number;            // Brüt tutar
  commission: number;        // Komisyon (amount * commissionRate/100)
  netAmount: number;         // Net (amount - commission)
  installment: number;       // Taksit sayısı
  currency: string;
  status: PosCollectionStatus;
  settlementDate: string | null;  // Banka hesabına geçeceği tarih
  description: string | null;
  refType: string | null;
  refId: string | null;
  isDeleted: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CREATE INPUTS
// ============================================================================

export interface CreateBankAccountInput {
  bankName: string;
  accountName: string;
  iban?: string;
  accountNumber?: string;
  currency: string;
  type: BankAccountType;
  branchCode?: string;
  branchName?: string;
  notes?: string;
  isDefault?: boolean;
}

export interface CreateBankTransactionInput {
  bankAccountId: string;
  txnDate: string;
  type: BankTransactionType;
  amount: number;
  currency: string;
  exchangeRate?: number;
  customerId?: string;
  counterBankAccountId?: string;
  description?: string;
  refType?: string;
  refId?: string;
  refNumber?: string;
}

export interface CreatePosDeviceInput {
  bankAccountId: string;
  name: string;
  posCode: string;
  commissionRate: number;
  blockDays: number;
  notes?: string;
}

export interface CreatePosCollectionInput {
  posDeviceId: string;
  collectionDate: string;
  customerId?: string;
  customerName?: string;
  amount: number;
  installment?: number;
  description?: string;
}

// ============================================================================
// LABELS
// ============================================================================

export const BankAccountStatusLabel: Record<BankAccountStatus, string> = {
  ACTIVE: 'Aktif',
  PASSIVE: 'Pasif',
  BLOCKED: 'Bloke',
};

export const BankAccountTypeLabel: Record<BankAccountType, string> = {
  CHECKING: 'Vadesiz',
  SAVINGS: 'Vadeli/Birikim',
  FOREIGN_CURRENCY: 'Döviz',
  POS: 'POS Hesabı',
};

export const BankTransactionTypeLabel: Record<BankTransactionType, string> = {
  DEPOSIT: 'Havale/EFT Giriş',
  WITHDRAWAL: 'Havale/EFT Çıkış',
  TRANSFER: 'Virman',
  FEE: 'Masraf',
  COLLECTION: 'Tahsilat',
  PAYMENT: 'Ödeme',
  POS_COLLECTION: 'POS Tahsilatı',
  INTEREST: 'Faiz',
  OTHER: 'Diğer',
};

export const PosStatusLabel: Record<PosStatus, string> = {
  ACTIVE: 'Aktif',
  PASSIVE: 'Pasif',
};

export const PosCollectionStatusLabel: Record<PosCollectionStatus, string> = {
  PENDING: 'Bekliyor',
  SETTLED: 'Hesaba Geçti',
  REVERSED: 'İptal',
  PARTIAL: 'Kısmi',
};
