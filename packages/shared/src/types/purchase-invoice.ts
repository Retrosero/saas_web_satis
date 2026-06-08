import type {
  PaymentStatus,
  PurchaseInvoiceStatus,
  PurchaseInvoiceType,
  SaleItemStatus,
} from '../enums/common.enum';

export interface PurchaseInvoice {
  id: string;
  tenantId: string;
  supplierId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  type: PurchaseInvoiceType;
  status: PurchaseInvoiceStatus;
  paymentStatus: PaymentStatus;
  warehouseId: string;
  warehouseName?: string;
  currency: string;
  exchangeRate: number;
  subTotal: number;
  vatTotal: number;
  discountTotal: number;
  grandTotal: number;
  paidAmount: number;
  supplierName: string;
  supplierTaxNumber: string | null;
  supplierAddress: string | null;
  supplierPhone: string | null;
  supplierEmail: string | null;
  einvoiceNumber: string | null;
  einvoiceStatus: string | null;
  einvoiceDate: string | null;
  notes: string | null;
  internalNotes: string | null;
  cancelsInvoiceId: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
}

export interface PurchaseInvoiceItem {
  id: string;
  tenantId: string;
  invoiceId: string;
  productId: string;
  productName?: string;
  productCode?: string;
  unitId: string | null;
  unitName?: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discountRate: number;
  description: string | null;
  sortOrder: number;
  status: SaleItemStatus;
  lineSubTotal: number;
  discountAmount: number;
  lineVatAmount: number;
  lineGrandTotal: number;
  createdAt: string;
  updatedAt: string;
}