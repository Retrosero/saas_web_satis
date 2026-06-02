import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.module.js';
import type { PaginatedResponse, StockMovement, StockMovementRefType, StockMovementType } from '@saas/shared';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tek bir stok hareketi oluştur (IN/OUT/ADJUST).
   * TRANSFER için createTransfer() kullan.
   */
  async create(
    tenantId: string,
    input: {
      productId: string;
      warehouseId: string;
      type: StockMovementType;
      quantity: number;
      unitCost?: number;
      movementDate: Date;
      refType: StockMovementRefType;
      transferToWarehouseId?: string;
      refNumber?: string;
      description?: string;
    },
    createdById?: string,
  ): Promise<StockMovement> {
    if (input.type === 'TRANSFER') {
      throw new BadRequestException('TRANSFER için createTransfer() metodunu kullanın');
    }
    return this.createSingle(tenantId, input, createdById);
  }

  /**
   * Depo arası transfer — 2 hareket oluşturur:
   *   - Kaynak depoda OUT
   *   - Hedef depoda IN
   * Tek bir işlem gibi davranır (yarıda kalırsa 2'si de rollback).
   */
  async createTransfer(
    tenantId: string,
    input: {
      productId: string;
      fromWarehouseId: string;
      toWarehouseId: string;
      quantity: number;
      movementDate: Date;
      refNumber?: string;
      description?: string;
    },
    createdById?: string,
  ): Promise<{ out: StockMovement; in: StockMovement }> {
    if (input.fromWarehouseId === input.toWarehouseId) {
      throw new BadRequestException('Kaynak ve hedef depo aynı olamaz');
    }
    if (input.quantity <= 0) {
      throw new BadRequestException('Transfer miktarı pozitif olmalı');
    }

    // Kaynak depoda yeterli stok var mı?
    const available = await this.getStockQuantity(tenantId, input.productId, input.fromWarehouseId);
    if (available < input.quantity) {
      throw new BadRequestException(
        `Kaynak depoda yeterli stok yok (mevcut: ${available}, istenen: ${input.quantity})`,
      );
    }

    const refNumber = input.refNumber ?? `TR-${Date.now()}`;

    return this.prisma.client.$transaction(async (tx) => {
      const out = await tx.stockMovement.create({
        data: {
          tenantId,
          productId: input.productId,
          warehouseId: input.fromWarehouseId,
          type: 'OUT',
          quantity: new Prisma.Decimal(input.quantity),
          movementDate: input.movementDate,
          refType: 'TRANSFER',
          refNumber,
          transferToWarehouseId: input.toWarehouseId,
          description: input.description ?? `Transfer: ${refNumber}`,
          status: 'POSTED',
          createdById: createdById ?? null,
        },
      });

      const in_ = await tx.stockMovement.create({
        data: {
          tenantId,
          productId: input.productId,
          warehouseId: input.toWarehouseId,
          type: 'IN',
          quantity: new Prisma.Decimal(input.quantity),
          movementDate: input.movementDate,
          refType: 'TRANSFER',
          refNumber,
          description: input.description ?? `Transfer: ${refNumber}`,
          status: 'POSTED',
          createdById: createdById ?? null,
        },
      });

      return { out: this.toDto(out), in: this.toDto(in_) };
    });
  }

  /**
   * Manuel düzeltme (sayım farkı, fire vb.).
   * Pozitif quantity = stok artışı, negatif = stok azalışı.
   */
  async adjust(
    tenantId: string,
    input: {
      productId: string;
      warehouseId: string;
      quantity: number; // + veya -
      movementDate: Date;
      refNumber?: string;
      description?: string;
    },
    createdById?: string,
  ): Promise<StockMovement> {
    return this.createSingle(
      tenantId,
      {
        productId: input.productId,
        warehouseId: input.warehouseId,
        type: 'ADJUST',
        quantity: Math.abs(input.quantity), // her zaman pozitif kaydedilir, yön sign'da
        movementDate: input.movementDate,
        refType: input.quantity < 0 ? 'WASTE' : 'COUNT',
        refNumber: input.refNumber,
        description: input.description ?? (input.quantity < 0 ? 'Fire/zayiat' : 'Sayım düzeltmesi'),
      },
      createdById,
    );
  }

  /**
   * Hareket listesi — filtre + sayfalama.
   * Tüm depolar ve ürünler için.
   */
  async list(
    tenantId: string,
    params: {
      page?: number;
      pageSize?: number;
      productId?: string;
      warehouseId?: string;
      type?: StockMovementType;
      refType?: StockMovementRefType;
      from?: Date;
      to?: Date;
    },
  ): Promise<PaginatedResponse<StockMovement & { productCode: string; productName: string; warehouseName: string }>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 50;
    const where: Prisma.StockMovementWhereInput = {
      tenantId,
      isDeleted: false,
      ...(params.productId ? { productId: params.productId } : {}),
      ...(params.warehouseId ? { warehouseId: params.warehouseId } : {}),
      ...(params.type ? { type: params.type } : {}),
      ...(params.refType ? { refType: params.refType } : {}),
      ...(params.from || params.to
        ? {
            movementDate: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lte: params.to } : {}),
            },
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.client.stockMovement.findMany({
        where,
        orderBy: [{ movementDate: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { product: true, warehouse: true },
      }),
      this.prisma.client.stockMovement.count({ where }),
    ]);

    return {
      data: rows.map((m) => ({
        ...this.toDto(m),
        productCode: m.product?.code ?? '',
        productName: m.product?.name ?? '',
        warehouseName: m.warehouse?.name ?? '',
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

  /**
   * Ürünün belirli bir depodaki anlık stok miktarı (event-sourcing).
   * SUM(IN) - SUM(OUT) + SUM(ADJUST) ters kayıtlar hariç.
   */
  async getStockQuantity(tenantId: string, productId: string, warehouseId: string): Promise<number> {
    const rows = await this.prisma.client.stockMovement.groupBy({
      by: ['type'],
      where: {
        tenantId,
        productId,
        warehouseId,
        isDeleted: false,
        status: 'POSTED',
        reversedBy: { is: null },
      },
      _sum: { quantity: true },
    });
    const inQty = Number(rows.find((r) => r.type === 'IN')?._sum.quantity ?? 0);
    const outQty = Number(rows.find((r) => r.type === 'OUT')?._sum.quantity ?? 0);
    const adjustQty = Number(rows.find((r) => r.type === 'ADJUST')?._sum.quantity ?? 0);
    return inQty - outQty + adjustQty;
  }

  /**
   * Hareketi ters kayıt ile iptal et.
   * Asla DELETE yok — yeni hareket oluşturulur.
   */
  async reverse(
    tenantId: string,
    movementId: string,
    createdById?: string,
  ): Promise<StockMovement> {
    const original = await this.prisma.client.stockMovement.findFirst({
      where: { id: movementId, tenantId, isDeleted: false },
    });
    if (!original) throw new NotFoundException('Hareket bulunamadı');
    // Ters kayıt zaten var mı? (reversesId benim ID'm olan bir kayıt)
    const existingReverse = await this.prisma.client.stockMovement.findFirst({
      where: { reversesId: original.id, isDeleted: false },
      select: { id: true },
    });
    if (existingReverse) throw new ConflictException('Bu hareket zaten ters kayıt ile iptal edilmiş');
    if (original.reversesId) throw new ConflictException('Bu zaten bir ters kayıt, tekrar iptal edilemez');

    return this.prisma.client.$transaction(async (tx) => {
      const reverse = await tx.stockMovement.create({
        data: {
          tenantId,
          productId: original.productId,
          warehouseId: original.warehouseId,
          // Ters yön: IN ↔ OUT, ADJUST aynı kalır
          type: original.type === 'IN' ? 'OUT' : original.type === 'OUT' ? 'IN' : 'ADJUST',
          quantity: original.quantity,
          unitCost: original.unitCost ?? undefined,
          movementDate: new Date(),
          refType: `${original.refType}_CANCEL` as StockMovementRefType,
          refNumber: `TRS-${original.refNumber ?? original.id}`,
          description: `İptal: ${original.refNumber ?? original.id}`,
          status: 'POSTED',
          reversesId: original.id,
          createdById: createdById ?? null,
        },
      });
      // Not: Original.reversedBy back-relation otomatik populate olur
      // (DB'de reversesId set edildiği için)
      return this.toDto(reverse);
    });
  }

  // ----- Private -----

  private async createSingle(
    tenantId: string,
    input: {
      productId: string;
      warehouseId: string;
      type: StockMovementType;
      quantity: number;
      unitCost?: number;
      movementDate: Date;
      refType: StockMovementRefType;
      transferToWarehouseId?: string;
      refNumber?: string;
      description?: string;
    },
    createdById?: string,
  ): Promise<StockMovement> {
    // Ürün ve depo kontrolü
    const [product, warehouse] = await Promise.all([
      this.prisma.client.product.findFirst({ where: { id: input.productId, tenantId, isDeleted: false } }),
      this.prisma.client.warehouse.findFirst({ where: { id: input.warehouseId, tenantId, isDeleted: false } }),
    ]);
    if (!product) throw new NotFoundException('Ürün bulunamadı');
    if (!warehouse) throw new NotFoundException('Depo bulunamadı');
    if (!product.trackStock) {
      throw new BadRequestException('Bu ürün için stok takibi kapalı');
    }
    if (input.quantity <= 0) {
      throw new BadRequestException('Miktar pozitif olmalı');
    }

    // OUT için yeterli stok var mı?
    if (input.type === 'OUT') {
      const available = await this.getStockQuantity(tenantId, input.productId, input.warehouseId);
      if (available < input.quantity) {
        throw new BadRequestException(
          `Yetersiz stok: mevcut ${available}, istenen ${input.quantity}`,
        );
      }
    }

    const created = await this.prisma.client.stockMovement.create({
      data: {
        tenantId,
        productId: input.productId,
        warehouseId: input.warehouseId,
        type: input.type,
        quantity: new Prisma.Decimal(input.quantity),
        unitCost: input.unitCost != null ? new Prisma.Decimal(input.unitCost) : null,
        movementDate: input.movementDate,
        refType: input.refType,
        transferToWarehouseId: input.transferToWarehouseId ?? null,
        refNumber: input.refNumber ?? null,
        description: input.description ?? null,
        status: 'POSTED',
        createdById: createdById ?? null,
      },
    });
    return this.toDto(created);
  }

  private toDto(m: {
    id: string;
    tenantId: string;
    productId: string;
    warehouseId: string;
    type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUST';
    quantity: Prisma.Decimal | number;
    unitCost: Prisma.Decimal | number | null;
    movementDate: Date;
    refType: string;
    refId: string | null;
    refNumber: string | null;
    description: string | null;
    status: 'DRAFT' | 'POSTED' | 'PENDING' | 'CANCELLED';
    transferToWarehouseId: string | null;
    reversesId: string | null;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): StockMovement {
    return {
      id: m.id,
      tenantId: m.tenantId,
      productId: m.productId,
      warehouseId: m.warehouseId,
      type: m.type,
      quantity: Number(m.quantity),
      unitCost: m.unitCost != null ? Number(m.unitCost) : null,
      movementDate: m.movementDate.toISOString(),
      refType: m.refType,
      refId: m.refId,
      refNumber: m.refNumber,
      description: m.description,
      status: m.status,
      transferToWarehouseId: m.transferToWarehouseId,
      reversesId: m.reversesId,
      isDeleted: m.isDeleted,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    };
  }
}
