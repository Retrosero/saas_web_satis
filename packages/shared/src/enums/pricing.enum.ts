/**
 * Fiyat listesi, müşteri grubu, kampanya, iskonto enumları.
 */

export const PriceListStatus = {
  ACTIVE: 'ACTIVE',
  PASSIVE: 'PASSIVE',
  EXPIRED: 'EXPIRED',
  DRAFT: 'DRAFT',
} as const;
export type PriceListStatus = (typeof PriceListStatus)[keyof typeof PriceListStatus];

export const DiscountType = {
  PERCENT: 'PERCENT',     // Yüzde iskonto
  AMOUNT: 'AMOUNT',       // Tutar iskonto
  FIXED_PRICE: 'FIXED_PRICE', // Sabit fiyat (2 al 1 öde, al fiyattan)
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

export const CampaignType = {
  PRODUCT: 'PRODUCT',                 // Ürün bazlı
  BRAND: 'BRAND',                     // Marka bazlı
  CATEGORY: 'CATEGORY',               // Kategori bazlı
  CUSTOMER_GROUP: 'CUSTOMER_GROUP',   // Müşteri grubu bazlı
  CART_AMOUNT: 'CART_AMOUNT',         // Sepet tutarı bazlı
  QUANTITY: 'QUANTITY',               // Adet bazlı
  DATE_RANGE: 'DATE_RANGE',           // Tarih aralıklı
} as const;
export type CampaignType = (typeof CampaignType)[keyof typeof CampaignType];

export const CampaignStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PASSIVE: 'PASSIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;
export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

export const PriceListStatusLabel: Record<PriceListStatus, string> = {
  ACTIVE: 'Aktif', PASSIVE: 'Pasif', EXPIRED: 'Süresi Doldu', DRAFT: 'Taslak',
};

export const CampaignStatusLabel: Record<CampaignStatus, string> = {
  DRAFT: 'Taslak', ACTIVE: 'Aktif', PASSIVE: 'Pasif', EXPIRED: 'Süresi Doldu', CANCELLED: 'İptal',
};

export const CampaignTypeLabel: Record<CampaignType, string> = {
  PRODUCT: 'Ürün Bazlı', BRAND: 'Marka Bazlı', CATEGORY: 'Kategori Bazlı',
  CUSTOMER_GROUP: 'Müşteri Grubu Bazlı', CART_AMOUNT: 'Sepet Tutarı Bazlı',
  QUANTITY: 'Adet Bazlı', DATE_RANGE: 'Tarih Aralıklı',
};

export const DiscountTypeLabel: Record<DiscountType, string> = {
  PERCENT: 'Yüzde İskonto', AMOUNT: 'Tutar İskonto', FIXED_PRICE: 'Sabit Fiyat',
};
