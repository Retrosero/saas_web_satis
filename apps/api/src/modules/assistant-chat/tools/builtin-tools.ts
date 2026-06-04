import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.module';
import { ITool, ToolContext, ToolExecutionResult } from './tool.interface';

/**
 * Müşteri/Cari bakiye sorgula
 */
@Injectable()
export class GetCustomerBalanceTool implements ITool {
  code = 'get_customer_balance';
  name = 'Cari Bakiye Sorgula';
  description = 'Belirli bir müşterinin güncel cari bakiyesini getir. Müşteri adı veya kodu ile arar.';
  module = 'cari';
  requiredPermission = 'customers:read';

  definition = {
    type: 'function' as const,
    function: {
      name: 'get_customer_balance',
      description: 'Müşterinin cari bakiyesini sorgula. Müşteri adı, kodu veya telefonu verilebilir.',
      parameters: {
        type: 'object' as const,
        properties: {
          search: { type: 'string', description: 'Müşteri adı, kodu veya telefon numarası' },
        },
        required: ['search'],
      },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async execute(args: { search: string }, ctx: ToolContext): Promise<ToolExecutionResult> {
    const customers = await this.prisma.client.customer.findMany({
      where: {
        tenantId: ctx.tenantId,
        isDeleted: false,
        OR: [
          { name: { contains: args.search, mode: 'insensitive' } },
          { code: { contains: args.search, mode: 'insensitive' } },
          { phone: { contains: args.search } },
          { taxNumber: { contains: args.search } },
        ],
      },
      take: 10,
    });
    if (customers.length === 0) return { success: false, error: 'Müşteri bulunamadı', display: `❌ "${args.search}" ile müşteri bulunamadı` };

    const results = await Promise.all(customers.map(async (c) => {
      const movements = await this.prisma.client.customerMovement.findMany({ where: { tenantId: ctx.tenantId, customerId: c.id } });
      const balance = movements.reduce((sum, m) => sum + Number(m.amount ?? 0), 0);
      return { id: c.id, code: c.code, name: c.name, phone: c.phone, balance, currency: 'TRY' };
    }));

    const first = results[0];
    return {
      success: true,
      data: results,
      display: results.length === 1
        ? `**${first.name}** (${first.code}) cari bakiyesi`
        : `${results.length} müşteri bulundu`,
      table: { headers: ['Kod', 'Ad', 'Telefon', 'Bakiye'], rows: results.map((r) => [r.code, r.name, r.phone ?? '—', r.balance.toLocaleString('tr-TR') + ' TRY']) },
      highlight: results.length === 1 ? { label: first.name, value: first.balance.toLocaleString('tr-TR') + ' TRY', color: first.balance > 0 ? 'red' : 'green' } : undefined,
    };
  }
}

/**
 * Müşterinin bekleyen satışlarını listele
 */
@Injectable()
export class ListCustomerPendingSalesTool implements ITool {
  code = 'list_customer_pending_sales';
  name = 'Bekleyen Satışları Listele';
  description = 'Müşterinin ödenmemiş/eksik ödenmiş satışlarını listeler.';
  module = 'sales';
  requiredPermission = 'sales:read';

  definition = {
    type: 'function' as const,
    function: {
      name: 'list_customer_pending_sales',
      description: 'Bir müşterinin bekleyen (ödenmemiş veya kısmi ödenmiş) satışlarını listeler.',
      parameters: {
        type: 'object' as const,
        properties: {
          customerName: { type: 'string', description: 'Müşteri adı veya kodu' },
        },
        required: ['customerName'],
      },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async execute(args: { customerName: string }, ctx: ToolContext): Promise<ToolExecutionResult> {
    const customer = await this.prisma.client.customer.findFirst({
      where: { tenantId: ctx.tenantId, isDeleted: false, OR: [{ name: { contains: args.customerName, mode: 'insensitive' } }, { code: { contains: args.customerName, mode: 'insensitive' } }] },
    });
    if (!customer) return { success: false, error: 'Müşteri bulunamadı', display: `❌ "${args.customerName}" ile müşteri bulunamadı` };

    const sales = await this.prisma.client.sale.findMany({
      where: { tenantId: ctx.tenantId, customerId: customer.id, status: { in: ['CONFIRMED', 'PARTIALLY_PAID', 'SHIPPED', 'DELIVERED', 'PARTIALLY_SHIPPED', 'OVERDUE'] } },
      orderBy: { saleDate: 'desc' },
      take: 20,
    });

    if (sales.length === 0) return { success: true, display: `✅ **${customer.name}** için bekleyen satış yok`, data: [] };

    return {
      success: true,
      data: sales,
      display: `**${customer.name}** için ${sales.length} bekleyen satış`,
      table: { headers: ['No', 'Tarih', 'Tutar', 'Durum'], rows: sales.map((s) => [s.saleNumber, new Date(s.saleDate).toLocaleDateString('tr-TR'), Number(s.grandTotal).toLocaleString('tr-TR') + ' ' + (s.currency ?? 'TRY'), s.status]) },
    };
  }
}

/**
 * Stokta belirli ürünün durumunu sorgula
 */
@Injectable()
export class CheckProductStockTool implements ITool {
  code = 'check_product_stock';
  name = 'Ürün Stok Sorgula';
  description = 'Ürün adı veya kodu ile stoktaki miktarı, fiyatı ve aktiflik bilgisini getirir.';
  module = 'stock';
  requiredPermission = 'products:read';

  definition = {
    type: 'function' as const,
    function: {
      name: 'check_product_stock',
      description: 'Ürünün stok durumunu depolar bazında gösterir. Ürün adı, kodu veya barkodu verilebilir.',
      parameters: {
        type: 'object' as const,
        properties: {
          search: { type: 'string', description: 'Ürün adı, kodu veya barkodu' },
        },
        required: ['search'],
      },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async execute(args: { search: string }, ctx: ToolContext): Promise<ToolExecutionResult> {
    const products = await this.prisma.client.product.findMany({
      where: {
        tenantId: ctx.tenantId,
        isDeleted: false,
        OR: [
          { name: { contains: args.search, mode: 'insensitive' } },
          { code: { contains: args.search, mode: 'insensitive' } },
          { primaryBarcode: { contains: args.search } },
        ],
      },
      take: 10,
    });
    if (products.length === 0) return { success: false, error: 'Ürün bulunamadı', display: `❌ "${args.search}" ile ürün bulunamadı` };

    const out: any[] = [];
    for (const p of products) {
      // Tüm depolar için stok
      const movements = await this.prisma.client.stockMovement.findMany({ where: { tenantId: ctx.tenantId, productId: p.id } });
      const totalQty = movements.reduce((sum, m) => sum + Number(m.quantity ?? 0), 0);
      const lastPrice = await this.prisma.client.productPrice.findFirst({ where: { tenantId: ctx.tenantId, productId: p.id }, orderBy: { createdAt: 'desc' } });
      out.push({ id: p.id, code: p.code, name: p.name, status: p.status, totalQty, price: lastPrice ? Number((lastPrice as any).price ?? (lastPrice as any).amount) : null, minStock: (p as any).minStockLevel ?? null });
    }

    return {
      success: true,
      data: out,
      display: `${out.length} ürün bulundu`,
      table: { headers: ['Kod', 'Ad', 'Durum', 'Stok', 'Min', 'Fiyat'], rows: out.map((p) => [p.code, p.name, p.status, p.totalQty.toString(), p.minStock?.toString() ?? '—', p.price ? p.price.toLocaleString('tr-TR') + ' TRY' : '—']) },
    };
  }
}

/**
 * Genel dashboard özeti
 */
@Injectable()
export class GetDashboardSummaryTool implements ITool {
  code = 'get_dashboard_summary';
  name = 'Dashboard Özeti';
  description = 'Bugünün/dünün/bu ayın satış, tahsilat, cari bakiye, stok kritik özetini getirir.';
  module = 'reports';
  requiredPermission = 'dashboard:view';

  definition = {
    type: 'function' as const,
    function: {
      name: 'get_dashboard_summary',
      description: 'Şirketin genel performans özetini getir: bugünkü satış, bu ay tahsilat, toplam cari alacak, kritik stok sayısı.',
      parameters: { type: 'object' as const, properties: {}, required: [] },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async execute(_args: any, ctx: ToolContext): Promise<ToolExecutionResult> {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const tenantWhere = { tenantId: ctx.tenantId };

    const [todaySales, monthSales, monthCollections, customers, criticalStock] = await Promise.all([
      this.prisma.client.sale.aggregate({ where: { ...tenantWhere, saleDate: { gte: today } }, _sum: { grandTotal: true }, _count: true }),
      this.prisma.client.sale.aggregate({ where: { ...tenantWhere, saleDate: { gte: startOfMonth } }, _sum: { grandTotal: true } }),
      this.prisma.client.collection.aggregate({ where: { ...tenantWhere, collectionDate: { gte: startOfMonth } }, _sum: { amount: true } }),
      this.prisma.client.customer.findMany({ where: { ...tenantWhere, isDeleted: false }, include: { movements: true } }),
      this.prisma.client.stockMovement.findMany({ where: tenantWhere, include: { product: true } }),
    ]);

    const totalReceivable = customers.reduce((sum, c) => sum + (c as any).movements.reduce((s: number, m: any) => s + Number(m.amount ?? 0), 0), 0);

    // Kritik stok: hareketlerden toplam qty < minStockLevel
    const stockByProduct = new Map<string, { qty: number; minStock: number; name: string }>();
    for (const m of criticalStock) {
      const cur = stockByProduct.get(m.productId) ?? { qty: 0, minStock: (m.product as any).minStockLevel ?? 0, name: (m.product as any).name };
      cur.qty += Number(m.quantity ?? 0);
      stockByProduct.set(m.productId, cur);
    }
    const critical = Array.from(stockByProduct.values()).filter((s) => s.minStock > 0 && s.qty < s.minStock).length;

    return {
      success: true,
      data: {
        todaySales: Number(todaySales._sum.grandTotal ?? 0),
        todaySaleCount: todaySales._count,
        monthSales: Number(monthSales._sum.grandTotal ?? 0),
        monthCollections: Number(monthCollections._sum.amount ?? 0),
        totalReceivable,
        criticalStock: critical,
      },
      display: 'Genel performans özeti',
      highlight: [
        { label: 'Bugün Satış', value: Number(todaySales._sum.grandTotal ?? 0).toLocaleString('tr-TR') + ' TRY', color: 'blue' as any },
        { label: 'Bu Ay Tahsilat', value: Number(monthCollections._sum.amount ?? 0).toLocaleString('tr-TR') + ' TRY', color: 'green' },
        { label: 'Toplam Alacak', value: totalReceivable.toLocaleString('tr-TR') + ' TRY', color: (totalReceivable > 0 ? 'red' : 'green') as any },
        { label: 'Kritik Stok', value: critical.toString(), color: (critical > 0 ? 'amber' : 'green') as any },
      ] as any,
    };
  }
}

/**
 * Tool registry — tüm tool'ları topla
 */
export const BUILTIN_TOOLS: any[] = [
  GetCustomerBalanceTool,
  ListCustomerPendingSalesTool,
  CheckProductStockTool,
  GetDashboardSummaryTool,
];
