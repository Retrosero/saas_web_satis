import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import { DemoDataSize } from '@saas/shared';

@Injectable()
export class DemoCompanyService {
  private readonly logger = new Logger(DemoCompanyService.name);

  // Demo paket boyutları
  private readonly SIZE_CONFIG: Record<DemoDataSize, any> = {
    SMALL: { customerCount: 50, productCount: 100, brandCount: 10, categoryCount: 8, saleCount: 200, collectionCount: 150, days: 30 },
    MEDIUM: { customerCount: 200, productCount: 500, brandCount: 25, categoryCount: 20, saleCount: 1000, collectionCount: 800, days: 60 },
    LARGE: { customerCount: 1000, productCount: 2000, brandCount: 50, categoryCount: 40, saleCount: 5000, collectionCount: 4000, days: 90 },
  };

  private readonly PRODUCT_NAMES = ['Ürün A', 'Ürün B', 'Ürün C', 'Ürün D', 'Premium Ürün', 'Ekonomik Ürün', 'Standart Ürün', 'Özel Ürün', 'Mega Paket', 'Mini Paket'];
  private readonly CUSTOMER_NAMES = ['ABC Ltd. Şti.', 'XYZ A.Ş.', 'Tekno Market', 'Mega Mağaza', 'Altın Ticaret', 'Yıldız Gıda', 'Güneş Tekstil', 'Mavi Hırdavat', 'Kırmızı Kırtasiye', 'Yeşil Market', 'Demir Sanayi', 'Altay Dağıtım', 'Asya İnşaat', 'Avrupa Mobilya', 'Akdeniz Turizm', 'Ege Lojistik'];
  private readonly CITIES = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Kayseri', 'Mersin'];

  constructor(private readonly prisma: PrismaService) {}

  // ===== Demo Data Templates =====
  async seedDemoTemplates() {
    const seeds: any[] = [
      { code: 'small_demo', name: 'Küçük Demo', size: DemoDataSize.SMALL, description: 'Satış sunumları için 50 cari, 100 ürün', config: this.SIZE_CONFIG.SMALL },
      { code: 'medium_demo', name: 'Orta Demo', size: DemoDataSize.MEDIUM, description: 'Eğitim için 200 cari, 500 ürün', config: this.SIZE_CONFIG.MEDIUM },
      { code: 'large_demo', name: 'Geniş Demo', size: DemoDataSize.LARGE, description: 'Yük test için 1000 cari, 2000 ürün', config: this.SIZE_CONFIG.LARGE },
    ];
    for (const s of seeds) {
      const existing = await this.prisma.client.demoDataTemplate.findUnique({ where: { code: s.code } });
      if (!existing) await this.prisma.client.demoDataTemplate.create({ data: s });
    }
  }

  async listTemplates() {
    return this.prisma.client.demoDataTemplate.findMany({ where: { isActive: true } });
  }

