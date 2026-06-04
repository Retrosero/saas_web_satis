import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import { CleanupType } from '@saas/shared';

@Injectable()
export class CleanupService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(tenantId?: string) {
    const where: any = tenantId ? { tenantId } : {};
    const [oldLogs, unusedImages, inactiveCustomers, inactiveProducts] = await Promise.all([
      this.prisma.client.securityLog.count({ where: { ...where, createdAt: { lt: new Date(Date.now() - 365 * 86400_000) } } }).catch(() => 0),
      tenantId ? this.prisma.client.productImage.count({ where: { tenantId, isDeleted: true, deletedAt: { not: null } } }).catch(() => 0) : 0,
      this.prisma.client.customer.count({ where: { ...where, isActive: false, isDeleted: false } }).catch(() => 0),
      this.prisma.client.product.count({ where: { ...where, status: 'PASSIVE' } }).catch(() => 0),
    ]);
    const oldImports = 0;
    return { oldLogs, oldImports, unusedImages, inactiveCustomers, inactiveProducts };
  }

  async listJobs(tenantId?: string) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    return this.prisma.client.cleanupJob.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  async preview(tenantId: string, input: { type: CleanupType; filters: any }) {
    let totalMatched = 0; let totalFreedMB = 0;
    const sample: any[] = [];
    if (input.type === CleanupType.INACTIVE_CUSTOMERS) {
      const customers = await this.prisma.client.customer.findMany({ where: { tenantId, isActive: false, isDeleted: false }, take: 10 });
      totalMatched = await this.prisma.client.customer.count({ where: { tenantId, isActive: false, isDeleted: false } });
      for (const c of customers) sample.push({ entityType: 'Customer', entityId: c.id, label: `${c.code} - ${c.name}`, sizeMB: 0 });
    } else if (input.type === CleanupType.INACTIVE_PRODUCTS) {
      const products = await this.prisma.client.product.findMany({ where: { tenantId, status: 'PASSIVE' }, take: 10 });
      totalMatched = await this.prisma.client.product.count({ where: { tenantId, status: 'PASSIVE' } });
      for (const p of products) sample.push({ entityType: 'Product', entityId: p.id, label: `${p.code} - ${p.name}`, sizeMB: 0 });
    } else if (input.type === CleanupType.OLD_LOGS) {
      const since = new Date(Date.now() - ((input.filters?.olderThanDays ?? 365)) * 86400_000);
      totalMatched = await this.prisma.client.securityLog.count({ where: { createdAt: { lt: since } } });
      const logs = await this.prisma.client.securityLog.findMany({ where: { createdAt: { lt: since } }, take: 10 });
      for (const l of logs) sample.push({ entityType: 'Log', entityId: l.id, label: l.event, sizeMB: 0 });
    } else if (input.type === CleanupType.UNUSED_IMAGES) {
      const images = await this.prisma.client.productImage.findMany({ where: { tenantId, isDeleted: true, deletedAt: { not: null } }, take: 10 });
      totalMatched = await this.prisma.client.productImage.count({ where: { tenantId, isDeleted: true, deletedAt: { not: null } } });
      for (const i of images) sample.push({ entityType: 'Image', entityId: i.id, label: i.fileName, sizeMB: i.fileSize / 1024 / 1024 });
    }
    return { totalMatched, totalFreedMB, sample };
  }

  async runJob(tenantId: string, input: { type: CleanupType; filters: any; archive?: boolean }, userId: string) {
    const preview = await this.preview(tenantId, input);
    const job = await this.prisma.client.cleanupJob.create({ data: { tenantId, type: input.type, filters: input.filters as any, totalMatched: preview.totalMatched, totalFreedMB: preview.totalFreedMB, status: 'PENDING', preview: preview as any, createdById: userId } });
    // Simüle: archive/skip
    let archived = 0, deleted = 0;
    if (input.type === CleanupType.INACTIVE_CUSTOMERS) {
      const customers = await this.prisma.client.customer.findMany({ where: { tenantId, isActive: false, isDeleted: false } });
      for (const c of customers) {
        if (input.archive) {
          await this.prisma.client.archiveRecord.create({ data: { tenantId, entityType: 'Customer', entityId: c.id, archivedData: c as any, reason: input.type, archivedById: userId } });
          await this.prisma.client.customer.update({ where: { id: c.id }, data: { isDeleted: true, deletedAt: new Date() } });
          archived++;
        } else archived++;
      }
    } else if (input.type === CleanupType.INACTIVE_PRODUCTS) {
      const products = await this.prisma.client.product.findMany({ where: { tenantId, status: 'PASSIVE' } });
      for (const p of products) {
        if (input.archive) {
          await this.prisma.client.archiveRecord.create({ data: { tenantId, entityType: 'Product', entityId: p.id, archivedData: p as any, reason: input.type, archivedById: userId } });
          await this.prisma.client.product.update({ where: { id: p.id }, data: { isDeleted: true, deletedAt: new Date() } });
          archived++;
        } else archived++;
      }
    }
    await this.prisma.client.cleanupJob.update({ where: { id: job.id }, data: { status: 'COMPLETED', totalArchived: archived, totalDeleted: deleted, completedAt: new Date() } });
    await this.prisma.client.cleanupLog.create({ data: { jobId: job.id, action: 'EXECUTE', actorId: userId, count: archived, sizeMB: preview.totalFreedMB, details: { type: input.type } as any } });
    return { jobId: job.id, archived, deleted };
  }
}
