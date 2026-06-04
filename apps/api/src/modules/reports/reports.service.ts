import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module.js';
import { Prisma } from '@prisma/client';
import type { ChartType, PivotConfig, PresetReport, ReportResult, ReportShareScope, ReportTemplate } from '@saas/shared';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // PRESET REPORTS (hard-coded)
  // ==========================================================================

  getPresets(): PresetReport[] {
    return [
      { code: 'DAILY_SALES', name: 'Günlük Satış Raporu', description: 'Bugünkü satışlar', config: { rows: ['sale.date'], columns: [], values: [{ field: 'sale.grandTotal', aggregate: 'SUM', alias: 'toplam_satis' }], filters: [] } },
      { code: 'MONTHLY_SALES', name: 'Aylık Satış Raporu', description: 'Aylık satış trendi', config: { rows: ['sale.date'], columns: [], values: [{ field: 'sale.grandTotal', aggregate: 'SUM', alias: 'aylik_satis' }], filters: [] } },
      { code: 'CUSTOMER_BALANCE', name: 'Cari Bakiye Raporu', description: 'Cari bakiyeler', config: { rows: ['customer.code', 'customer.name'], columns: [], values: [], filters: [] } },
      { code: 'COLLECTION_REPORT', name: 'Tahsilat Raporu', description: 'Tahsilatlar', config: { rows: ['collection.date'], columns: [], values: [{ field: 'collection.amount', aggregate: 'SUM', alias: 'tahsilat' }], filters: [] } },
      { code: 'STOCK_REPORT', name: 'Stok Raporu', description: 'Stok miktarları', config: { rows: ['product.code', 'product.name'], columns: ['warehouse.name'], values: [{ field: 'stock.quantity', aggregate: 'SUM', alias: 'stok' }], filters: [] } },
      { code: 'CRITICAL_STOCK', name: 'Kritik Stok Raporu', description: 'Kritik seviyenin altındaki stoklar', config: { rows: ['product.code', 'product.name', 'warehouse.name'], columns: [], values: [{ field: 'stock.quantity', aggregate: 'SUM', alias: 'stok' }], filters: [] } },
      { code: 'TOP_SELLING', name: 'En Çok Satan Ürünler', description: 'Satış adedine göre', config: { rows: ['product.code', 'product.name'], columns: [], values: [{ field: 'sale.quantity', aggregate: 'SUM', alias: 'satis_adedi' }], filters: [] } },
      { code: 'SALES_PERSON', name: 'Plasiyer Performansı', description: 'Plasiyer bazlı satış', config: { rows: ['customer.salesperson'], columns: [], values: [{ field: 'sale.grandTotal', aggregate: 'SUM', alias: 'satis' }], filters: [] } },
      { code: 'BRAND_SALES', name: 'Marka Bazlı Satış', description: 'Marka performansı', config: { rows: ['product.brand'], columns: [], values: [{ field: 'sale.grandTotal', aggregate: 'SUM', alias: 'satis' }], filters: [] } },
      { code: 'CATEGORY_SALES', name: 'Kategori Bazlı Satış', description: 'Kategori performansı', config: { rows: ['product.category'], columns: [], values: [{ field: 'sale.grandTotal', aggregate: 'SUM', alias: 'satis' }], filters: [] } },
      { code: 'WAREHOUSE_STOCK', name: 'Depo Bazlı Stok', description: 'Depo bazında stok', config: { rows: ['warehouse.name', 'product.code'], columns: [], values: [{ field: 'stock.quantity', aggregate: 'SUM', alias: 'stok' }], filters: [] } },
      { code: 'CASH_REPORT', name: 'Kasa Raporu', description: 'Kasa hareketleri', config: { rows: ['collection.date', 'collection.cashAccount'], columns: [], values: [{ field: 'collection.amount', aggregate: 'SUM', alias: 'tutar' }], filters: [] } },
    ];
  }

  // ==========================================================================
  // SAVED TEMPLATES
  // ==========================================================================

  async listTemplates(tenantId: string, params: { isFavorite?: boolean; sharedWithMe?: boolean }): Promise<ReportTemplate[]> {
    const where: any = { tenantId, isDeleted: false };
    if (params.isFavorite) where.isFavorite = true;
    if (params.sharedWithMe) where.shareScope = 'ALL_TENANT';
    const ts = await this.prisma.client.reportTemplate.findMany({ where, orderBy: { updatedAt: 'desc' } });
    return ts.map((t) => this.toDto(t));
  }

  async getTemplate(tenantId: string, id: string): Promise<ReportTemplate> {
    const t = await this.prisma.client.reportTemplate.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!t) throw new NotFoundException('Şablon bulunamadı');
    return this.toDto(t);
  }

  async createTemplate(tenantId: string, input: { name: string; description?: string; config: PivotConfig; chartType?: ChartType; shareScope?: ReportShareScope; sharedRoles?: string[]; sharedUsers?: string[]; isFavorite?: boolean }, userId?: string): Promise<ReportTemplate> {
    const t = await this.prisma.client.reportTemplate.create({
      data: {
        tenantId,
        name: input.name,
        description: input.description ?? null,
        config: input.config as any,
        chartType: input.chartType ?? 'TABLE',
        shareScope: input.shareScope ?? 'PRIVATE',
        sharedRoles: input.sharedRoles ?? [],
        sharedUsers: input.sharedUsers ?? [],
        isFavorite: input.isFavorite ?? false,
        createdById: userId,
      },
    });
    return this.toDto(t);
  }

  async updateTemplate(tenantId: string, id: string, input: Partial<ReportTemplate>): Promise<ReportTemplate> {
    const t = await this.prisma.client.reportTemplate.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!t) throw new NotFoundException('Şablon bulunamadı');
    const data: any = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.config !== undefined) data.config = input.config as any;
    if (input.chartType !== undefined) data.chartType = input.chartType;
    if (input.shareScope !== undefined) data.shareScope = input.shareScope;
    if (input.sharedRoles !== undefined) data.sharedRoles = input.sharedRoles;
    if (input.sharedUsers !== undefined) data.sharedUsers = input.sharedUsers;
    if (input.isFavorite !== undefined) data.isFavorite = input.isFavorite;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    const updated = await this.prisma.client.reportTemplate.update({ where: { id }, data });
    return this.toDto(updated);
  }

  async deleteTemplate(tenantId: string, id: string): Promise<void> {
    await this.prisma.client.reportTemplate.updateMany({ where: { id, tenantId }, data: { isDeleted: true, deletedAt: new Date() } });
  }

  async toggleFavorite(tenantId: string, id: string): Promise<ReportTemplate> {
    const t = await this.prisma.client.reportTemplate.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!t) throw new NotFoundException('Şablon bulunamadı');
    const updated = await this.prisma.client.reportTemplate.update({ where: { id }, data: { isFavorite: !t.isFavorite, runCount: { increment: 0 } } });
    return this.toDto(updated);
  }

  // ==========================================================================
  // EXECUTE PIVOT REPORT
  // ==========================================================================

  async execute(tenantId: string, config: PivotConfig): Promise<ReportResult> {
    const start = Date.now();
    const isSale = config.values.some((v) => v.field.startsWith('sale.')) || config.rows.some((r) => r.startsWith('sale.')) || config.rows.some((r) => r.startsWith('product.')) || config.rows.some((r) => r.startsWith('customer.'));
    const isCollection = config.values.some((v) => v.field.startsWith('collection.')) || config.rows.some((r) => r.startsWith('collection.'));

    let rawRows: any[] = [];
    if (isSale && !isCollection) {
      // Satış pivot
      rawRows = await this.executeSalePivot(tenantId, config);
    } else if (isCollection) {
      rawRows = await this.executeCollectionPivot(tenantId, config);
    } else {
      rawRows = await this.executeStockPivot(tenantId, config);
    }

    return {
      columns: this.buildColumns(config, rawRows),
      rows: rawRows.slice(0, config.limit ?? 1000),
      totals: this.computeTotals(config, rawRows),
      rowCount: rawRows.length,
      duration: Date.now() - start,
      executedAt: new Date().toISOString(),
    };
  }

  private async executeSalePivot(tenantId: string, config: PivotConfig): Promise<any[]> {
    // WHERE clause
    const where: any = { tenantId, isDeleted: false, status: { not: 'CANCELLED' } };
    for (const f of config.filters ?? []) {
      if (f.field === 'sale.date' && f.operator === '>=') where.saleDate = { gte: new Date(f.value) };
      if (f.field === 'sale.date' && f.operator === '<=') where.saleDate = { ...(where.saleDate ?? {}), lte: new Date(f.value) };
    }

    const sales = await this.prisma.client.sale.findMany({
      where,
      include: {
        customer: { select: { id: true, code: true, name: true, city: true, district: true, taxNumber: true, type: true } },
        items: { include: { product: { select: { code: true, name: true, primaryBarcode: true, status: true } } } },
      },
    });

    // Pivot
    const groupMap = new Map<string, any>();
    for (const s of sales) {
      const key = config.rows.map((r) => this.getValue(r, { sale: s, customer: s.customer, product: s.items[0]?.product })).join('|');
      if (!groupMap.has(key)) groupMap.set(key, {});
      const g = groupMap.get(key);
      for (const r of config.rows) g[r] = this.getValue(r, { sale: s, customer: s.customer, product: s.items[0]?.product });
      for (const v of config.values) {
        const val = this.computeAggregate(v, (sales as any[]).filter((x) => this.rowMatches(x, config.rows, key)).flatMap((x) => x.items));
        g[v.alias] = val;
      }
    }
    return Array.from(groupMap.values());
  }

  private async executeCollectionPivot(tenantId: string, config: PivotConfig): Promise<any[]> {
    const where: any = { tenantId, isDeleted: false };
    for (const f of config.filters ?? []) {
      if (f.field === 'collection.date' && f.operator === '>=') where.collectionDate = { gte: new Date(f.value) };
      if (f.field === 'collection.date' && f.operator === '<=') where.collectionDate = { ...(where.collectionDate ?? {}), lte: new Date(f.value) };
    }
    const cols = await this.prisma.client.collection.findMany({ where, include: { customer: { select: { id: true, code: true, name: true } } } });
    const groupMap = new Map<string, any>();
    for (const c of cols) {
      const key = config.rows.map((r) => this.getValue(r, { collection: c, customer: c.customer })).join('|');
      if (!groupMap.has(key)) groupMap.set(key, {});
      const g = groupMap.get(key);
      for (const r of config.rows) g[r] = this.getValue(r, { collection: c, customer: c.customer });
      for (const v of config.values) g[v.alias] = this.computeAggregate(v, cols.filter((x) => this.rowMatchesCollection(x, config.rows, key)));
    }
    return Array.from(groupMap.values());
  }

  private async executeStockPivot(tenantId: string, config: PivotConfig): Promise<any[]> {
    const where: any = { tenantId, isDeleted: false };
    const products = await this.prisma.client.product.findMany({ where, include: { stockMovements: { include: { warehouse: { select: { name: true } } } } } });
    const groupMap = new Map<string, any>();
    for (const p of products) {
      for (const sm of p.stockMovements) {
        const ctx = { stock: { quantity: sm.quantity, minLevel: 0, diff: 0 }, product: p, warehouse: sm.warehouse };
        const key = config.rows.map((r) => this.getValue(r, ctx)).join('|');
        if (!groupMap.has(key)) groupMap.set(key, {});
        const g = groupMap.get(key);
        for (const r of config.rows) g[r] = this.getValue(r, ctx);
        for (const v of config.values) g[v.alias] = this.computeAggregate(v, [sm]);
      }
    }
    return Array.from(groupMap.values());
  }

  private getValue(field: string, ctx: any): any {
    const [scope, key] = field.split('.');
    const obj = ctx[scope];
    if (!obj) return '—';
    return obj[key] ?? '—';
  }

  private rowMatches(s: any, rows: string[], key: string): boolean {
    return rows.every((r, i) => this.getValue(r, { sale: s, customer: s.customer, product: s.items[0]?.product }) === key.split('|')[i]) as any;
  }

  private rowMatchesCollection(c: any, rows: string[], key: string): boolean {
    return rows.every((r, i) => this.getValue(r, { collection: c, customer: c.customer }) === key.split('|')[i]) as any;
  }

  private computeAggregate(v: { field: string; aggregate: string }, items: any[]): number {
    if (items.length === 0) return 0;
    const [scope, key] = v.field.split('.');
    const vals: number[] = [];
    for (const it of items) {
      const obj = it[scope] ?? it;
      const val = Number(obj?.[key] ?? 0);
      if (!isNaN(val)) vals.push(val);
    }
    if (vals.length === 0) return 0;
    switch (v.aggregate) {
      case 'SUM': case 'CUMULATIVE_SUM': return vals.reduce((a, b) => a + b, 0);
      case 'AVG': return vals.reduce((a, b) => a + b, 0) / vals.length;
      case 'MIN': return Math.min(...vals);
      case 'MAX': return Math.max(...vals);
      case 'COUNT': return vals.length;
      case 'DISTINCT_COUNT': return new Set(vals).size;
      default: return vals.reduce((a, b) => a + b, 0);
    }
  }

  private buildColumns(config: PivotConfig, rows: any[]): Array<{ key: string; label: string; type: 'string' | 'number' }> {
    const cols: Array<{ key: string; label: string; type: 'string' | 'number' }> = [];
    for (const r of config.rows) cols.push({ key: r, label: r.split('.').pop() ?? r, type: 'string' });
    for (const v of config.values) cols.push({ key: v.alias, label: `${v.alias} (${v.aggregate})`, type: 'number' });
    return cols;
  }

  private computeTotals(config: PivotConfig, rows: any[]): Record<string, number> {
    const totals: Record<string, number> = {};
    for (const v of config.values) {
      if (v.aggregate === 'SUM' || v.aggregate === 'CUMULATIVE_SUM') {
        totals[v.alias] = rows.reduce((s, r) => s + Number(r[v.alias] ?? 0), 0);
      } else if (v.aggregate === 'AVG' && rows.length > 0) {
        totals[v.alias] = rows.reduce((s, r) => s + Number(r[v.alias] ?? 0), 0) / rows.length;
      } else {
        totals[v.alias] = 0;
      }
    }
    return totals;
  }

  // ==========================================================================
  // SCHEDULED REPORTS
  // =========================================================================>

  async listSchedules(tenantId: string): Promise<any[]> {
    return this.prisma.client.scheduledReport.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async createSchedule(tenantId: string, input: any, userId?: string): Promise<any> {
    return this.prisma.client.scheduledReport.create({ data: { ...input, tenantId, createdById: userId } });
  }

  async toggleSchedule(tenantId: string, id: string): Promise<any> {
    const s = await this.prisma.client.scheduledReport.findFirst({ where: { id, tenantId } });
    if (!s) throw new NotFoundException('Zamanlama bulunamadı');
    return this.prisma.client.scheduledReport.update({ where: { id }, data: { isActive: !s.isActive } });
  }

  async deleteSchedule(tenantId: string, id: string): Promise<void> {
    await this.prisma.client.scheduledReport.deleteMany({ where: { id, tenantId } });
  }

  // ==========================================================================

  private toDto(t: any): ReportTemplate {
    return {
      id: t.id, tenantId: t.tenantId, name: t.name, description: t.description,
      config: t.config as PivotConfig, chartType: t.chartType as ChartType,
      shareScope: t.shareScope as ReportShareScope,
      sharedRoles: t.sharedRoles ?? [], sharedUsers: t.sharedUsers ?? [],
      isFavorite: t.isFavorite, isActive: t.isActive,
      lastRunAt: t.lastRunAt?.toISOString() ?? null, runCount: t.runCount,
      createdById: t.createdById,
      createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString(),
    };
  }
}