  // ===== Demo Company =====
  async listCompanies(tenantId?: string) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    const items = await this.prisma.client.demoCompany.findMany({ where, include: { tenant: true }, orderBy: { createdAt: 'desc' } });
    return items.map((c: any) => ({ ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString(), lastResetAt: c.lastResetAt?.toISOString(), convertedAt: c.convertedAt?.toISOString() }));
  }

  async getCompany(id: string) {
    const c = await this.prisma.client.demoCompany.findUnique({ where: { id }, include: { tenant: true } });
    if (!c) throw new NotFoundException('Demo firma bulunamadı');
    return { ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() };
  }

  async createDemoCompany(tenantId: string, input: { size: DemoDataSize; templateCode: string }, userId: string) {
    const cfg = this.SIZE_CONFIG[input.size];
    const start = Date.now();
    const demo = await this.prisma.client.demoCompany.create({ data: { tenantId, size: input.size, templateCode: input.templateCode, isActive: true, state: { ...cfg, version: 1 } as any } });
    // Seed data
    const stats = await this.seedDemoData(tenantId, cfg);
    const durationMs = Date.now() - start;
    await this.prisma.client.demoSeedLog.create({ data: { demoCompanyId: demo.id, action: 'SEEDED', size: input.size, data: { ...stats, durationMs } as any, createdById: userId } });
    return { demo: { ...demo, createdAt: demo.createdAt.toISOString(), updatedAt: demo.updatedAt.toISOString() }, stats: { ...stats, durationMs } };
  }

  async resetDemo(tenantId: string, userId: string) {
    const demo = await this.prisma.client.demoCompany.findUnique({ where: { tenantId } });
    if (!demo) throw new NotFoundException('Demo firma bulunamadı');
    const start = Date.now();
    await this.deleteDemoData(tenantId);
    const stats = await this.seedDemoData(tenantId, this.SIZE_CONFIG[demo.size]);
    const durationMs = Date.now() - start;
    await this.prisma.client.demoSeedLog.create({ data: { demoCompanyId: demo.id, action: 'RESET', size: demo.size, data: { ...stats, durationMs } as any, createdById: userId } });
    await this.prisma.client.demoCompany.update({ where: { id: demo.id }, data: { resetCount: { increment: 1 }, lastResetAt: new Date() } });
    return { stats: { ...stats, durationMs } };
  }

  async convertToReal(tenantId: string, userId: string) {
    const demo = await this.prisma.client.demoCompany.findUnique({ where: { tenantId } });
    if (!demo) throw new NotFoundException('Demo firma bulunamadı');
    // Tenant'ı gerçek moda al
    await this.prisma.client.tenant.update({ where: { id: tenantId }, data: { workingMode: 'SAAS_MASTER', status: 'ACTIVE' } });
    await this.prisma.client.demoCompany.update({ where: { id: demo.id }, data: { convertedAt: new Date(), isActive: false } });
    await this.prisma.client.demoSeedLog.create({ data: { demoCompanyId: demo.id, action: 'CONVERTED', size: demo.size, createdById: userId } });
    return { ok: true, message: 'Demo firma gerçek firmaya dönüştürüldü' };
  }

  // ===== Seed =====
  private async seedDemoData(tenantId: string, cfg: any) {
    const stats = { customerCount: 0, productCount: 0, brandCount: 0, categoryCount: 0, saleCount: 0, collectionCount: 0 };
    // Markalar
    const brands: any[] = [];
    for (let i = 0; i < cfg.brandCount; i++) brands.push({ tenantId, name: `Marka ${i + 1}`, isActive: true, createdAt: new Date() });
    if (brands.length) await this.prisma.client.brand.createMany({ data: brands });
    stats.brandCount = brands.length;
    // Kategoriler
    const categories: any[] = [];
    for (let i = 0; i < cfg.categoryCount; i++) categories.push({ tenantId, name: `Kategori ${i + 1}`, isActive: true, createdAt: new Date() });
    if (categories.length) await this.prisma.client.productCategory.createMany({ data: categories });
    stats.categoryCount = categories.length;
    // Ürünler
    const products: any[] = [];
    for (let i = 0; i < cfg.productCount; i++) {
      products.push({ tenantId, code: `DEMO-${String(i + 1).padStart(5, '0')}`, name: `${this.PRODUCT_NAMES[i % this.PRODUCT_NAMES.length]} #${i + 1}`, primaryBarcode: `869${String(1000000000 + i)}`, type: 'GOODS' as any, status: 'ACTIVE' as any, salePrice: Math.floor(50 + Math.random() * 500), costPrice: Math.floor(30 + Math.random() * 300), vatRate: 20, brandId: brands[i % brands.length]?.id, categoryId: categories[i % categories.length]?.id, createdAt: new Date() });
    }
    for (let i = 0; i < products.length; i += 100) await this.prisma.client.product.createMany({ data: products.slice(i, i + 100) });
    stats.productCount = products.length;
    // Müşteriler
    const customers: any[] = [];
    for (let i = 0; i < cfg.customerCount; i++) customers.push({ tenantId, code: `M${String(1000 + i)}`, name: `${this.CUSTOMER_NAMES[i % this.CUSTOMER_NAMES.length]} ${i + 1}`, type: i % 2 === 0 ? 'CORPORATE' : 'INDIVIDUAL' as any, city: this.CITIES[i % this.CITIES.length], phone: `+90555${String(1000000 + i).padStart(7, '0')}`, email: `demo${i}@firma.local`, taxNumber: `${1000000000 + i}`, isActive: true, createdAt: new Date() });
    for (let i = 0; i < customers.length; i += 100) await this.prisma.client.customer.createMany({ data: customers.slice(i, i + 100) });
    stats.customerCount = customers.length;
    // Satışlar
    const now = Date.now();
    const dayMs = 86400_000;
    for (let i = 0; i < cfg.saleCount; i++) {
      const cust = customers[i % customers.length];
      const product = products[i % products.length];
      const qty = 1 + Math.floor(Math.random() * 10);
      const price = Number(product.salePrice) * qty;
      const date = new Date(now - Math.floor(Math.random() * cfg.days) * dayMs);
      await this.prisma.client.sale.create({ data: { tenantId, saleNumber: `SLS-${String(100000 + i).padStart(6, '0')}`, saleDate: date, customerId: cust.id, customerName: cust.name, currency: 'TRY', status: 'PAID' as any, grandTotal: price, subTotal: price, createdAt: date, createdById: 'demo-seed' } });
    }
    stats.saleCount = cfg.saleCount;
    return stats;
  }

  private async deleteDemoData(tenantId: string) {
    // Demo verileri sil — sırayla
    await this.prisma.client.sale.deleteMany({ where: { tenantId, createdById: 'demo-seed' } });
    await this.prisma.client.customer.deleteMany({ where: { tenantId, code: { startsWith: 'M' } } });
    await this.prisma.client.product.deleteMany({ where: { tenantId, code: { startsWith: 'DEMO-' } } });
    await this.prisma.client.productCategory.deleteMany({ where: { tenantId, name: { startsWith: 'Kategori' } } });
    await this.prisma.client.brand.deleteMany({ where: { tenantId, name: { startsWith: 'Marka' } } });
  }
}
