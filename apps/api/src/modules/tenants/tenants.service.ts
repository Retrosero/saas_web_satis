import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import type { Tenant, PaginatedResponse, TenantStatus, WorkingMode } from '@saas/shared';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: TenantStatus;
  }): Promise<PaginatedResponse<Tenant>> {
    const { page, pageSize, search, status } = params;
    const where = {
      isDeleted: false,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { code: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.client.tenant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.client.tenant.count({ where }),
    ]);
    return {
      data: data.map(this.toDto),
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

  async findById(id: string): Promise<Tenant> {
    const t = await this.prisma.client.tenant.findUnique({ where: { id } });
    if (!t || t.isDeleted) throw new NotFoundException('Firma bulunamadı');
    return this.toDto(t);
  }

  async create(input: {
    code: string;
    name: string;
    workingMode?: WorkingMode;
    planId?: string;
  }): Promise<Tenant> {
    const t = await this.prisma.client.tenant.create({
      data: {
        code: input.code.toUpperCase(),
        name: input.name,
        workingMode: input.workingMode ?? 'SAAS_MASTER',
        status: 'TRIAL',
      },
    });
    return this.toDto(t);
  }

  async update(id: string, input: Partial<{ name: string; status: TenantStatus; workingMode: WorkingMode }>): Promise<Tenant> {
    const exists = await this.prisma.client.tenant.findUnique({ where: { id } });
    if (!exists || exists.isDeleted) throw new NotFoundException('Firma bulunamadı');
    const t = await this.prisma.client.tenant.update({
      where: { id },
      data: input,
    });
    return this.toDto(t);
  }

  private toDto(t: {
    id: string;
    code: string;
    name: string;
    workingMode: 'SAAS_MASTER' | 'ERP_MASTER';
    status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'PENDING' | 'CANCELLED';
    createdAt: Date;
    updatedAt: Date;
  }): Tenant {
    return {
      id: t.id,
      code: t.code,
      name: t.name,
      workingMode: t.workingMode,
      status: t.status,
      planId: null,
      subscriptionId: null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }
}
