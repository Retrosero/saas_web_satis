import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import { CustomerRiskLevel } from '@saas/shared';

@Injectable()
export class CustomerRiskService {
  constructor(private readonly prisma: PrismaService) {}

  async computeForCustomer(tenantId: string, customerId: string) {
    const customer = await this.prisma.client.customer.findFirst({ where: { id: customerId, tenantId } });
    if (!customer) return null;
    const config = await this.prisma.client.customerRiskConfig.findFirst({ where: { tenantId, isActive: true, isDefault: true } }) ?? await this.prisma.client.customerRiskConfig.findFirst({ where: { tenantId, isActive: true } });
    const cfg = config ?? { balanceWarning: 10000, balanceCritical: 50000, overdue30Warn: 5000, overdue60Warn: 10000, overdue90Crit: 20000, daysSinceOrderWarn: 60, daysSinceOrderCrit: 120, daysSincePaymentWarn: 45, daysSincePaymentCrit: 90 };
    const movements = await this.prisma.client.customerMovement.findMany({ where: { tenantId, customerId } });
    const balance = movements.reduce((s, m) => s + Number(m.amount ?? 0), 0);
    const lastOrder = await this.prisma.client.sale.findFirst({ where: { tenantId, customerId, status: { in: ['CONFIRMED', 'PARTIALLY_PAID', 'SHIPPED', 'DELIVERED'] } }, orderBy: { saleDate: 'desc' } });
    const lastCollection = await this.prisma.client.collection.findFirst({ where: { tenantId, customerId }, orderBy: { collectionDate: 'desc' } });
    const daysSinceOrder = lastOrder ? Math.floor((Date.now() - lastOrder.saleDate.getTime()) / 86400_000) : null;
    const daysSincePayment = lastCollection ? Math.floor((Date.now() - lastCollection.collectionDate.getTime()) / 86400_000) : null;
    const reasons: any[] = []; let riskScore = 0;
    if (balance > Number(cfg.balanceCritical)) { reasons.push({ factor: 'BALANCE_CRITICAL', weight: 40, message: `Bakiye kritik seviyede: ${balance.toLocaleString('tr-TR')} TRY` }); riskScore += 40; }
    else if (balance > Number(cfg.balanceWarning)) { reasons.push({ factor: 'BALANCE_WARNING', weight: 20, message: `Bakiye yüksek: ${balance.toLocaleString('tr-TR')} TRY` }); riskScore += 20; }
    if (daysSinceOrder !== null && daysSinceOrder > Number(cfg.daysSinceOrderCrit)) { reasons.push({ factor: 'DAYS_ORDER_CRIT', weight: 30, message: `${daysSinceOrder} gündür sipariş yok` }); riskScore += 30; }
    else if (daysSinceOrder !== null && daysSinceOrder > Number(cfg.daysSinceOrderWarn)) { reasons.push({ factor: 'DAYS_ORDER_WARN', weight: 15, message: `${daysSinceOrder} gündür sipariş yok` }); riskScore += 15; }
    if (daysSincePayment !== null && daysSincePayment > Number(cfg.daysSincePaymentCrit)) { reasons.push({ factor: 'DAYS_PAYMENT_CRIT', weight: 30, message: `${daysSincePayment} gündür ödeme yok` }); riskScore += 30; }
    let level = CustomerRiskLevel.LOW;
    if (riskScore >= 70) level = CustomerRiskLevel.CRITICAL;
    else if (riskScore >= 40) level = CustomerRiskLevel.HIGH;
    else if (riskScore >= 20) level = CustomerRiskLevel.MEDIUM;
    return { tenantId, customerId, customerName: customer.name, riskLevel: level, balance, overdue30: 0, overdue60: 0, overdue90: 0, daysSinceOrder, daysSincePayment, riskScore, reasons, snapshotAt: new Date() };
  }

  async refreshAll(tenantId: string) {
    const customers = await this.prisma.client.customer.findMany({ where: { tenantId, isDeleted: false } });
    let low = 0, medium = 0, high = 0, critical = 0;
    for (const c of customers) {
      const snap = await this.computeForCustomer(tenantId, c.id);
      if (snap) {
        await this.prisma.client.customerRiskSnapshot.upsert({ where: { id: 'pending' }, create: { ...snap, reasons: snap.reasons as any }, update: {} }).catch(() => undefined);
        // Çoklu snapshot için createMany
        await this.prisma.client.customerRiskSnapshot.create({ data: { ...snap, reasons: snap.reasons as any } });
        if (snap.riskLevel === CustomerRiskLevel.LOW) low++;
        else if (snap.riskLevel === CustomerRiskLevel.MEDIUM) medium++;
        else if (snap.riskLevel === CustomerRiskLevel.HIGH) high++;
        else critical++;
      }
    }
    return { total: customers.length, low, medium, high, critical };
  }

  async listAtRisk(tenantId: string, filters: { level?: CustomerRiskLevel; minBalance?: number; page?: number; pageSize?: number }) {
    const where: any = { tenantId };
    if (filters.level) where.riskLevel = filters.level;
    if (filters.minBalance !== undefined) where.balance = { gte: filters.minBalance };
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 30;
    const [items, total] = await Promise.all([
      this.prisma.client.customerRiskSnapshot.findMany({ where, orderBy: [{ riskScore: 'desc' }], skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.client.customerRiskSnapshot.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async getDashboard(tenantId: string) {
    const snapshots = await this.prisma.client.customerRiskSnapshot.groupBy({ by: ['riskLevel'], where: { tenantId }, _count: true });
    const totalReceivable = await this.prisma.client.customerMovement.groupBy({ by: ['customerId'], where: { tenantId }, _sum: { amount: true } });
    const total = totalReceivable.reduce((s, x) => s + (Number(x._sum.amount ?? 0) > 0 ? Number(x._sum.amount) : 0), 0);
    const get = (l: CustomerRiskLevel) => snapshots.find((s) => s.riskLevel === l)?._count ?? 0;
    return { totalAtRisk: get(CustomerRiskLevel.MEDIUM) + get(CustomerRiskLevel.HIGH) + get(CustomerRiskLevel.CRITICAL), low: get(CustomerRiskLevel.LOW), medium: get(CustomerRiskLevel.MEDIUM), high: get(CustomerRiskLevel.HIGH), critical: get(CustomerRiskLevel.CRITICAL), totalReceivable };
  }

  async listConfigs(tenantId: string) { return this.prisma.client.customerRiskConfig.findMany({ where: { tenantId } }); }
  async upsertConfig(tenantId: string, input: any) { return this.prisma.client.customerRiskConfig.upsert({ where: { id: input.id ?? 'new' }, create: { ...input, tenantId, isDefault: input.isDefault ?? true } as any, update: input }); }
}
