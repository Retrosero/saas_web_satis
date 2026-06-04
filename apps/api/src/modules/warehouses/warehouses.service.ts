import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.module.js';
import type { PaginatedResponse, Warehouse, WarehouseStatus } from '@saas/shared';

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

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
    const ids = rows.map((r) => r.id);
    const counts = await this.getCounts(tenantId, ids);

    return {
      data: rows.map((w) => ({
        ...this.toDto(w),
        productCount: counts.get(w.id)?.productCount ?? 0,
        stockMovementCount: counts.get(w.id)?.stockMovementCount ?? 0,
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
    const w = await this.prisma.client.warehouse.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!w) throw new NotFoundException('Depo bulunamadı');
    const counts = await this.getCounts(tenantId, [id]);
    return { ...this.toDto(w), ...(counts.get(id) ?? { productCount: 0, stockMovementCount: 0 }) };
  }

  async create(tenantId: string, input: {
    code?: string;
    name: string;
    status?: WarehouseStatus;
    address?: string;
    city?: string;
    manager?: string;
    phone?: string;
    isDefault?: boolean;
    notes?: string;
  }): Promise<Warehouse> {
    const code = input.code ?? (await this.generateNextCode(tenantId));

    const existing = await this.prisma.client.warehouse.findFirst({
      where: { tenantId, code, isDeleted: false },
    });
    if (existing) throw new ConflictException(`Bu depo kodu zaten kullanılıyor: ${code}`);

    // İlk depo ise otomatik default
    const isDefault = input.isDefault ?? (await this.prisma.client.warehouse.count({ where: { tenantId, isDeleted: false } })) === 0;

    // Default'u değiştiriyorsa diğerlerini kapat
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

  async update(tenantId: string, id: string, input: {
    name?: string;
    status?: WarehouseStatus;
    address?: string | null;
    city?: string | null;
    manager?: string | null;
    phone?: string | null;
    isDefault?: boolean;
    notes?: string | null;
  }): Promise<Warehouse> {
    const exists = await this.prisma.client.warehouse.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!exists) throw new NotFoundException('Depo bulunamadı');

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

  async remove(tenantId: string, id: string): Promise<void> {
    const exists = await this.prisma.client.warehouse.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!exists) throw new NotFoundException('Depo bulunamadı');

    // Ürün var mı kontrolü
    const productCount = await this.prisma.client.product.count({
      where: { OR: [{ defaultWarehouseId: id }, { stockMovements: { some: { warehouseId: id, isDeleted: false } } }] },
    });
    if (productCount > 0) {
      throw new ConflictException(`Bu depoda ${productCount} ürün/hareket var. Önce başka depoya taşıyın.`);
    }

    await this.prisma.client.warehouse.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });
  }

  // --- Private ---

  private async generateNextCode(tenantId: string): Promise<string> {
    const last = await this.prisma.client.warehouse.findFirst({
      where: { tenantId, code: { startsWith: 'W-' } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    let n = 1;
    if (last) {
      const m = last.code.match(/-(\d+)$/);
      if (m) n = Number(m[1]) + 1;
    }
    return `W-${String(n).padStart(4, '0')}`;
  }

  private async getCounts(tenantId: string, ids: string[]): Promise<Map<string, { productCount: number; stockMovementCount: number }>> {
    const map = new Map<string, { productCount: number; stockMovementCount: number }>();
    if (ids.length === 0) return map;

    const products = await this.prisma.client.product.groupBy({
      by: ['defaultWarehouseId'],
      where: { tenantId, isDeleted: false, defaultWarehouseId: { in: ids } },
      _count: { _all: true },
    });
    const movements = await this.prisma.client.stockMovement.groupBy({
      by: ['warehouseId'],
      where: { tenantId, isDeleted: false, warehouseId: { in: ids } },
      _count: { _all: true },
    });
    for (const id of ids) {
      map.set(id, {
        productCount: products.find((p) => p.defaultWarehouseId === id)?._count._all ?? 0,
        stockMovementCount: movements.find((m) => m.warehouseId === id)?._count._all ?? 0,
      });
    }
    return map;
  }

  private toDto(w: {
    id: string;
    tenantId: string;
    code: string;
    name: string;
    status: 'ACTIVE' | 'PASSIVE';
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
      id: w.id,
      tenantId: w.tenantId,
      code: w.code,
      name: w.name,
      status: w.status,
      address: w.address,
      city: w.city,
      manager: w.manager,
      phone: w.phone,
      isDefault: w.isDefault,
      notes: w.notes,
      isActive: w.isActive,
      isDeleted: w.isDeleted,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
    };
  }
}
