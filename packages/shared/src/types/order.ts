import type { OrderStatus, OrderType } from '../enums/common.enum.js';

export interface Order {
  id: string;
  tenantId: string;
  orderNumber: string;
  orderDate: string;
  deliveryDate: string | null;
  type: OrderType;
  status: OrderStatus;
  customerId: string;
  customerName: string;
  customerTaxNumber: string | null;
  customerAddress: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  currency: string;
  exchangeRate: number;
  subTotal: number;
  vatTotal: number;
  discountTotal: number;
  grandTotal: number;
  warehouseId: string | null;
  warehouseName: string | null;
  linkedSaleId: string | null;
  notes: string | null;
  internalNotes: string | null;
  cancelsOrderId: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
}

export interface OrderItem {
  id: string;
  tenantId: string;
  orderId: string;
  productId: string;
  unitId: string | null;
  quantity: number;
  quantityShipped: number;
  unitPrice: number;
  vatRate: number;
  discountRate: number;
  description: string | null;
  sortOrder: number;
  status: 'ACTIVE' | 'CANCELLED';
  lineSubTotal: number;
  discountAmount: number;
  lineVatAmount: number;
  lineGrandTotal: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
