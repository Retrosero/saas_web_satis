/**
 * Genel enumlar.
 */

export const CustomerType = {
  CUSTOMER: 'CUSTOMER',
  SUPPLIER: 'SUPPLIER',
  BOTH: 'BOTH',
} as const;
export type CustomerType = (typeof CustomerType)[keyof typeof CustomerType];

export const CustomerStatus = {
  ACTIVE: 'ACTIVE',
  PASSIVE: 'PASSIVE',
  BLOCKED: 'BLOCKED',
} as const;
export type CustomerStatus = (typeof CustomerStatus)[keyof typeof CustomerStatus];

export const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PARTIALLY_SHIPPED: 'PARTIALLY_SHIPPED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const OrderType = {
  SALES_ORDER: 'SALES_ORDER',
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  RETURN_ORDER: 'RETURN_ORDER',
  PROFORMA_ORDER: 'PROFORMA_ORDER',
  CONSIGNMENT_OUT: 'CONSIGNMENT_OUT',
} as const;
export type OrderType = (typeof OrderType)[keyof typeof OrderType];

export const PaymentType = {
  CASH: 'CASH',
  CARD: 'CARD',
  BANK: 'BANK',
  EFT: 'EFT',
  CHECK: 'CHECK',
  OTHER: 'OTHER',
} as const;
export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType];

export const CashAccountType = {
  CASH: 'CASH',
  BANK: 'BANK',
  POS: 'POS',
} as const;
export type CashAccountType = (typeof CashAccountType)[keyof typeof CashAccountType];

export const StockMovementType = {
  IN: 'IN',
  OUT: 'OUT',
  TRANSFER: 'TRANSFER',
  ADJUST: 'ADJUST',
} as const;
export type StockMovementType = (typeof StockMovementType)[keyof typeof StockMovementType];

export const StockMovementRefType = {
  SALE: 'SALE',
  SALE_CANCEL: 'SALE_CANCEL',
  PURCHASE: 'PURCHASE',
  PURCHASE_CANCEL: 'PURCHASE_CANCEL',
  TRANSFER: 'TRANSFER',
  TRANSFER_CANCEL: 'TRANSFER_CANCEL',
  ADJUST: 'ADJUST',
  COUNT: 'COUNT',
  OPENING_BALANCE: 'OPENING_BALANCE',
  RETURN: 'RETURN',
  PRODUCTION: 'PRODUCTION',
  WASTE: 'WASTE',
} as const;
export type StockMovementRefType = (typeof StockMovementRefType)[keyof typeof StockMovementRefType];

export const ProductType = {
  GOODS: 'GOODS',
  SERVICE: 'SERVICE',
  RAW_MATERIAL: 'RAW_MATERIAL',
  FINISHED_GOOD: 'FINISHED_GOOD',
  CONSUMABLE: 'CONSUMABLE',
} as const;
export type ProductType = (typeof ProductType)[keyof typeof ProductType];

export const ProductStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PASSIVE: 'PASSIVE',
  DISCONTINUED: 'DISCONTINUED',
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const UnitType = {
  PIECE: 'PIECE',
  WEIGHT: 'WEIGHT',
  LENGTH: 'LENGTH',
  VOLUME: 'VOLUME',
  TIME: 'TIME',
  AREA: 'AREA',
} as const;
export type UnitType = (typeof UnitType)[keyof typeof UnitType];

export const PriceType = {
  PURCHASE: 'PURCHASE',
  SALE: 'SALE',
  WHOLESALE: 'WHOLESALE',
  MIN_SALE: 'MIN_SALE',
  LIST_PRICE: 'LIST_PRICE',
} as const;
export type PriceType = (typeof PriceType)[keyof typeof PriceType];

export const WarehouseStatus = {
  ACTIVE: 'ACTIVE',
  PASSIVE: 'PASSIVE',
} as const;
export type WarehouseStatus = (typeof WarehouseStatus)[keyof typeof WarehouseStatus];

export const SaleType = {
  SALE: 'SALE',
  RETURN: 'RETURN',
  PROFORMA: 'PROFORMA',
  CONSIGNMENT_OUT: 'CONSIGNMENT_OUT',
  CONSIGNMENT_IN: 'CONSIGNMENT_IN',
} as const;
export type SaleType = (typeof SaleType)[keyof typeof SaleType];

