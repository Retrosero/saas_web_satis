import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import { LabelType, LabelPageSize } from '@saas/shared';

@Injectable()
export class LabelsService implements OnModuleInit {
  private readonly logger = new Logger(LabelsService.name);

  private readonly SEED_TEMPLATES = [
    { name: 'Standart Barkod Etiketi', type: LabelType.BARCODE, pageSize: LabelPageSize.SIZE_58MM, widthMm: 50, heightMm: 25, isGlobal: true, layout: { fields: [{ field: 'productName', x: 2, y: 2, fontSize: 10 }, { field: 'productCode', x: 2, y: 13, fontSize: 8 }, { field: 'price', x: 35, y: 13, fontSize: 12, fontWeight: 'bold' }], barcode: { type: 'EAN13', position: 'bottom', size: 30 } } },
    { name: 'Raf Etiketi', type: LabelType.SHELF, pageSize: LabelPageSize.A4, widthMm: 100, heightMm: 50, isGlobal: true, layout: { fields: [{ field: 'productName', x: 5, y: 5, fontSize: 18 }, { field: 'productCode', x: 5, y: 28, fontSize: 12 }, { field: 'category', x: 5, y: 40, fontSize: 10 }] } },
    { name: 'Fiyat Etiketi', type: LabelType.PRICE, pageSize: LabelPageSize.SIZE_80MM, widthMm: 70, heightMm: 40, isGlobal: true, layout: { fields: [{ field: 'productName', x: 2, y: 2, fontSize: 12 }, { field: 'price', x: 2, y: 18, fontSize: 20, fontWeight: 'bold' }] } },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    for (const t of this.SEED_TEMPLATES) {
      const existing = await this.prisma.client.labelTemplate.findFirst({ where: { name: t.name, isGlobal: true } });
      if (!existing) await this.prisma.client.labelTemplate.create({ data: t as any });
    }
  }

  async listTemplates(tenantId: string) { return this.prisma.client.labelTemplate.findMany({ where: { OR: [{ tenantId }, { isGlobal: true }] }, orderBy: [{ isGlobal: 'desc' }, { createdAt: 'desc' }] }); }
  async getTemplate(tenantId: string, id: string) { return this.prisma.client.labelTemplate.findFirst({ where: { id, OR: [{ tenantId }, { isGlobal: true }] } }); }
  async createTemplate(tenantId: string, input: any, userId: string) { return this.prisma.client.labelTemplate.create({ data: { ...input, tenantId, createdById: userId } }); }
  async updateTemplate(tenantId: string, id: string, input: any) { return this.prisma.client.labelTemplate.update({ where: { id }, data: input }); }
  async deleteTemplate(tenantId: string, id: string) { await this.prisma.client.labelTemplate.delete({ where: { id } }); }
  async printLabels(tenantId: string, templateId: string, productIds: string[], copies: number, userId: string) {
    const job = await this.prisma.client.labelPrintJob.create({ data: { tenantId, templateId, productIds: productIds as any, copies, printedById: userId } });
    return { ok: true, jobId: job.id, totalLabels: productIds.length * copies };
  }
  async listPrintJobs(tenantId: string, limit = 30) { return this.prisma.client.labelPrintJob.findMany({ where: { tenantId }, orderBy: { printedAt: 'desc' }, take: limit }); }
}
