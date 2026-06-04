/**
 * Banka & POS modülü enumları.
 *
 * Banka hesapları, POS cihazları, banka hareketleri, POS tahsilatları.
 * Event-sourced: bakiyeler hareketlerden hesaplanır.
 */

export const BankAccountStatus = {
  ACTIVE: 'ACTIVE',
  PASSIVE: 'PASSIVE',
  BLOCKED: 'BLOCKED',
} as const;
export type BankAccountStatus = (typeof BankAccountStatus)[keyof typeof BankAccountStatus];

export const BankAccountType = {
  CHECKING: 'CHECKING',         // Vadesiz (TRY)
  SAVINGS: 'SAVINGS',           // Vadeli / birikim
  FOREIGN_CURRENCY: 'FOREIGN_CURRENCY', // Döviz
  POS: 'POS',                   // POS bağlı hesap
} as const;
export type BankAccountType = (typeof BankAccountType)[keyof typeof BankAccountType];

export const BankTransactionType = {
  DEPOSIT: 'DEPOSIT',         // Havale/EFT giriş
  WITHDRAWAL: 'WITHDRAWAL',   // Havale/EFT çıkış
  TRANSFER: 'TRANSFER',       // Virman (banka hesapları arası)
  FEE: 'FEE',                 // Masraf
  COLLECTION: 'COLLECTION',   // Tahsilat (müşteriden)
  PAYMENT: 'PAYMENT',         // Ödeme (tedarikçiye)
  POS_COLLECTION: 'POS_COLLECTION', // POS tahsilatı
  INTEREST: 'INTEREST',       // Faiz
  OTHER: 'OTHER',
} as const;
export type BankTransactionType = (typeof BankTransactionType)[keyof typeof BankTransactionType];

export const PosStatus = {
  ACTIVE: 'ACTIVE',
  PASSIVE: 'PASSIVE',
} as const;
export type PosStatus = (typeof PosStatus)[keyof typeof PosStatus];

export const PosCollectionStatus = {
  PENDING: 'PENDING',       // Henüz bloke süresinde
  SETTLED: 'SETTLED',       // Banka hesabına geçti
  REVERSED: 'REVERSED',     // İptal
  PARTIAL: 'PARTIAL',       // Kısmi
} as const;
export type PosCollectionStatus = (typeof PosCollectionStatus)[keyof typeof PosCollectionStatus];
