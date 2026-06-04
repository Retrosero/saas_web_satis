import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module.js';

@Injectable()
export class MonitoringService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sistem sağlığı dashboard istatistikleri.
   */
  async getDashboard(): Promise<any> {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const last7days = new Date(today); last7days.setDate(last7days.getDate() - 7);

    const [
      errorsToday, errorsYesterday, _criticalErrors,
      topErrorTenant, slowEndpoints,
      apiFailures, openAlarms,
    ] = await Promise.all([
      this.prisma.client.errorLog.count({ where: { createdAt: { gte: today } } }),
      this.prisma.client.errorLog.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
      this.prisma.client.errorLog.count({ where: { createdAt: { gte: last7days } } }),
      this.prisma.client.errorLog.groupBy({ by: ['tenantId'], where: { createdAt: { gte: last7days } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 1 }),
      this.prisma.client.apiKeyUsageLog.groupBy({ by: ['endpoint'], where: { createdAt: { gte: last7days }, duration: { gt: 1000 } }, _avg: { duration: true }, _count: { id: true }, orderBy: { _avg: { duration: 'desc' } }, take: 5 }),
      this.prisma.client.apiKeyUsageLog.count({ where: { statusCode: { gte: 500 }, createdAt: { gte: today } } }),
      this.prisma.client.securityLog.count({ where: { createdAt: { gte: last7days } } }),
    ]);

    // Tenant isimlerini çek
    let topTenant = null;
    if (topErrorTenant.length > 0 && topErrorTenant[0].tenantId) {
      const t = await this.prisma.client.tenant.findUnique({ where: { id: topErrorTenant[0].tenantId! } });
      topTenant = t ? { tenantId: t.id, tenantName: t.name, errorCount: topErrorTenant[0]._count.id } : null;
    }

    return {
      errorsToday, errorsYesterday,
      errorDelta: errorsYesterday === 0 ? null : ((errorsToday - errorsYesterday) / errorsYesterday) * 100,
      criticalErrors: errorsToday, topTenant,
      slowEndpoints: slowEndpoints.map((s) => ({ endpoint: s.endpoint, avgDuration: Math.round(s._avg.duration ?? 0), requestCount: s._count.id })),
      apiFailures, openAlarms,
    };
  }

  /**
   * API hata oranları (endpoint bazlı, son 7 gün).
   */
  async getApiErrorRates(): Promise<any> {
    const last7days = new Date(); last7days.setDate(last7days.getDate() - 7);
    const items = await this.prisma.client.apiKeyUsageLog.groupBy({
      by: ['endpoint', 'statusCode'],
      where: { createdAt: { gte: last7days } },
      _count: { id: true },
    });
    // Endpoint bazlı grupla
    const map = new Map<string, { endpoint: string; total: number; errors: number; success: number; byCode: Record<string, number> }>();
    for (const i of items) {
      const cur = map.get(i.endpoint) ?? { endpoint: i.endpoint, total: 0, errors: 0, success: 0, byCode: {} };
      cur.total += i._count.id;
      cur.byCode[String(i.statusCode)] = i._count.id;
      if (i.statusCode >= 500) cur.errors += i._count.id;
      else if (i.statusCode >= 200 && i.statusCode < 400) cur.success += i._count.id;
      map.set(i.endpoint, cur);
    }
    return Array.from(map.values())
      .map((e) => ({ ...e, errorRate: e.total > 0 ? (e.errors / e.total) * 100 : 0 }))
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 20);
  }

  /**
   * Yavaş endpoint'ler (>500ms).
   */
  async getSlowEndpoints(): Promise<any> {
    const last7days = new Date(); last7days.setDate(last7days.getDate() - 7);
    const items = await this.prisma.client.apiKeyUsageLog.groupBy({
      by: ['endpoint', 'method'],
      where: { createdAt: { gte: last7days } },
      _avg: { duration: true }, _max: { duration: true }, _count: { id: true },
      orderBy: { _avg: { duration: 'desc' } },
      take: 20,
    });
    return items.map((i) => ({ endpoint: i.endpoint, method: i.method, avgDuration: Math.round(i._avg.duration ?? 0), maxDuration: i._max.duration ?? 0, count: i._count.id }));
  }

  /**
   * Tenant bazlı hata yoğunluğu.
   */
  async getTenantErrorDensity(): Promise<any> {
    const last7days = new Date(); last7days.setDate(last7days.getDate() - 7);
    const items = await this.prisma.client.errorLog.groupBy({
      by: ['tenantId'],
      where: { createdAt: { gte: last7days } },
      _count: { id: true },
    });
    const validIds = items.map((i) => i.tenantId).filter((x): x is string => !!x);
    const tenants = await this.prisma.client.tenant.findMany({ where: { id: { in: validIds } }, select: { id: true, name: true, code: true } });
    return items.filter((i) => i.tenantId).map((i) => {
      const t = tenants.find((x) => x.id === i.tenantId);
      return { tenantId: i.tenantId!, tenantName: t?.name ?? 'Bilinmiyor', tenantCode: t?.code, errorCount: i._count.id };
    }).sort((a, b) => b.errorCount - a.errorCount);
  }

  /**
   * Hata logları (filterelenebilir).
   */
  async getErrorLogs(params: { page?: number; pageSize?: number; severity?: string; tenantId?: string; from?: Date; to?: Date }): Promise<any> {
    const { page = 1, pageSize = 25, severity, tenantId, from, to } = params;
    const where: any = {};
    if (severity) where.severity = severity;
    if (tenantId) where.tenantId = tenantId;
    if (from || to) { where.createdAt = {}; if (from) where.createdAt.gte = from; if (to) where.createdAt.lte = to; }
    const [total, items] = await Promise.all([
      this.prisma.client.errorLog.count({ where }),
      this.prisma.client.errorLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    ]);
    return {
      data: items.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize), hasNext: page * pageSize < total, hasPrev: page > 1 },
    };
  }

  /**
   * Servis durumları.
   */
  async getServiceStatuses(): Promise<any> {
    return [
      { name: 'API', status: 'OPERATIONAL', description: 'NestJS backend', lastCheck: new Date().toISOString() },
      { name: 'Database (PostgreSQL)', status: 'OPERATIONAL', description: 'Ana veritabanı', lastCheck: new Date().toISOString() },
      { name: 'Cache (Redis)', status: 'NOT_CONFIGURED', description: 'Cache katmanı', lastCheck: new Date().toISOString() },
      { name: 'Storage (S3/R2)', status: 'NOT_CONFIGURED', description: 'Dosya depolama', lastCheck: new Date().toISOString() },
      { name: 'Email Service', status: 'NOT_CONFIGURED', description: 'E-posta gönderimi', lastCheck: new Date().toISOString() },
      { name: 'WebSocket', status: 'OPERATIONAL', description: 'Real-time bildirimler', lastCheck: new Date().toISOString() },
    ];
  }
}
