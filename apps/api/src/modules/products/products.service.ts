import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.module.js';
import type { PaginatedResponse, Product, ProductStatus, ProductType } from '@saas/shared';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    tenantId: string,
    params: {
      page?: number;
      pageSize?: number;
      search?: string;
      type?: ProductType;
      status?: ProductStatus;
      brandId?: string;
      categoryId?: string;
    },
  ): Promise<PaginatedResponse<Product & { totalStock: number; brandName: string | null; categoryName: string | null; unitName: string }>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 50;
    const where: Prisma.ProductWhereInput = {
      tenantId,
      isDeleted: false,
      ...(params.type ? { type: params.type } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.brandId ? { brandId: params.brandId } : {}),
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params.search
        ? {
            OR: [
              { code: { contains: params.search, mode: 'insensitive' } },
              { name: { contains: params.search, mode: 'insensitive' } },
              { shortName: { contains: params.search, mode: 'insensitive' } },
              { primaryBarcode: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.client.product.findMany({
        where,
        orderBy: [{ name: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { brand: true, category: true, unit: true },
      }),
      this.prisma.client.product.count({ where }),
    ]);

    // Stok miktarlarını toplu hesapla
    const productIds = rows.map((r) => r.id);
    const stocks = await this.computeTotalStocks(tenantId, productIds);

    return {
      data: rows.map((p) => ({
        ...this.toDto(p),
        totalStock: stocks.get(p.id) ?? 0,
        brandName: p.brand?.name ?? null,
        categoryName: p.category?.name ?? null,
        unitName: p.unit?.name ?? '',
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

  async findById(
    tenantId: string,
    id: string,
  ): Promise<Product & {
    totalStock: number;
    stockByWarehouse: Array<{ warehouseId: string; warehouseName: string; quantity: number }>;
    brandName: string | null;
    categoryName: string | null;
    unitName: string;
  }> {
    const p = await this.prisma.client.product.findFirst({
      where: { id, tenantId, isDeleted: false },
      include: { brand: true, category: true, unit: true },
    });
    if (!p) throw new NotFoundException('Ürün bulunamadı');

    const [totalStock, stockByWarehouse] = await Promise.all([
      this.computeTotalStocks(tenantId, [id]),
      this.computeStockByWarehouse(tenantId, id),
    ]);

    return {
      ...this.toDto(p),
      totalStock: totalStock.get(id) ?? 0,
      stockByWarehouse,
      brandName: p.brand?.name ?? null,
      categoryName: p.category?.name ?? null,
      unitName: p.unit?.name ?? '',
    };
  }

  async create(
    tenantId: string,
    input: {
      code?: string;
      name: string;
      shortName?: string;
      description?: string;
      type?: ProductType;
      status?: ProductStatus;
      brandId?: string;
      categoryId?: string;
      defaultWarehouseId?: string;
      unitId: string;
      primaryBarcode?: string;
      trackStock?: boolean;
      vatRate?: number;
      minStock?: number;
      maxStock?: number;
      weight?: number;
      volume?: number;
    },
    createdById?: string,
  ): Promise<Product> {
    const code = input.code ?? (await this.generateNextCode(tenantId));

    const existing = await this.prisma.client.product.findFirst({
      where: { tenantId, code, isDeleted: false },
    });
    if (existing) throw new ConflictException(`Bu ürün kodu zaten kullanılıyor: ${code}`);

    // Unit kontrolü
    const unit = await this.prisma.client.unit.findFirst({
      where: { id: input.unitId, OR: [{ tenantId }, { tenantId: null }] },
    });
    if (!unit) throw new BadRequestException('Geçersiz birim (unitId)');

    const created = await this.prisma.client.product.create({
      data: {
        tenantId,
        code,
        name: input.name,
        shortName: input.shortName ?? null,
        description: input.description ?? null,
        type: input.type ?? 'GOODS',
        status: input.status ?? 'ACTIVE',
        brandId: input.brandId ?? null,
        categoryId: input.categoryId ?? null,
        defaultWarehouseId: input.defaultWarehouseId ?? null,
        unitId: input.unitId,
        primaryBarcode: input.primaryBarcode ?? null,
        trackStock: input.trackStock ?? true,
        vatRate: new Prisma.Decimal(input.vatRate ?? 20),
        minStock: new Prisma.Decimal(input.minStock ?? 0),
        maxStock: new Prisma.Decimal(input.maxStock ?? 0),
        weight: input.weight != null ? new Prisma.Decimal(input.weight) : null,
        volume: input.volume != null ? new Prisma.Decimal(input.volume) : null,
        createdById: createdById ?? null,
      },
    });
    return this.toDto(created);
  }

  async update(tenantId: string, id: string, input: {
    name?: string;
    shortName?: string | null;
    description?: string | null;
    status?: ProductStatus;
    brandId?: string | null;
    categoryId?: string | null;
    defaultWarehouseId?: string | null;
    unitId?: string;
    primaryBarcode?: string | null;
    trackStock?: boolean;
    vatRate?: number;
    minStock?: number;
    maxStock?: number;
    weight?: number | null;
    volume?: number | null;
  }, updatedById?: string): Promise<Product> {
    const exists = await this.prisma.client.product.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!exists) throw new NotFoundException('Ürün bulunamadı');

    const updated = await this.prisma.client.product.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.shortName !== undefined ? { shortName: input.shortName } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.brandId !== undefined ? { brandId: input.brandId } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.defaultWarehouseId !== undefined ? { defaultWarehouseId: input.defaultWarehouseId } : {}),
        ...(input.unitId !== undefined ? { unitId: input.unitId } : {}),
        ...(input.primaryBarcode !== undefined ? { primaryBarcode: input.primaryBarcode } : {}),
        ...(input.trackStock !== undefined ? { trackStock: input.trackStock } : {}),
        ...(input.vatRate !== undefined ? { vatRate: new Prisma.Decimal(input.vatRate) } : {}),
        ...(input.minStock !== undefined ? { minStock: new Prisma.Decimal(input.minStock) } : {}),
        ...(input.maxStock !== undefined ? { maxStock: new Prisma.Decimal(input.maxStock) } : {}),
        ...(input.weight !== undefined ? { weight: input.weight != null ? new Prisma.Decimal(input.weight) : null } : {}),
        ...(input.volume !== undefined ? { volume: input.volume != null ? new Prisma.Decimal(input.volume) : null } : {}),
        updatedById: updatedById ?? null,
      },
    });
    return this.toDto(updated);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const exists = await this.prisma.client.product.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!exists) throw new NotFoundException('Ürün bulunamadı');

    // Stok hareketi var mı?
    const movementCount = await this.prisma.client.stockMovement.count({
      where: { productId: id, isDeleted: false },
    });
    if (movementCount > 0) {
      throw new BadRequestException(
        `Bu ürünün ${movementCount} stok hareketi var. Silmek için önce hareketleri iptal edin veya ürünü PASIF yapın.`,
      );
    }
    await this.prisma.client.product.update({
      where: { id },
      data: { isDeleted: true, isActive: false, deletedAt: new Date() },
    });
  }

  // --- Private ---

  private async generateNextCode(tenantId: string): Promise<string> {
    const last = await this.prisma.client.product.findFirst({
      where: { tenantId, code: { startsWith: 'P-' } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    let n = 1;
    if (last) {
      const m = last.code.match(/-(\d+)$/);
      if (m) n = Number(m[1]) + 1;
    }
    return `P-${String(n).padStart(5, '0')}`;
  }

  /**
   * Birden fazla ürünün toplam stok miktarı (tüm depolar dahil).
   * Event-sourcing: SUM(IN) - SUM(OUT) hareketten hesaplanır.
   */
  private async computeTotalStocks(tenantId: string, productIds: string[]): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (productIds.length === 0) return map;

    const rows = await this.prisma.client.stockMovement.groupBy({
      by: ['productId', 'type'],
      where: {
        tenantId,
        productId: { in: productIds },
        isDeleted: false,
        status: 'POSTED',
        reversedBy: { is: null },
      },
      _sum: { quantity: true },
    });

    for (const id of productIds) {
      const inQty = Number(rows.find((r) => r.productId === id && r.type === 'IN')?._sum.quantity ?? 0);
      const outQty = Number(rows.find((r) => r.productId === id && r.type === 'OUT')?._sum.quantity ?? 0);
      // TRANSFER miktarı dahil edilmez (zaten OUT + IN olarak sayılıyor)
      // ADJUST direkt eklenir/çıkarılır (yön quantity sign'ında)
      const adjustQty = Number(rows.find((r) => r.productId === id && r.type === 'ADJUST')?._sum.quantity ?? 0);
      map.set(id, inQty - outQty + adjustQty);
    }
    return map;
  }

  /**
   * Tek ürünün depo bazında stok dağılımı.
   */
  private async computeStockByWarehouse(
    tenantId: string,
    productId: string,
  ): Promise<Array<{ warehouseId: string; warehouseName: string; quantity: number }>> {
    const rows = await this.prisma.client.stockMovement.groupBy({
      by: ['warehouseId', 'type'],
      where: {
        tenantId,
        productId,
        isDeleted: false,
        status: 'POSTED',
        reversedBy: { is: null },
      },
      _sum: { quantity: true },
    });

    const warehouseIds = [...new Set(rows.map((r) => r.warehouseId))];
    const warehouses = await this.prisma.client.warehouse.findMany({
      where: { id: { in: warehouseIds } },
      select: { id: true, name: true },
    });
    const wMap = new Map(warehouses.map((w) => [w.id, w.name]));

    const stockMap = new Map<string, number>();
    for (const id of warehouseIds) {
      const inQty = Number(rows.find((r) => r.warehouseId === id && r.type === 'IN')?._sum.quantity ?? 0);
      const outQty = Number(rows.find((r) => r.warehouseId === id && r.type === 'OUT')?._sum.quantity ?? 0);
      const adjustQty = Number(rows.find((r) => r.warehouseId === id && r.type === 'ADJUST')?._sum.quantity ?? 0);
      stockMap.set(id, inQty - outQty + adjustQty);
    }

    return Array.from(stockMap.entries()).map(([warehouseId, quantity]) => ({
      warehouseId,
      warehouseName: wMap.get(warehouseId) ?? 'Bilinmeyen',
      quantity,
    }));
  }

  private toDto(p: {
    id: string;
    tenantId: string;
    code: string;
    name: string;
    shortName: string | null;
    description: string | null;
    type: 'GOODS' | 'SERVICE' | 'RAW_MATERIAL' | 'FINISHED_GOOD' | 'CONSUMABLE';
    status: 'DRAFT' | 'ACTIVE' | 'PASSIVE' | 'DISCONTINUED';
    brandId: string | null;
    categoryId: string | null;
    defaultWarehouseId: string | null;
    unitId: string;
    primaryBarcode: string | null;
    trackStock: boolean;
    vatRate: Prisma.Decimal | number;
    minStock: Prisma.Decimal | number;
    maxStock: Prisma.Decimal | number;
    weight: Prisma.Decimal | number | null;
    volume: Prisma.Decimal | number | null;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Product {
    return {
      id: p.id,
      tenantId: p.tenantId,
      code: p.code,
      name: p.name,
      shortName: p.shortName,
      description: p.description,
      type: p.type,
      status: p.status,
      brandId: p.brandId,
      categoryId: p.categoryId,
      defaultWarehouseId: p.defaultWarehouseId,
      unitId: p.unitId,
      primaryBarcode: p.primaryBarcode,
      trackStock: p.trackStock,
      vatRate: Number(p.vatRate),
      minStock: Number(p.minStock),
      maxStock: Number(p.maxStock),
      weight: p.weight != null ? Number(p.weight) : null,
      volume: p.volume != null ? Number(p.volume) : null,
      isActive: p.isActive,
      isDeleted: p.isDeleted,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}
