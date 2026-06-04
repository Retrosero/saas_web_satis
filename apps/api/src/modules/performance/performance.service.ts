import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import { TargetType, TargetStatus, TargetPeriod, CommissionType } from '@saas/shared';

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ===== TARGETS =====
  async listTargets(tenantId: string, filters: { type?: TargetType; status?: TargetStatus; assigneeId?: string; from?: string; to?: string; page?: number; pageSize?: number }) {
    const where: any = { tenantId, isDeleted: false };
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.from || filters.to) {
      where.startDate = {};
      if (filters.from) where.startDate.gte = new Date(filters.from);
      if (filters.to) where.startDate.lte = new Date(filters.to);
    }
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const [items, total] = await Promise.all([
      this.prisma.client.performanceTarget.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.client.performanceTarget.count({ where }),
    ]);
    return { items: items.map((t) => this.toTargetDto(t)), total, page, pageSize };
  }

  async getTarget(tenantId: string, id: string) {
    const t = await this.prisma.client.performanceTarget.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!t) throw new NotFoundException('Hedef bulunamadı');
    return this.toTargetDto(t);
  }

  async createTarget(tenantId: string, input: any, userId: string) {
    const t = await this.prisma.client.performanceTarget.create({ data: { tenantId, name: input.name, description: input.description, type: input.type, period: input.period ?? TargetPeriod.MONTHLY, startDate: new Date(input.startDate), endDate: new Date(input.endDate), assigneeType: input.assigneeType, assigneeId: input.assigneeId, assigneeName: input.assigneeName, targetValue: input.targetValue, currency: input.currency ?? 'TRY', tiers: (input.tiers ?? []) as any, filters: (input.filters ?? {}) as any, createdById: userId } });
    await this.snapshotTarget(t.id);
    return this.toTargetDto(t);
  }

  async updateTarget(tenantId: string, id: string, input: any) {
    const t = await this.prisma.client.performanceTarget.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!t) throw new NotFoundException('Hedef bulunamadı');
    const data: any = { ...input };
    if (input.startDate) data.startDate = new Date(input.startDate);
    if (input.endDate) data.endDate = new Date(input.endDate);
    delete data.tenantId; delete data.id;
    const updated = await this.prisma.client.performanceTarget.update({ where: { id }, data });
    return this.toTargetDto(updated);
  }

  async deleteTarget(tenantId: string, id: string) {
    await this.prisma.client.performanceTarget.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
  }

  /**
   * Hedefi mevcut veriden hesapla (snapshot)
   */
  async snapshotTarget(targetId: string) {
    const t = await this.prisma.client.performanceTarget.findUnique({ where: { id: targetId } });
    if (!t) return;
    let achieved = 0;
    if (t.type === TargetType.SALES_AMOUNT || t.type === TargetType.COLLECTION) {
      const where: any = { tenantId: t.tenantId, saleDate: { gte: t.startDate, lte: t.endDate } };
      if (t.assigneeId) where.createdById = t.assigneeId;
      const agg = await this.prisma.client.sale.aggregate({ where, _sum: { grandTotal: true } });
      achieved = Number(agg._sum.grandTotal ?? 0);
    } else if (t.type === TargetType.SALES_COUNT) {
      const where: any = { tenantId: t.tenantId, saleDate: { gte: t.startDate, lte: t.endDate } };
      if (t.assigneeId) where.createdById = t.assigneeId;
      achieved = await this.prisma.client.sale.count({ where });
    } else if (t.type === TargetType.NEW_CUSTOMER) {
      const where: any = { tenantId: t.tenantId, createdAt: { gte: t.startDate, lte: t.endDate } };
      if (t.assigneeId) where.createdById = t.assigneeId;
      achieved = await this.prisma.client.customer.count({ where });
    } else if (t.type === TargetType.VISIT_COUNT) {
      const where: any = { tenantId: t.tenantId, planDate: { gte: t.startDate, lte: t.endDate } };
      if (t.assigneeId) where.salespersonId = t.assigneeId;
      const plans = await this.prisma.client.visitPlan.findMany({ where, include: { customers: true } });
      achieved = plans.reduce((sum, p) => sum + p.customers.filter((c) => c.status !== 'PLANNED' && c.status !== 'CANCELLED' && c.status !== 'COULDNT_MEET').length, 0);
    } else if (t.type === TargetType.ORDER_COUNT) {
      const where: any = { tenantId: t.tenantId, createdAt: { gte: t.startDate, lte: t.endDate } };
      if (t.assigneeId) where.createdById = t.assigneeId;
      achieved = await this.prisma.client.order.count({ where });
    }
    const rate = Number(t.targetValue) > 0 ? (achieved / Number(t.targetValue)) * 100 : 0;
    let status = t.status;
    const now = new Date();
    if (rate >= 100) status = TargetStatus.EXCEEDED;
    if (now > t.endDate) status = rate >= 100 ? TargetStatus.COMPLETED : TargetStatus.FAILED;
    await this.prisma.client.performanceTarget.update({ where: { id: targetId }, data: { achievedValue: achieved, achievementRate: rate, lastSnapshotAt: new Date(), status } });
    if (t.assigneeId) {
      await this.prisma.client.performanceSnapshot.create({ data: { tenantId: t.tenantId, targetId, userId: t.assigneeId, date: new Date(), achievedValue: achieved, targetValue: Number(t.targetValue), achievementRate: rate, metadata: { period: t.period } as any } });
    }
  }

  async snapshotAllActive(tenantId: string) {
    const targets = await this.prisma.client.performanceTarget.findMany({ where: { tenantId, isDeleted: false, status: TargetStatus.ACTIVE } });
    for (const t of targets) await this.snapshotTarget(t.id);
    return { updated: targets.length };
  }

  // ===== Performance =====
  async getPerformanceDashboard(tenantId: string, from?: string, to?: string) {
    const fromD = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const toD = to ? new Date(to) : new Date();
    const targets = await this.prisma.client.performanceTarget.findMany({ where: { tenantId, isDeleted: false, startDate: { gte: fromD }, endDate: { lte: toD } } });
    const total = targets.length;
    const active = targets.filter((t) => t.status === TargetStatus.ACTIVE).length;
    const completed = targets.filter((t) => t.status === TargetStatus.COMPLETED || t.status === TargetStatus.EXCEEDED).length;
    const failed = targets.filter((t) => t.status === TargetStatus.FAILED).length;
    const avgAchievement = targets.length > 0 ? targets.reduce((s, t) => s + t.achievementRate, 0) / targets.length : 0;
    return { total, active, completed, failed, avgAchievement, byType: {} };
  }

  async getUserPerformance(tenantId: string, userId: string, days = 30) {
    const since = new Date(); since.setDate(since.getDate() - days);
    const [salesAgg, visitPlans, collectionAgg, targets] = await Promise.all([
      this.prisma.client.sale.aggregate({ where: { tenantId, createdById: userId, saleDate: { gte: since } }, _sum: { grandTotal: true }, _count: true }),
      this.prisma.client.visitPlan.findMany({ where: { tenantId, salespersonId: userId, planDate: { gte: since } }, include: { customers: true } }),
      this.prisma.client.collection.aggregate({ where: { tenantId, createdById: userId, collectionDate: { gte: since } }, _sum: { amount: true } }),
      this.prisma.client.performanceTarget.findMany({ where: { tenantId, assigneeId: userId, isDeleted: false } }),
    ]);
    const visitCount = visitPlans.reduce((s, p) => s + p.customers.filter((c) => c.status !== 'PLANNED' && c.status !== 'CANCELLED').length, 0);
    return { totalSales: Number(salesAgg._sum.grandTotal ?? 0), salesCount: salesAgg._count, totalCollections: Number(collectionAgg._sum.amount ?? 0), visitCount, planCount: visitPlans.length, activeTargets: targets.length, targetProgress: targets.map((t) => ({ name: t.name, type: t.type, achievement: t.achievementRate, status: t.status })) };
  }

  // ===== Commission =====
  async listCommissionRules(tenantId: string) {
    return this.prisma.client.commissionRule.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async getCommissionRule(tenantId: string, id: string) {
    const r = await this.prisma.client.commissionRule.findFirst({ where: { id, tenantId } });
    if (!r) throw new NotFoundException('Prim kuralı bulunamadı');
    return r;
  }

  async createCommissionRule(tenantId: string, input: any, userId: string) {
    return this.prisma.client.commissionRule.create({ data: { tenantId, name: input.name, description: input.description, targetType: input.targetType, minAchievementRate: input.minAchievementRate ?? 100, commissionType: input.commissionType, config: input.config ?? {}, maxAmount: input.maxAmount, minAmount: input.minAmount, effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : null, effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null, createdById: userId } });
  }

  async updateCommissionRule(tenantId: string, id: string, input: any) {
    const data: any = { ...input };
    if (input.effectiveFrom) data.effectiveFrom = new Date(input.effectiveFrom);
    if (input.effectiveTo) data.effectiveTo = new Date(input.effectiveTo);
    delete data.tenantId; delete data.id;
    return this.prisma.client.commissionRule.update({ where: { id }, data });
  }

  async deleteCommissionRule(tenantId: string, id: string) {
    await this.prisma.client.commissionRule.delete({ where: { id } });
  }

  /**
   * Prim hesapla — kullanıcının dönem performansına göre
   */
  async calculateCommission(tenantId: string, input: { userId: string; userName?: string; ruleId: string; period: string; targetId?: string }, userId: string) {
    const rule = await this.getCommissionRule(tenantId, input.ruleId);
    const target = input.targetId ? await this.prisma.client.performanceTarget.findFirst({ where: { id: input.targetId, tenantId } }) : null;
    if (!target) throw new BadRequestException('Hedef bulunamadı');
    const achieved = Number(target.achievedValue);
    const targetVal = Number(target.targetValue);
    const baseAmount = target.type === TargetType.SALES_AMOUNT || target.type === TargetType.COLLECTION ? achieved : 0;
    const rate = targetVal > 0 ? (achieved / targetVal) * 100 : 0;
    if (rate < rule.minAchievementRate) {
      const log = await this.prisma.client.commissionCalculationLog.create({ data: { tenantId, ruleId: rule.id, userId: input.userId, userName: input.userName, period: input.period, targetId: input.targetId, achievedValue: achieved, achievementRate: rate, baseAmount, calculatedAmount: 0, finalAmount: 0, status: 'PENDING', notes: `${rule.minAchievementRate}% eşiği sağlanmadı (${rate.toFixed(1)}%)` } });
      return { log, calculated: false, reason: `Eşik: ${rule.minAchievementRate}%, Mevcut: ${rate.toFixed(1)}%` };
    }
    let calculated = 0;
    const config = rule.config as any;
    if (rule.commissionType === CommissionType.PERCENTAGE) {
      calculated = baseAmount * (config.rate ?? 0);
    } else if (rule.commissionType === CommissionType.FIXED) {
      calculated = config.amount ?? 0;
    } else if (rule.commissionType === CommissionType.TIERED) {
      const tiers = config.tiers ?? [];
      let matchedTier = tiers[0];
      for (const t of tiers) if (rate >= (t.minRate ?? 0)) matchedTier = t;
      if (matchedTier?.type === 'PERCENT') calculated = baseAmount * (matchedTier.value ?? 0);
      else if (matchedTier?.type === 'FIXED') calculated = matchedTier.value ?? 0;
    } else if (rule.commissionType === CommissionType.BONUS) {
      if (rate >= (config.triggerRate ?? 0)) calculated = config.amount ?? 0;
    }
    if (rule.maxAmount && calculated > Number(rule.maxAmount)) calculated = Number(rule.maxAmount);
    if (rule.minAmount && calculated < Number(rule.minAmount)) calculated = 0;
    const log = await this.prisma.client.commissionCalculationLog.create({ data: { tenantId, ruleId: rule.id, userId: input.userId, userName: input.userName, period: input.period, targetId: input.targetId, achievedValue: achieved, achievementRate: rate, baseAmount, calculatedAmount: calculated, finalAmount: calculated, status: 'PENDING' } });
    return { log, calculated: true, calculatedAmount: calculated, baseAmount, rate };
  }

  async listCommissionLogs(tenantId: string, filters: { userId?: string; status?: string; period?: string; page?: number; pageSize?: number }) {
    const where: any = { tenantId };
    if (filters.userId) where.userId = filters.userId;
    if (filters.status) where.status = filters.status;
    if (filters.period) where.period = filters.period;
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 30;
    const [items, total] = await Promise.all([
      this.prisma.client.commissionCalculationLog.findMany({ where, orderBy: { calculatedAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.client.commissionCalculationLog.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async updateCommissionStatus(tenantId: string, id: string, status: 'APPROVED' | 'PAID' | 'REJECTED', userId: string, notes?: string) {
    const data: any = { status };
    if (status === 'APPROVED') data.approvedAt = new Date(), data.approvedById = userId;
    if (status === 'PAID') data.paidAt = new Date();
    if (notes) data.notes = notes;
    return this.prisma.client.commissionCalculationLog.update({ where: { id }, data });
  }

  private toTargetDto(t: any) {
    return { id: t.id, tenantId: t.tenantId, name: t.name, description: t.description, type: t.type, period: t.period, startDate: t.startDate.toISOString(), endDate: t.endDate.toISOString(), assigneeType: t.assigneeType, assigneeId: t.assigneeId, assigneeName: t.assigneeName, targetValue: Number(t.targetValue), currency: t.currency, tiers: t.tiers, filters: t.filters, status: t.status, achievedValue: Number(t.achievedValue), achievementRate: t.achievementRate, lastSnapshotAt: t.lastSnapshotAt?.toISOString(), createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
  }
}
