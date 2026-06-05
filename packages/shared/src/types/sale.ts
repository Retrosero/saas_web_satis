import type { PaymentStatus, SaleItemStatus, SaleStatus, SaleType } from '../enums/common.enum';

export interface Sale {
  id: string;
  tenantId: string;
  customerId: string;
  saleNumber: string;
  saleDate: string;
  dueDate: string | null;
  type: SaleType;
  status: SaleStatus;
  paymentStatus: PaymentStatus;
  warehouseId: string | null;
  currency: string;
  exchangeRate: number;
  subTotal: number;
  vatTotal: number;
  discountTotal: number;
  grandTotal: number;
  paidAmount: number;
  customerName: string;
  customerTaxNumber: string | null;
  customerAddress: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  notes: string | null;
  internalNotes: string | null;
  cancelsSaleId: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
}

export interface SaleItem {
  id: string;
  tenantId: string;
  saleId: string;
  productId: string;
  unitId: string | null;
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
