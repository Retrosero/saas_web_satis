import { Injectable, OnModuleInit, Logger, OnModuleDestroy } from '@nestjs/common';
import { MeiliSearch, Index } from 'meilisearch';
import { PrismaService } from '../../prisma/prisma.module';

export const INDEX_CUSTOMERS = 'customers';
export const INDEX_PRODUCTS = 'products';
export const INDEX_SALES = 'sales';
export const INDEX_QUOTES = 'quotes';

export interface SearchHit { id: string; tenantId: string; name: string; code?: string; description?: string; link: string; module: string; status?: string }

@Injectable()
export class SearchService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SearchService.name);
  private client!: MeiliSearch;
  private indexes: Record<string, Index> = {};
  private healthy = false;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const host = process.env.MEILISEARCH_HOST ?? 'http://localhost:7700';
    const apiKey = process.env.MEILISEARCH_API_KEY ?? 'masterKey';
    this.client = new MeiliSearch({ host, apiKey });
    try {
      await this.client.health();
      this.healthy = true;
      this.logger.log(`Meilisearch bağlantısı kuruldu: ${host}`);
      await this.setupIndexes();
    } catch (e: any) {
      this.logger.warn(`Meilisearch bağlantısı kurulamadı (${e.message}), Prisma fallback aktif`);
    }
  }

  private async setupIndexes() {
    for (const name of [INDEX_CUSTOMERS, INDEX_PRODUCTS, INDEX_SALES, INDEX_QUOTES]) {
      try {
        await this.client.createIndex(name, { primaryKey: 'id' });
      } catch { /* already exists */ }
      this.indexes[name] = this.client.index(name);
      await this.indexes[name].updateFilterableAttributes(['tenantId', 'status', 'type']);
      await this.indexes[name].updateSearchableAttributes(['name', 'code', 'description', 'phone', 'email', 'taxNumber']);
      await this.indexes[name].updateSortableAttributes(['createdAt', 'name']);
    }
  }

  async onModuleDestroy() { /* meili has no persistent conn */ }

  isHealthy() { return this.healthy; }

  /** Index/Remove tek kayıt */
  async indexDocument(indexName: string, doc: any) {
    if (!this.healthy) return;
    try { await this.indexes[indexName].addDocuments([doc]); } catch (e: any) { this.logger.warn(`Index error [${indexName}/${doc.id}]: ${e.message}`); }
  }

  async removeDocument(indexName: string, id: string) {
    if (!this.healthy) return;
    try { await this.indexes[indexName].deleteDocument(id); } catch { /* ignore */ }
  }

  /** Bulk index (reindex için) */
  async bulkIndex(indexName: string, docs: any[]) {
    if (!this.healthy || docs.length === 0) return;
    try { await this.indexes[indexName].addDocuments(docs); } catch (e: any) { this.logger.warn(`Bulk index error: ${e.message}`); }
  }

  /** Arama: multi-index + tenant filter */
  async search(tenantId: string, query: string, limit = 5) {
    if (!this.healthy || !query || query.length < 2) return { results: [], byModule: {}, totalCount: 0, durationMs: 0 };
    const start = Date.now();
    const searchPromises = Object.entries(this.indexes).map(async ([name, idx]) => {
      try {
        const res = await idx.search(query, { filter: [`tenantId = "${tenantId}"`], limit, attributesToHighlight: ['name', 'code'] });
        return { name, hits: res.hits as any[] };
      } catch { return { name, hits: [] }; }
    });
    const all = await Promise.all(searchPromises);
    const byModule: Record<string, SearchHit[]> = {};
    const results: SearchHit[] = [];
    for (const { name, hits } of all) {
      if (hits.length === 0) continue;
      const mapped = hits.map((h) => this.toSearchHit(name, h));
      byModule[this.moduleName(name)] = mapped;
      results.push(...mapped);
    }
    return { results, byModule, totalCount: results.length, durationMs: Date.now() - start };
  }

  private toSearchHit(indexName: string, h: any): SearchHit {
    const base: SearchHit = { id: h.id, tenantId: h.tenantId, name: h.name ?? h.code ?? '', link: '', module: this.moduleName(indexName) };
    if (indexName === INDEX_CUSTOMERS) { base.code = h.code; base.description = `${h.code} • ${h.phone ?? '—'} • ${h.email ?? ''}`; base.status = h.isActive ? 'Aktif' : 'Pasif'; base.link = `/customers/${h.id}`; }
    if (indexName === INDEX_PRODUCTS) { base.code = h.code; base.description = `${h.code} • ${h.status}`; base.status = h.status; base.link = `/products/${h.id}`; }
    if (indexName === INDEX_SALES) { base.code = h.code; base.description = `${h.customerName ?? '—'} • ${h.grandTotal ?? 0} TRY`; base.status = h.status; base.link = `/sales/${h.id}`; }
    if (indexName === INDEX_QUOTES) { base.code = h.code; base.description = `${h.customerName ?? '—'} • ${h.grandTotal ?? 0} TRY`; base.status = h.status; base.link = `/quotes/${h.id}`; }
    return base;
  }

  private moduleName(indexName: string): string {
    const map: Record<string, string> = { [INDEX_CUSTOMERS]: 'cari', [INDEX_PRODUCTS]: 'urun', [INDEX_SALES]: 'satis', [INDEX_QUOTES]: 'teklif' };
    return map[indexName] ?? indexName;
  }

  /** Tüm tenant verisini reindex (background job) */
  async reindexTenant(tenantId: string) {
    if (!this.healthy) return { ok: false, reason: 'Meilisearch bağlı değil' };
    const [customers, products, sales, quotes] = await Promise.all([
      this.prisma.client.customer.findMany({ where: { tenantId, isDeleted: false }, take: 5000 }),
      this.prisma.client.product.findMany({ where: { tenantId, isDeleted: false }, take: 5000 }),
      this.prisma.client.sale.findMany({ where: { tenantId, isDeleted: false }, include: { customer: true }, take: 5000, orderBy: { createdAt: 'desc' } }),
      this.prisma.client.quote.findMany({ where: { tenantId, isDeleted: false }, take: 5000, orderBy: { createdAt: 'desc' } }),
    ]);
    const cDocs = customers.map((c) => ({ id: c.id, tenantId: c.tenantId, name: c.name, code: c.code, phone: c.phone, email: c.email, taxNumber: c.taxNumber, isActive: c.isActive, createdAt: c.createdAt.getTime() }));
    const pDocs = products.map((p) => ({ id: p.id, tenantId: p.tenantId, name: p.name, code: p.code, status: p.status, createdAt: p.createdAt.getTime() }));
    const sDocs = sales.map((s: any) => ({ id: s.id, tenantId: s.tenantId, name: s.saleNumber, code: s.saleNumber, customerName: s.customer?.name, grandTotal: Number(s.grandTotal), status: s.status, createdAt: s.createdAt.getTime() }));
    const qDocs = quotes.map((q: any) => ({ id: q.id, tenantId: q.tenantId, name: q.quoteNumber, code: q.quoteNumber, customerName: q.customerName, grandTotal: Number(q.grandTotal), status: q.status, createdAt: q.createdAt.getTime() }));
    await Promise.all([this.bulkIndex(INDEX_CUSTOMERS, cDocs), this.bulkIndex(INDEX_PRODUCTS, pDocs), this.bulkIndex(INDEX_SALES, sDocs), this.bulkIndex(INDEX_QUOTES, qDocs)]);
    return { ok: true, counts: { customers: cDocs.length, products: pDocs.length, sales: sDocs.length, quotes: qDocs.length } };
  }

  async getIndexStats() {
    if (!this.healthy) return { healthy: false, indexes: [] };
    const stats: any[] = [];
    for (const [name, idx] of Object.entries(this.indexes)) {
      try { const s = await idx.getStats(); stats.push({ name, numberOfDocuments: (s as any).numberOfDocuments, isIndexing: (s as any).isIndexing }); } catch (e: any) { stats.push({ name, error: e.message }); }
    }
    return { healthy: true, indexes: stats };
  }
}
