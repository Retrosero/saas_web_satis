import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import {
  DataCheckType,
  DataCheckSeverity,
  DataCheckRunStatus,
  DataCheckResultStatus,
  DataCheckFrequency,
  DataCheckRule,
  DataCheckRun,
  DataCheckResult,
  DataCheckSchedule,
  DataCheckActionLog,
  DataCheckStats,
} from '@saas/shared';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ===== KURALLAR =====
  async listRules(tenantId: string, filters: { checkType?: string; isActive?: boolean; severity?: string; search?: string }) {
    const where: any = { tenantId, isDeleted: false };
    if (filters.checkType) where.checkType = filters.checkType;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.severity) where.severity = filters.severity;
    if (filters.search) where.name = { contains: filters.search, mode: 'insensitive' };
    const rules = await this.prisma.client.dataCheckRule.findMany({ where, orderBy: [{ severity: 'desc' }, { name: 'asc' }] });
    return rules.map((r) => this.toRuleDto(r));
  }

  async getRule(tenantId: string, id: string): Promise<DataCheckRule> {
    const r = await this.prisma.client.dataCheckRule.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!r) throw new NotFoundException('Kural bulunamadı');
    return this.toRuleDto(r);
  }

  async createRule(tenantId: string, input: { name: string; description?: string; checkType: DataCheckType; severity?: DataCheckSeverity; isActive?: boolean; parameters?: any; query?: string; autoFixable?: boolean; notifyUsers?: string[] }, userId?: string): Promise<DataCheckRule> {
    if (!Object.values(DataCheckType).includes(input.checkType)) throw new BadRequestException('Geçersiz kontrol tipi');
    const r = await this.prisma.client.dataCheckRule.create({ data: { tenantId, name: input.name, description: input.description, checkType: input.checkType, severity: input.severity ?? DataCheckSeverity.MEDIUM, isActive: input.isActive ?? true, parameters: (input.parameters ?? {}) as any, query: input.query, autoFixable: input.autoFixable ?? false, notifyUsers: (input.notifyUsers ?? []) as any, createdById: userId } });
    return this.toRuleDto(r);
  }

  async updateRule(tenantId: string, id: string, input: any): Promise<DataCheckRule> {
    const r = await this.prisma.client.dataCheckRule.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!r) throw new NotFoundException('Kural bulunamadı');
    const data: any = {};
    ['name', 'description', 'checkType', 'severity', 'isActive', 'parameters', 'query', 'autoFixable', 'notifyUsers'].forEach((k) => { if (input[k] !== undefined) data[k] = input[k]; });
    const updated = await this.prisma.client.dataCheckRule.update({ where: { id }, data });
    return this.toRuleDto(updated);
  }

  async deleteRule(tenantId: string, id: string) {
    const r = await this.prisma.client.dataCheckRule.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!r) throw new NotFoundException('Kural bulunamadı');
    await this.prisma.client.dataCheckRule.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date(), isActive: false } });
  }

  async toggleRule(tenantId: string, id: string): Promise<DataCheckRule> {
    const r = await this.prisma.client.dataCheckRule.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!r) throw new NotFoundException('Kural bulunamadı');
    const updated = await this.prisma.client.dataCheckRule.update({ where: { id }, data: { isActive: !r.isActive } });
    return this.toRuleDto(updated);
  }

  async cloneRule(tenantId: string, id: string, userId?: string): Promise<DataCheckRule> {
    const orig = await this.getRule(tenantId, id);
    return this.createRule(tenantId, { name: `${orig.name} (kopya)`, description: orig.description, checkType: orig.checkType, severity: orig.severity, isActive: false, parameters: orig.parameters, query: orig.query, autoFixable: orig.autoFixable, notifyUsers: orig.notifyUsers }, userId);
  }

  // ===== ÇALIŞTIRMA =====
  async runRule(tenantId: string, ruleId: string, userId?: string): Promise<DataCheckRun> {
    const rule = await this.prisma.client.dataCheckRule.findFirst({ where: { id: ruleId, tenantId, isDeleted: false } });
    if (!rule) throw new NotFoundException('Kural bulunamadı');

    const run = await this.prisma.client.dataCheckRun.create({ data: { tenantId, ruleId, ruleName: rule.name, checkType: rule.checkType, status: DataCheckRunStatus.RUNNING, startedAt: new Date(), parameters: rule.parameters as any, triggeredBy: userId ?? 'MANUAL' } });

    const start = Date.now();
    let results: any[] = [];
    let errorCount = 0;
    let warning: string | undefined;

    try {
      results = await this.executeCheck(tenantId, (rule.checkType as any), rule.parameters as any);
    } catch (e: any) {
      this.logger.error(`Check ${rule.checkType} failed: ${e.message}`);
      errorCount = 1;
      warning = e.message;
    }

    const durationMs = Date.now() - start;
    const completedRun = await this.prisma.client.dataCheckRun.update({
      where: { id: run.id },
      data: { status: errorCount > 0 ? DataCheckRunStatus.FAILED : DataCheckRunStatus.COMPLETED, completedAt: new Date(), durationMs, resultCount: results.length, errorCount, warning, summary: { severity: rule.severity, runAt: new Date().toISOString() } as any },
    });

    // Sonuçları kaydet
    for (const r of results) {
      await this.prisma.client.dataCheckResult.create({ data: { ...r, tenantId, ruleId, runId: run.id, checkType: rule.checkType, severity: rule.severity, status: DataCheckResultStatus.OPEN, createdAt: new Date(), updatedAt: new Date() } });
    }

    await this.prisma.client.dataCheckRule.update({ where: { id: ruleId }, data: { lastRunAt: new Date(), runCount: { increment: 1 }, lastResultCount: results.length } });
    return this.toRunDto(completedRun);
  }

  private async executeCheck(tenantId: string, checkType: DataCheckType, params: any): Promise<any[]> {
    const results: any[] = [];
    switch (checkType) {
      case DataCheckType.MISSING_PRODUCT_BARCODE: {
        const ps = await this.prisma.client.product.findMany({ where: { tenantId, isDeleted: false, OR: [{ primaryBarcode: null }, { primaryBarcode: '' }] }, take: 500 });
        for (const p of ps) results.push({ entityType: 'Product', entityId: p.id, entityLabel: `${p.code} - ${p.name}`, entityNumber: p.code, description: 'Ürünün barkod bilgisi eksik', details: { productCode: p.code, productName: p.name }, suggestedFix: 'Ürün kartına barkod ekleyin' });
        break;
      }
      case DataCheckType.NEGATIVE_STOCK: {
        const stocks = await this.prisma.client.stockMovement.findMany({ where: { tenantId, quantity: { lt: 0 } }, include: { product: true, warehouse: true }, take: 500 });
        for (const s of stocks) results.push({ entityType: 'Stock', entityId: s.id, entityLabel: `${(s.product as any)?.code} - ${(s.product as any)?.name} (${(s.warehouse as any)?.name})`, description: `Negatif stok: ${s.quantity}`, details: { productId: s.productId, warehouseId: s.warehouseId, quantity: s.quantity, minStock: (s.product as any)?.minStockLevel }, suggestedFix: 'Stok hareketlerini kontrol edin veya iade alın' });
        break;
      }
      case DataCheckType.CUSTOMER_NO_CONTACT: {
        const customers = await this.prisma.client.customer.findMany({ where: { tenantId, isDeleted: false, OR: [{ email: null }, { email: '' }, { phone: null }, { phone: '' }] }, take: 500 });
        for (const c of customers) results.push({ entityType: 'Customer', entityId: c.id, entityLabel: `${c.code} - ${c.name}`, entityNumber: c.code, description: 'Cari hesabın telefon veya e-posta bilgisi yok', details: { customerCode: c.code, customerName: c.name, hasEmail: !!c.email, hasPhone: !!c.phone }, suggestedFix: 'Cari kartına iletişim bilgisi ekleyin' });
        break;
      }
      case DataCheckType.INACTIVE_PRODUCT_SOLD: {
        const sales = await this.prisma.client.saleItem.findMany({ where: { sale: { tenantId, status: { in: ['CONFIRMED', 'PAID', 'PARTIALLY_PAID', 'SHIPPED', 'DELIVERED', 'PARTIALLY_SHIPPED'] } as any }, product: { status: 'PASSIVE' as any } }, include: { product: true, sale: true }, take: 200 });
        for (const s of sales) results.push({ entityType: 'Sale', entityId: s.saleId, entityLabel: `${(s.sale as any).saleNumber} - ${(s.product as any).name}`, entityNumber: (s.sale as any).saleNumber, description: 'Pasif ürün satışı yapılmış', details: { productId: s.productId, saleId: s.saleId, quantity: s.quantity }, suggestedFix: 'Ürünü aktif edin veya satışı iptal edin' });
        break;
      }
      case DataCheckType.INACTIVE_CUSTOMER_SALE: {
        const sales = await this.prisma.client.sale.findMany({ where: { tenantId, status: { in: ['CONFIRMED', 'PAID', 'PARTIALLY_PAID', 'SHIPPED', 'DELIVERED', 'PARTIALLY_SHIPPED'] } as any, customer: { status: 'PASSIVE' as any } }, include: { customer: true }, take: 200 });
        for (const s of sales) results.push({ entityType: 'Sale', entityId: s.id, entityLabel: `${s.saleNumber} - ${(s.customer as any).name}`, entityNumber: s.saleNumber, description: 'Pasif cariye satış yapılmış', details: { customerId: s.customerId, saleId: s.id, grandTotal: s.grandTotal }, suggestedFix: 'Carinin aktiflik durumunu kontrol edin' });
        break;
      }
      case DataCheckType.EMAIL_INVALID: {
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const users = await this.prisma.client.user.findMany({ where: { tenantId, isDeleted: false }, take: 500 });
        for (const u of users) if (u.email && !emailRe.test(u.email)) results.push({ entityType: 'User', entityId: u.id, entityLabel: u.fullName, description: `Geçersiz e-posta: ${u.email}`, details: { email: u.email }, suggestedFix: 'Kullanıcının e-posta adresini düzeltin' });
        break;
      }
      case DataCheckType.PHONE_INVALID: {
        const phoneRe = /^[+]?[\d\s()-]{10,}$/;
        const customers = await this.prisma.client.customer.findMany({ where: { tenantId, isDeleted: false, NOT: { phone: null } }, take: 500 });
        for (const c of customers) if (c.phone && !phoneRe.test(c.phone)) results.push({ entityType: 'Customer', entityId: c.id, entityLabel: `${c.code} - ${c.name}`, description: `Geçersiz telefon: ${c.phone}`, details: { phone: c.phone }, suggestedFix: 'Telefon numarasını düzeltin' });
        break;
      }
      case DataCheckType.COLLECTION_OVERDUE: {
        const daysOverdue = params.daysOverdue ?? 30;
        const customers = await this.prisma.client.customer.findMany({ where: { tenantId, isDeleted: false }, take: 100 });
        for (const c of customers) {
          const balance = await this.getCustomerBalance(tenantId, c.id);
          if (balance > 0) {
            const oldest = await this.prisma.client.sale.findFirst({ where: { tenantId, customerId: c.id, status: { in: ['CONFIRMED', 'PAID', 'PARTIALLY_PAID', 'SHIPPED', 'DELIVERED', 'PARTIALLY_SHIPPED'] } as any }, orderBy: { saleDate: 'asc' } });
            if (oldest) {
              const days = Math.floor((Date.now() - oldest.saleDate.getTime()) / 86400_000);
              if (days >= daysOverdue) results.push({ entityType: 'Customer', entityId: c.id, entityLabel: `${c.code} - ${c.name}`, description: `${days} gündür ödenmemiş: ${balance} TRY`, details: { balance, days, oldestInvoice: oldest.saleNumber }, suggestedFix: 'Tahsilat yapın veya vadeyi uzatın' });
            }
          }
        }
        break;
      }
      case DataCheckType.STOCK_NO_WAREHOUSE: {
        const stocks = await this.prisma.client.stockMovement.findMany({ where: { tenantId, warehouseId: { not: '' } }, take: 200 });
        for (const s of stocks) results.push({ entityType: 'Stock', entityId: s.id, entityLabel: `Stok kaydı #${s.id}`, description: 'Stok kaydının deposu tanımsız', details: { productId: s.productId, quantity: s.quantity }, suggestedFix: 'Stok kaydına depo atayın' });
        break;
      }
      case DataCheckType.DUPLICATE_INVOICE_NUMBER: {
        const groups = await this.prisma.client.sale.groupBy({ by: ['saleNumber'], where: { tenantId }, _count: true, having: { saleNumber: { _count: { gt: 1 } } }, orderBy: { saleNumber: 'asc' }, take: 100 });
        for (const g of groups) {
          const sales = await this.prisma.client.sale.findMany({ where: { tenantId, saleNumber: g.saleNumber } });
          for (const s of sales) results.push({ entityType: 'Sale', entityId: s.id, entityLabel: s.saleNumber, entityNumber: s.saleNumber, description: `Mükerrer fatura numarası: ${g.saleNumber} (${g._count} adet)`, details: { saleNumber: g.saleNumber, count: g._count }, suggestedFix: 'Fatura numarasını benzersiz yapın' });
        }
        break;
      }
      case DataCheckType.DISCOUNT_OVER_LIMIT: {
        const maxPct = params.maxDiscount ?? 50;
        const items = await this.prisma.client.saleItem.findMany({ where: { sale: { tenantId, status: { in: ['CONFIRMED', 'PAID', 'PARTIALLY_PAID', 'SHIPPED', 'DELIVERED', 'PARTIALLY_SHIPPED'] } as any }, discountRate: { gt: maxPct } }, include: { sale: true, product: true } as any, take: 200 });
        for (const i of items) results.push({ entityType: 'Sale', entityId: i.saleId, entityLabel: `${(i.sale as any).saleNumber} - ${(i.product as any).name}`, description: `Limit üstü iskonto: %${i.discountPercent} (limit: %${maxPct})`, details: { discountRate: i.discountRate, maxAllowed: maxPct, saleId: i.saleId }, suggestedFix: 'İskonto limitini gözden geçirin' });
        break;
      }
      default: {
        // Desteklenmeyen tip — boş
        this.logger.warn(`Check type ${checkType} not yet implemented`);
      }
    }
    return results;
  }

  private async getCustomerBalance(tenantId: string, customerId: string): Promise<number> {
    const movements = await this.prisma.client.customerMovement.findMany({ where: { tenantId, customerId } });
    return movements.reduce((sum, m) => sum + Number(m.amount ?? 0), 0);
  }

  // ===== RUNS =====
  async listRuns(tenantId: string, filters: { ruleId?: string; status?: string; checkType?: string; page?: number; pageSize?: number }) {
    const where: any = { tenantId };
    if (filters.ruleId) where.ruleId = filters.ruleId;
    if (filters.status) where.status = filters.status;
    if (filters.checkType) where.checkType = filters.checkType;
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 30;
    const [items, total] = await Promise.all([
      this.prisma.client.dataCheckRun.findMany({ where, orderBy: { startedAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.client.dataCheckRun.count({ where }),
    ]);
    return { items: items.map((r) => this.toRunDto(r)), total, page, pageSize };
  }

  async getRun(tenantId: string, id: string): Promise<DataCheckRun> {
    const r = await this.prisma.client.dataCheckRun.findFirst({ where: { id, tenantId } });
    if (!r) throw new NotFoundException('Çalıştırma bulunamadı');
    return this.toRunDto(r);
  }

  async runAll(tenantId: string, userId?: string): Promise<{ runCount: number; results: DataCheckRun[] }> {
    const rules = await this.prisma.client.dataCheckRule.findMany({ where: { tenantId, isDeleted: false, isActive: true } });
    const results: DataCheckRun[] = [];
    for (const rule of rules) {
      const run = await this.runRule(tenantId, rule.id, userId);
      results.push(run);
    }
    return { runCount: results.length, results };
  }

  // ===== RESULTS =====
  async listResults(tenantId: string, filters: { ruleId?: string; checkType?: string; severity?: string; status?: string; entityType?: string; runId?: string; page?: number; pageSize?: number }) {
    const where: any = { tenantId };
    if (filters.ruleId) where.ruleId = filters.ruleId;
    if (filters.checkType) where.checkType = filters.checkType;
    if (filters.severity) where.severity = filters.severity;
    if (filters.status) where.status = filters.status;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.runId) where.runId = filters.runId;
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 30;
    const [items, total] = await Promise.all([
      this.prisma.client.dataCheckResult.findMany({ where, orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }], skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.client.dataCheckResult.count({ where }),
    ]);
    const enriched = await Promise.all(items.map(async (r) => {
      const rule = await this.prisma.client.dataCheckRule.findUnique({ where: { id: r.ruleId } });
      return this.toResultDto(r, rule?.name);
    }));
    return { items: enriched, total, page, pageSize };
  }

  async getResult(tenantId: string, id: string): Promise<DataCheckResult> {
    const r = await this.prisma.client.dataCheckResult.findFirst({ where: { id, tenantId } });
    if (!r) throw new NotFoundException('Bulgu bulunamadı');
    const rule = await this.prisma.client.dataCheckRule.findUnique({ where: { id: r.ruleId } });
    return this.toResultDto(r, rule?.name);
  }

  async acknowledgeResult(tenantId: string, id: string, userId: string) {
    const r = await this.prisma.client.dataCheckResult.findFirst({ where: { id, tenantId } });
    if (!r) throw new NotFoundException('Bulgu bulunamadı');
    const updated = await this.prisma.client.dataCheckResult.update({ where: { id }, data: { status: DataCheckResultStatus.ACKNOWLEDGED, acknowledgedAt: new Date(), acknowledgedById: userId } });
    await this.prisma.client.dataCheckActionLog.create({ data: { tenantId, resultId: id, actionType: 'ACKNOWLEDGED', actorId: userId } });
    return this.toResultDto(updated);
  }

  async fixResult(tenantId: string, id: string, userId: string, userName: string, note?: string) {
    const r = await this.prisma.client.dataCheckResult.findFirst({ where: { id, tenantId } });
    if (!r) throw new NotFoundException('Bulgu bulunamadı');
    const updated = await this.prisma.client.dataCheckResult.update({ where: { id }, data: { status: DataCheckResultStatus.FIXED, fixedAt: new Date(), fixedById: userId, fixedByName: userName, fixNote: note } });
    await this.prisma.client.dataCheckActionLog.create({ data: { tenantId, resultId: id, actionType: 'FIXED', actorId: userId, actorName: userName, note } });
    return this.toResultDto(updated);
  }

  async ignoreResult(tenantId: string, id: string, userId: string, reason: string) {
    if (!reason) throw new BadRequestException('Yok sayma sebebi zorunlu');
    const r = await this.prisma.client.dataCheckResult.findFirst({ where: { id, tenantId } });
    if (!r) throw new NotFoundException('Bulgu bulunamadı');
    const updated = await this.prisma.client.dataCheckResult.update({ where: { id }, data: { status: DataCheckResultStatus.IGNORED, ignoredAt: new Date(), ignoredById: userId, ignoreReason: reason } });
    await this.prisma.client.dataCheckActionLog.create({ data: { tenantId, resultId: id, actionType: 'IGNORED', actorId: userId, note: reason } });
    return this.toResultDto(updated);
  }

  async markFalsePositive(tenantId: string, id: string, userId: string, reason: string) {
    const r = await this.prisma.client.dataCheckResult.findFirst({ where: { id, tenantId } });
    if (!r) throw new NotFoundException('Bulgu bulunamadı');
    const updated = await this.prisma.client.dataCheckResult.update({ where: { id }, data: { status: DataCheckResultStatus.FALSE_POSITIVE, ignoredAt: new Date(), ignoredById: userId, ignoreReason: reason } });
    await this.prisma.client.dataCheckActionLog.create({ data: { tenantId, resultId: id, actionType: 'FALSE_POSITIVE', actorId: userId, note: reason } });
    return this.toResultDto(updated);
  }

  async bulkAction(tenantId: string, ids: string[], action: 'fix' | 'ignore' | 'acknowledge', userId: string, userName?: string, note?: string) {
    let count = 0;
    for (const id of ids) {
      try {
        if (action === 'fix') await this.fixResult(tenantId, id, userId, userName ?? '', note);
        else if (action === 'ignore') await this.ignoreResult(tenantId, id, userId, note ?? 'Toplu yok sayma');
        else await this.acknowledgeResult(tenantId, id, userId);
        count++;
      } catch (e) { this.logger.warn(`Bulk action failed for ${id}: ${e}`); }
    }
    return { count };
  }

  // ===== SCHEDULES =====
  async listSchedules(tenantId: string) {
    const items = await this.prisma.client.dataCheckSchedule.findMany({ where: { tenantId, isDeleted: false }, orderBy: { createdAt: 'desc' } });
    return items.map((s) => this.toScheduleDto(s));
  }

  async createSchedule(tenantId: string, input: { name: string; ruleIds: string[]; schedule: DataCheckFrequency; hour?: number; dayOfWeek?: number; dayOfMonth?: number; isActive?: boolean; notifyOnComplete?: boolean; notifyUserIds?: string[] }, userId?: string): Promise<DataCheckSchedule> {
    const s = await this.prisma.client.dataCheckSchedule.create({ data: { tenantId, name: input.name, ruleIds: (input.ruleIds ?? []) as any, schedule: input.schedule, hour: input.hour ?? 2, dayOfWeek: input.dayOfWeek, dayOfMonth: input.dayOfMonth, isActive: input.isActive ?? true, notifyOnComplete: input.notifyOnComplete ?? false, notifyUserIds: (input.notifyUserIds ?? []) as any, createdById: userId, nextRunAt: this.computeNextRun(input.schedule, input.hour ?? 2, input.dayOfWeek, input.dayOfMonth) } });
    return this.toScheduleDto(s);
  }

  async updateSchedule(tenantId: string, id: string, input: any): Promise<DataCheckSchedule> {
    const s = await this.prisma.client.dataCheckSchedule.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!s) throw new NotFoundException('Zamanlama bulunamadı');
    const data: any = {};
    ['name', 'ruleIds', 'schedule', 'hour', 'dayOfWeek', 'dayOfMonth', 'isActive', 'notifyOnComplete', 'notifyUserIds'].forEach((k) => { if (input[k] !== undefined) data[k] = input[k]; });
    if (input.schedule || input.hour !== undefined || input.dayOfWeek !== undefined || input.dayOfMonth !== undefined) {
      const sched = input.schedule ?? s.schedule;
      const hour = input.hour ?? s.hour;
      data.nextRunAt = this.computeNextRun(sched, hour, input.dayOfWeek ?? s.dayOfWeek, input.dayOfMonth ?? s.dayOfMonth);
    }
    const updated = await this.prisma.client.dataCheckSchedule.update({ where: { id }, data });
    return this.toScheduleDto(updated);
  }

  async deleteSchedule(tenantId: string, id: string) {
    const s = await this.prisma.client.dataCheckSchedule.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!s) throw new NotFoundException('Zamanlama bulunamadı');
    await this.prisma.client.dataCheckSchedule.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date(), isActive: false } });
  }

  private computeNextRun(schedule: DataCheckFrequency, hour: number, dayOfWeek?: number, dayOfMonth?: number): Date {
    const now = new Date();
    const next = new Date();
    next.setHours(hour, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    if (schedule === DataCheckFrequency.WEEKLY && dayOfWeek !== undefined && dayOfWeek !== null) {
      while (next.getDay() !== dayOfWeek) next.setDate(next.getDate() + 1);
    } else if (schedule === DataCheckFrequency.MONTHLY && dayOfMonth !== undefined && dayOfMonth !== null) {
      next.setDate(dayOfMonth);
      if (next <= now) next.setMonth(next.getMonth() + 1);
    }
    return next;
  }

  // ===== STATS =====
  async getStats(tenantId: string): Promise<DataCheckStats> {
    const where = { tenantId };
    const [total, byStatus, bySeverity, byCheckType, byEntityType, fixedResults] = await Promise.all([
      this.prisma.client.dataCheckResult.count({ where }),
      this.prisma.client.dataCheckResult.groupBy({ by: ['status'], where, _count: true }),
      this.prisma.client.dataCheckResult.groupBy({ by: ['severity'], where, _count: true }),
      this.prisma.client.dataCheckResult.groupBy({ by: ['checkType'], where, _count: true }),
      this.prisma.client.dataCheckResult.groupBy({ by: ['entityType'], where, _count: true }),
      this.prisma.client.dataCheckResult.findMany({ where: { ...where, status: DataCheckResultStatus.FIXED, fixedAt: { not: null } }, select: { createdAt: true, fixedAt: true } }),
    ]);
    const get = (s: string) => byStatus.find((b) => b.status === s)?._count ?? 0;
    const fixed = get(DataCheckResultStatus.FIXED);
    const fixRate = total > 0 ? fixed / total : 0;
    const avgMs = fixedResults.length > 0 ? fixedResults.reduce((s, r) => s + (r.fixedAt!.getTime() - r.createdAt.getTime()), 0) / fixedResults.length : undefined;
    return {
      total, open: get(DataCheckResultStatus.OPEN), acknowledged: get(DataCheckResultStatus.ACKNOWLEDGED), fixed, ignored: get(DataCheckResultStatus.IGNORED),
      bySeverity: bySeverity.map((b) => ({ severity: b.severity as any, count: b._count })),
      byCheckType: byCheckType.map((b) => ({ checkType: b.checkType as any, count: b._count })),
      byEntityType: byEntityType.map((b) => ({ entityType: b.entityType, count: b._count })),
      fixRate, avgFixTimeMs: avgMs,
    };
  }

  // ===== LOGS =====
  async listActionLogs(tenantId: string, filters: { resultId?: string; actionType?: string; page?: number; pageSize?: number }) {
    const where: any = { tenantId };
    if (filters.resultId) where.resultId = filters.resultId;
    if (filters.actionType) where.actionType = filters.actionType;
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 30;
    const [items, total] = await Promise.all([
      this.prisma.client.dataCheckActionLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.client.dataCheckActionLog.count({ where }),
    ]);
    return { items: items.map((l) => this.toLogDto(l)), total, page, pageSize };
  }

  // ===== DTOs =====
  private toRuleDto(r: any): DataCheckRule {
    return { id: r.id, tenantId: r.tenantId, name: r.name, description: r.description, checkType: r.checkType, severity: r.severity, isActive: r.isActive, parameters: r.parameters, query: r.query, autoFixable: r.autoFixable, notifyUsers: r.notifyUsers, lastRunAt: r.lastRunAt?.toISOString(), runCount: r.runCount, lastResultCount: r.lastResultCount, createdById: r.createdById, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() };
  }
  private toRunDto(r: any): DataCheckRun {
    return { id: r.id, tenantId: r.tenantId, ruleId: r.ruleId, ruleName: r.ruleName, checkType: r.checkType, status: r.status, startedAt: r.startedAt.toISOString(), completedAt: r.completedAt?.toISOString(), durationMs: r.durationMs, resultCount: r.resultCount, errorCount: r.errorCount, warning: r.warning, parameters: r.parameters, triggeredBy: r.triggeredBy, summary: r.summary, createdAt: r.createdAt.toISOString() };
  }
  private toResultDto(r: any, ruleName?: string): DataCheckResult {
    return { id: r.id, tenantId: r.tenantId, ruleId: r.ruleId, runId: r.runId, checkType: r.checkType, severity: r.severity, status: r.status, entityType: r.entityType, entityId: r.entityId, entityLabel: r.entityLabel, entityNumber: r.entityNumber, description: r.description, details: r.details, suggestedFix: r.suggestedFix, autoFixable: r.autoFixable, fixedAt: r.fixedAt?.toISOString(), fixedById: r.fixedById, fixedByName: r.fixedByName, fixNote: r.fixNote, acknowledgedAt: r.acknowledgedAt?.toISOString(), acknowledgedById: r.acknowledgedById, ignoredAt: r.ignoredAt?.toISOString(), ignoredById: r.ignoredById, ignoreReason: r.ignoreReason, metadata: r.metadata, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(), ruleName };
  }
  private toScheduleDto(s: any): DataCheckSchedule {
    return { id: s.id, tenantId: s.tenantId, name: s.name, ruleIds: s.ruleIds, schedule: s.schedule, hour: s.hour, dayOfWeek: s.dayOfWeek, dayOfMonth: s.dayOfMonth, isActive: s.isActive, lastRunAt: s.lastRunAt?.toISOString(), nextRunAt: s.nextRunAt?.toISOString(), notifyOnComplete: s.notifyOnComplete, notifyUserIds: s.notifyUserIds, createdById: s.createdById, createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString() };
  }
  private toLogDto(l: any): DataCheckActionLog {
    return { id: l.id, tenantId: l.tenantId, resultId: l.resultId, actionType: l.actionType, actorId: l.actorId, actorName: l.actorName, note: l.note, beforeState: l.beforeState, afterState: l.afterState, createdAt: l.createdAt.toISOString() };
  }
}
