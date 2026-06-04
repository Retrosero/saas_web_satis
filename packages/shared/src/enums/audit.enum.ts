export enum DataCheckType {
  MISSING_CUSTOMER_BALANCE = 'MISSING_CUSTOMER_BALANCE',
  MISSING_PRODUCT_BARCODE = 'MISSING_PRODUCT_BARCODE',
  NEGATIVE_STOCK = 'NEGATIVE_STOCK',
  DUPLICATE_INVOICE_NUMBER = 'DUPLICATE_INVOICE_NUMBER',
  ORPHANED_PAYMENT = 'ORPHANED_PAYMENT',
  STOCK_BALANCE_MISMATCH = 'STOCK_BALANCE_MISMATCH',
  CUSTOMER_NO_CONTACT = 'CUSTOMER_NO_CONTACT',
  CASH_MOVEMENT_MISSING_DOC = 'CASH_MOVEMENT_MISSING_DOC',
  PRICE_BELOW_COST = 'PRICE_BELOW_COST',
  DISCOUNT_OVER_LIMIT = 'DISCOUNT_OVER_LIMIT',
  INACTIVE_PRODUCT_SOLD = 'INACTIVE_PRODUCT_SOLD',
  INACTIVE_CUSTOMER_SALE = 'INACTIVE_CUSTOMER_SALE',
  STOCK_NO_WAREHOUSE = 'STOCK_NO_WAREHOUSE',
  RETURN_NO_REASON = 'RETURN_NO_REASON',
  COLLECTION_OVERDUE = 'COLLECTION_OVERDUE',
  TAX_NUMBER_INVALID = 'TAX_NUMBER_INVALID',
  EMAIL_INVALID = 'EMAIL_INVALID',
  PHONE_INVALID = 'PHONE_INVALID',
}

export const DataCheckTypeLabel: Record<DataCheckType, string> = {
  [DataCheckType.MISSING_CUSTOMER_BALANCE]: 'Cari Bakiyesi Eksik',
  [DataCheckType.MISSING_PRODUCT_BARCODE]: 'Ürün Barkodu Eksik',
  [DataCheckType.NEGATIVE_STOCK]: 'Negatif Stok',
  [DataCheckType.DUPLICATE_INVOICE_NUMBER]: 'Mükerrer Fatura No',
  [DataCheckType.ORPHANED_PAYMENT]: 'Yetim Ödeme',
  [DataCheckType.STOCK_BALANCE_MISMATCH]: 'Stok Bakiye Uyuşmazlığı',
  [DataCheckType.CUSTOMER_NO_CONTACT]: 'Cari İletişim Bilgisi Yok',
  [DataCheckType.CASH_MOVEMENT_MISSING_DOC]: 'Belgesiz Kasa Hareketi',
  [DataCheckType.PRICE_BELOW_COST]: 'Alış Fiyatı Altında Satış',
  [DataCheckType.DISCOUNT_OVER_LIMIT]: 'Limit Üstü İskonto',
  [DataCheckType.INACTIVE_PRODUCT_SOLD]: 'Pasif Ürün Satışı',
  [DataCheckType.INACTIVE_CUSTOMER_SALE]: 'Pasif Cariye Satış',
  [DataCheckType.STOCK_NO_WAREHOUSE]: 'Deposuz Stok',
  [DataCheckType.RETURN_NO_REASON]: 'Sebepsiz İade',
  [DataCheckType.COLLECTION_OVERDUE]: 'Gecikmiş Tahsilat',
  [DataCheckType.TAX_NUMBER_INVALID]: 'Geçersiz VKN',
  [DataCheckType.EMAIL_INVALID]: 'Geçersiz E-posta',
  [DataCheckType.PHONE_INVALID]: 'Geçersiz Telefon',
};

export const DataCheckTypeCategory: Record<DataCheckType, string> = {
  [DataCheckType.MISSING_CUSTOMER_BALANCE]: 'CARI',
  [DataCheckType.CUSTOMER_NO_CONTACT]: 'CARI',
  [DataCheckType.ORPHANED_PAYMENT]: 'CARI',
  [DataCheckType.COLLECTION_OVERDUE]: 'CARI',
  [DataCheckType.INACTIVE_CUSTOMER_SALE]: 'CARI',
  [DataCheckType.TAX_NUMBER_INVALID]: 'CARI',
  [DataCheckType.EMAIL_INVALID]: 'CARI',
  [DataCheckType.PHONE_INVALID]: 'CARI',
  [DataCheckType.MISSING_PRODUCT_BARCODE]: 'STOK',
  [DataCheckType.NEGATIVE_STOCK]: 'STOK',
  [DataCheckType.STOCK_BALANCE_MISMATCH]: 'STOK',
  [DataCheckType.INACTIVE_PRODUCT_SOLD]: 'STOK',
  [DataCheckType.STOCK_NO_WAREHOUSE]: 'STOK',
  [DataCheckType.PRICE_BELOW_COST]: 'SATIS',
  [DataCheckType.DISCOUNT_OVER_LIMIT]: 'SATIS',
  [DataCheckType.DUPLICATE_INVOICE_NUMBER]: 'FATURA',
  [DataCheckType.RETURN_NO_REASON]: 'IADE',
  [DataCheckType.CASH_MOVEMENT_MISSING_DOC]: 'KASA',
};

