import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import { BulkOperationType, BulkOperationStatus } from '@saas/shared';

@Injectable()
export class BulkOperationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, filters: { type?: BulkOperationType; status?: BulkOperationStatus; page?: number; pageSize?: number }) {
    const where: any = { tenantId, isDeleted: false };
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const [items, total] = await Promise.all([this.prisma.client.bulkOperation.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }), this.prisma.client.bulkOperation.count({ where })]);
    return { items, total, page, pageSize };
  }

  async preview(tenantId: string, input: { type: BulkOperationType; filters: any; update: any }) {
    const count = await this.previewMatch(tenantId, input.type, input.filters);
    return { totalMatched: count, sample: count > 0 ? await this.previewSample(tenantId, input.type, input.filters, 5) : [] };
  }

  private async previewMatch(tenantId: string, type: BulkOperationType, filters: any): Promise<number> {
    const where: any = { tenantId, isDeleted: false, ...filters };
    if (type.startsWith('PRODUCT') || type === 'PRICE_UPDATE' || type === 'CATEGORY_CHANGE' || type === 'BRAND_ASSIGN' || type === 'WAREHOUSE_UPDATE') return this.prisma.client.product.count({ where });
    if (type.startsWith('CUSTOMER')) return this.prisma.client.customer.count({ where });
    return 0;
  }

  private async previewSample(tenantId: string, type: BulkOperationType, filters: any, limit: number) {
    const where: any = { tenantId, isDeleted: false, ...filters };
    if (type.startsWith('PRODUCT') || type === 'PRICE_UPDATE' || type === 'CATEGORY_CHANGE' || type === 'BRAND_ASSIGN' || type === 'WAREHOUSE_UPDATE') return this.prisma.client.product.findMany({ where, take: limit, select: { id: true, code: true, name: true } });
    if (type.startsWith('CUSTOMER')) return this.prisma.client.customer.findMany({ where, take: limit, select: { id: true, code: true, name: true } });
    return [];
  }

  async create(tenantId: string, input: { name: string; type: BulkOperationType; filters: any; update: any }, userId: string) {
    const preview = await this.preview(tenantId, { type: input.type, filters: input.filters, update: input.update });
    const op = await this.prisma.client.bulkOperation.create({ data: { tenantId, name: input.name, type: input.type, status: BulkOperationStatus.DRAFT, filters: { ...(input.filters as any ?? {}), _preview: preview } as any, update: input.update as any, totalMatched: preview.totalMatched, createdById: userId, batchId: `batch-${Date.now()}` } });
    await this.prisma.client.bulkOperationLog.create({ data: { operationId: op.id, action: 'PREVIEW', actorId: userId, details: preview as any } });
    return op;
  }

  async execute(tenantId: string, id: string, userId: string) {
    const op = await this.prisma.client.bulkOperation.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!op) throw new NotFoundException('İşlem bulunamadı');
    if (op.status === BulkOperationStatus.COMPLETED) throw new BadRequestException('İşlem zaten tamamlanmış');
    await this.prisma.client.bulkOperation.update({ where: { id }, data: { status: BulkOperationStatus.RUNNING, startedAt: new Date() } });
    // Snapshot'ı al
    const where: any = { tenantId, isDeleted: false, ...(op.filters as any) };
    const items: any[] = [];
    let successCount = 0; let failedCount = 0;
    if ((op.type as string).startsWith('PRODUCT') || op.type === 'PRICE_UPDATE' || op.type === 'CATEGORY_CHANGE' || op.type === 'BRAND_ASSIGN' || op.type === 'WAREHOUSE_UPDATE') {
      const products = await this.prisma.client.product.findMany({ where });
      for (const p of products) {
        const before = { ...p };
        const updateData: any = {};
        const update = op.update as any;
        if (op.type === 'PRICE_UPDATE') {
          // Product'ta fiyat alanı yok; SaleItem unitPrice'da — burada description'a fiyatı yaz veya skip
          // Çok kaba: yüzdelik artışta defaultPurchasePrice / defaultSalePrice alanı varsa kullan
          if (update.percentage && (p as any).defaultSalePrice) updateData.defaultSalePrice = Number((p as any).defaultSalePrice) * (1 + update.percentage / 100);
          else if (update.value !== undefined && (p as any).defaultSalePrice) updateData.defaultSalePrice = update.value;
        } else if (op.type === 'CATEGORY_CHANGE') { updateData.categoryId = update.value; }
        else if (op.type === 'BRAND_ASSIGN') { updateData.brandId = update.value; }
        else if (op.type === 'PRODUCT_DEACTIVATE') { updateData.status = 'PASSIVE'; }
        try {
          await this.prisma.client.product.update({ where: { id: p.id }, data: updateData });
          successCount++;
          items.push({ entityType: 'Product', entityId: p.id, beforeState: before, afterState: updateData, status: 'SUCCESS' });
        } catch (e: any) { failedCount++; items.push({ entityType: 'Product', entityId: p.id, beforeState: before, afterState: updateData, status: 'FAILED', error: e.message }); }
      }
    }
    await this.prisma.client.bulkOperationItem.createMany({ data: items.map((i) => ({ operationId: id, entityType: i.entityType, entityId: i.entityId, beforeState: i.beforeState as any, afterState: i.afterState as any, status: i.status, error: i.error, processedAt: new Date() })) });
    await this.prisma.client.bulkOperation.update({ where: { id }, data: { status: BulkOperationStatus.COMPLETED, completedAt: new Date(), totalProcessed: items.length, totalSuccess: successCount, totalFailed: failedCount } });
    await this.prisma.client.bulkOperationLog.create({ data: { operationId: id, action: 'EXECUTE', actorId: userId, details: { success: successCount, failed: failedCount } as any } });
    return { ok: true, totalProcessed: items.length, successCount, failedCount };
  }

  async rollback(tenantId: string, id: string, userId: string) {
    const op = await this.prisma.client.bulkOperation.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!op) throw new NotFoundException('İşlem bulunamadı');
    if (op.status !== BulkOperationStatus.COMPLETED) throw new BadRequestException('Sadece tamamlanmış işlemler geri alınabilir');
    const items = await this.prisma.client.bulkOperationItem.findMany({ where: { operationId: id, status: 'SUCCESS' } });
    let rolledBack = 0;
    for (const item of items) {
      try {
        if (item.entityType === 'Product') await this.prisma.client.product.update({ where: { id: item.entityId }, data: item.beforeState as any });
        rolledBack++;
      } catch (e: any) { /* skip */ }
    }
    await this.prisma.client.bulkOperation.update({ where: { id }, data: { status: BulkOperationStatus.ROLLED_BACK, rolledBackAt: new Date() } });
    await this.prisma.client.bulkOperationLog.create({ data: { operationId: id, action: 'ROLLBACK', actorId: userId, details: { rolledBack } as any } });
    return { ok: true, rolledBack };
  }
}
