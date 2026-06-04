import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import { RecommendationType } from '@saas/shared';

@Injectable()
export class ProductRecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForCustomer(tenantId: string, customerId: string, limit = 8) {
    const recs: any[] = [];
    // 1) Bu müşteri daha önce aldı (son 6 ayda 2+ kez)
    const since = new Date(); since.setMonth(since.getMonth() - 6);
    const items = await this.prisma.client.saleItem.findMany({ where: { tenantId, sale: { customerId, saleDate: { gte: since } } }, include: { product: true } });
    const counts = new Map<string, { count: number; product: any }>();
    for (const it of items) { const c = counts.get(it.productId) ?? { count: 0, product: it.product }; c.count += Number(it.quantity); counts.set(it.productId, c); }
    for (const [pid, v] of counts) if (v.count >= 2) recs.push({ productId: pid, productCode: v.product.code, productName: v.product.name, brand: (v.product as any).brandId, price: Number((v.product as any).salePrice ?? (v.product as any).unitPrice ?? 0), stock: 0, reason: `Bu müşteri son 6 ayda ${v.count} kez aldı`, type: RecommendationType.PREVIOUSLY_PURCHASED, confidence: Math.min(1, v.count / 5) });

    // 2) Çok satan (son 30 gün)
    const since30 = new Date(); since30.setDate(since30.getDate() - 30);
    const topItems = await this.prisma.client.saleItem.findMany({ where: { tenantId, sale: { saleDate: { gte: since30 } } } });
    const topCounts = new Map<string, number>();
    for (const it of topItems) topCounts.set(it.productId, (topCounts.get(it.productId) ?? 0) + Number(it.quantity));
    const topProducts = await this.prisma.client.product.findMany({ where: { id: { in: [...topCounts.keys()] }, tenantId, isDeleted: false }, take: 3 });
    for (const p of topProducts) recs.push({ productId: p.id, productCode: p.code, productName: p.name, price: Number((p as any).salePrice ?? (p as any).unitPrice ?? 0), stock: 0, reason: 'Çok satan ürün', type: RecommendationType.TOP_SELLING, confidence: 0.7 });

    // 3) Stok fazlası
    const products = await this.prisma.client.product.findMany({ where: { tenantId, isDeleted: false, status: 'ACTIVE' }, take: 50 });
    // Basit: 30 günde hiç satılmayanları overstock
    const soldIds = new Set(topItems.map((i) => i.productId));
    for (const p of products) if (!soldIds.has(p.id) && Math.random() < 0.1) recs.push({ productId: p.id, productCode: p.code, productName: p.name, price: Number((p as any).salePrice ?? (p as any).unitPrice ?? 0), stock: 0, reason: 'Stok fazlası — 30 gündür satılmadı', type: RecommendationType.OVERSTOCK, confidence: 0.5 });

    // Log
    if (recs.length > 0) await this.prisma.client.productRecommendationLog.createMany({ data: recs.slice(0, limit).map((r) => ({ tenantId, customerId, productId: r.productId, type: r.type, userId: undefined })) });
    return recs.slice(0, limit);
  }

  async listRules(tenantId: string) { return this.prisma.client.productRecommendationRule.findMany({ where: { tenantId } }); }
  async createRule(tenantId: string, input: any, userId: string) { return this.prisma.client.productRecommendationRule.create({ data: { ...input, tenantId, createdById: userId } }); }
  async deleteRule(tenantId: string, id: string) { await this.prisma.client.productRecommendationRule.delete({ where: { id } }); }
}
