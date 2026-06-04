import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.module';
import { ITool, ToolContext, ToolExecutionResult } from './tool.interface';

/**
 * Yeni satış oluştur (destructive — confirmationRequired)
 */
@Injectable()
export class CreateSaleTool implements ITool {
  code = 'create_sale';
  name = 'Yeni Satış Oluştur';
  description = 'Belirtilen müşteri ve ürünler için yeni satış taslağı oluşturur. Onay gerektirir.';
  module = 'sales';
  requiredPermission = 'sales:write';

  definition = {
    type: 'function' as const,
    function: {
      name: 'create_sale',
      description: 'Yeni bir satış kaydı oluşturur. Bu işlem geri alınabilir ama kullanıcı onayı gerekir.',
      parameters: {
        type: 'object' as const,
        properties: {
          customerName: { type: 'string', description: 'Müşteri adı veya kodu' },
          items: {
            type: 'array',
            description: 'Satış kalemleri',
            items: {
              type: 'object',
              properties: {
                productCode: { type: 'string' },
                quantity: { type: 'number' },
                unitPrice: { type: 'number', description: 'Birim fiyat (opsiyonel — ürün kartından alınır)' },
              },
              required: ['productCode', 'quantity'],
            },
          },
          note: { type: 'string', description: 'Satış notu' },
        },
        required: ['customerName', 'items'],
      },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async execute(args: any, ctx: ToolContext): Promise<ToolExecutionResult> {
    // Destructive — confirmation
    if (!args.confirm) {
      const customer = await this.prisma.client.customer.findFirst({ where: { tenantId: ctx.tenantId, isDeleted: false, OR: [{ name: { contains: args.customerName, mode: 'insensitive' } }, { code: args.customerName }] } });
      const lines: string[] = [];
      let total = 0;
      for (const item of args.items) {
        const product = await this.prisma.client.product.findFirst({ where: { tenantId: ctx.tenantId, isDeleted: false, code: item.productCode } });
        if (!product) return { success: false, error: `Ürün bulunamadı: ${item.productCode}`, display: `❌ Ürün bulunamadı: ${item.productCode}` };
        const price = item.unitPrice ?? Number((product as any).salePrice ?? 0);
        const lineTotal = price * item.quantity;
        total += lineTotal;
        lines.push(`- ${product.name} × ${item.quantity} = ${lineTotal.toLocaleString('tr-TR')} TRY`);
      }
      return {
        success: true,
        data: { requiresConfirmation: true, preview: { customer: customer?.name ?? args.customerName, lines, total } },
        display: `⚠️ **ONAY GEREKİYOR**\n\nMüşteri: ${customer?.name ?? args.customerName}\n${lines.join('\n')}\n\n**Toplam: ${total.toLocaleString('tr-TR')} TRY**\n\nBu satışı oluşturmak istiyorsanız "evet, oluştur" yazın veya onay butonunu tıklayın.`,
        highlight: { label: 'Toplam', value: total.toLocaleString('tr-TR') + ' TRY', color: 'blue' },
      };
    }
    if (args.confirm !== true) return { success: false, error: 'Onay verilmedi', display: '❌ Satış oluşturma iptal edildi' };

    // Gerçek oluşturma
    const customer = await this.prisma.client.customer.findFirst({ where: { tenantId: ctx.tenantId, isDeleted: false, OR: [{ name: { contains: args.customerName, mode: 'insensitive' } }, { code: args.customerName }] } });
    if (!customer) throw new NotFoundException('Müşteri bulunamadı');

    const saleNumber = `SL-${Date.now().toString().slice(-8)}`;
    const sale = await this.prisma.client.sale.create({
      data: { tenantId: ctx.tenantId, saleNumber, saleDate: new Date(), customerId: customer.id, currency: 'TRY', status: 'DRAFT', notes: args.note ?? null, createdById: ctx.userId, customerName: customer.name, grandTotal: 0, subTotal: 0 },
    });
    let total = 0;
    for (let i = 0; i < args.items.length; i++) {
      const item = args.items[i];
      const product = await this.prisma.client.product.findFirst({ where: { tenantId: ctx.tenantId, code: item.productCode } });
      if (!product) continue;
      const price = item.unitPrice ?? Number((product as any).salePrice ?? 0);
      const lineTotal = price * item.quantity;
      total += lineTotal;
      await this.prisma.client.saleItem.create({ data: { tenantId: ctx.tenantId, saleId: sale.id, productId: product.id, quantity: item.quantity, unitPrice: price, vatRate: (product as any).vatRate ?? 20, lineSubTotal: lineTotal, lineGrandTotal: lineTotal, sortOrder: i } });
    }
    await this.prisma.client.sale.update({ where: { id: sale.id }, data: { grandTotal: total, subTotal: total } });
    return { success: true, display: `✅ **Satış oluşturuldu**: ${saleNumber} — ${total.toLocaleString('tr-TR')} TRY`, data: { saleId: sale.id, saleNumber, total } };
  }
}

/**
 * Tahsilat kaydet (destructive)
 */
@Injectable()
export class CreateCollectionTool implements ITool {
  code = 'create_collection';
  name = 'Tahsilat Kaydet';
  description = 'Müşteriden tahsilat alır. Onay gerektirir.';
  module = 'collections';
  requiredPermission = 'collections:write';

  definition = {
    type: 'function' as const,
    function: {
      name: 'create_collection',
      description: 'Bir müşteriden tahsilat kaydeder.',
      parameters: {
        type: 'object' as const,
        properties: {
          customerName: { type: 'string' },
          amount: { type: 'number', description: 'Tahsilat tutarı' },
          paymentMethod: { type: 'string', description: 'Nakit/Havale/Kredi Kartı' },
          note: { type: 'string' },
        },
        required: ['customerName', 'amount'],
      },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async execute(args: any, ctx: ToolContext): Promise<ToolExecutionResult> {
    if (!args.confirm) {
      return { success: true, data: { requiresConfirmation: true }, display: `⚠️ **ONAY GEREKİYOR**\n\nMüşteri: ${args.customerName}\nTutar: ${args.amount} TRY\nYöntem: ${args.paymentMethod ?? 'Nakit'}\n\nOnaylıyor musunuz?` };
    }
    const customer = await this.prisma.client.customer.findFirst({ where: { tenantId: ctx.tenantId, isDeleted: false, OR: [{ name: { contains: args.customerName, mode: 'insensitive' } }, { code: args.customerName }] } });
    if (!customer) throw new NotFoundException('Müşteri bulunamadı');
    const collectionNumber = `CO-${Date.now().toString().slice(-8)}`;
    const coll = await this.prisma.client.collection.create({ data: { tenantId: ctx.tenantId, collectionNumber, customerId: customer.id, customerName: customer.name, amount: args.amount, currency: 'TRY', collectionDate: new Date(),  notes: args.note ?? null, createdById: ctx.userId, status: 'COMPLETED' as any } });
    // Müşteri hareketi
    await this.prisma.client.customerMovement.create({ data: { tenantId: ctx.tenantId, customerId: customer.id, type: 'COLLECTION' as any, amount: -args.amount, currency: 'TRY' } as any });
    return { success: true, display: `✅ **Tahsilat kaydedildi**: ${collectionNumber} — ${args.amount} TRY`, data: { collectionId: coll.id, collectionNumber } };
  }
}

/**
 * Ürün ara (detaylı)
 */
@Injectable()
export class SearchProductsTool implements ITool {
  code = 'search_products';
  name = 'Ürün Ara';
  description = 'Ürün arar, fiyat, kategori, durum bilgisi verir.';
  module = 'products';
  requiredPermission = 'products:read';

  definition = {
    type: 'function' as const,
    function: {
      name: 'search_products',
      description: 'Ürün arar — kriterler: ad, kod, barkod, kategori, durum.',
      parameters: {
        type: 'object' as const,
        properties: {
          search: { type: 'string' },
          status: { type: 'string', enum: ['ACTIVE', 'PASSIVE', 'DISCONTINUED', 'DRAFT'] },
          minPrice: { type: 'number' },
          maxPrice: { type: 'number' },
          limit: { type: 'number', description: 'Maks. sonuç (default 20)' },
        },
      },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async execute(args: any, ctx: ToolContext): Promise<ToolExecutionResult> {
    const where: any = { tenantId: ctx.tenantId, isDeleted: false };
    if (args.search) where.OR = [{ name: { contains: args.search, mode: 'insensitive' } }, { code: { contains: args.search, mode: 'insensitive' } }, { primaryBarcode: { contains: args.search } }];
    if (args.status) where.status = args.status;
    const products = await this.prisma.client.product.findMany({ where, take: args.limit ?? 20, orderBy: { name: 'asc' } });
    if (products.length === 0) return { success: false, display: `❌ "${args.search ?? ''}" ile ürün bulunamadı` };
    return {
      success: true, data: products,
      display: `${products.length} ürün bulundu`,
      table: { headers: ['Kod', 'Ad', 'Durum', 'Barkod'], rows: products.map((p) => [p.code, p.name, p.status, (p as any).primaryBarcode ?? '—']) },
    };
  }
}

/**
 * Carileri listele (filtreli)
 */
@Injectable()
export class ListCustomersTool implements ITool {
  code = 'list_customers';
  name = 'Carileri Listele';
  description = 'Cari hesapları listeler — filtreler: tip, bakiye aralığı, şehir.';
  module = 'cari';
  requiredPermission = 'customers:read';

  definition = {
    type: 'function' as const,
    function: {
      name: 'list_customers',
      description: 'Cari hesapları listeler.',
      parameters: {
        type: 'object' as const,
        properties: {
          search: { type: 'string' },
          type: { type: 'string', enum: ['INDIVIDUAL', 'CORPORATE'] },
          city: { type: 'string' },
          hasBalance: { type: 'boolean', description: 'Sadece bakiyesi olanlar' },
          limit: { type: 'number' },
        },
      },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async execute(args: any, ctx: ToolContext): Promise<ToolExecutionResult> {
    const where: any = { tenantId: ctx.tenantId, isDeleted: false };
    if (args.search) where.OR = [{ name: { contains: args.search, mode: 'insensitive' } }, { code: { contains: args.search, mode: 'insensitive' } }];
    if (args.type) where.type = args.type;
    if (args.city) where.city = { contains: args.city, mode: 'insensitive' };
    const customers = await this.prisma.client.customer.findMany({ where, take: args.limit ?? 30, include: { movements: true } });
    let enriched = customers.map((c) => {
      const balance = c.movements.reduce((s, m) => s + Number(m.amount ?? 0), 0);
      return { id: c.id, code: c.code, name: c.name, type: c.type, city: c.city, balance, phone: c.phone };
    });
    if (args.hasBalance) enriched = enriched.filter((c) => c.balance !== 0);
    enriched.sort((a, b) => b.balance - a.balance);

    if (enriched.length === 0) return { success: true, display: 'Filtreye uyan müşteri yok', data: [] };
    const totalBalance = enriched.reduce((s, c) => s + c.balance, 0);
    return {
      success: true, data: enriched, display: `${enriched.length} müşteri listelendi — toplam alacak: ${totalBalance.toLocaleString('tr-TR')} TRY`,
      table: { headers: ['Kod', 'Ad', 'Tip', 'Şehir', 'Bakiye'], rows: enriched.map((c) => [c.code, c.name, c.type, c.city ?? '—', c.balance.toLocaleString('tr-TR') + ' TRY']) },
      highlight: { label: 'Toplam Alacak', value: totalBalance.toLocaleString('tr-TR') + ' TRY', color: totalBalance > 0 ? 'red' : 'green' },
    };
  }
}

/**
 * Bugün yapılan satışlar
 */
@Injectable()
export class TodaySalesTool implements ITool {
  code = 'today_sales';
  name = 'Bugünkü Satışlar';
  description = 'Bugün yapılan tüm satışları listeler, toplam tutarı verir.';
  module = 'sales';
  requiredPermission = 'sales:read';

  definition = {
    type: 'function' as const,
    function: { name: 'today_sales', description: 'Bugünkü satışları özetler.', parameters: { type: 'object' as const, properties: {} } },
  };

  constructor(private readonly prisma: PrismaService) {}

  async execute(_args: any, ctx: ToolContext): Promise<ToolExecutionResult> {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const sales = await this.prisma.client.sale.findMany({ where: { tenantId: ctx.tenantId, saleDate: { gte: today } }, include: { customer: true }, orderBy: { saleDate: 'desc' } });
    const total = sales.reduce((s, x) => s + Number(x.grandTotal ?? 0), 0);
    if (sales.length === 0) return { success: true, display: 'Bugün hiç satış yapılmamış' };
    return {
      success: true, data: sales,
      display: `Bugün **${sales.length} satış**, toplam **${total.toLocaleString('tr-TR')} TRY**`,
      table: { headers: ['No', 'Saat', 'Müşteri', 'Tutar', 'Durum'], rows: sales.map((s) => [s.saleNumber, new Date(s.saleDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), s.customerName ?? '—', Number(s.grandTotal).toLocaleString('tr-TR') + ' TRY', s.status]) },
      highlight: { label: 'Bugün Toplam', value: total.toLocaleString('tr-TR') + ' TRY', color: 'green' },
    };
  }
}

/**
 * En çok satan ürünler
 */
@Injectable()
export class TopProductsTool implements ITool {
  code = 'top_products';
  name = 'En Çok Satan Ürünler';
  description = 'Belirli bir tarih aralığında en çok satan ürünleri getirir.';
  module = 'reports';
  requiredPermission = 'reports:view';

  definition = {
    type: 'function' as const,
    function: {
      name: 'top_products',
      description: 'En çok satan ürünleri getirir.',
      parameters: {
        type: 'object' as const,
        properties: {
          days: { type: 'number', description: 'Son kaç gün (default 30)' },
          limit: { type: 'number', description: 'Kaç ürün (default 10)' },
        },
      },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async execute(args: any, ctx: ToolContext): Promise<ToolExecutionResult> {
    const days = args.days ?? 30;
    const limit = args.limit ?? 10;
    const since = new Date(); since.setDate(since.getDate() - days);
    const items = await this.prisma.client.saleItem.findMany({ where: { tenantId: ctx.tenantId, sale: { saleDate: { gte: since } } }, include: { product: true } });
    const grouped = new Map<string, { product: any; qty: number; total: number }>();
    for (const it of items) {
      const key = it.productId;
      const cur = grouped.get(key) ?? { product: it.product, qty: 0, total: 0 };
      cur.qty += Number(it.quantity);
      cur.total += Number(it.lineGrandTotal ?? 0);
      grouped.set(key, cur);
    }
    const sorted = Array.from(grouped.values()).sort((a, b) => b.qty - a.qty).slice(0, limit);
    if (sorted.length === 0) return { success: true, display: `Son ${days} günde satış yok` };
    return {
      success: true, data: sorted,
      display: `Son ${days} günde en çok satan ${sorted.length} ürün`,
      table: { headers: ['#', 'Kod', 'Ürün', 'Adet', 'Tutar'], rows: sorted.map((g, i) => [i + 1, g.product.code, g.product.name, g.qty.toString(), g.total.toLocaleString('tr-TR') + ' TRY']) },
    };
  }
}

/**
 * Vadesi yaklaşan / geçen tahsilatlar
 */
@Injectable()
export class OverdueCollectionsTool implements ITool {
  code = 'overdue_collections';
  name = 'Vadesi Geçen Tahsilatlar';
  description = 'Vadesi geçmiş veya yaklaşan tahsilatları listeler.';
  module = 'collections';
  requiredPermission = 'collections:read';

  definition = {
    type: 'function' as const,
    function: {
      name: 'overdue_collections',
      description: 'Vadesi geçen veya yaklaşan tahsilatları listeler.',
      parameters: { type: 'object' as const, properties: { daysAhead: { type: 'number', description: 'Kaç gün ileriye bak (default 7)' } } },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async execute(args: any, ctx: ToolContext): Promise<ToolExecutionResult> {
    const daysAhead = args.daysAhead ?? 7;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const future = new Date(today); future.setDate(today.getDate() + daysAhead);
    const sales = await this.prisma.client.sale.findMany({
      where: { tenantId: ctx.tenantId, status: { in: ['CONFIRMED', 'PARTIALLY_PAID', 'SHIPPED', 'DELIVERED', 'OVERDUE'] } },
      include: { customer: true, collections: true },
      orderBy: { saleDate: 'asc' },
      take: 30,
    });
    const out: any[] = [];
    for (const s of sales) {
      const paid = s.collections.reduce((sum, c) => sum + Number(c.amount ?? 0), 0);
      const remaining = Number(s.grandTotal ?? 0) - paid;
      if (remaining <= 0) continue;
      // Vade tarihi = saleDate + 30 gün (varsayılan)
      const dueDate = new Date(s.saleDate); dueDate.setDate(dueDate.getDate() + 30);
      const daysDiff = Math.floor((dueDate.getTime() - today.getTime()) / 86400_000);
      if (daysDiff <= daysAhead) {
        out.push({ saleNumber: s.saleNumber, customer: s.customerName, amount: remaining, dueDate, daysDiff });
      }
    }
    out.sort((a, b) => a.daysDiff - b.daysDiff);
    if (out.length === 0) return { success: true, display: `Önümüzdeki ${daysAhead} gün içinde vadesi geçen tahsilat yok 🎉` };
    const totalAmount = out.reduce((s, x) => s + x.amount, 0);
    return {
      success: true, data: out,
      display: `${out.length} vadesi geçen/yaklaşan tahsilat — toplam ${totalAmount.toLocaleString('tr-TR')} TRY`,
      table: { headers: ['No', 'Müşteri', 'Tutar', 'Vade', 'Durum'], rows: out.map((o) => [o.saleNumber, o.customer, o.amount.toLocaleString('tr-TR') + ' TRY', o.dueDate.toLocaleDateString('tr-TR'), o.daysDiff < 0 ? `${Math.abs(o.daysDiff)} gün gecikme` : o.daysDiff === 0 ? 'BUGÜN' : `${o.daysDiff} gün kaldı`]) },
      highlight: { label: 'Toplam', value: totalAmount.toLocaleString('tr-TR') + ' TRY', color: 'red' },
    };
  }
}

/**
 * Tool registry — yeni tool'lar
 */
export const BUILTIN_TOOLS_V2: any[] = [
  CreateSaleTool,
  CreateCollectionTool,
  SearchProductsTool,
  ListCustomersTool,
  TodaySalesTool,
  TopProductsTool,
  OverdueCollectionsTool,
];
