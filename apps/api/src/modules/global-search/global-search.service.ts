import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import type { GlobalSearchResponse, GlobalSearchResult } from '@saas/shared';

@Injectable()
export class GlobalSearchService {
  private readonly logger = new Logger(GlobalSearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async search(tenantId: string, userId: string, query: string, limit = 5): Promise<GlobalSearchResponse> {
    const start = Date.now();
    if (!query || query.length < 2) return { query, results: [], byModule: {}, totalCount: 0, durationMs: 0 };
    const q = query.trim();
    const where: any = { OR: [] as any[] };

    // History kaydet
    this.prisma.client.globalSearchHistory.create({ data: { tenantId, userId, query: q } }).catch(() => undefined);

    const orFilters: any[] = [
      { code: { contains: q, mode: 'insensitive' } },
      { name: { contains: q, mode: 'insensitive' } },
      { taxNumber: { contains: q } },
      { phone: { contains: q } },
      { email: { contains: q, mode: 'insensitive' } },
    ];

    const [customers, products, sales, orders, collections, quotes, users] = await Promise.all([
      this.prisma.client.customer.findMany({ where: { tenantId, isDeleted: false, OR: orFilters as any }, take: limit }).catch(() => []),
      this.prisma.client.product.findMany({ where: { tenantId, isDeleted: false, OR: [{ code: { contains: q, mode: 'insensitive' } }, { name: { contains: q, mode: 'insensitive' } }, { primaryBarcode: { contains: q } }] }, take: limit }).catch(() => []),
      this.prisma.client.sale.findMany({ where: { tenantId, saleNumber: { contains: q, mode: 'insensitive' } }, take: limit, orderBy: { saleDate: 'desc' } }).catch(() => []),
      this.prisma.client.order.findMany({ where: { tenantId, orderNumber: { contains: q, mode: 'insensitive' } }, take: limit }).catch(() => []),
      this.prisma.client.collection.findMany({ where: { tenantId, collectionNumber: { contains: q, mode: 'insensitive' } }, take: limit, orderBy: { collectionDate: 'desc' } }).catch(() => []),
      this.prisma.client.quote.findMany({ where: { tenantId, quoteNumber: { contains: q, mode: 'insensitive' } }, take: limit }).catch(() => []),
      this.prisma.client.user.findMany({ where: { tenantId, isDeleted: false, OR: [{ email: { contains: q, mode: 'insensitive' } }, { fullName: { contains: q, mode: 'insensitive' } }] }, take: limit }).catch(() => []),
    ]);

    const results: GlobalSearchResult[] = [];
    for (const c of customers) results.push({ type: 'CUSTOMER', title: c.name, description: `${c.code} • ${c.phone ?? '—'} • Bakiye: ${c.code}`, module: 'cari', status: c.isActive ? 'Aktif' : 'Pasif', link: `/customers/${c.id}` });
    for (const p of products) results.push({ type: 'PRODUCT', title: p.name, description: `${p.code} • ${p.status}`, module: 'urun', link: `/products/${p.id}` });
    for (const s of sales) results.push({ type: 'SALE', title: s.saleNumber, description: `${s.customerName ?? '—'} • ${Number(s.grandTotal).toLocaleString('tr-TR')} TRY`, module: 'satis', date: s.saleDate.toISOString(), status: s.status, link: `/sales/${s.id}` });
    for (const o of orders) results.push({ type: 'ORDER', title: o.orderNumber, description: o.notes ?? '—', module: 'siparis', date: o.createdAt.toISOString(), link: `/orders/${o.id}` });
    for (const cl of collections) results.push({ type: 'COLLECTION', title: cl.collectionNumber, description: `${Number(cl.amount).toLocaleString('tr-TR')} TRY`, module: 'tahsilat', date: cl.collectionDate.toISOString(), link: `/collections/${cl.id}` });
    for (const q2 of quotes) results.push({ type: 'QUOTE', title: q2.quoteNumber, description: q2.customerName, module: 'teklif', date: q2.quoteDate.toISOString(), status: q2.status, link: `/quotes/${q2.id}` });
    for (const u of users) results.push({ type: 'USER', title: u.fullName, description: u.email, module: 'kullanici', link: `/users/${u.id}` });

    const byModule: Record<string, GlobalSearchResult[]> = {};
    for (const r of results) { (byModule[r.module] ??= []).push(r); }

    return { query: q, results, byModule, totalCount: results.length, durationMs: Date.now() - start };
  }

  async getHistory(tenantId: string, userId: string, limit = 10) {
    return this.prisma.client.globalSearchHistory.findMany({ where: { tenantId, userId }, orderBy: { createdAt: 'desc' }, take: limit });
  }
}
