import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import type { PaginatedResponse, RiskLevel } from '@saas/shared';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== AUDIT LOGS ====================

  async listAuditLogs(params: {
    tenantId?: string | null; // null = süper admin (tüm tenant'lar)
    page: number;
    pageSize: number;
    module?: string;
    action?: string;
    riskLevel?: RiskLevel;
    userId?: string;
    entityType?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<PaginatedResponse<any>> {
    const where: Record<string, unknown> = {};
    if (params.tenantId !== undefined) where.tenantId = params.tenantId;
    if (params.module) where.module = params.module;
    if (params.action) where.action = params.action;
    if (params.riskLevel) where.riskLevel = params.riskLevel;
    if (params.userId) where.userId = params.userId;
    if (params.entityType) where.entityType = params.entityType;
    if (params.entityId) where.entityId = params.entityId;
    if (params.startDate || params.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (params.startDate) dateFilter.gte = params.startDate;
      if (params.endDate) dateFilter.lte = params.endDate;
      where.createdAt = dateFilter;
    }

    const [data, total] = await Promise.all([
      this.prisma.client.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: {
          user: { select: { id: true, email: true, fullName: true } },
          tenant: { select: { id: true, code: true, name: true } },
        },
      }),
      this.prisma.client.auditLog.count({ where }),
    ]);

    return {
      data: data.map((l) => ({
        id: l.id,
        tenantId: l.tenantId,
        tenant: l.tenant,
        userId: l.userId,
        user: l.user,
        module: l.module,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        oldValues: l.oldValues,
        newValues: l.newValues,
        changedFields: l.changedFields,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        requestId: l.requestId,
        riskLevel: l.riskLevel,
        createdAt: l.createdAt.toISOString(),
      })),
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.ceil(total / params.pageSize),
        hasNext: params.page * params.pageSize < total,
        hasPrev: params.page > 1,
      },
    };
  }

  async getAuditLogStats(tenantId?: string | null) {
    const where: Record<string, unknown> = {};
    if (tenantId !== undefined) where.tenantId = tenantId;
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    where.createdAt = { gte: since24h };

    const [total, critical, high] = await Promise.all([
      this.prisma.client.auditLog.count({ where }),
      this.prisma.client.auditLog.count({ where: { ...where, riskLevel: 'CRITICAL' } }),
      this.prisma.client.auditLog.count({ where: { ...where, riskLevel: 'HIGH' } }),
    ]);
    return { last24h: total, critical, high };
  }

  // ==================== ERROR LOGS ====================

  async listErrorLogs(params: {
    tenantId?: string | null;
    page: number;
    pageSize: number;
    level?: string;
    path?: string;
    statusCode?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<PaginatedResponse<any>> {
    const where: Record<string, unknown> = {};
    if (params.tenantId !== undefined) where.tenantId = params.tenantId;
    if (params.level) where.level = params.level;
    if (params.path) where.path = { contains: params.path, mode: 'insensitive' };
    if (params.statusCode) where.statusCode = params.statusCode;
    if (params.startDate || params.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (params.startDate) dateFilter.gte = params.startDate;
      if (params.endDate) dateFilter.lte = params.endDate;
      where.createdAt = dateFilter;
    }

    const [data, total] = await Promise.all([
      this.prisma.client.errorLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.client.errorLog.count({ where }),
    ]);

    return {
      data: data.map((e) => ({
        id: e.id,
        tenantId: e.tenantId,
        userId: e.userId,
        level: e.level,
        message: e.message,
        path: e.path,
        method: e.method,
        statusCode: e.statusCode,
        requestId: e.requestId,
        createdAt: e.createdAt.toISOString(),
      })),
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.ceil(total / params.pageSize),
        hasNext: params.page * params.pageSize < total,
        hasPrev: params.page > 1,
      },
    };
  }

  // ==================== SECURITY LOGS ====================

  async listSecurityLogs(params: {
    tenantId?: string | null;
    page: number;
    pageSize: number;
    event?: string;
    riskLevel?: RiskLevel;
    userId?: string;
    ipAddress?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<PaginatedResponse<any>> {
    const where: Record<string, unknown> = {};
    if (params.tenantId !== undefined) where.tenantId = params.tenantId;
    if (params.event) where.event = params.event;
    if (params.riskLevel) where.riskLevel = params.riskLevel;
    if (params.userId) where.userId = params.userId;
    if (params.ipAddress) where.ipAddress = params.ipAddress;
    if (params.startDate || params.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (params.startDate) dateFilter.gte = params.startDate;
      if (params.endDate) dateFilter.lte = params.endDate;
      where.createdAt = dateFilter;
    }

    const [data, total] = await Promise.all([
      this.prisma.client.securityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: {
          user: { select: { id: true, email: true, fullName: true } },
        },
      }),
      this.prisma.client.securityLog.count({ where }),
    ]);

    return {
      data: data.map((s) => ({
        id: s.id,
        tenantId: s.tenantId,
        userId: s.userId,
        user: s.user,
        event: s.event,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        riskLevel: s.riskLevel,
        metadata: s.metadata,
        createdAt: s.createdAt.toISOString(),
      })),
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.ceil(total / params.pageSize),
        hasNext: params.page * params.pageSize < total,
        hasPrev: params.page > 1,
      },
    };
  }
}
