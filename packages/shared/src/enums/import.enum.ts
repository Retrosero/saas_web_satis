/**
 * Veri taşıma / içe aktarma modülü enumları.
 *
 * Excel/CSV/SQL/XML kaynaklardan müşteri/ürün/fiyat/bakiye aktarımı.
 * Satış geçmişi sadece ARŞİV amaçlıdır (cari/stok bakiyesini ETKİLEMEZ).
 */

export const ImportSource = {
  EXCEL: 'EXCEL',
  CSV: 'CSV',
  XML: 'XML',
  MIKRO: 'MIKRO',
  LOGO: 'LOGO',
  NETSIS: 'NETSIS',
  PARASUT: 'PARASUT',
  CUSTOM_SQL: 'CUSTOM_SQL',
  MANUAL: 'MANUAL',
} as const;
export type ImportSource = (typeof ImportSource)[keyof typeof ImportSource];

export const ImportEntityType = {
  CUSTOMER: 'CUSTOMER',
  PRODUCT: 'PRODUCT',
  PRICE: 'PRICE',
  BARCODE: 'BARCODE',
  WAREHOUSE: 'WAREHOUSE',
  CUSTOMER_BALANCE: 'CUSTOMER_BALANCE',
  STOCK_BALANCE: 'STOCK_BALANCE',
  ARCHIVE_SALE: 'ARCHIVE_SALE',
} as const;
export type ImportEntityType = (typeof ImportEntityType)[keyof typeof ImportEntityType];

export const ImportStatus = {
  DRAFT: 'DRAFT',
  MAPPING: 'MAPPING',
  PREVIEW: 'PREVIEW',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  ROLLED_BACK: 'ROLLED_BACK',
} as const;
export type ImportStatus = (typeof ImportStatus)[keyof typeof ImportStatus];

