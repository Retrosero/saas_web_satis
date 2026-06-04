/**
 * İade (Return) modülü enumları.
 *
 * Satıştan veya sevkiyattan sonra geri alınan ürün/hizmetler.
 * Soft delete + ters kayıt (event sourcing) felsefesi uygulanır.
 */

export const ReturnStatus = {
  DRAFT: 'DRAFT',             // Taslak (henüz onaylanmadı)
  PENDING: 'PENDING',         // Onay bekliyor
  APPROVED: 'APPROVED',       // Onaylandı (henüz stok etkisi yok)
  COMPLETED: 'COMPLETED',     // Tamamlandı (stok geri alındı, cari düzeltildi)
  REJECTED: 'REJECTED',       // Reddedildi
  CANCELLED: 'CANCELLED',     // İptal edildi (ters kayıt)
} as const;
export type ReturnStatus = (typeof ReturnStatus)[keyof typeof ReturnStatus];

/** İade nedenleri */
export const ReturnReason = {
  INTACT: 'INTACT',                 // Sağlam iade (müşteri vazgeçti)
  DEFECTIVE: 'DEFECTIVE',           // Arızalı iade
  WRONG_PRODUCT: 'WRONG_PRODUCT',   // Yanlış ürün gönderildi
  EXCESS: 'EXCESS',                 // Fazla ürün gönderildi
  OTHER: 'OTHER',                   // Diğer
} as const;
export type ReturnReason = (typeof ReturnReason)[keyof typeof ReturnReason];

/** İade tipi — ne ile ilişkili */
export const ReturnSource = {
  SALE: 'SALE',         // Satıştan iade
  ORDER: 'ORDER',       // Sevkiyattan iade
  DIRECT: 'DIRECT',     // Direkt iade (bağlantısız)
} as const;
export type ReturnSource = (typeof ReturnSource)[keyof typeof ReturnSource];

/** Ürünün fiziksel durumu (sağlam/arızalı) */
export const ReturnItemCondition = {
  INTACT: 'INTACT',         // Sağlam (stoka geri alınabilir)
  DEFECTIVE: 'DEFECTIVE',   // Arızalı (stoka alınmaz, ayrı kayıt)
  DAMAGED: 'DAMAGED',       // Hasarlı
} as const;
export type ReturnItemCondition = (typeof ReturnItemCondition)[keyof typeof ReturnItemCondition];
