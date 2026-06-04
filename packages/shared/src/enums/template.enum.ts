/**
 * Belge/PDF şablon enumları.
 *
 * Satış, sipariş, tahsilat, iade, kasa için yazdırma/PDF şablonları.
 * Şablonlar blok-tabanlı (sections) JSON olarak saklanır.
 */

export const DocumentType = {
  SALE: 'SALE',                 // Satış Formu
  ORDER: 'ORDER',               // Sipariş Formu
  COLLECTION: 'COLLECTION',     // Tahsilat Makbuzu
  RETURN: 'RETURN',             // İade Formu
  CASH: 'CASH',                 // Kasa Fişi
  STATEMENT: 'STATEMENT',       // Cari Ekstre
  STOCK_REPORT: 'STOCK_REPORT', // Stok Raporu
  SALES_REPORT: 'SALES_REPORT', // Satış Raporu
  QUOTE: 'QUOTE',               // Teklif Formu
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const PageFormat = {
  A4_PORTRAIT: 'A4_PORTRAIT',
  A4_LANDSCAPE: 'A4_LANDSCAPE',
  THERMAL_58: 'THERMAL_58',
  THERMAL_80: 'THERMAL_80',
  CUSTOM: 'CUSTOM',
} as const;
export type PageFormat = (typeof PageFormat)[keyof typeof PageFormat];

export const DocumentTypeLabel: Record<DocumentType, string> = {
  SALE: 'Satış Formu', ORDER: 'Sipariş Formu', COLLECTION: 'Tahsilat Makbuzu',
  RETURN: 'İade Formu', CASH: 'Kasa Fişi', STATEMENT: 'Cari Ekstre',
  STOCK_REPORT: 'Stok Raporu', SALES_REPORT: 'Satış Raporu', QUOTE: 'Teklif Formu',
};

export const PageFormatLabel: Record<PageFormat, string> = {
  A4_PORTRAIT: 'A4 Dikey', A4_LANDSCAPE: 'A4 Yatay',
  THERMAL_58: '58mm Termal', THERMAL_80: '80mm Termal', CUSTOM: 'Özel Ölçü',
};
