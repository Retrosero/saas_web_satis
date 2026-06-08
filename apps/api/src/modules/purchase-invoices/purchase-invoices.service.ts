/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module.js';
import type {
  PaginatedResponse,
  PurchaseInvoice,
  PurchaseInvoiceItem,
  PurchaseInvoiceStatus,
  PurchaseInvoiceType,
} from '@saas/shared';

@Injectable()
export class PurchaseInvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async searchSuppliers(tenantId: string, search?: string) {
    return this.prisma.client.customer.findMany({
      where: {
        tenantId,
        isDeleted: false,
        status: 'ACTIVE',
        type: { in: ['SUPPLIER', 'BOTH'] },
        ...(search?.trim()
          ? {
              OR: [
                { name: { contains: search.trim(), mode: 'insensitive' } },
                { code: { contains: search.trim(), mode: 'insensitive' } },
                { taxNumber: { contains: search.trim(), mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ name: 'asc' }],
      take: 20,
      select: {
        id: true,
        code: true,
        name: true,
        taxNumber: true,
      },
    });
  }

  async searchProducts(tenantId: string, search?: string) {
    return this.prisma.client.product.findMany({
      where: {
        tenantId,
        isDeleted: false,
        status: 'ACTIVE',
        ...(search?.trim()
          ? {
              OR: [
                { name: { contains: search.trim(), mode: 'insensitive' } },
                { code: { contains: search.trim(), mode: 'insensitive' } },
                { primaryBarcode: { contains: search.trim(), mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ name: 'asc' }],
      take: 20,
      select: {
        id: true,
        code: true,
        name: true,
      },
    });
  }

  async list(
    tenantId: string,
    params: {
      page?: number;
      pageSize?: number;
      supplierId?: string;
      status?: PurchaseInvoiceStatus;
      paymentStatus?: string;
      type?: PurchaseInvoiceType;
      search?: string;
      from?: Date;
      to?: Date;
      warehouseId?: string;
    },
  ): Promise<PaginatedResponse<PurchaseInvoice & { itemCount: number }>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 50;

    const where: any = {
      tenantId,
      isDeleted: false,
      ...(params.supplierId ? { supplierId: params.supplierId } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.paymentStatus ? { paymentStatus: params.paymentStatus } : {}),
      ...(params.type ? { type: params.type } : {}),
      ...(params.warehouseId ? { warehouseId: params.warehouseId } : {}),
      ...(params.from || params.to
        ? {
            invoiceDate: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lte: params.to } : {}),
            },
          }
        : {}),
      ...(params.search
        ? {
            OR: [
              { invoiceNumber: { contains: params.search, mode: 'insensitive' } },
              { supplierName: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.client.purchaseInvoice.findMany({
        where,
        orderBy: [{ invoiceDate: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          items: {
            select: { id: true },
          },
        },
      }),
      this.prisma.client.purchaseInvoice.count({ where }),
    ]);

    return {
      data: rows.map((row) => ({
        ...this.toDto(row),
        itemCount: row.items.length,
      })),
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

  async findById(tenantId: string, id: string): Promise<PurchaseInvoice & { items: PurchaseInvoiceItem[] }> {
    const invoice = await this.prisma.client.purchaseInvoice.findFirst({
      where: { id, tenantId, isDeleted: false },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            product: {
              select: { id: true, code: true, name: true },
            },
          },
        },
        warehouse: {
          select: { id: true, name: true },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Alış faturası bulunamadı');
    }

    return {
      ...this.toDto(invoice),
      warehouseName: invoice.warehouse?.name,
      items: invoice.items.map((item) => ({
        ...this.toItemDto(item),
        productName: item.product?.name,
        productCode: item.product?.code,
      })),
    };
  }

  async create(
    tenantId: string,
    input: {
      supplierId: string;
      invoiceDate: Date;
      dueDate?: Date;
      type?: PurchaseInvoiceType;
      status?: PurchaseInvoiceStatus;
      warehouseId: string;
      einvoiceNumber?: string;
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
  ): Promise<PurchaseInvoice> {
    // Tedarikçi kontrolü (SUPPLIER veya BOTH tipinde olmalı)
    const supplier = await (this.prisma.client as any).customer.findFirst({
      where: { id: input.supplierId, tenantId, isDeleted: false },
    });
    if (!supplier) {
      throw new NotFoundException('Tedarikçi bulunamadı');
    }
    if (supplier.type !== 'SUPPLIER' && supplier.type !== 'BOTH') {
      throw new ConflictException('Seçili cari tedarikçi olarak tanımlanmamış');
    }

    // Depo kontrolü
    const warehouse = await (this.prisma.client as any).warehouse.findFirst({
      where: { id: input.warehouseId, tenantId, isDeleted: false, status: 'ACTIVE' },
    });
    if (!warehouse) {
      throw new NotFoundException('Depo bulunamadı veya pasif');
    }

    if (!input.items || input.items.length === 0) {
      throw new BadRequestException('En az 1 kalem eklenmelidir');
    }

    // Ürün kontrolü
    const productIds = input.items.map((i) => i.productId);
    const products = await (this.prisma.client as any).product.findMany({
      where: { id: { in: productIds }, tenantId, isDeleted: false },
    });
    if (products.length !== new Set(productIds).size) {
      throw new BadRequestException('Bir veya daha fazla ürün bulunamadı');
    }

    // Fiyat hesaplaması
    let subTotal = 0;
    let vatTotal = 0;
    let discountTotal = 0;
    const lineCalcs = input.items.map((i) => {
      const lineSub = i.quantity * i.unitPrice;
      const discountAmount = lineSub * ((i.discountRate ?? 0) / 100);
      const netAmount = lineSub - discountAmount;
      const vatAmount = netAmount * (i.vatRate / 100);
      const lineGrand = netAmount + vatAmount;
      subTotal += lineSub;
      discountTotal += discountAmount;
      vatTotal += vatAmount;
      return { subTotal: lineSub, discountAmount, vatAmount, grandTotal: lineGrand };
    });
    const grandTotal = subTotal - discountTotal + vatTotal;

    const invoiceNumber = await this.generateNextInvoiceNumber(tenantId, input.type ?? 'PURCHASE');

    return (this.prisma.client as any).$transaction(async (tx: any) => {
      const invoice = await tx.purchaseInvoice.create({
        data: {
          tenantId,
          supplierId: input.supplierId,
          invoiceNumber,
          invoiceDate: input.invoiceDate,
          dueDate: input.dueDate ?? null,
          type: input.type ?? 'PURCHASE',
          status: input.status ?? 'DRAFT',
          warehouseId: input.warehouseId,
          supplierName: supplier.name,
          supplierTaxNumber: supplier.taxNumber,
          supplierAddress: supplier.address,
          supplierPhone: supplier.phone,
          supplierEmail: supplier.email,
          subTotal,
          vatTotal,
          discountTotal,
          grandTotal,
          paidAmount: 0,
          einvoiceNumber: input.einvoiceNumber ?? null,
          notes: input.notes ?? null,
          internalNotes: input.internalNotes ?? null,
          createdById: createdById ?? null,
          confirmedById: input.status === 'CONFIRMED' ? (createdById ?? null) : null,
          confirmedAt: input.status === 'CONFIRMED' ? new Date() : null,
        },
      });

      // Kalemleri oluştur
      const createdItems: any[] = [];
      for (let idx = 0; idx < input.items.length; idx++) {
        const item = input.items[idx]!;
        const li = lineCalcs[idx]!;
        const createdItem = await tx.purchaseInvoiceItem.create({
          data: {
            tenantId,
            invoiceId: invoice.id,
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
        createdItems.push(createdItem);
      }

      // Eğer doğrudan CONFIRMED olarak oluşturulduysa, stok ve cari hareketleri oluştur
      if (input.status === 'CONFIRMED') {
        // Stok hareketleri oluştur
        for (const item of createdItems) {
          await tx.stockMovement.create({
            data: {
              tenantId,
              productId: item.productId,
              warehouseId: input.warehouseId,
              type: 'IN',
              quantity: item.quantity,
              unitCost: item.unitPrice,
              movementDate: input.invoiceDate,
              refType: 'PURCHASE',
              refId: invoice.id,
              refNumber: invoice.invoiceNumber,
              description: item.description ?? `Alış Faturası ${invoice.invoiceNumber}`,
              status: 'POSTED',
              createdById: createdById ?? null,
            },
          });
        }

        // Cari hareket oluştur (tedarikçiye borç).
        // Not: Runtime Prisma client eski enum setiyle çalışıyorsa PURCHASE refType doğrulamada düşebilir.
        // Bu yüzden mevcut uyumlu enum olan ADJUST kullanılıyor; belge bağı refId/refNumber ile korunur.
        await tx.customerMovement.create({
          data: {
            tenantId,
            customerId: input.supplierId,
            type: 'CREDIT', // Bizim borcumuz (tedarikçiye)
            amount: grandTotal,
            currency: 'TRY',
            exchangeRate: 1,
            amountTry: grandTotal,
            movementDate: input.invoiceDate,
            dueDate: input.dueDate ?? null,
            refType: 'ADJUST',
            refId: invoice.id,
            refNumber: invoice.invoiceNumber,
            description: `Alış Faturası ${invoice.invoiceNumber}`,
            status: 'POSTED',
            createdById: createdById ?? null,
          },
        });
      }

      return this.toDto(invoice);
    });
  }

  async confirm(tenantId: string, id: string, userId?: string): Promise<PurchaseInvoice> {
    const invoice = await (this.prisma.client as any).purchaseInvoice.findFirst({
      where: { id, tenantId, isDeleted: false },
    });

    if (!invoice) {
      throw new NotFoundException('Alış faturası bulunamadı');
    }

    if (invoice.status !== 'DRAFT') {
      throw new ConflictException('Sadece taslak faturalar onaylanabilir');
    }

    const items = await (this.prisma.client as any).purchaseInvoiceItem.findMany({
      where: { invoiceId: id },
    });

    return (this.prisma.client as any).$transaction(async (tx: any) => {
      // Faturayı onayla
      const updated = await tx.purchaseInvoice.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
          confirmedById: userId ?? null,
          confirmedAt: new Date(),
        },
      });

      // Stok hareketleri oluştur
      for (const item of items) {
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            warehouseId: invoice.warehouseId,
            type: 'IN',
            quantity: item.quantity,
            unitCost: item.unitPrice,
            movementDate: invoice.invoiceDate,
            refType: 'PURCHASE',
            refId: invoice.id,
            refNumber: invoice.invoiceNumber,
            description: item.description ?? `Alış Faturası ${invoice.invoiceNumber}`,
            status: 'POSTED',
            createdById: userId ?? null,
          },
        });
      }

      // Cari hareket oluştur (tedarikçiye borç)
      await tx.customerMovement.create({
        data: {
          tenantId,
          customerId: invoice.supplierId,
          type: 'CREDIT', // Bizim borcumuz (tedarikçiye)
          amount: invoice.grandTotal,
          currency: invoice.currency ?? 'TRY',
          exchangeRate: invoice.exchangeRate ?? 1,
          amountTry: invoice.grandTotal * (invoice.exchangeRate ?? 1),
          movementDate: invoice.invoiceDate,
          dueDate: invoice.dueDate,
          refType: 'ADJUST',
          refId: invoice.id,
          refNumber: invoice.invoiceNumber,
          description: `Alış Faturası ${invoice.invoiceNumber}`,
          status: 'POSTED',
          createdById: userId ?? null,
        },
      });

      return this.toDto(updated);
    });
  }

  async cancel(tenantId: string, id: string, userId?: string, reason?: string): Promise<PurchaseInvoice> {
    const invoice = await (this.prisma.client as any).purchaseInvoice.findFirst({
      where: { id, tenantId, isDeleted: false },
    });

    if (!invoice) {
      throw new NotFoundException('Alış faturası bulunamadı');
    }

    if (invoice.status === 'CANCELLED') {
      throw new ConflictException('Fatura zaten iptal edilmiş');
    }

    const items = await (this.prisma.client as any).purchaseInvoiceItem.findMany({
      where: { invoiceId: id },
    });

    return (this.prisma.client as any).$transaction(async (tx: any) => {
      // İptal faturayı oluştur
      const cancelInvoice = await tx.purchaseInvoice.create({
        data: {
          tenantId,
          supplierId: invoice.supplierId,
          invoiceNumber: `${invoice.invoiceNumber}-IPTAL`,
          invoiceDate: new Date(),
          dueDate: null,
          type: invoice.type === 'PURCHASE' ? 'RETURN' : 'PURCHASE',
          status: 'CONFIRMED',
          warehouseId: invoice.warehouseId,
          supplierName: invoice.supplierName,
          supplierTaxNumber: invoice.supplierTaxNumber,
          supplierAddress: invoice.supplierAddress,
          supplierPhone: invoice.supplierPhone,
          supplierEmail: invoice.supplierEmail,
          subTotal: invoice.subTotal,
          vatTotal: invoice.vatTotal,
          discountTotal: invoice.discountTotal,
          grandTotal: invoice.grandTotal,
          paidAmount: 0,
          notes: `İptal sebebi: ${reason ?? 'Belirtilmedi'}`,
          cancelsInvoiceId: id,
          cancelledById: userId ?? null,
          cancelledAt: new Date(),
          confirmedById: userId ?? null,
          confirmedAt: new Date(),
        },
      });

      // Orijinal faturayı güncelle
      await tx.purchaseInvoice.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledById: userId ?? null,
          cancelledAt: new Date(),
        },
      });

      // Stok hareketlerini tersine çevir
      for (const item of items) {
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            warehouseId: invoice.warehouseId,
            type: 'OUT',
            quantity: item.quantity,
            movementDate: new Date(),
            refType: 'PURCHASE_CANCEL',
            refId: id,
            refNumber: invoice.invoiceNumber,
            description: `İptal: ${invoice.invoiceNumber}`,
            status: 'POSTED',
            createdById: userId ?? null,
          },
        });
      }

      // Cari hareketi tersine çevir
      await tx.customerMovement.create({
        data: {
          tenantId,
          customerId: invoice.supplierId,
          type: 'DEBIT', // Ters kayıt
          amount: invoice.grandTotal,
          currency: invoice.currency ?? 'TRY',
          exchangeRate: invoice.exchangeRate ?? 1,
          amountTry: invoice.grandTotal * (invoice.exchangeRate ?? 1),
          movementDate: new Date(),
          refType: 'ADJUST',
          refId: id,
          refNumber: invoice.invoiceNumber,
          description: `İptal: ${invoice.invoiceNumber}`,
          status: 'POSTED',
          createdById: userId ?? null,
        },
      });

      return this.toDto(cancelInvoice);
    });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const invoice = await (this.prisma.client as any).purchaseInvoice.findFirst({
      where: { id, tenantId, isDeleted: false },
    });

    if (!invoice) {
      throw new NotFoundException('Alış faturası bulunamadı');
    }

    if (invoice.status !== 'DRAFT') {
      throw new ConflictException('Sadece taslak faturalar silinebilir');
    }

    await (this.prisma.client as any).purchaseInvoice.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });
  }

  private async generateNextInvoiceNumber(tenantId: string, type: PurchaseInvoiceType): Promise<string> {
    const prefix = type === 'PURCHASE' ? 'AF' : 'AI';
    const year = new Date().getFullYear();
    const yearPrefix = `${prefix}-${year}-`;

    const last = await (this.prisma.client as any).purchaseInvoice.findFirst({
      where: {
        tenantId,
        invoiceNumber: { startsWith: yearPrefix },
      },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });

    const lastSequence = last?.invoiceNumber.match(/-(\d+)$/)?.[1];
    const nextSequence = lastSequence ? Number(lastSequence) + 1 : 1;
    return `${yearPrefix}${String(nextSequence).padStart(6, '0')}`;
  }

  private toDto(invoice: any): PurchaseInvoice {
    return {
      id: invoice.id,
      tenantId: invoice.tenantId,
      supplierId: invoice.supplierId,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate.toISOString(),
      dueDate: invoice.dueDate?.toISOString() ?? null,
      type: invoice.type,
      status: invoice.status,
      paymentStatus: invoice.paymentStatus ?? 'UNPAID',
      warehouseId: invoice.warehouseId,
      currency: invoice.currency ?? 'TRY',
      exchangeRate: Number(invoice.exchangeRate ?? 1),
      subTotal: Number(invoice.subTotal),
      vatTotal: Number(invoice.vatTotal),
      discountTotal: Number(invoice.discountTotal),
      grandTotal: Number(invoice.grandTotal),
      paidAmount: Number(invoice.paidAmount ?? 0),
      supplierName: invoice.supplierName,
      supplierTaxNumber: invoice.supplierTaxNumber ?? null,
      supplierAddress: invoice.supplierAddress ?? null,
      supplierPhone: invoice.supplierPhone ?? null,
      supplierEmail: invoice.supplierEmail ?? null,
      einvoiceNumber: invoice.einvoiceNumber ?? null,
      einvoiceStatus: invoice.einvoiceStatus ?? null,
      einvoiceDate: invoice.einvoiceDate?.toISOString() ?? null,
      notes: invoice.notes ?? null,
      internalNotes: invoice.internalNotes ?? null,
      cancelsInvoiceId: invoice.cancelsInvoiceId ?? null,
      isActive: invoice.isActive ?? true,
      isDeleted: invoice.isDeleted ?? false,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
      confirmedAt: invoice.confirmedAt?.toISOString() ?? null,
      cancelledAt: invoice.cancelledAt?.toISOString() ?? null,
    };
  }

  private toItemDto(item: any): PurchaseInvoiceItem {
    return {
      id: item.id,
      tenantId: item.tenantId,
      invoiceId: item.invoiceId,
      productId: item.productId,
      unitId: item.unitId ?? null,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      vatRate: Number(item.vatRate),
      discountRate: Number(item.discountRate),
      description: item.description ?? null,
      sortOrder: item.sortOrder ?? 0,
      status: item.status,
      lineSubTotal: Number(item.lineSubTotal),
      discountAmount: Number(item.discountAmount),
      lineVatAmount: Number(item.lineVatAmount),
      lineGrandTotal: Number(item.lineGrandTotal),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