export const SaleStatus = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  PARTIALLY_SHIPPED: 'PARTIALLY_SHIPPED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
  CLOSED: 'CLOSED',
} as const;
export type SaleStatus = (typeof SaleStatus)[keyof typeof SaleStatus];

export const PaymentStatus = {
  UNPAID: 'UNPAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const SaleItemStatus = {
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
} as const;
export type SaleItemStatus = (typeof SaleItemStatus)[keyof typeof SaleItemStatus];

export const CustomerMovementType = {
  DEBIT: 'DEBIT',
  CREDIT: 'CREDIT',
} as const;
export type CustomerMovementType = (typeof CustomerMovementType)[keyof typeof CustomerMovementType];

export const CustomerMovementRefType = {
  SALE: 'SALE',
  SALE_CANCEL: 'SALE_CANCEL',
  PURCHASE: 'PURCHASE',
  PURCHASE_CANCEL: 'PURCHASE_CANCEL',
  COLLECTION: 'COLLECTION',
  COLLECTION_CANCEL: 'COLLECTION_CANCEL',
  RETURN: 'RETURN',
  ADJUST: 'ADJUST',
  OPENING_BALANCE: 'OPENING_BALANCE',
  TRANSFER: 'TRANSFER',
} as const;
export type CustomerMovementRefType = (typeof CustomerMovementRefType)[keyof typeof CustomerMovementRefType];

export const CashMovementType = {
  IN: 'IN',
  OUT: 'OUT',
  TRANSFER: 'TRANSFER',
} as const;
export type CashMovementType = (typeof CashMovementType)[keyof typeof CashMovementType];

export const CashMovementRefType = {
  COLLECTION: 'COLLECTION',
  COLLECTION_CANCEL: 'COLLECTION_CANCEL',
  PAYMENT: 'PAYMENT',
  PAYMENT_CANCEL: 'PAYMENT_CANCEL',
  SALE_REFUND: 'SALE_REFUND',
  TRANSFER: 'TRANSFER',
  ADJUST: 'ADJUST',
  OPENING_BALANCE: 'OPENING_BALANCE',
} as const;
export type CashMovementRefType = (typeof CashMovementRefType)[keyof typeof CashMovementRefType];

export const CashAccountStatus = {
  ACTIVE: 'ACTIVE',
  PASSIVE: 'PASSIVE',
} as const;
export type CashAccountStatus = (typeof CashAccountStatus)[keyof typeof CashAccountStatus];

export const MovementStatus = {
  DRAFT: 'DRAFT',
  POSTED: 'POSTED',
  PENDING: 'PENDING',
  CANCELLED: 'CANCELLED',
} as const;
export type MovementStatus = (typeof MovementStatus)[keyof typeof MovementStatus];

export const SyncStatus = {
  SYNCED: 'SYNCED',
  PENDING: 'PENDING',
  CONFLICT: 'CONFLICT',
  IGNORED: 'IGNORED',
} as const;
export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus];

export const SourceSystem = {
  SAAS: 'SAAS',
  MICRO: 'MICRO',
  LOGO: 'LOGO',
  NETSIS: 'NETSIS',
  PARASUT: 'PARASUT',
  OTHER: 'OTHER',
} as const;
export type SourceSystem = (typeof SourceSystem)[keyof typeof SourceSystem];

export const CollectionStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;
export type CollectionStatus = (typeof CollectionStatus)[keyof typeof CollectionStatus];

export const CollectionType = {
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
  POS: 'POS',
  QR: 'QR',
  CHECK: 'CHECK',
  OTHER: 'OTHER',
} as const;
export type CollectionType = (typeof CollectionType)[keyof typeof CollectionType];

export const PurchaseInvoiceStatus = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
} as const;
export type PurchaseInvoiceStatus = (typeof PurchaseInvoiceStatus)[keyof typeof PurchaseInvoiceStatus];

export const PurchaseInvoiceType = {
  PURCHASE: 'PURCHASE',
  RETURN: 'RETURN',
} as const;
export type PurchaseInvoiceType = (typeof PurchaseInvoiceType)[keyof typeof PurchaseInvoiceType];
