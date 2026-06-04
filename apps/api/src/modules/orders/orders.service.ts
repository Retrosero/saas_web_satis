/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module.js';
import { CreateOrderDto } from './dto/order.dto.js';
import type {
  Order,
  OrderItem,
  OrderStatus,
  OrderType,
  PaginatedResponse,
} from '@saas/shared';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    input: {
      customerId: string;
      orderDate: Date;
      deliveryDate?: Date;
      type?: OrderType;
      status?: OrderStatus;
      warehouseId?: string;
      items: Array<{
        productId: string;
        unitId?: string;
        quantity: number;
        unitPrice: number;
        vatRate: number;
        discountRate?: number;
        description?: string;
      }>;
      notes?: string;
      internalNotes?: string;
    },
    createdById?: string,
  ): Promise<Order> {
    const customer = await (this.prisma.client as any).customer.findFirst({
      where: { id: input.customerId, tenantId, isDeleted: false },
    });
    if (!customer) throw new NotFoundException('Müşteri bulunamadı');

    if (!input.items || input.items.length === 0) {
      throw new BadRequestException('En az 1 kalem gerekiyor');
    }

    const productIds = input.items.map((i) => i.productId);
    const products = await (this.prisma.client as any).product.findMany({
      where: { id: { in: productIds }, tenantId, isDeleted: false },
    });
    if (products.length !== new Set(productIds).size) {
      throw new BadRequestException('Bir veya daha fazla ürün bulunamadı');
    }

    let subTotal = 0;
    let vatTotal = 0;
    let discountTotal = 0;
    const lineCalcs = input.items.map((i) => {
      const lineSub = i.quantity * i.unitPrice;
      const discountAmount = lineSub * (i.discountRate ?? 0) / 100;
      const netAmount = lineSub - discountAmount;
      const vatAmount = netAmount * (i.vatRate / 100);
      const lineGrand = netAmount + vatAmount;
      subTotal += lineSub;
      discountTotal += discountAmount;
      vatTotal += vatAmount;
      return { subTotal: lineSub, discountAmount, vatAmount, grandTotal: lineGrand };
    });
    const grandTotal = subTotal - discountTotal + vatTotal;

    let warehouseName: string | null = null;
    if (input.warehouseId) {
      const wh = await (this.prisma.client as any).warehouse.findFirst({
        where: { id: input.warehouseId, tenantId, isDeleted: false },
      });
      warehouseName = wh?.name ?? null;
    }

    const orderNumber = await this.generateNextOrderNumber(tenantId);

    return (this.prisma.client as any).$transaction(async (tx: any) => {
      const order = await tx.order.create({
        data: {
          tenantId,
          customerId: input.customerId,
          orderNumber,
          orderDate: input.orderDate,
          deliveryDate: input.deliveryDate ?? null,
          type: input.type ?? 'SALES_ORDER',
          status: input.status ?? 'PENDING',
          customerName: customer.name,
          customerTaxNumber: customer.taxNumber,
          customerAddress: customer.address,
          customerPhone: customer.phone,
          customerEmail: customer.email,
          warehouseId: input.warehouseId ?? null,
          warehouseName,
          subTotal,
          vatTotal,
          discountTotal,
          grandTotal,
          notes: input.notes ?? null,
          internalNotes: input.internalNotes ?? null,
          createdById: createdById ?? null,
        },
      });

      for (let idx = 0; idx < input.items.length; idx++) {
        const item = input.items[idx]!;
        const li = lineCalcs[idx]!;
        await tx.orderItem.create({
          data: {
            tenantId,
            orderId: order.id,
            productId: item.productId,
            unitId: item.unitId ?? null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            discountRate: item.discountRate ?? 0,
            description: item.description ?? null,
            sortOrder: idx,
            lineSubTotal: li.subTotal,
            discountAmount: li.discountAmount,
            lineVatAmount: li.vatAmount,
            lineGrandTotal: li.grandTotal,
          },
        });
      }

      return this.toDto(order);
    });
  }

  async confirm(
    tenantId: string,
    orderId: string,
    confirmedById?: string,
  ): Promise<Order> {
    const order = await (this.prisma.client as any).order.findFirst({
      where: { id: orderId, tenantId, isDeleted: false },
    });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');
    if (order.status !== 'PENDING') {
      throw new ConflictException(
        `Sadece bekleyen siparişler onaylanabilir (mevcut: ${order.status})`,
      );
    }

    const updated = await (this.prisma.client as any).order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        confirmedById: confirmedById ?? null,
      },
    });
    return this.toDto(updated);
  }

  async cancel(
    tenantId: string,
    orderId: string,
    cancelledById?: string,
    reason?: string,
  ): Promise<Order> {
    const order = await (this.prisma.client as any).order.findFirst({
      where: { id: orderId, tenantId, isDeleted: false },
    });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');
    if (order.status === 'CANCELLED') {
      throw new ConflictException('Bu sipariş zaten iptal edilmiş');
    }
    if (order.linkedSaleId) {
      throw new ConflictException('Satışa bağlı sipariş iptal edilemez. Önce satışı iptal edin.');
    }

    const internalNotes = order.internalNotes
      ? `${order.internalNotes}\n[İptal sebebi] ${reason ?? '—'}`
      : `[İptal sebebi] ${reason ?? '—'}`;

    const updated = await (this.prisma.client as any).order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledById: cancelledById ?? null,
        internalNotes,
      },
    });
    return this.toDto(updated);
  }

  async list(
    tenantId: string,
    params: {
      page?: number;
      pageSize?: number;
      customerId?: string;
      status?: OrderStatus;
      type?: OrderType;
      from?: Date;
      to?: Date;
      search?: string;
    },
  ): Promise<PaginatedResponse<Order & { itemCount: number }>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 50;
    const where: Record<string, unknown> = {
      tenantId,
      isDeleted: false,
    };
    if (params.customerId) where.customerId = params.customerId;
    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;
    if (params.from || params.to) {
      where.orderDate = {};
      if (params.from) (where.orderDate as Record<string, unknown>)['gte'] = params.from;
      if (params.to) (where.orderDate as Record<string, unknown>)['lte'] = params.to;
    }
    if (params.search) {
      where.OR = [
        { orderNumber: { contains: params.search, mode: 'insensitive' } },
        { customerName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await Promise.all([
      (this.prisma.client as any).order.findMany({
        where,
        orderBy: { orderDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { items: true } } },
      }),
      (this.prisma.client as any).order.count({ where }),
    ]);

    return {
      data: rows.map((o: any) => ({ ...this.toDto(o), itemCount: o._count?.items ?? 0 })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page * pageSize < total,
        hasPrev: page > 1,
      },
    };
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<Order & { items: OrderItem[] }> {
    const order = await (this.prisma.client as any).order.findFirst({
      where: { id, tenantId, isDeleted: false },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');
    return {
      ...this.toDto(order),
      items: order.items.map((i: any) => this.itemToDto(i)),
    };
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const order = await (this.prisma.client as any).order.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Sadece bekleyen siparişler silinebilir');
    }
    if (order.linkedSaleId) {
      throw new BadRequestException('Satışa bağlı sipariş silinemez');
    }
    await (this.prisma.client as any).order.update({
      where: { id },
      data: { isDeleted: true, isActive: false, deletedAt: new Date() },
    });
  }

  // ----- Private -----

  private async generateNextOrderNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const last = await (this.prisma.client as any).order.findFirst({
      where: {
        tenantId,
        orderNumber: { startsWith: `OR-${year}-` },
      },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });
    let n = 1;
    if (last) {
      const m = last.orderNumber.match(/-(\d+)$/);
      if (m) n = Number(m[1]) + 1;
    }
    return `OR-${year}-${String(n).padStart(6, '0')}`;
  }

  private num(v: unknown): number {
    return typeof v === 'number' ? v : 0;
  }

  private toDto(o: any): Order {
    return {
      id: o.id,
      tenantId: o.tenantId,
      orderNumber: o.orderNumber,
      orderDate: new Date(o.orderDate).toISOString(),
      deliveryDate: o.deliveryDate ? new Date(o.deliveryDate).toISOString() : null,
      type: o.type as OrderType,
      status: o.status as OrderStatus,
      customerId: o.customerId,
      customerName: o.customerName,
      customerTaxNumber: o.customerTaxNumber,
      customerAddress: o.customerAddress,
      customerPhone: o.customerPhone,
      customerEmail: o.customerEmail,
      currency: o.currency ?? 'TRY',
      exchangeRate: this.num(o.exchangeRate),
      subTotal: this.num(o.subTotal),
      vatTotal: this.num(o.vatTotal),
      discountTotal: this.num(o.discountTotal),
      grandTotal: this.num(o.grandTotal),
      warehouseId: o.warehouseId,
      warehouseName: o.warehouseName,
      linkedSaleId: o.linkedSaleId,
      notes: o.notes,
      internalNotes: o.internalNotes,
      cancelsOrderId: o.cancelsOrderId,
      isActive: o.isActive,
      isDeleted: o.isDeleted,
      createdAt: new Date(o.createdAt).toISOString(),
      updatedAt: new Date(o.updatedAt).toISOString(),
      confirmedAt: o.confirmedAt ? new Date(o.confirmedAt).toISOString() : null,
      cancelledAt: o.cancelledAt ? new Date(o.cancelledAt).toISOString() : null,
    };
  }

  private itemToDto(i: any): OrderItem {
    return {
      id: i.id,
      tenantId: i.tenantId,
      orderId: i.orderId,
      productId: i.productId,
      unitId: i.unitId,
      quantity: this.num(i.quantity),
      quantityShipped: this.num(i.quantityShipped),
      unitPrice: this.num(i.unitPrice),
      vatRate: this.num(i.vatRate),
      discountRate: this.num(i.discountRate),
      description: i.description,
      sortOrder: i.sortOrder ?? 0,
      status: (i.status as 'ACTIVE' | 'CANCELLED') ?? 'ACTIVE',
      lineSubTotal: this.num(i.lineSubTotal),
      discountAmount: this.num(i.discountAmount),
      lineVatAmount: this.num(i.lineVatAmount),
      lineGrandTotal: this.num(i.lineGrandTotal),
      notes: i.notes,
      createdAt: new Date(i.createdAt).toISOString(),
      updatedAt: new Date(i.updatedAt).toISOString(),
    };
  }
}