/** Her entity tipi için hedef alanlar (kolon eşleştirme için) */
export const ImportTargetFields: Record<ImportEntityType, Array<{ key: string; label: string; required: boolean; type: 'string' | 'number' | 'date' | 'boolean' }>> = {
  CUSTOMER: [
    { key: 'code', label: 'Cari Kodu', required: true, type: 'string' },
    { key: 'name', label: 'Cari Adı', required: true, type: 'string' },
    { key: 'taxNumber', label: 'Vergi No', required: false, type: 'string' },
    { key: 'taxOffice', label: 'Vergi Dairesi', required: false, type: 'string' },
    { key: 'address', label: 'Adres', required: false, type: 'string' },
    { key: 'city', label: 'Şehir', required: false, type: 'string' },
    { key: 'phone', label: 'Telefon', required: false, type: 'string' },
    { key: 'email', label: 'E-posta', required: false, type: 'string' },
    { key: 'contactPerson', label: 'Yetkili', required: false, type: 'string' },
    { key: 'type', label: 'Tip (CUSTOMER/SUPPLIER/BOTH)', required: false, type: 'string' },
  ],
  PRODUCT: [
    { key: 'code', label: 'Ürün Kodu', required: true, type: 'string' },
    { key: 'name', label: 'Ürün Adı', required: true, type: 'string' },
    { key: 'shortName', label: 'Kısa Ad', required: false, type: 'string' },
    { key: 'barcode', label: 'Barkod', required: false, type: 'string' },
    { key: 'unit', label: 'Birim', required: false, type: 'string' },
    { key: 'vatRate', label: 'KDV %', required: false, type: 'number' },
    { key: 'salePrice', label: 'Satış Fiyatı', required: false, type: 'number' },
    { key: 'category', label: 'Kategori', required: false, type: 'string' },
    { key: 'brand', label: 'Marka', required: false, type: 'string' },
  ],
  PRICE: [
    { key: 'productCode', label: 'Ürün Kodu', required: true, type: 'string' },
    { key: 'priceList', label: 'Fiyat Listesi', required: true, type: 'string' },
    { key: 'price', label: 'Fiyat', required: true, type: 'number' },
    { key: 'currency', label: 'Para Birimi', required: false, type: 'string' },
    { key: 'validFrom', label: 'Geçerlilik Başlangıç', required: false, type: 'date' },
    { key: 'validTo', label: 'Geçerlilik Bitiş', required: false, type: 'date' },
  ],
  BARCODE: [
    { key: 'productCode', label: 'Ürün Kodu', required: true, type: 'string' },
    { key: 'barcode', label: 'Barkod', required: true, type: 'string' },
    { key: 'unit', label: 'Birim', required: false, type: 'string' },
    { key: 'isPrimary', label: 'Birincil mi?', required: false, type: 'boolean' },
  ],
  WAREHOUSE: [
    { key: 'code', label: 'Depo Kodu', required: true, type: 'string' },
    { key: 'name', label: 'Depo Adı', required: true, type: 'string' },
    { key: 'branch', label: 'Şube', required: false, type: 'string' },
    { key: 'manager', label: 'Sorumlu', required: false, type: 'string' },
    { key: 'address', label: 'Adres', required: false, type: 'string' },
    { key: 'city', label: 'Şehir', required: false, type: 'string' },
  ],
  CUSTOMER_BALANCE: [
    { key: 'customerCode', label: 'Cari Kodu', required: true, type: 'string' },
    { key: 'amount', label: 'Bakiye', required: true, type: 'number' },
    { key: 'currency', label: 'Para Birimi', required: false, type: 'string' },
    { key: 'asOfDate', label: 'Bakiye Tarihi', required: false, type: 'date' },
  ],
  STOCK_BALANCE: [
    { key: 'productCode', label: 'Ürün Kodu', required: true, type: 'string' },
    { key: 'warehouseCode', label: 'Depo Kodu', required: true, type: 'string' },
    { key: 'quantity', label: 'Miktar', required: true, type: 'number' },
    { key: 'asOfDate', label: 'Bakiye Tarihi', required: false, type: 'date' },
  ],
  ARCHIVE_SALE: [
    { key: 'saleNumber', label: 'Belge No', required: true, type: 'string' },
    { key: 'saleDate', label: 'Tarih', required: true, type: 'date' },
    { key: 'customerCode', label: 'Cari Kodu', required: true, type: 'string' },
    { key: 'productCode', label: 'Ürün Kodu', required: false, type: 'string' },
    { key: 'quantity', label: 'Miktar', required: false, type: 'number' },
    { key: 'unitPrice', label: 'Birim Fiyat', required: false, type: 'number' },
    { key: 'totalAmount', label: 'Toplam Tutar', required: true, type: 'number' },
    { key: 'description', label: 'Açıklama', required: false, type: 'string' },
  ],
};

export const ImportSourceLabel: Record<ImportSource, string> = {
  EXCEL: 'Excel',
  CSV: 'CSV',
  XML: 'XML',
  MIKRO: 'Mikro',
  LOGO: 'Logo',
  NETSIS: 'Netsis',
  PARASUT: 'Paraşüt',
  CUSTOM_SQL: 'Özel SQL',
  MANUAL: 'Manuel',
};

export const ImportEntityTypeLabel: Record<ImportEntityType, string> = {
  CUSTOMER: 'Cari Kartlar',
  PRODUCT: 'Stok Kartları',
  PRICE: 'Fiyatlar',
  BARCODE: 'Barkodlar',
  WAREHOUSE: 'Depolar',
  CUSTOMER_BALANCE: 'Cari Bakiyeleri',
  STOCK_BALANCE: 'Stok Bakiyeleri',
  ARCHIVE_SALE: 'Arşiv Satış Geçmişi',
};

export const ImportStatusLabel: Record<ImportStatus, string> = {
  DRAFT: 'Taslak',
  MAPPING: 'Eşleştirme',
  PREVIEW: 'Ön İzleme',
  RUNNING: 'Çalışıyor',
  COMPLETED: 'Tamamlandı',
  FAILED: 'Başarısız',
  CANCELLED: 'İptal Edildi',
  ROLLED_BACK: 'Geri Alındı',
};
