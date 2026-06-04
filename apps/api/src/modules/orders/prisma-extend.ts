import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module.js';
import type { Tenant } from '@prisma/client';

// Order + OrderItem Prisma tipleri (schema güncellendikten sonra prisma generate ile otomatik üretilecek)
// Şimdilik manual tipler
export interface PrismaOrderModel {
  readonly id: string;
  readonly tenantId: string;
  readonly orderNumber: string;
  readonly orderDate: Date;
  readonly deliveryDate: Date | null;
  readonly type: string;
  readonly status: string;
  readonly customerId: string;
  readonly customerName: string;
  readonly customerTaxNumber: string | null;
  readonly customerAddress: string | null;
  readonly customerPhone: string | null;
  readonly customerEmail: string | null;
  readonly currency: string;
  readonly exchangeRate: unknown;
  readonly subTotal: unknown;
  readonly vatTotal: unknown;
  readonly discountTotal: unknown;
  readonly grandTotal: unknown;
  readonly warehouseId: string | null;
  readonly warehouseName: string | null;
  readonly linkedSaleId: string | null;
  readonly notes: string | null;
  readonly internalNotes: string | null;
  readonly cancelsOrderId: string | null;
  readonly isActive: boolean;
  readonly isDeleted: boolean;
  readonly deletedAt: Date | null;
  readonly createdById: string | null;
  readonly updatedById: string | null;
  readonly confirmedById: string | null;
  readonly confirmedAt: Date | null;
  readonly cancelledById: string | null;
  readonly cancelledAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PrismaOrderItemModel {
  readonly id: string;
  readonly tenantId: string;
  readonly orderId: string;
  readonly productId: string;
  readonly unitId: string | null;
  readonly quantity: unknown;
  readonly quantityShipped: unknown;
  readonly unitPrice: unknown;
  readonly vatRate: unknown;
  readonly discountRate: unknown;
  readonly description: string | null;
  readonly sortOrder: number;
  readonly status: string;
  readonly lineSubTotal: unknown;
  readonly discountAmount: unknown;
  readonly lineVatAmount: unknown;
  readonly lineGrandTotal: unknown;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PrismaClientExtended {
  order: {
    findFirst(params: {
      where: { id?: string; tenantId?: string; isDeleted?: boolean; orderNumber?: { startsWith: string } };
      orderBy?: { orderNumber: 'asc' | 'desc' };
      select?: { orderNumber: true } | object;
    }): Promise<PrismaOrderModel | null>;
    findMany(params: {
      where: object;
      orderBy: object;
      skip?: number;
      take?: number;
      include?: object;
    }): Promise<PrismaOrderModel[]>;
    count(params: { where: object }): Promise<number>;
    findFirst(params: { where: object; include?: object }): Promise<(PrismaOrderModel & { items?: PrismaOrderItemModel[]; _count?: { items: true } }) | null>;
    create(params: { data: object }): Promise<PrismaOrderModel>;
    update(params: { where: { id: string }; data: object }): Promise<PrismaOrderModel>;
    updateMany(params: { where: object; data: object }): Promise<object>;
  };
  orderItem: {
    create(params: { data: object }): Promise<PrismaOrderItemModel>;
  };
}

export interface ExtendedPrismaService extends PrismaService {
  client: PrismaService['client'] & PrismaClientExtended;
}
