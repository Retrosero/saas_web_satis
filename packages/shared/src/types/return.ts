import type {
  ReturnItemCondition,
  ReturnReason,
  ReturnSource,
  ReturnStatus,
} from '../enums/return.enum.js';

export interface Return {
  id: string;
  tenantId: string;
  returnNumber: string;       // "IADE-2026-0001"
  returnDate: string;
  customerId: string;
  source: ReturnSource;       // SALE / ORDER / DIRECT
  sourceId: string | null;    // Sale.id veya Order.id
  reason: ReturnReason;
  status: ReturnStatus;

  // Snapshot (anlık müşteri bilgisi)
  customerName: string;
  customerTaxNumber: string | null;
  customerAddress: string | null;
  customerPhone: string | null;

  // Tutar
  currency: string;
  exchangeRate: number;
  subTotal: number;
  vatTotal: number;
  discountTotal: number;
  grandTotal: number;

  // Stok etkisi
  returnToStock: boolean;     // Depoya geri alınsın mı?

  // Notlar
  notes: string | null;
  internalNotes: string | null;
  rejectionReason: string | null;

  // Audit
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  createdById: string | null;
  updatedById: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  completedById: string | null;
  completedAt: string | null;
  rejectedById: string | null;
  rejectedAt: string | null;
  cancelledById: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnItem {
  id: string;
  tenantId: string;
  returnId: string;
  productId: string;
  unitId: string | null;

  // Miktarlar
  quantity: number;
  unitPrice: number;          // KDV hariç
  vatRate: number;
  discountRate: number;

  // Durum
  condition: ReturnItemCondition;
  description: string | null;  // Serbest metin açıklama
  sortOrder: number;

  // Hesaplanmış
  lineSubTotal: number;
  lineVatAmount: number;
  lineGrandTotal: number;

  createdAt: string;
  updatedAt: string;
}

export interface ReturnListItem extends Return {
  itemCount: number;
  customerCode: string | null;
}

export interface ReturnDetail extends Return {
  items: ReturnItem[];
  customer?: { id: string; code: string; name: string };
  sourceSaleNumber?: string;
  sourceOrderNumber?: string;
  stockMovements?: Array<{ id: string; productId: string; type: string; quantity: number }>;
  customerMovements?: Array<{ id: string; type: string; amount: number; description: string }>;
  logs?: Array<{ id: string; action: string; userId: string | null; createdAt: string }>;
}

export interface CreateReturnItemInput {
  productId: string;
  unitId?: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discountRate?: number;
  condition: ReturnItemCondition;
  description?: string;
}

export interface CreateReturnInput {
  customerId: string;
  returnDate: string;
  source: ReturnSource;
  sourceId?: string;
  reason: ReturnReason;
  returnToStock: boolean;
  notes?: string;
  internalNotes?: string;
  items: CreateReturnItemInput[];
}

export const ReturnStatusLabel: Record<ReturnStatus, string> = {
  DRAFT: 'Taslak',
  PENDING: 'Onay Bekliyor',
  APPROVED: 'Onaylandı',
  COMPLETED: 'Tamamlandı',
  REJECTED: 'Reddedildi',
  CANCELLED: 'İptal Edildi',
};

export const ReturnReasonLabel: Record<ReturnReason, string> = {
  INTACT: 'Sağlam İade',
  DEFECTIVE: 'Arızalı İade',
  WRONG_PRODUCT: 'Yanlış Ürün',
  EXCESS: 'Fazla Ürün',
  OTHER: 'Diğer',
};

export const ReturnSourceLabel: Record<ReturnSource, string> = {
  SALE: 'Satıştan İade',
  ORDER: 'Sipariş/Sevkiyattan İade',
  DIRECT: 'Direkt İade',
};

export const ReturnItemConditionLabel: Record<ReturnItemCondition, string> = {
  INTACT: 'Sağlam',
  DEFECTIVE: 'Arızalı',
  DAMAGED: 'Hasarlı',
};
