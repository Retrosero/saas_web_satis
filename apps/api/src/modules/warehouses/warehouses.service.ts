import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.module.js';
import type { PaginatedResponse, Warehouse, WarehouseStatus } from '@saas/shared';
import { StockService } from '../stock/stock.service.js';

@Injectable()
export class WarehousesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
  ) {}

  async list(
    tenantId: string,
    params: { page?: number; pageSize?: number; search?: string; status?: WarehouseStatus },
  ): Promise<PaginatedResponse<Warehouse & { productCount: number; stockMovementCount: number }>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 50;
    const where: Prisma.WarehouseWhereInput = {
      tenantId,
      isDeleted: false,
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { code: { contains: params.search, mode: 'insensitive' } },
              { name: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.client.warehouse.findMany({
        where,
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.client.warehouse.count({ where }),
    ]);
    const ids = rows.map((row) => row.id);
    const counts = await this.getCounts(tenantId, ids);

    return {
      data: rows.map((warehouse) => ({
        ...this.toDto(warehouse),
        productCount: counts.get(warehouse.id)?.productCount ?? 0,
        stockMovementCount: counts.get(warehouse.id)?.stockMovementCount ?? 0,
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

  async findById(tenantId: string, id: string): Promise<Warehouse & { productCount: number; stockMovementCount: number }> {
    const warehouse = await this.prisma.client.warehouse.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!warehouse) throw new NotFoundException('Depo bulunamadi');
    const counts = await this.getCounts(tenantId, [id]);
    return { ...this.toDto(warehouse), ...(counts.get(id) ?? { productCount: 0, stockMovementCount: 0 }) };
  }

  async getStock(tenantId: string, warehouseId: string) {
    await this.ensureWarehouseExists(tenantId, warehouseId);

    const [movementRows, assignedProducts] = await Promise.all([
      this.prisma.client.stockMovement.groupBy({
        by: ['productId', 'type'],
        where: {
          tenantId,
          warehouseId,
          isDeleted: false,
          status: 'POSTED',
          reversedBy: { is: null },
        },
        _sum: { quantity: true },
      }),
      this.prisma.client.product.findMany({
        where: {
          tenantId,
          isDeleted: false,
          defaultWarehouseId: warehouseId,
        },
        select: { id: true },
      }),
    ]);

    const productIds = [...new Set([...movementRows.map((row) => row.productId), ...assignedProducts.map((product) => product.id)])];
    if (productIds.length === 0) return [];

    const products = await this.prisma.client.product.findMany({
      where: {
        tenantId,
        isDeleted: false,
        id: { in: productIds },
      },
      include: {
        unit: true,
        prices: {
          where: { isActive: true, type: 'SALE' },
          orderBy: [{ validFrom: 'desc' }],
          take: 1,
        },
      },
    });

    const quantityMap = new Map<string, number>();
    for (const row of movementRows) {
      const current = quantityMap.get(row.productId) ?? 0;
      const amount = Number(row._sum.quantity ?? 0);
      const delta = row.type === 'OUT' ? -amount : amount;
      quantityMap.set(row.productId, current + delta);
    }

    return products
      .map((product) => {
        const totalStock = quantityMap.get(product.id) ?? 0;
        const unitPrice = Number(product.prices[0]?.amount ?? 0);
        return {
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          unitName: product.unit?.name ?? null,
          totalStock,
          minStock: Number(product.minStock),
          maxStock: Number(product.maxStock),
          unitPrice,
          stockValue: totalStock * unitPrice,
        };
      })
      .sort((left, right) => left.productName.localeCompare(right.productName, 'tr'));
  }

  async listTransfers(
    tenantId: string,
    params: { page?: number; pageSize?: number; fromWarehouseId?: string; toWarehouseId?: string; status?: string },
  ) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 50;
    const where: Prisma.WarehouseTransferWhereInput = {
      tenantId,
      isDeleted: false,
      ...(params.fromWarehouseId ? { fromWarehouseId: params.fromWarehouseId } : {}),
      ...(params.toWarehouseId ? { toWarehouseId: params.toWarehouseId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.client.warehouseTransfer.findMany({
        where,
        orderBy: [{ transferDate: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          fromWarehouse: true,
          toWarehouse: true,
          items: {
            select: {
              quantity: true,
            },
          },
        },
      }),
      this.prisma.client.warehouseTransfer.count({ where }),
    ]);

    return {
      data: rows.map((transfer) => this.mapTransferListItem(transfer)),
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

  async listUnassignedProducts(tenantId: string, search?: string) {
    return this.prisma.client.product.findMany({
      where: {
        tenantId,
        isDeleted: false,
        defaultWarehouseId: null,
        ...(search
          ? {
              OR: [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { primaryBarcode: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ name: 'asc' }],
      take: 30,
      select: {
        id: true,
        code: true,
        name: true,
        primaryBarcode: true,
      },
    });
  }

  async create(
    tenantId: string,
    input: {
      code?: string;
      name: string;
      status?: WarehouseStatus;
      branch?: string;
      address?: string;
      city?: string;
      manager?: string;
      phone?: string;
      isDefault?: boolean;
      notes?: string;
    },
  ): Promise<Warehouse> {
    const code = input.code ?? (await this.generateNextCode(tenantId));
    const existing = await this.prisma.client.warehouse.findFirst({
      where: { tenantId, code, isDeleted: false },
    });
    if (existing) throw new ConflictException(`Bu depo kodu zaten kullaniliyor: ${code}`);

    const isDefault =
      input.isDefault ??
      (await this.prisma.client.warehouse.count({ where: { tenantId, isDeleted: false } })) ===
        0;

    if (isDefault) {
      await this.prisma.client.warehouse.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const created = await this.prisma.client.warehouse.create({
      data: {
        tenantId,
        code,
        name: input.name,
        status: input.status ?? 'ACTIVE',
        branch: input.branch?.trim() ? input.branch.trim() : null,
        address: input.address ?? null,
        city: input.city ?? null,
        manager: input.manager ?? null,
        phone: input.phone ?? null,
        isDefault,
        notes: input.notes ?? null,
      },
    });
    return this.toDto(created);
  }

  async createTransfer(
    tenantId: string,
    input: {
      fromWarehouseId: string;
      toWarehouseId: string;
      transferDate: Date;
      description?: string;
      items: Array<{ productId: string; quantity: number; description?: string }>;
    },
    userId?: string,
  ) {
    if (input.fromWarehouseId === input.toWarehouseId) {
      throw new ConflictException('Cikis ve giris deposu ayni olamaz');
    }
    if (input.items.length === 0) {
      throw new ConflictException('En az 1 kalem eklenmelidir');
    }

    await Promise.all([
      this.ensureWarehouseExists(tenantId, input.fromWarehouseId),
      this.ensureWarehouseExists(tenantId, input.toWarehouseId),
    ]);

    const products = await this.prisma.client.product.findMany({
      where: {
        tenantId,
        isDeleted: false,
        id: { in: input.items.map((item) => item.productId) },
      },
      select: {
        id: true,
        name: true,
        trackStock: true,
      },
    });
    const productMap = new Map(products.map((product) => [product.id, product]));

    for (const item of input.items) {
      if (item.quantity <= 0) {
        throw new ConflictException('Transfer miktari pozitif olmalidir');
      }
      const product = productMap.get(item.productId);
      if (!product) throw new NotFoundException('Urun bulunamadi');
      if (!product.trackStock) {
        throw new ConflictException(`${product.name} icin stok takibi kapali`);
      }

      const available = await this.stockService.getStockQuantity(tenantId, item.productId, input.fromWarehouseId);
      if (available < item.quantity) {
        throw new ConflictException(`Yetersiz stok: ${product.name} icin mevcut ${available}, istenen ${item.quantity}`);
      }
    }

    const transferNumber = await this.generateNextTransferNumber(tenantId);
    const created = await this.prisma.client.$transaction(async (tx) => {
      const transfer = await tx.warehouseTransfer.create({
        data: {
          tenantId,
          transferNumber,
          transferDate: input.transferDate,
          fromWarehouseId: input.fromWarehouseId,
          toWarehouseId: input.toWarehouseId,
          status: 'CONFIRMED',
          description: input.description?.trim() ? input.description.trim() : null,
          createdById: userId ?? null,
          updatedById: userId ?? null,
          confirmedById: userId ?? null,
          confirmedAt: new Date(),
        },
      });

      await tx.warehouseTransferItem.createMany({
        data: input.items.map((item, index) => ({
          tenantId,
          transferId: transfer.id,
          productId: item.productId,
          quantity: new Prisma.Decimal(item.quantity),
          description: item.description?.trim() ? item.description.trim() : null,
          sortOrder: index,
        })),
      });

      for (const item of input.items) {
        const lineDescription = item.description?.trim() || input.description?.trim() || transfer.transferNumber;

        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            warehouseId: input.fromWarehouseId,
            type: 'OUT',
            quantity: new Prisma.Decimal(item.quantity),
            movementDate: input.transferDate,
            refType: 'TRANSFER',
            refId: transfer.id,
            refNumber: transfer.transferNumber,
            transferToWarehouseId: input.toWarehouseId,
            description: lineDescription,
            status: 'POSTED',
            createdById: userId ?? null,
          },
        });

        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            warehouseId: input.toWarehouseId,
            type: 'IN',
            quantity: new Prisma.Decimal(item.quantity),
            movementDate: input.transferDate,
            refType: 'TRANSFER',
            refId: transfer.id,
            refNumber: transfer.transferNumber,
            description: lineDescription,
            status: 'POSTED',
            createdById: userId ?? null,
          },
        });
      }

      return transfer.id;
    });

    return this.getTransferById(tenantId, created);
  }

  async update(
    tenantId: string,
    id: string,
    input: {
      name?: string;
      status?: WarehouseStatus;
      branch?: string | null;
      address?: string | null;
      city?: string | null;
      manager?: string | null;
      phone?: string | null;
      isDefault?: boolean;
      notes?: string | null;
    },
  ): Promise<Warehouse> {
    const exists = await this.prisma.client.warehouse.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!exists) throw new NotFoundException('Depo bulunamadi');

    if (input.isDefault) {
      await this.prisma.client.warehouse.updateMany({
        where: { tenantId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.client.warehouse.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.branch !== undefined ? { branch: input.branch?.trim() ? input.branch.trim() : null } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.manager !== undefined ? { manager: input.manager } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });
    return this.toDto(updated);
  }

  async deactivate(tenantId: string, id: string): Promise<Warehouse> {
    const exists = await this.prisma.client.warehouse.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!exists) throw new NotFoundException('Depo bulunamadi');

    if (exists.isDefault) {
      const replacement = await this.prisma.client.warehouse.findFirst({
        where: {
          tenantId,
          isDeleted: false,
          status: 'ACTIVE',
          id: { not: id },
        },
        orderBy: [{ name: 'asc' }],
      });

      if (replacement) {
        await this.prisma.client.warehouse.update({
          where: { id: replacement.id },
          data: { isDefault: true },
        });
      }
    }

    const updated = await this.prisma.client.warehouse.update({
      where: { id },
      data: {
        status: 'PASSIVE',
        isActive: false,
        isDefault: false,
      },
    });
    return this.toDto(updated);
  }

  async assignProducts(tenantId: string, warehouseId: string, productIds: string[]) {
    await this.ensureWarehouseExists(tenantId, warehouseId);
    if (!productIds.length) return { updatedCount: 0 };

    const result = await this.prisma.client.product.updateMany({
      where: {
        tenantId,
        isDeleted: false,
        id: { in: productIds },
        defaultWarehouseId: null,
      },
      data: {
        defaultWarehouseId: warehouseId,
      },
    });

    return { updatedCount: result.count };
  }

  async confirmTransfer(tenantId: string, id: string, userId?: string) {
    const transfer = await this.prisma.client.warehouseTransfer.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!transfer) throw new NotFoundException('Transfer bulunamadi');
    return this.getTransferById(tenantId, transfer.id);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const exists = await this.prisma.client.warehouse.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!exists) throw new NotFoundException('Depo bulunamadi');

    const productCount = await this.prisma.client.product.count({
      where: {
        OR: [
          { defaultWarehouseId: id },
          { stockMovements: { some: { warehouseId: id, isDeleted: false } } },
        ],
      },
    });
    if (productCount > 0) {
      throw new ConflictException(`Bu depoda ${productCount} urun/hareket var. Once baska depoya tasiyin.`);
    }

    await this.prisma.client.warehouse.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });
  }

  private async generateNextCode(tenantId: string): Promise<string> {
    const last = await this.prisma.client.warehouse.findFirst({
      where: { tenantId, code: { startsWith: 'W-' } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    let next = 1;
    if (last) {
      const match = last.code.match(/-(\d+)$/);
      if (match) next = Number(match[1]) + 1;
    }
    return `W-${String(next).padStart(4, '0')}`;
  }

  private async generateNextTransferNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TR-${year}-`;
    const last = await this.prisma.client.warehouseTransfer.findFirst({
      where: {
        tenantId,
        transferNumber: { startsWith: prefix },
      },
      orderBy: { transferNumber: 'desc' },
      select: { transferNumber: true },
    });

    const lastSequence = last?.transferNumber.match(/(\d+)$/)?.[1];
    const nextSequence = lastSequence ? Number(lastSequence) + 1 : 1;
    return `${prefix}${String(nextSequence).padStart(6, '0')}`;
  }

  private async getTransferById(tenantId: string, id: string) {
    const transfer = await this.prisma.client.warehouseTransfer.findFirst({
      where: { id, tenantId, isDeleted: false },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: {
          select: {
            quantity: true,
          },
        },
      },
    });
    if (!transfer) throw new NotFoundException('Transfer bulunamadi');
    return this.mapTransferListItem(transfer);
  }

  private mapTransferListItem(transfer: {
    id: string;
    transferNumber: string;
    transferDate: Date;
    fromWarehouseId: string;
    fromWarehouse: { name: string };
    toWarehouseId: string;
    toWarehouse: { name: string };
    status: string;
    description: string | null;
    items: Array<{ quantity: Prisma.Decimal }>;
    createdAt: Date;
  }) {
    return {
      id: transfer.id,
      transferNumber: transfer.transferNumber,
      transferDate: transfer.transferDate.toISOString(),
      fromWarehouseId: transfer.fromWarehouseId,
      fromWarehouseName: transfer.fromWarehouse.name,
      toWarehouseId: transfer.toWarehouseId,
      toWarehouseName: transfer.toWarehouse.name,
      status: transfer.status as 'PENDING' | 'CONFIRMED' | 'CANCELLED',
      description: transfer.description,
      itemCount: transfer.items.length,
      totalQuantity: transfer.items.reduce((sum, item) => sum + Number(item.quantity), 0),
      createdByName: null,
      createdAt: transfer.createdAt.toISOString(),
    };
  }

  private async getCounts(tenantId: string, ids: string[]): Promise<Map<string, { productCount: number; stockMovementCount: number }>> {
    const map = new Map<string, { productCount: number; stockMovementCount: number }>();
    if (ids.length === 0) return map;

    const [products, movements] = await Promise.all([
      this.prisma.client.product.groupBy({
        by: ['defaultWarehouseId'],
        where: {
          tenantId,
          isDeleted: false,
          defaultWarehouseId: { in: ids },
        },
        _count: { _all: true },
      }),
      this.prisma.client.stockMovement.groupBy({
        by: ['warehouseId'],
        where: {
          tenantId,
          isDeleted: false,
          warehouseId: { in: ids },
        },
        _count: { _all: true },
      }),
    ]);

    for (const id of ids) {
      map.set(id, {
        productCount: products.find((product) => product.defaultWarehouseId === id)?._count._all ?? 0,
        stockMovementCount: movements.find((movement) => movement.warehouseId === id)?._count._all ?? 0,
      });
    }

    return map;
  }

  private async ensureWarehouseExists(tenantId: string, id: string) {
    const warehouse = await this.prisma.client.warehouse.findFirst({
      where: { id, tenantId, isDeleted: false },
      select: { id: true },
    });
    if (!warehouse) throw new NotFoundException('Depo bulunamadi');
  }

  private toDto(warehouse: {
    id: string;
    tenantId: string;
    code: string;
    name: string;
    status: 'ACTIVE' | 'PASSIVE';
    branch: string | null;
    address: string | null;
    city: string | null;
    manager: string | null;
    phone: string | null;
    isDefault: boolean;
    notes: string | null;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Warehouse {
    return {
      id: warehouse.id,
      tenantId: warehouse.tenantId,
      code: warehouse.code,
      name: warehouse.name,
      status: warehouse.status,
      branch: warehouse.branch,
      address: warehouse.address,
      city: warehouse.city,
      manager: warehouse.manager,
      phone: warehouse.phone,
      isDefault: warehouse.isDefault,
      notes: warehouse.notes,
      isActive: warehouse.isActive,
      isDeleted: warehouse.isDeleted,
      createdAt: warehouse.createdAt.toISOString(),
      updatedAt: warehouse.updatedAt.toISOString(),
    };
  }
}