export const DataCheckTypeIcon: Record<DataCheckType, string> = {
  [DataCheckType.MISSING_CUSTOMER_BALANCE]: '💰',
  [DataCheckType.MISSING_PRODUCT_BARCODE]: '🏷️',
  [DataCheckType.NEGATIVE_STOCK]: '📉',
  [DataCheckType.DUPLICATE_INVOICE_NUMBER]: '🧾',
  [DataCheckType.ORPHANED_PAYMENT]: '💸',
  [DataCheckType.STOCK_BALANCE_MISMATCH]: '⚖️',
  [DataCheckType.CUSTOMER_NO_CONTACT]: '📞',
  [DataCheckType.CASH_MOVEMENT_MISSING_DOC]: '🧮',
  [DataCheckType.PRICE_BELOW_COST]: '⚠️',
  [DataCheckType.DISCOUNT_OVER_LIMIT]: '🎯',
  [DataCheckType.INACTIVE_PRODUCT_SOLD]: '🚫',
  [DataCheckType.INACTIVE_CUSTOMER_SALE]: '🚫',
  [DataCheckType.STOCK_NO_WAREHOUSE]: '📦',
  [DataCheckType.RETURN_NO_REASON]: '↩️',
  [DataCheckType.COLLECTION_OVERDUE]: '⏰',
  [DataCheckType.TAX_NUMBER_INVALID]: '🔢',
  [DataCheckType.EMAIL_INVALID]: '✉️',
  [DataCheckType.PHONE_INVALID]: '📱',
};

export enum DataCheckSeverity {
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export const DataCheckSeverityLabel: Record<DataCheckSeverity, string> = {
  [DataCheckSeverity.INFO]: 'Bilgi',
  [DataCheckSeverity.LOW]: 'Düşük',
  [DataCheckSeverity.MEDIUM]: 'Orta',
  [DataCheckSeverity.HIGH]: 'Yüksek',
  [DataCheckSeverity.CRITICAL]: 'Kritik',
};

export const DataCheckSeverityColor: Record<DataCheckSeverity, string> = {
  [DataCheckSeverity.INFO]: 'blue',
  [DataCheckSeverity.LOW]: 'gray',
  [DataCheckSeverity.MEDIUM]: 'amber',
  [DataCheckSeverity.HIGH]: 'orange',
  [DataCheckSeverity.CRITICAL]: 'red',
};

export enum DataCheckRunStatus {
  DRAFT = 'DRAFT',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export const DataCheckRunStatusLabel: Record<DataCheckRunStatus, string> = {
  [DataCheckRunStatus.DRAFT]: 'Taslak',
  [DataCheckRunStatus.RUNNING]: 'Çalışıyor',
  [DataCheckRunStatus.COMPLETED]: 'Tamamlandı',
  [DataCheckRunStatus.FAILED]: 'Hata',
  [DataCheckRunStatus.CANCELLED]: 'İptal',
};

export enum DataCheckResultStatus {
  OPEN = 'OPEN',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  IN_PROGRESS = 'IN_PROGRESS',
  FIXED = 'FIXED',
  IGNORED = 'IGNORED',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
}

export const DataCheckResultStatusLabel: Record<DataCheckResultStatus, string> = {
  [DataCheckResultStatus.OPEN]: 'Açık',
  [DataCheckResultStatus.ACKNOWLEDGED]: 'İnceleniyor',
  [DataCheckResultStatus.IN_PROGRESS]: 'Üzerinde Çalışılıyor',
  [DataCheckResultStatus.FIXED]: 'Çözüldü',
  [DataCheckResultStatus.IGNORED]: 'Yok Sayıldı',
  [DataCheckResultStatus.FALSE_POSITIVE]: 'Yanlış Tespit',
};

export const DataCheckResultStatusColor: Record<DataCheckResultStatus, string> = {
  [DataCheckResultStatus.OPEN]: 'red',
  [DataCheckResultStatus.ACKNOWLEDGED]: 'amber',
  [DataCheckResultStatus.IN_PROGRESS]: 'blue',
  [DataCheckResultStatus.FIXED]: 'green',
  [DataCheckResultStatus.IGNORED]: 'gray',
  [DataCheckResultStatus.FALSE_POSITIVE]: 'purple',
};

export enum DataCheckFrequency {
  MANUAL = 'MANUAL',
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export const DataCheckFrequencyLabel: Record<DataCheckFrequency, string> = {
  [DataCheckFrequency.MANUAL]: 'Manuel',
  [DataCheckFrequency.HOURLY]: 'Saatlik',
  [DataCheckFrequency.DAILY]: 'Günlük',
  [DataCheckFrequency.WEEKLY]: 'Haftalık',
  [DataCheckFrequency.MONTHLY]: 'Aylık',
};
