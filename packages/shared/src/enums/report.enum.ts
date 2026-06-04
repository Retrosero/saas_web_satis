/**
 * Gelişmiş Rapor / Pivot enumları.
 *
 * Sürükle-bırak pivot motoru, satır/sütun/değer/filtre alanları.
 */

export const ReportFieldCategory = {
  CUSTOMER: 'CUSTOMER',
  PRODUCT: 'PRODUCT',
  SALE: 'SALE',
  COLLECTION: 'COLLECTION',
  WAREHOUSE: 'WAREHOUSE',
} as const;
export type ReportFieldCategory = (typeof ReportFieldCategory)[keyof typeof ReportFieldCategory];

export const AggregateType = {
  SUM: 'SUM',
  AVG: 'AVG',
  MIN: 'MIN',
  MAX: 'MAX',
  COUNT: 'COUNT',
  DISTINCT_COUNT: 'DISTINCT_COUNT',
  PERCENTAGE: 'PERCENTAGE',
  CUMULATIVE_SUM: 'CUMULATIVE_SUM',
} as const;
export type AggregateType = (typeof AggregateType)[keyof typeof AggregateType];

export const ChartType = {
  TABLE: 'TABLE',
  BAR: 'BAR',
  LINE: 'LINE',
  PIE: 'PIE',
  AREA: 'AREA',
} as const;
export type ChartType = (typeof ChartType)[keyof typeof ChartType];

export const ReportShareScope = {
  PRIVATE: 'PRIVATE',
  ALL_TENANT: 'ALL_TENANT',
  ROLES: 'ROLES',
  USERS: 'USERS',
} as const;
export type ReportShareScope = (typeof ReportShareScope)[keyof typeof ReportShareScope];

export const ReportType = {
  PRESET: 'PRESET',
  PIVOT: 'PIVOT',
} as const;
export type ReportType = (typeof ReportType)[keyof typeof ReportType];

/** Pivot alan tanımı */
export interface ReportField {
  /** Alan kodu (örn: 'customer.city', 'sale.grandTotal') */
  field: string;
  label: string;
  category: ReportFieldCategory;
  /** Pivot'ta kullanılabilir mi? */
  groupable: boolean;  // row/col/filter
  aggregatable: boolean; // value
  /** Sayısal mı? (SUM/AVG/MIN/MAX için) */
  numeric: boolean;
}

export const REPORT_FIELDS: ReportField[] = [
  // CUSTOMER
  { field: 'customer.city', label: 'İl', category: 'CUSTOMER', groupable: true, aggregatable: false, numeric: false },
  { field: 'customer.district', label: 'İlçe', category: 'CUSTOMER', groupable: true, aggregatable: false, numeric: false },
  { field: 'customer.groupCode', label: 'Cari Grup', category: 'CUSTOMER', groupable: true, aggregatable: false, numeric: false },
  { field: 'customer.code', label: 'Cari Kod', category: 'CUSTOMER', groupable: true, aggregatable: false, numeric: false },
  { field: 'customer.name', label: 'Cari Adı', category: 'CUSTOMER', groupable: true, aggregatable: false, numeric: false },
  { field: 'customer.salesperson', label: 'Plasiyer', category: 'CUSTOMER', groupable: true, aggregatable: false, numeric: false },
  { field: 'customer.riskGroup', label: 'Risk Grubu', category: 'CUSTOMER', groupable: true, aggregatable: false, numeric: false },
  // PRODUCT
  { field: 'product.code', label: 'Ürün Kodu', category: 'PRODUCT', groupable: true, aggregatable: false, numeric: false },
  { field: 'product.name', label: 'Ürün Adı', category: 'PRODUCT', groupable: true, aggregatable: false, numeric: false },
  { field: 'product.brand', label: 'Marka', category: 'PRODUCT', groupable: true, aggregatable: false, numeric: false },
  { field: 'product.category', label: 'Kategori', category: 'PRODUCT', groupable: true, aggregatable: false, numeric: false },
  { field: 'product.subCategory', label: 'Alt Kategori', category: 'PRODUCT', groupable: true, aggregatable: false, numeric: false },
  { field: 'product.barcode', label: 'Barkod', category: 'PRODUCT', groupable: true, aggregatable: false, numeric: false },
  { field: 'product.unit', label: 'Birim', category: 'PRODUCT', groupable: true, aggregatable: false, numeric: false },
  // SALE
  { field: 'sale.date', label: 'Satış Tarihi', category: 'SALE', groupable: true, aggregatable: false, numeric: false },
  { field: 'sale.number', label: 'Belge No', category: 'SALE', groupable: true, aggregatable: false, numeric: false },
  { field: 'sale.grandTotal', label: 'Satış Tutarı', category: 'SALE', groupable: false, aggregatable: true, numeric: true },
  { field: 'sale.quantity', label: 'Satış Adedi', category: 'SALE', groupable: false, aggregatable: true, numeric: true },
  { field: 'sale.discount', label: 'İskonto Tutarı', category: 'SALE', groupable: false, aggregatable: true, numeric: true },
  { field: 'sale.vat', label: 'KDV Tutarı', category: 'SALE', groupable: false, aggregatable: true, numeric: true },
  { field: 'sale.net', label: 'Net Tutar', category: 'SALE', groupable: false, aggregatable: true, numeric: true },
  { field: 'sale.cost', label: 'Maliyet', category: 'SALE', groupable: false, aggregatable: true, numeric: true },
  { field: 'sale.profit', label: 'Kâr', category: 'SALE', groupable: false, aggregatable: true, numeric: true },
  // COLLECTION
  { field: 'collection.date', label: 'Tahsilat Tarihi', category: 'COLLECTION', groupable: true, aggregatable: false, numeric: false },
  { field: 'collection.amount', label: 'Tahsilat Tutarı', category: 'COLLECTION', groupable: false, aggregatable: true, numeric: true },
  { field: 'collection.paymentType', label: 'Ödeme Tipi', category: 'COLLECTION', groupable: true, aggregatable: false, numeric: false },
  { field: 'collection.cashAccount', label: 'Kasa', category: 'COLLECTION', groupable: true, aggregatable: false, numeric: false },
  { field: 'collection.bankAccount', label: 'Banka', category: 'COLLECTION', groupable: true, aggregatable: false, numeric: false },
  // WAREHOUSE
  { field: 'warehouse.name', label: 'Depo', category: 'WAREHOUSE', groupable: true, aggregatable: false, numeric: false },
  { field: 'stock.quantity', label: 'Stok Miktarı', category: 'WAREHOUSE', groupable: false, aggregatable: true, numeric: true },
  { field: 'stock.minLevel', label: 'Kritik Stok', category: 'WAREHOUSE', groupable: false, aggregatable: true, numeric: true },
  { field: 'stock.diff', label: 'Sayım Farkı', category: 'WAREHOUSE', groupable: false, aggregatable: true, numeric: true },
];

export const AggregateTypeLabel: Record<AggregateType, string> = {
  SUM: 'Toplam', AVG: 'Ortalama', MIN: 'Minimum', MAX: 'Maksimum',
  COUNT: 'Sayı', DISTINCT_COUNT: 'Benzersiz Sayı', PERCENTAGE: 'Yüzde Oran', CUMULATIVE_SUM: 'Kümülatif Toplam',
};

export const ChartTypeLabel: Record<ChartType, string> = {
  TABLE: 'Tablo', BAR: 'Çubuk', LINE: 'Çizgi', PIE: 'Pasta', AREA: 'Alan',
};
