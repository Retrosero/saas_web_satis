export enum QuoteStatus { DRAFT = 'DRAFT', SENT = 'SENT', VIEWED = 'VIEWED', ACCEPTED = 'ACCEPTED', REJECTED = 'REJECTED', EXPIRED = 'EXPIRED', CONVERTED_TO_ORDER = 'CONVERTED_TO_ORDER', CONVERTED_TO_SALE = 'CONVERTED_TO_SALE', CANCELLED = 'CANCELLED' }
export const QuoteStatusLabel: Record<QuoteStatus, string> = {
  [QuoteStatus.DRAFT]: 'Taslak', [QuoteStatus.SENT]: 'Gönderildi', [QuoteStatus.VIEWED]: 'Görüldü',
  [QuoteStatus.ACCEPTED]: 'Kabul Edildi', [QuoteStatus.REJECTED]: 'Reddedildi', [QuoteStatus.EXPIRED]: 'Süresi Doldu',
  [QuoteStatus.CONVERTED_TO_ORDER]: 'Siparişe Dönüştü', [QuoteStatus.CONVERTED_TO_SALE]: 'Satışa Dönüştü', [QuoteStatus.CANCELLED]: 'İptal',
};
export const QuoteStatusColor: Record<QuoteStatus, string> = { DRAFT: 'gray', SENT: 'blue', VIEWED: 'amber', ACCEPTED: 'green', REJECTED: 'red', EXPIRED: 'gray', CONVERTED_TO_ORDER: 'green', CONVERTED_TO_SALE: 'green', CANCELLED: 'gray' };

export enum CustomerRiskLevel { LOW = 'LOW', MEDIUM = 'MEDIUM', HIGH = 'HIGH', CRITICAL = 'CRITICAL' }
export const CustomerRiskLevelLabel: Record<CustomerRiskLevel, string> = { LOW: 'Düşük', MEDIUM: 'Orta', HIGH: 'Yüksek', CRITICAL: 'Kritik' };
export const CustomerRiskLevelColor: Record<CustomerRiskLevel, string> = { LOW: 'green', MEDIUM: 'amber', HIGH: 'orange', CRITICAL: 'red' };

export enum RecommendationType { PREVIOUSLY_PURCHASED = 'PREVIOUSLY_PURCHASED', FREQUENTLY_BOUGHT_BUNDLE = 'FREQUENTLY_BOUGHT_BUNDLE', PROMOTIONAL = 'PROMOTIONAL', OVERSTOCK = 'OVERSTOCK', TOP_SELLING = 'TOP_SELLING', SAME_CATEGORY = 'SAME_CATEGORY', SAME_BRAND = 'SAME_BRAND' }
export const RecommendationTypeLabel: Record<RecommendationType, string> = {
  PREVIOUSLY_PURCHASED: 'Daha Önce Aldı', FREQUENTLY_BOUGHT_BUNDLE: 'Birlikte Alınan', PROMOTIONAL: 'Kampanyalı', OVERSTOCK: 'Stok Fazlası', TOP_SELLING: 'Çok Satan', SAME_CATEGORY: 'Aynı Kategori', SAME_BRAND: 'Aynı Marka',
};

