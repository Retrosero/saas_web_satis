import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.module.js';
import { applySale } from '@saas/shared';
import type { PaginatedResponse, PaymentStatus, Sale, SaleItem, SaleStatus, SaleType } from '@saas/shared';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Yeni satış. status=DRAFT ise sadece kayıt oluşur (stok/cari hareketi YOK).
   * status=CONFIRMED ise tek transaction'da stok + cari hareketleri de oluşur.
   */
  async create(tenantId: string, input: {
    customerId: string;
    saleDate: Date;
    dueDate?: Date;
    type?: SaleType;
    status?: SaleStatus;
    warehouseId?: string;
    currency?: string;
    exchangeRate?: number;
    items: Array<{ productId: string; unitId?: string; quantity: number; unitPrice: number; vatRate: number; discountRate?: number; description?: string }>;
    notes?: string;
    internalNotes?: string;
  }, createdById?: string): Promise<Sale> {
    // Müşteri kontrol
    const customer = await this.prisma.client.customer.findFirst({
      where: { id: input.customerId, tenantId, isDeleted: false },
    });
    if (!customer) throw new NotFoundException('Müşteri bulunamadı');

    // Depo kontrol (status=CONFIRMED ise zorunlu)
    if (input.status === 'CONFIRMED' && !input.warehouseId) {
      throw new BadRequestException('Onaylanan satış için depo seçilmelidir');
    }
    if (input.warehouseId) {
      const wh = await this.prisma.client.warehouse.findFirst({ where: { id: input.warehouseId, tenantId, isDeleted: false } });
      if (!wh) throw new NotFoundException('Depo bulunamadı');
    }

    if (!input.items || input.items.length === 0) {
      throw new BadRequestException('En az 1 satır gerekiyor');
    }

    // Ürün kontrol
    const productIds = input.items.map((i) => i.productId);
    const products = await this.prisma.client.product.findMany({
      where: { id: { in: productIds }, tenantId, isDeleted: false },
    });
    if (products.length !== new Set(productIds).size) {
      throw new BadRequestException('Bir veya daha fazla ürün bulunamadı');
    }

    // Toplamları manual hesapla (event-sourcing: anlık toplam)
    let subTotal = 0;
    let vatTotal = 0;
    let discountTotal = 0;
    const lineCalcs = input.items.map((i) => {
      const lineSub = i.quantity * i.unitPrice;
      const discountAmount = lineSub * (i.discountRate ?? 0) / 100;
      const netAmount = lineSub - discountAmount;
      const vatAmount = netAmount * i.vatRate / 100;
      const lineGrand = netAmount + vatAmount;
      subTotal += lineSub;
      discountTotal += discountAmount;
      vatTotal += vatAmount;
      return { subTotal: lineSub, discountAmount, vatAmount, grandTotal: lineGrand };
    });
    const grandTotal = subTotal - discountTotal + vatTotal;

    const saleNumber = await this.generateNextSaleNumber(tenantId);

    return this.prisma.client.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          tenantId,
          customerId: input.customerId,
          saleNumber,
          saleDate: input.saleDate,
          dueDate: input.dueDate ?? null,
          type: input.type ?? 'SALE',
          status: input.status ?? 'DRAFT',
          paymentStatus: 'UNPAID',
          warehouseId: input.warehouseId ?? null,
          currency: input.currency ?? 'TRY',
          exchangeRate: new Prisma.Decimal(input.exchangeRate ?? 1),
          subTotal: new Prisma.Decimal(subTotal),
          vatTotal: new Prisma.Decimal(vatTotal),
          discountTotal: new Prisma.Decimal(discountTotal),
          grandTotal: new Prisma.Decimal(grandTotal),
          paidAmount: new Prisma.Decimal(0),
          customerName: customer.name,
          customerTaxNumber: customer.taxNumber,
          customerAddress: customer.address,
          customerPhone: customer.phone,
          customerEmail: customer.email,
          notes: input.notes ?? null,
          internalNotes: input.internalNotes ?? null,
          createdById: createdById ?? null,
        },
      });

      // Kalemler
      for (let idx = 0; idx < input.items.length; idx++) {
        const item = input.items[idx]!;
        const li = lineCalcs[idx]!;
        await tx.saleItem.create({
          data: {
            tenantId,
            saleId: sale.id,
            productId: item.productId,
            unitId: item.unitId ?? null,
            quantity: new Prisma.Decimal(item.quantity),
            unitPrice: new Prisma.Decimal(item.unitPrice),
            vatRate: new Prisma.Decimal(item.vatRate),
            discountRate: new Prisma.Decimal(item.discountRate ?? 0),
            description: item.description ?? null,
            sortOrder: idx,
            status: 'ACTIVE',
            lineSubTotal: new Prisma.Decimal(li.subTotal),
            discountAmount: new Prisma.Decimal(li.discountAmount),
            lineVatAmount: new Prisma.Decimal(li.vatAmount),
            lineGrandTotal: new Prisma.Decimal(li.grandTotal),
          },
        });
      }

      // CONFIRMED ise stok + cari hareketleri
      if (input.status === 'CONFIRMED' && input.warehouseId) {
        await this.applyConfirmedMovements(
          tx,
          tenantId,
          sale.id,
          input.warehouseId,
          input.items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, vatRate: i.vatRate, discountRate: i.discountRate ?? 0 })),
          createdById,
        );
      }

      return this.toDto(sale);
    });
  }

  /**
   * DRAFT → CONFIRMED geçişi. Stok + cari hareketleri oluşturur.
   */
  async confirm(tenantId: string, saleId: string, confirmedById?: string): Promise<Sale> {
    const sale = await this.prisma.client.sale.findFirst({
      where: { id: saleId, tenantId, isDeleted: false },
      include: { items: true },
    });
    if (!sale) throw new NotFoundException('Satış bulunamadı');
    if (sale.status !== 'DRAFT') throw new ConflictException(`Sadece taslak satışlar onaylanabilir (mevcut: ${sale.status})`);
    if (!sale.warehouseId) throw new BadRequestException('Satış için depo tanımlı değil');

    return this.prisma.client.$transaction(async (tx) => {
      await this.applyConfirmedMovements(
        tx,
        tenantId,
        sale.id,
        sale.warehouseId!,
        sale.items.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          vatRate: Number(i.vatRate),
          discountRate: Number(i.discountRate ?? 0),
        })),
        confirmedById,
      );
      const updated = await tx.sale.update({
        where: { id: sale.id },
        data: { status: 'CONFIRMED', confirmedAt: new Date(), confirmedById: confirmedById ?? null },
      });
      return this.toDto(updated);
    });
  }

  /**
   * Satış iptali. Tüm hareketlerin TERS kaydını oluşturur.
   */
  async cancel(tenantId: string, saleId: string, cancelledById?: string, reason?: string): Promise<Sale> {
    const sale = await this.prisma.client.sale.findFirst({
      where: { id: saleId, tenantId, isDeleted: false },
      include: { items: true },
    });
    if (!sale) throw new NotFoundException('Satış bulunamadı');
    if (sale.status === 'CANCELLED') throw new ConflictException('Bu satış zaten iptal edilmiş');

    // İlgili hareketleri bul ve ters kayıt oluştur
    const customerMovements = await this.prisma.client.customerMovement.findMany({
      where: { tenantId, refId: sale.id, refType: 'SALE', isDeleted: false },
    });
    const stockMovements = await this.prisma.client.stockMovement.findMany({
      where: { tenantId, refId: sale.id, refType: 'SALE', isDeleted: false },
    });

    return this.prisma.client.$transaction(async (tx) => {
      // Müşteri hareketi ters kayıt
      for (const m of customerMovements) {
        await tx.customerMovement.create({
          data: {
            tenantId,
            customerId: m.customerId,
            type: m.type === 'DEBIT' ? 'CREDIT' : 'DEBIT',
            amount: m.amount,
            currency: m.currency,
            exchangeRate: m.exchangeRate,
            amountTry: m.amountTry,
            movementDate: new Date(),
            refType: 'SALE_CANCEL',
            refId: sale.id,
            refNumber: `IPT-${sale.saleNumber}`,
            description: `Satış iptal: ${sale.saleNumber}${reason ? ` — ${reason}` : ''}`,
            status: 'POSTED',
            reversesId: m.id,
            createdById: cancelledById ?? null,
          },
        });
        await tx.customerMovement.update({
          where: { id: m.id },
          data: { reversedBy: { connect: { id: m.id } } }, // no-op back-relation workaround
        }).catch(() => {/* ignore: relation may not be set */});
      }

      // Stok hareketleri ters kayıt (OUT → IN)
      for (const sm of stockMovements) {
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: sm.productId,
            warehouseId: sm.warehouseId,
            type: sm.type === 'OUT' ? 'IN' : 'OUT',
            quantity: sm.quantity,
            unitCost: sm.unitCost ?? null,
            movementDate: new Date(),
            refType: 'SALE_CANCEL',
            refId: sale.id,
            refNumber: `IPT-${sale.saleNumber}`,
            description: `Satış iptal: ${sale.saleNumber}`,
            status: 'POSTED',
            reversesId: sm.id,
            createdById: cancelledById ?? null,
          },
        });
      }

      const updated = await tx.sale.update({
        where: { id: sale.id },
        data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledById: cancelledById ?? null },
      });
      return this.toDto(updated);
    });
  }

  async list(
    tenantId: string,
    params: { page?: number; pageSize?: number; customerId?: string; status?: SaleStatus; paymentStatus?: PaymentStatus; type?: SaleType; from?: Date; to?: Date; search?: string },
  ): Promise<PaginatedResponse<Sale & { itemCount: number }>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 50;
    const where: Prisma.SaleWhereInput = {
      tenantId,
      isDeleted: false,
      ...(params.customerId ? { customerId: params.customerId } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.paymentStatus ? { paymentStatus: params.paymentStatus } : {}),
      ...(params.type ? { type: params.type } : {}),
      ...(params.from || params.to
        ? { saleDate: { ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lte: params.to } : {}) } }
        : {}),
      ...(params.search
        ? {
            OR: [
              { saleNumber: { contains: params.search, mode: 'insensitive' } },
              { customerName: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.client.sale.findMany({
        where,
        orderBy: { saleDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { items: true } } },
      }),
      this.prisma.client.sale.count({ where }),
    ]);

    return {
      data: rows.map((s) => ({ ...this.toDto(s), itemCount: s._count.items })),
      pagination: {
        page, pageSize, total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page * pageSize < total,
        hasPrev: page > 1,
      },
    };
  }

  async findById(tenantId: string, id: string): Promise<Sale & { items: SaleItem[]; customerName: string }> {
    const sale = await this.prisma.client.sale.findFirst({
      where: { id, tenantId, isDeleted: false },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!sale) throw new NotFoundException('Satış bulunamadı');
    return { ...this.toDto(sale), items: sale.items.map((i) => this.itemToDto(i)) };
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const sale = await this.prisma.client.sale.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!sale) throw new NotFoundException('Satış bulunamadı');
    if (sale.status !== 'DRAFT') {
      throw new BadRequestException('Sadece taslak satışlar silinebilir. İptal için cancel kullanın.');
    }
    await this.prisma.client.sale.update({
      where: { id },
      data: { isDeleted: true, isActive: false, deletedAt: new Date() },
    });
  }

  // ----- Private -----

  private async applyConfirmedMovements(
    tx: Prisma.TransactionClient,
    tenantId: string,
    saleId: string,
    warehouseId: string,
    items: Array<{ productId: string; quantity: number; unitPrice: number; vatRate: number; discountRate: number }>,
    createdById: string | undefined,
  ): Promise<void> {
    // Stok yeterlilik kontrolü
    for (const item of items) {
      const available = await tx.stockMovement
        .groupBy({
          by: ['type'],
          where: { tenantId, productId: item.productId, warehouseId, isDeleted: false, status: 'POSTED', reversedBy: { is: null } },
          _sum: { quantity: true },
        })
        .then((rows) => {
          const inQty = Number(rows.find((r) => r.type === 'IN')?._sum.quantity ?? 0);
          const outQty = Number(rows.find((r) => r.type === 'OUT')?._sum.quantity ?? 0);
          const adjustQty = Number(rows.find((r) => r.type === 'ADJUST')?._sum.quantity ?? 0);
          return inQty - outQty + adjustQty;
        });
      if (available < item.quantity) {
        throw new BadRequestException(`Yetersiz stok: ürün ${item.productId}, depo ${warehouseId} (mevcut: ${available}, istenen: ${item.quantity})`);
      }
    }

    const sale = await tx.sale.findUnique({ where: { id: saleId } });
    if (!sale) throw new NotFoundException('Satış bulunamadı');

    // 1 cari hareket (DEBIT)
    await tx.customerMovement.create({
      data: {
        tenantId,
        customerId: sale.customerId,
        type: 'DEBIT',
        amount: sale.grandTotal,
        currency: sale.currency,
        exchangeRate: sale.exchangeRate,
        amountTry: sale.grandTotal, // TL bazında
        movementDate: sale.saleDate,
        dueDate: sale.dueDate,
        refType: 'SALE',
        refId: sale.id,
        refNumber: sale.saleNumber,
        description: `Satış: ${sale.saleNumber}`,
        status: 'POSTED',
        createdById: createdById ?? null,
      },
    });

    // N stok hareketi (her kalem için OUT)
    for (const item of items) {
      await tx.stockMovement.create({
        data: {
          tenantId,
          productId: item.productId,
          warehouseId,
          type: 'OUT',
          quantity: new Prisma.Decimal(item.quantity),
          unitCost: new Prisma.Decimal(item.unitPrice),
          movementDate: sale.saleDate,
          refType: 'SALE',
          refId: sale.id,
          refNumber: sale.saleNumber,
          description: `Satış: ${sale.saleNumber}`,
          status: 'POSTED',
          createdById: createdById ?? null,
        },
      });
    }
  }

  private async generateNextSaleNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.prisma.client.sale.findFirst({
      where: { tenantId, saleNumber: { startsWith: `S-${year}-` } },
      orderBy: { saleNumber: 'desc' },
      select: { saleNumber: true },
    });
    let n = 1;
    if (last) {
      const m = last.saleNumber.match(/-(\d+)$/);
      if (m) n = Number(m[1]) + 1;
    }
    return `S-${year}-${String(n).padStart(6, '0')}`;
  }

  private toDto(s: {
    id: string; tenantId: string; customerId: string; saleNumber: string;
    saleDate: Date; dueDate: Date | null; type: string; status: string; paymentStatus: string;
    warehouseId: string | null; currency: string; exchangeRate: Prisma.Decimal | number;
    subTotal: Prisma.Decimal | number; vatTotal: Prisma.Decimal | number;
    discountTotal: Prisma.Decimal | number; grandTotal: Prisma.Decimal | number;
    paidAmount: Prisma.Decimal | number;
    customerName: string; customerTaxNumber: string | null;
    customerAddress: string | null; customerPhone: string | null; customerEmail: string | null;
    notes: string | null; internalNotes: string | null;
    cancelsSaleId: string | null; isActive: boolean; isDeleted: boolean;
    createdAt: Date; updatedAt: Date; confirmedAt: Date | null; cancelledAt: Date | null;
  }): Sale {
    return {
      id: s.id, tenantId: s.tenantId, customerId: s.customerId, saleNumber: s.saleNumber,
      saleDate: s.saleDate.toISOString(), dueDate: s.dueDate?.toISOString() ?? null,
      type: s.type as SaleType, status: s.status as SaleStatus, paymentStatus: s.paymentStatus as PaymentStatus,
      warehouseId: s.warehouseId, currency: s.currency, exchangeRate: Number(s.exchangeRate),
      subTotal: Number(s.subTotal), vatTotal: Number(s.vatTotal),
      discountTotal: Number(s.discountTotal), grandTotal: Number(s.grandTotal),
      paidAmount: Number(s.paidAmount),
      customerName: s.customerName, customerTaxNumber: s.customerTaxNumber,
      customerAddress: s.customerAddress, customerPhone: s.customerPhone, customerEmail: s.customerEmail,
      notes: s.notes, internalNotes: s.internalNotes,
      cancelsSaleId: s.cancelsSaleId, isActive: s.isActive, isDeleted: s.isDeleted,
      createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString(),
      confirmedAt: s.confirmedAt?.toISOString() ?? null, cancelledAt: s.cancelledAt?.toISOString() ?? null,
    };
  }

  private itemToDto(i: {
    id: string; tenantId: string; saleId: string; productId: string; unitId: string | null;
    quantity: Prisma.Decimal | number; unitPrice: Prisma.Decimal | number; vatRate: Prisma.Decimal | number;
    discountRate: Prisma.Decimal | number; description: string | null; sortOrder: number; status: string;
    lineSubTotal: Prisma.Decimal | number; discountAmount: Prisma.Decimal | number;
    lineVatAmount: Prisma.Decimal | number; lineGrandTotal: Prisma.Decimal | number;
    createdAt: Date; updatedAt: Date;
  }): SaleItem {
    return {
      id: i.id, tenantId: i.tenantId, saleId: i.saleId, productId: i.productId, unitId: i.unitId,
      quantity: Number(i.quantity), unitPrice: Number(i.unitPrice), vatRate: Number(i.vatRate),
      discountRate: Number(i.discountRate), description: i.description, sortOrder: i.sortOrder,
      status: i.status as SaleItem['status'],
      lineSubTotal: Number(i.lineSubTotal), discountAmount: Number(i.discountAmount),
      lineVatAmount: Number(i.lineVatAmount), lineGrandTotal: Number(i.lineGrandTotal),
      createdAt: i.createdAt.toISOString(), updatedAt: i.updatedAt.toISOString(),
    };
  }
}
