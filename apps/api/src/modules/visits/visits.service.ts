import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import { VisitStatus, VisitPlanStatus } from '@saas/shared';

@Injectable()
export class VisitsService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== Plans =====
  async listPlans(tenantId: string, filters: { salespersonId?: string; status?: string; dateFrom?: string; dateTo?: string; page?: number; pageSize?: number }) {
    const where: any = { tenantId };
    if (filters.salespersonId) where.salespersonId = filters.salespersonId;
    if (filters.status) where.status = filters.status;
    if (filters.dateFrom || filters.dateTo) {
      where.planDate = {};
      if (filters.dateFrom) where.planDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.planDate.lte = new Date(filters.dateTo);
    }
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const [items, total] = await Promise.all([
      this.prisma.client.visitPlan.findMany({ where, orderBy: { planDate: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, include: { customers: true } }),
      this.prisma.client.visitPlan.count({ where }),
    ]);
    return { items: items.map((p) => this.toPlanDto(p)), total, page, pageSize };
  }

  async getPlan(tenantId: string, id: string) {
    const p = await this.prisma.client.visitPlan.findFirst({ where: { id, tenantId }, include: { customers: { orderBy: { order: 'asc' } }, checkins: true, notes_: true } });
    if (!p) throw new NotFoundException('Plan bulunamadı');
    return this.toPlanDto(p);
  }

  async createPlan(tenantId: string, input: { name: string; description?: string; planDate: string; salespersonId: string; region?: string; customerGroupId?: string; customerIds: string[]; notes?: string }, userId: string) {
    if (!input.customerIds || input.customerIds.length === 0) throw new BadRequestException('En az 1 müşteri seçin');
    const customers = await this.prisma.client.customer.findMany({ where: { id: { in: input.customerIds }, tenantId } });
    const plan = await this.prisma.client.visitPlan.create({ data: { tenantId, name: input.name, description: input.description, planDate: new Date(input.planDate), salespersonId: input.salespersonId, region: input.region, customerGroupId: input.customerGroupId, notes: input.notes, status: VisitPlanStatus.DRAFT, createdById: userId, totalCustomers: input.customerIds.length, customers: { create: input.customerIds.map((cid, idx) => { const c = customers.find((x) => x.id === cid)!; return { customerId: cid, customerName: c.name, customerAddress: (c as any).address ?? undefined, customerPhone: c.phone ?? undefined, customerBalance: 0, order: idx + 1, status: VisitStatus.PLANNED }; }) } } });
    return this.getPlan(tenantId, plan.id);
  }

  async updatePlanStatus(tenantId: string, id: string, status: VisitPlanStatus) {
    const p = await this.prisma.client.visitPlan.findFirst({ where: { id, tenantId } });
    if (!p) throw new NotFoundException('Plan bulunamadı');
    const data: any = { status };
    if (status === VisitPlanStatus.ACTIVE && !p.startedAt) data.startedAt = new Date();
    if (status === VisitPlanStatus.COMPLETED && !p.completedAt) data.completedAt = new Date();
    return this.prisma.client.visitPlan.update({ where: { id }, data });
  }

  async deletePlan(tenantId: string, id: string) {
    const p = await this.prisma.client.visitPlan.findFirst({ where: { id, tenantId } });
    if (!p) throw new NotFoundException('Plan bulunamadı');
    await this.prisma.client.visitPlan.delete({ where: { id } });
  }

  // ===== Customer Status =====
  async updateCustomerStatus(tenantId: string, planId: string, customerId: string, input: { status: VisitStatus; reason?: string; resultOrderId?: string; resultCollectionId?: string }, userId: string) {
    const c = await this.prisma.client.visitPlanCustomer.findFirst({ where: { id: customerId, planId, plan: { tenantId } } });
    if (!c) throw new NotFoundException('Müşteri bulunamadı');
    const fromStatus = c.status;
    await this.prisma.client.visitPlanCustomer.update({ where: { id: customerId }, data: { status: input.status, reason: input.reason, resultOrderId: input.resultOrderId, resultCollectionId: input.resultCollectionId, leftAt: input.status === VisitStatus.VISITED || input.status === VisitStatus.ORDER_TAKEN || input.status === VisitStatus.COLLECTION_TAKEN ? new Date() : c.leftAt } });
    await this.prisma.client.visitStatusLog.create({ data: { planId, customerId, fromStatus: fromStatus as any, toStatus: input.status, actorId: userId, reason: input.reason } });
    // Plan istatistik güncelle
    const allCustomers = await this.prisma.client.visitPlanCustomer.findMany({ where: { planId } });
    const visited = allCustomers.filter((c) => c.status !== VisitStatus.PLANNED && c.status !== VisitStatus.CANCELLED && c.status !== VisitStatus.COULDNT_MEET).length;
    const orderCount = allCustomers.filter((c) => c.status === VisitStatus.ORDER_TAKEN).length;
    await this.prisma.client.visitPlan.update({ where: { id: planId }, data: { visitedCount: visited, orderCount } });
    return { ok: true };
  }

  // ===== Check-in =====
  async checkin(tenantId: string, planId: string, input: { customerId: string; type: 'CHECK_IN' | 'CHECK_OUT'; latitude: number; longitude: number; address?: string; accuracy?: number; photo?: string; notes?: string }, userId: string) {
    const plan = await this.prisma.client.visitPlan.findFirst({ where: { id: planId, tenantId } });
    if (!plan) throw new NotFoundException('Plan bulunamadı');
    const check = await this.prisma.client.visitCheckin.create({ data: { planId, customerId: input.customerId, type: input.type, latitude: input.latitude, longitude: input.longitude, address: input.address, accuracy: input.accuracy, photo: input.photo, notes: input.notes } });
    if (input.type === 'CHECK_IN') {
      await this.prisma.client.visitPlanCustomer.update({ where: { id: input.customerId }, data: { arrivedAt: new Date(), status: VisitStatus.IN_PROGRESS, latitude: input.latitude, longitude: input.longitude } });
    }
    return check;
  }

  // ===== Notes =====
  async addNote(tenantId: string, planId: string, input: { customerId: string; content: string; type?: string; attachments?: any[] }, userId: string) {
    const plan = await this.prisma.client.visitPlan.findFirst({ where: { id: planId, tenantId } });
    if (!plan) throw new NotFoundException('Plan bulunamadı');
    return this.prisma.client.visitNote.create({ data: { planId, customerId: input.customerId, content: input.content, type: input.type ?? 'GENERAL', attachments: (input.attachments ?? []) as any, createdById: userId } });
  }

  async listNotes(tenantId: string, planId: string, customerId?: string) {
    const where: any = { planId, plan: { tenantId } };
    if (customerId) where.customerId = customerId;
    return this.prisma.client.visitNote.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  // ===== Report =====
  async getSalespersonReport(tenantId: string, salespersonId: string, from?: string, to?: string) {
    const where: any = { tenantId, salespersonId };
    if (from || to) { where.planDate = {}; if (from) where.planDate.gte = new Date(from); if (to) where.planDate.lte = new Date(to); }
    const plans = await this.prisma.client.visitPlan.findMany({ where, include: { customers: true } });
    let totalPlans = plans.length, totalCustomers = 0, visited = 0, orders = 0, couldntMeet = 0, orderAmount = 0;
    for (const p of plans) {
      totalCustomers += p.totalCustomers;
      for (const c of p.customers) {
        if (c.status === VisitStatus.VISITED || c.status === VisitStatus.ORDER_TAKEN || c.status === VisitStatus.COLLECTION_TAKEN) visited++;
        if (c.status === VisitStatus.ORDER_TAKEN) orders++;
        if (c.status === VisitStatus.COULDNT_MEET) couldntMeet++;
      }
    }
    return { totalPlans, totalCustomers, visited, orders, couldntMeet, visitRate: totalCustomers > 0 ? (visited / totalCustomers) * 100 : 0, orderConversion: visited > 0 ? (orders / visited) * 100 : 0 };
  }

  private toPlanDto(p: any) {
    return { id: p.id, tenantId: p.tenantId, name: p.name, description: p.description, planDate: p.planDate.toISOString(), salespersonId: p.salespersonId, region: p.region, customerGroupId: p.customerGroupId, status: p.status, totalCustomers: p.totalCustomers, visitedCount: p.visitedCount, orderCount: p.orderCount, collectionAmount: Number(p.collectionAmount), startedAt: p.startedAt?.toISOString(), completedAt: p.completedAt?.toISOString(), notes: p.notes, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString(), customers: p.customers };
  }
}
