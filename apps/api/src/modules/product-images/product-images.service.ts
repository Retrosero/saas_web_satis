import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';

@Injectable()
export class ProductImagesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, filters: { productId?: string; isMain?: boolean; page?: number; pageSize?: number }) {
    const where: any = { tenantId, isDeleted: false };
    if (filters.productId) where.productId = filters.productId;
    if (filters.isMain !== undefined) where.isMain = filters.isMain;
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 30;
    const [items, total] = await Promise.all([this.prisma.client.productImage.findMany({ where, orderBy: [{ productId: 'asc' }, { sortOrder: 'asc' }], skip: (page - 1) * pageSize, take: pageSize }), this.prisma.client.productImage.count({ where })]);
    return { items, total, page, pageSize };
  }

  async getDashboard(tenantId: string) {
    const [totalProducts, totalImages, storageUsed] = await Promise.all([
      this.prisma.client.product.count({ where: { tenantId, isDeleted: false } }),
      this.prisma.client.productImage.aggregate({ where: { tenantId, isDeleted: false }, _sum: { fileSize: true }, _count: true }),
      this.prisma.client.productImage.aggregate({ where: { tenantId, isDeleted: false }, _sum: { fileSize: true } }),
    ]);
    const productsWithImages = await this.prisma.client.productImage.findMany({ where: { tenantId, isDeleted: false }, select: { productId: true }, distinct: ['productId'] });
    return { totalProducts, totalImages: totalImages._count, productsWithImages: productsWithImages.length, productsWithoutImages: Math.max(0, totalProducts - productsWithImages.length), storageUsedMB: Number(((storageUsed._sum.fileSize ?? 0) / 1024 / 1024).toFixed(2)) };
  }

  async add(tenantId: string, input: { productId: string; r2Key: string; url: string; thumbnailUrl?: string; fileName: string; fileSize: number; mimeType: string; width?: number; height?: number; isMain?: boolean; sortOrder?: number; altText?: string }, userId: string) {
    if (input.isMain) {
      // Diğer ana görselleri kaldır
      await this.prisma.client.productImage.updateMany({ where: { tenantId, productId: input.productId, isMain: true }, data: { isMain: false } });
    }
    return this.prisma.client.productImage.create({ data: { tenantId, ...input, uploadedById: userId } });
  }

  async remove(tenantId: string, id: string) {
    const img = await this.prisma.client.productImage.findFirst({ where: { id, tenantId } });
    if (!img) throw new NotFoundException('Görsel bulunamadı');
    await this.prisma.client.productImage.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
  }

  async batchUpload(tenantId: string, input: { files: any[]; matchBy: 'filename' | 'barcode' | 'productCode' }, userId: string) {
    const batch = await this.prisma.client.imageUploadBatch.create({ data: { tenantId, uploadedById: userId, totalFiles: input.files.length, matchBy: input.matchBy } });
    let success = 0, failed = 0;
    for (const f of input.files) {
      let productId: string | undefined;
      if (input.matchBy === 'productCode') productId = (await this.prisma.client.product.findFirst({ where: { tenantId, code: f.fileName.split('.')[0] } }))?.id;
      else if (input.matchBy === 'barcode') productId = (await this.prisma.client.product.findFirst({ where: { tenantId, primaryBarcode: f.fileName.split('.')[0] } }))?.id;
      const matched = !!productId;
      await this.prisma.client.imageMatchLog.create({ data: { batchId: batch.id, fileName: f.fileName, matched, productId, errorReason: matched ? null : 'Ürün eşleşmedi' } });
      if (matched && productId) {
        await this.prisma.client.productImage.create({ data: { tenantId, productId, r2Key: f.r2Key, url: f.url, fileName: f.fileName, fileSize: f.fileSize, mimeType: f.mimeType, uploadedById: userId } });
        success++;
      } else failed++;
    }
    await this.prisma.client.imageUploadBatch.update({ where: { id: batch.id }, data: { successCount: success, failedCount: failed, status: 'COMPLETED', completedAt: new Date() } });
    return { batchId: batch.id, total: input.files.length, success, failed };
  }
}