export enum BulkOperationType { PRICE_UPDATE = 'PRICE_UPDATE', CATEGORY_CHANGE = 'CATEGORY_CHANGE', BRAND_ASSIGN = 'BRAND_ASSIGN', CUSTOMER_GROUP_ASSIGN = 'CUSTOMER_GROUP_ASSIGN', SALESPERSON_ASSIGN = 'SALESPERSON_ASSIGN', PRODUCT_DEACTIVATE = 'PRODUCT_DEACTIVATE', CUSTOMER_DEACTIVATE = 'CUSTOMER_DEACTIVATE', CAMPAIGN_ASSIGN = 'CAMPAIGN_ASSIGN', RISK_LIMIT_UPDATE = 'RISK_LIMIT_UPDATE', WAREHOUSE_UPDATE = 'WAREHOUSE_UPDATE' }
export const BulkOperationTypeLabel: Record<BulkOperationType, string> = {
  PRICE_UPDATE: 'Toplu Fiyat Güncelle', CATEGORY_CHANGE: 'Toplu Kategori Değiştir', BRAND_ASSIGN: 'Toplu Marka Ata',
  CUSTOMER_GROUP_ASSIGN: 'Toplu Cari Grup', SALESPERSON_ASSIGN: 'Toplu Plasiyer', PRODUCT_DEACTIVATE: 'Toplu Ürün Pasife',
  CUSTOMER_DEACTIVATE: 'Toplu Cari Pasife', CAMPAIGN_ASSIGN: 'Toplu Kampanya', RISK_LIMIT_UPDATE: 'Toplu Risk Limiti', WAREHOUSE_UPDATE: 'Toplu Depo',
};
export enum BulkOperationStatus { DRAFT = 'DRAFT', PREVIEW = 'PREVIEW', PENDING = 'PENDING', RUNNING = 'RUNNING', COMPLETED = 'COMPLETED', FAILED = 'FAILED', CANCELLED = 'CANCELLED', ROLLED_BACK = 'ROLLED_BACK' }
export const BulkOperationStatusLabel: Record<BulkOperationStatus, string> = { DRAFT: 'Taslak', PREVIEW: 'Önizleme', PENDING: 'Onay Bekliyor', RUNNING: 'Çalışıyor', COMPLETED: 'Tamamlandı', FAILED: 'Hata', CANCELLED: 'İptal', ROLLED_BACK: 'Geri Alındı' };

export enum LabelType { BARCODE = 'BARCODE', SHELF = 'SHELF', PRICE = 'PRICE', QR = 'QR', CARTON = 'CARTON' }
export const LabelTypeLabel: Record<LabelType, string> = { BARCODE: 'Barkod', SHELF: 'Raf', PRICE: 'Fiyat', QR: 'QR', CARTON: 'Koli' };
export enum LabelPageSize { A4 = 'A4', SIZE_58MM = 'SIZE_58MM', SIZE_80MM = 'SIZE_80MM', CUSTOM = 'CUSTOM' }
export const LabelPageSizeLabel: Record<LabelPageSize, string> = { A4: 'A4 (210×297mm)', SIZE_58MM: '58mm Termal', SIZE_80MM: '80mm Termal', CUSTOM: 'Özel' };

export enum SegmentType { MANUAL = 'MANUAL', AUTOMATIC = 'AUTOMATIC' }
export const SegmentTypeLabel: Record<SegmentType, string> = { MANUAL: 'Manuel', AUTOMATIC: 'Otomatik' };

export enum CleanupType { OLD_LOGS = 'OLD_LOGS', OLD_IMPORT_FILES = 'OLD_IMPORT_FILES', UNUSED_IMAGES = 'UNUSED_IMAGES', INACTIVE_CUSTOMERS = 'INACTIVE_CUSTOMERS', INACTIVE_PRODUCTS = 'INACTIVE_PRODUCTS', STORAGE_OPTIMIZE = 'STORAGE_OPTIMIZE' }
export const CleanupTypeLabel: Record<CleanupType, string> = { OLD_LOGS: 'Eski Loglar', OLD_IMPORT_FILES: 'Eski Import Dosyaları', UNUSED_IMAGES: 'Kullanılmayan Görseller', INACTIVE_CUSTOMERS: 'Pasif Cariler', INACTIVE_PRODUCTS: 'Pasif Ürünler', STORAGE_OPTIMIZE: 'Storage Optimizasyonu' };
export const CleanupStatusLabel: Record<string, string> = { PENDING: 'Bekliyor', PREVIEW: 'Önizleme', RUNNING: 'Çalışıyor', COMPLETED: 'Tamamlandı', FAILED: 'Hata', CANCELLED: 'İptal' };
