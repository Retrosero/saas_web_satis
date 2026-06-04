import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import { SegmentType } from '@saas/shared';

@Injectable()
export class CustomerSegmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string) { return this.prisma.client.customerSegment.findMany({ where: { tenantId, isDeleted: false }, orderBy: { createdAt: 'desc' } }); }

  async get(tenantId: string, id: string) {
    const s = await this.prisma.client.customerSegment.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!s) throw new NotFoundException('Segment bulunamadı');
    const members = await this.prisma.client.customerSegmentMember.findMany({ where: { segmentId: id }, take: 100 });
    return { ...s, members };
  }

  async create(tenantId: string, input: { name: string; description?: string; type: SegmentType; rules?: any[]; customerIds?: string[]; color?: string; icon?: string }, userId: string) {
    const s = await this.prisma.client.customerSegment.create({ data: { tenantId, name: input.name, description: input.description, type: input.type, rules: (input.rules ?? []) as any, color: input.color ?? 'blue', icon: input.icon ?? '👥', createdById: userId } });
    if (input.customerIds && input.customerIds.length > 0) {
      await this.prisma.client.customerSegmentMember.createMany({ data: input.customerIds.map((cid) => ({ segmentId: s.id, customerId: cid, addedBy: 'MANUAL' })) });
      await this.prisma.client.customerSegment.update({ where: { id: s.id }, data: { memberCount: input.customerIds.length } });
    }
    return s;
  }

  async update(tenantId: string, id: string, input: any) {
    const s = await this.prisma.client.customerSegment.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!s) throw new NotFoundException('Segment bulunamadı');
    return this.prisma.client.customerSegment.update({ where: { id }, data: input });
  }

  async delete(tenantId: string, id: string) {
    await this.prisma.client.customerSegment.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
  }

  async addMember(tenantId: string, segmentId: string, customerId: string) {
    await this.prisma.client.customerSegmentMember.upsert({ where: { segmentId_customerId: { segmentId, customerId } }, create: { segmentId, customerId, addedBy: 'MANUAL' }, update: {} });
    const count = await this.prisma.client.customerSegmentMember.count({ where: { segmentId } });
    await this.prisma.client.customerSegment.update({ where: { id: segmentId }, data: { memberCount: count } });
  }

  async removeMember(tenantId: string, segmentId: string, customerId: string) {
    await this.prisma.client.customerSegmentMember.delete({ where: { segmentId_customerId: { segmentId, customerId } } });
    const count = await this.prisma.client.customerSegmentMember.count({ where: { segmentId } });
    await this.prisma.client.customerSegment.update({ where: { id: segmentId }, data: { memberCount: count } });
  }

  async refreshSegment(tenantId: string, id: string) {
    const s = await this.prisma.client.customerSegment.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!s || s.type !== SegmentType.AUTOMATIC) return { ok: false, reason: 'Manuel segment' };
    // Basit kural değerlendirmesi
    const customers = await this.prisma.client.customer.findMany({ where: { tenantId, isDeleted: false }, include: { movements: true } });
    const matched: string[] = [];
    for (const c of customers) {
      const balance = c.movements.reduce((s, m) => s + Number(m.amount ?? 0), 0);
      let isMatch = true;
      for (const rule of s.rules as any[]) {
        if (rule.field === 'balance' && rule.operator === '>=' && balance < Number(rule.value)) isMatch = false;
        if (rule.field === 'balance' && rule.operator === '<=' && balance > Number(rule.value)) isMatch = false;
        if (rule.field === 'balance' && rule.operator === '>' && balance <= Number(rule.value)) isMatch = false;
        if (rule.field === 'balance' && rule.operator === '<' && balance >= Number(rule.value)) isMatch = false;
        if (rule.field === 'balance' && rule.operator === '=' && balance !== Number(rule.value)) isMatch = false;
        if (!isMatch) break;
      }
      if (isMatch) matched.push(c.id);
    }
    // Üyeleri güncelle
    await this.prisma.client.customerSegmentMember.deleteMany({ where: { segmentId: id, addedBy: 'AUTO_REFRESH' } });
    if (matched.length > 0) await this.prisma.client.customerSegmentMember.createMany({ data: matched.map((cid) => ({ segmentId: id, customerId: cid, addedBy: 'AUTO_REFRESH' })) });
    await this.prisma.client.customerSegment.update({ where: { id }, data: { memberCount: matched.length, lastRefreshAt: new Date() } });
    return { ok: true, memberCount: matched.length };
  }
}
