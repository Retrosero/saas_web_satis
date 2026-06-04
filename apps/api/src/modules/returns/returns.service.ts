import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  PaginatedResponse,
  Return,
  ReturnItem,
  ReturnReason,
  ReturnSource,
  ReturnStatus,
} from '@saas/shared';
import { PrismaService } from '../../prisma/prisma.module.js';
import { applyReturn } from '@saas/shared';
import type { CreateReturnInput, UpdateReturnInput } from './dto/return.dto.js';

export interface ListReturnParams {
  page?: number;
  pageSize?: number;
  search?: string;
  customerId?: string;
  status?: ReturnStatus;
  reason?: ReturnReason;
  source?: ReturnSource;
  from?: Date;
  to?: Date;
}

@Injectable()
export class ReturnsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // LIST
  // ==========================================================================

  async list(tenantId: string, params: ListReturnParams): Promise<PaginatedResponse<Return>> {
    const {
      page = 1,
      pageSize = 25,
      search,
      customerId,
      status,
      reason,
      source,
      from,
      to,
    } = params;

    const where: any = { tenantId, isDeleted: false };
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    if (reason) where.reason = reason;
    if (source) where.source = source;
    if (from || to) {
      where.returnDate = {};
      if (from) where.returnDate.gte = from;
      if (to) where.returnDate.lte = to;
    }
    if (search) {
      where.OR = [
        { returnNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.client.return.count({ where }),
      this.prisma.client.return.findMany({
        where,
        orderBy: { returnDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { items: true } } },
      }),
    ]);

    return {
      data: items.map((r) => this.toListDto(r)),
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

  // ==========================================================================
  // GET BY ID
  // ==========================================================================

  async getById(tenantId: string, id: string): Promise<Return & { items: ReturnItem[]; stockMovements: any[]; customerMovements: any[] }> {
    const r = await this.prisma.client.return.findFirst({
      where: { id, tenantId, isDeleted: false },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        customer: { select: { id: true, code: true, name: true } },
      },
    });
    if (!r) throw new NotFoundException('İade bulunamadı');

    // İlgili stok hareketleri (kaynak)
    const stockMovements = await this.prisma.client.stockMovement.findMany({
      where: { refType: 'RETURN', refId: id },
      select: { id: true, productId: true, type: true, quantity: true, movementDate: true },
    });

    // İlgili cari hareketleri
    const customerMovements = await this.prisma.client.customerMovement.findMany({
      where: { refType: 'RETURN', refId: id },
      select: { id: true, type: true, amount: true, description: true, movementDate: true },
    });

    return {
      ...this.toListDto(r),
      items: r.items.map((it) => this.toItemDto(it)),
      stockMovements,
      customerMovements,
    } as any;
  }

  // ==========================================================================
  // CREATE
  // ==========================================================================

  async create(tenantId: string, input: CreateReturnInput, userId?: string): Promise<Return & { items: ReturnItem[] }> {
    // Müşteri kontrol
    const customer = await this.prisma.client.customer.findFirst({
      where: { id: input.customerId, tenantId, isDeleted: false },
    });
    if (!customer) throw new NotFoundException('Müşteri bulunamadı');

    if (!input.items || input.items.length === 0) {
      throw new BadRequestException('En az 1 satır gerekiyor');
    }

    // Ürün kontrol
    const productIds = input.items.map((i) => i.productId);
    const products = await this.prisma.client.product.findMany({
      where: { id: { in: productIds }, tenantId, isDeleted: false },
      select: { id: true, code: true, name: true, trackStock: true, defaultWarehouseId: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const it of input.items) {
      if (!productMap.has(it.productId)) {
        throw new NotFoundException(`Ürün bulunamadı: ${it.productId}`);
      }
    }

    // İade numarası üret
    const returnNumber = await this.generateReturnNumber(tenantId);

    // Muhasebe hesaplama
    const calc = applyReturn(
      input.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        vatRate: it.vatRate,
        discountRate: it.discountRate ?? 0,
      })),
    );

    // Kayıt
    const created = await this.prisma.client.return.create({
      data: {
        tenantId,
        returnNumber,
        returnDate: new Date(input.returnDate),
        customerId: input.customerId,
        source: input.source ?? 'DIRECT',
        sourceId: input.sourceId ?? null,
        reason: input.reason,
        status: 'DRAFT',
        customerName: customer.name,
        customerTaxNumber: customer.taxNumber,
        customerAddress: customer.address,
        customerPhone: customer.phone,
        currency: 'TRY',
        exchangeRate: 1,
        subTotal: calc.subTotal,
        vatTotal: calc.vatTotal,
        discountTotal: 0,
        grandTotal: calc.grandTotal,
        returnToStock: input.returnToStock,
        notes: input.notes,
        internalNotes: input.internalNotes,
        createdById: userId,
        items: {
          create: input.items.map((it, idx) => {
            const line = calc.lines[idx];
            return {
              tenantId,
              productId: it.productId,
              unitId: it.unitId,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              vatRate: it.vatRate,
              discountRate: it.discountRate ?? 0,
              condition: it.condition,
              description: it.description,
              sortOrder: idx,
              lineSubTotal: line.lineSubTotal,
              lineVatAmount: line.lineVatAmount,
              lineGrandTotal: line.lineGrandTotal,
            };
          }),
        },
      },
      include: { items: true },
    });

    return {
      ...this.toListDto(created),
      items: created.items.map((it) => this.toItemDto(it)),
    } as any;
  }

  // ==========================================================================
  // UPDATE
  // ==========================================================================

  async update(tenantId: string, id: string, input: UpdateReturnInput, userId?: string): Promise<Return & { items: ReturnItem[] }> {
    const existing = await this.prisma.client.return.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!existing) throw new NotFoundException('İade bulunamadı');
    if (!['DRAFT', 'PENDING'].includes(existing.status)) {
      throw new BadRequestException('Sadece taslak veya onay bekleyen iade düzenlenebilir');
    }

    // Güncelleme
    if (input.items) {
      // Eski kalemleri sil, yenilerini oluştur
      await this.prisma.client.returnItem.deleteMany({ where: { returnId: id } });
      const calc = applyReturn(
        input.items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          vatRate: it.vatRate,
          discountRate: it.discountRate ?? 0,
        })),
      );
      await this.prisma.client.returnItem.createMany({
        data: input.items.map((it, idx) => {
          const line = calc.lines[idx];
          return {
            tenantId,
            returnId: id,
            productId: it.productId,
            unitId: it.unitId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            vatRate: it.vatRate,
            discountRate: it.discountRate ?? 0,
            condition: it.condition,
            description: it.description,
            sortOrder: idx,
            lineSubTotal: line.lineSubTotal,
            lineVatAmount: line.lineVatAmount,
            lineGrandTotal: line.lineGrandTotal,
          };
        }),
      });

      const totals = { subTotal: calc.subTotal, vatTotal: calc.vatTotal, grandTotal: calc.grandTotal };
      await this.prisma.client.return.update({
        where: { id },
        data: {
          returnDate: input.returnDate ? new Date(input.returnDate) : undefined,
          source: input.source ?? undefined,
          sourceId: input.sourceId ?? undefined,
          reason: input.reason ?? undefined,
          returnToStock: input.returnToStock ?? undefined,
          notes: input.notes,
          internalNotes: input.internalNotes,
          ...totals,
          updatedById: userId,
        },
      });
    } else {
      await this.prisma.client.return.update({
        where: { id },
        data: {
          returnDate: input.returnDate ? new Date(input.returnDate) : undefined,
          reason: input.reason ?? undefined,
          returnToStock: input.returnToStock ?? undefined,
          notes: input.notes,
          internalNotes: input.internalNotes,
          updatedById: userId,
        },
      });
    }

    return this.getById(tenantId, id) as any;
  }

  // ==========================================================================
  // ACTIONS: submit / approve / reject / complete / cancel
  // ==========================================================================

  async submit(tenantId: string, id: string, userId?: string): Promise<Return> {
    const r = await this.prisma.client.return.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!r) throw new NotFoundException('İade bulunamadı');
    if (r.status !== 'DRAFT') throw new BadRequestException('Sadece taslak iade onaya gönderilebilir');
    return this.toListDto(
      await this.prisma.client.return.update({
        where: { id },
        data: { status: 'PENDING', updatedById: userId },
      }),
    );
  }

  async approve(tenantId: string, id: string, userId?: string): Promise<Return> {
    const r = await this.prisma.client.return.findFirst({
      where: { id, tenantId, isDeleted: false },
      include: { items: true },
    });
    if (!r) throw new NotFoundException('İade bulunamadı');
    if (r.status !== 'PENDING') throw new BadRequestException('Sadece onay bekleyen iade onaylanabilir');
    if (r.items.length === 0) throw new BadRequestException('İade kalemleri boş olamaz');

    return this.toListDto(
      await this.prisma.client.return.update({
        where: { id },
        data: { status: 'APPROVED', approvedById: userId, approvedAt: new Date(), updatedById: userId },
      }),
    );
  }

  async reject(tenantId: string, id: string, reason: string, userId?: string): Promise<Return> {
    const r = await this.prisma.client.return.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!r) throw new NotFoundException('İade bulunamadı');
    if (!['PENDING', 'APPROVED'].includes(r.status)) {
      throw new BadRequestException('Sadece onay bekleyen veya onaylanmış iade reddedilebilir');
    }
    if (!reason || reason.trim().length < 3) {
      throw new BadRequestException('Red nedeni en az 3 karakter olmalı');
    }
    return this.toListDto(
      await this.prisma.client.return.update({
        where: { id },
        data: { status: 'REJECTED', rejectedById: userId, rejectedAt: new Date(), rejectionReason: reason, updatedById: userId },
      }),
    );
  }

  /**
   * İadeyi tamamla: stok ve cari hareketlerini oluştur (event sourcing).
   * Bu adım geri alınamaz. Soft delete + ters kayıt felsefesi uygulanır.
   */
  async complete(tenantId: string, id: string, userId?: string): Promise<Return> {
    const r = await this.prisma.client.return.findFirst({
      where: { id, tenantId, isDeleted: false },
      include: { items: true },
    });
    if (!r) throw new NotFoundException('İade bulunamadı');
    if (r.status !== 'APPROVED') {
      throw new BadRequestException('Sadece onaylanmış iade tamamlanabilir');
    }
    if (r.items.length === 0) throw new BadRequestException('İade kalemleri boş olamaz');

    return await this.prisma.client.$transaction(async (tx) => {
      // 1) Stok hareketleri (returnToStock=true ise ve condition=INTACT ise)
      if (r.returnToStock) {
        for (const item of r.items) {
          if (item.condition !== 'INTACT') continue;
          // Varsayılan depo: ürünün defaultWarehouseId
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          const warehouseId = product?.defaultWarehouseId;
          if (!warehouseId) continue;
          await tx.stockMovement.create({
            data: {
              tenantId,
              warehouseId,
              productId: item.productId,
              type: 'IN',
              refType: 'RETURN',
              refId: r.id,
              quantity: item.quantity,
              movementDate: new Date(),
              description: `İade: ${r.returnNumber}`,
              createdById: userId,
            },
          });
        }
      }

      // 2) Cari hareketi (CREDIT — müşteri alacağı azalır veya borcu artar)
      await tx.customerMovement.create({
        data: {
          tenantId,
          customerId: r.customerId,
          type: 'CREDIT',
          refType: 'RETURN',
          refId: r.id,
          amount: r.grandTotal,
          currency: 'TRY',
          exchangeRate: 1,
          amountTry: r.grandTotal,
          description: `İade: ${r.returnNumber}`,
          movementDate: new Date(),
          createdById: userId,
        },
      });

      // 3) İade durumunu güncelle
      return this.toListDto(
        await tx.return.update({
          where: { id },
          data: { status: 'COMPLETED', completedById: userId, completedAt: new Date(), updatedById: userId },
        }),
      );
    });
  }

  async cancel(tenantId: string, id: string, userId?: string): Promise<Return> {
    const r = await this.prisma.client.return.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!r) throw new NotFoundException('İade bulunamadı');
    if (['COMPLETED', 'CANCELLED', 'REJECTED'].includes(r.status)) {
      throw new BadRequestException('Tamamlanmış/iptal edilmiş/reddedilmiş iade iptal edilemez');
    }
    return this.toListDto(
      await this.prisma.client.return.update({
        where: { id },
        data: { status: 'CANCELLED', cancelledById: userId, cancelledAt: new Date(), updatedById: userId },
      }),
    );
  }

  // ==========================================================================
  // DELETE (soft delete)
  // ==========================================================================

  async softDelete(tenantId: string, id: string, userId?: string): Promise<void> {
    const r = await this.prisma.client.return.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!r) throw new NotFoundException('İade bulunamadı');
    if (r.status === 'COMPLETED') {
      throw new BadRequestException('Tamamlanmış iade silinemez. İptal ediniz.');
    }
    await this.prisma.client.return.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), updatedById: userId },
    });
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private async generateReturnNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.prisma.client.return.findFirst({
      where: { tenantId, returnNumber: { startsWith: `IADE-${year}-` } },
      orderBy: { returnNumber: 'desc' },
    });
    let next = 1;
    if (last) {
      const m = last.returnNumber.match(/IADE-\d{4}-(\d+)/);
      if (m) next = Number(m[1]) + 1;
    }
    return `IADE-${year}-${String(next).padStart(6, '0')}`;
  }

  private toListDto(r: any): any {
    return {
      id: r.id,
      tenantId: r.tenantId,
      returnNumber: r.returnNumber,
      returnDate: r.returnDate.toISOString(),
      customerId: r.customerId,
      source: r.source,
      sourceId: r.sourceId,
      reason: r.reason,
      status: r.status,
      customerName: r.customerName,
      customerTaxNumber: r.customerTaxNumber,
      customerAddress: r.customerAddress,
      customerPhone: r.customerPhone,
      currency: r.currency,
      exchangeRate: Number(r.exchangeRate),
      subTotal: Number(r.subTotal),
      vatTotal: Number(r.vatTotal),
      discountTotal: Number(r.discountTotal),
      grandTotal: Number(r.grandTotal),
      returnToStock: r.returnToStock,
      notes: r.notes,
      internalNotes: r.internalNotes,
      rejectionReason: r.rejectionReason,
      isActive: r.isActive,
      isDeleted: r.isDeleted,
      deletedAt: r.deletedAt?.toISOString() ?? null,
      createdById: r.createdById,
      updatedById: r.updatedById,
      approvedById: r.approvedById,
      approvedAt: r.approvedAt?.toISOString() ?? null,
      completedById: r.completedById,
      completedAt: r.completedAt?.toISOString() ?? null,
      rejectedById: r.rejectedById,
      rejectedAt: r.rejectedAt?.toISOString() ?? null,
      cancelledById: r.cancelledById,
      cancelledAt: r.cancelledAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      itemCount: r._count?.items ?? r.items?.length ?? 0,
      customerCode: r.customer?.code ?? null,
    };
  }

  private toItemDto(it: any): any {
    return {
      id: it.id,
      tenantId: it.tenantId,
      returnId: it.returnId,
      productId: it.productId,
      unitId: it.unitId,
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      vatRate: Number(it.vatRate),
      discountRate: Number(it.discountRate),
      condition: it.condition,
      description: it.description,
      sortOrder: it.sortOrder,
      lineSubTotal: Number(it.lineSubTotal),
      lineVatAmount: Number(it.lineVatAmount),
      lineGrandTotal: Number(it.lineGrandTotal),
      createdAt: it.createdAt.toISOString(),
      updatedAt: it.updatedAt.toISOString(),
    };
  }
}
