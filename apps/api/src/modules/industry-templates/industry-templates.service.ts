import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';

@Injectable()
export class IndustryTemplatesService {
  // 8 hazır sektör şablonu
  private readonly SEED_TEMPLATES = [
    { code: 'wholesale', name: 'Toptancı', icon: '🏢', sectorKey: 'toptanci', description: 'Toptan satış, bayi yönetimi, vadeli ödeme', config: { activeModules: ['sales', 'cari', 'stock', 'orders', 'pricing', 'collections', 'reports', 'visits', 'targets'], defaultRoles: [{ name: 'Satış Müdürü', permissions: ['sales:read', 'sales:write', 'cari:read', 'stock:read', 'reports:view', 'targets:view', 'visits:view'] }, { name: 'Plasiyer', permissions: ['sales:read', 'sales:write', 'cari:read', 'visits:create', 'visits:checkin', 'visits:checkout', 'targets:view'] }], defaultReports: ['daily_sales', 'collection_report', 'top_customers', 'salesperson_performance'], defaultDashboards: ['sales_dashboard', 'collection_dashboard'] } },
    { code: 'toys', name: 'Oyuncakçı', icon: '🧸', sectorKey: 'oyuncakci', description: 'Oyuncak, oyun, çocuk ürünleri', config: { activeModules: ['sales', 'cari', 'stock', 'orders', 'pricing', 'returns', 'reports', 'targets'], defaultRoles: [{ name: 'Mağaza Müdürü', permissions: ['sales:read', 'sales:write', 'stock:read', 'stock:write', 'reports:view', 'targets:view'] }], defaultReports: ['daily_sales', 'stock_age', 'top_products', 'seasonal_sales'] } },
    { code: 'food', name: 'Gıda Dağıtım', icon: '🥖', sectorKey: 'gida', description: 'Gıda, içecek, hızlı tüketim dağıtımı', config: { activeModules: ['sales', 'cari', 'stock', 'orders', 'collections', 'pricing', 'reports', 'visits', 'targets', 'audit'], defaultRoles: [{ name: 'Dağıtım Sorumlusu', permissions: ['sales:read', 'sales:write', 'stock:read', 'visits:create'] }, { name: 'Şoför/Plasiyer', permissions: ['sales:read', 'sales:write', 'cari:read', 'visits:create', 'visits:checkin', 'visits:checkout'] }], defaultReports: ['sales_by_route', 'expiry_report', 'stock_movement'] } },
    { code: 'textile', name: 'Tekstil', icon: '👕', sectorKey: 'tekstil', description: 'Tekstil, konfeksiyon, kumaş toptan', config: { activeModules: ['sales', 'cari', 'stock', 'orders', 'pricing', 'returns', 'collections', 'reports', 'targets'], defaultRoles: [{ name: 'Modelhane', permissions: ['products:write', 'stock:read'] }, { name: 'Toptan Satış', permissions: ['sales:read', 'sales:write', 'cari:read', 'reports:view'] }], defaultReports: ['sales_by_size', 'sales_by_color', 'collection_aging'] } },
    { code: 'hardware', name: 'Hırdavat', icon: '🔧', sectorKey: 'hirdavat', description: 'Hırdavat, nalbur, yapı malzemeleri', config: { activeModules: ['sales', 'cari', 'stock', 'orders', 'pricing', 'collections', 'reports'], defaultRoles: [{ name: 'Mağaza Sorumlusu', permissions: ['sales:read', 'sales:write', 'stock:read', 'cari:read', 'reports:view'] }], defaultReports: ['slow_moving_stock', 'daily_sales', 'top_products'] } },
    { code: 'stationery', name: 'Kırtasiye', icon: '✏️', sectorKey: 'kirtasiye', description: 'Kırtasiye, ofis malzemeleri, eğitim', config: { activeModules: ['sales', 'cari', 'stock', 'orders', 'pricing', 'reports'], defaultRoles: [{ name: 'Mağaza Sahibi', permissions: ['sales:*', 'stock:*', 'cari:*', 'reports:view'] }], defaultReports: ['daily_sales', 'school_season_sales', 'slow_moving'] } },
    { code: 'warehouse', name: 'Depo/Sayım Odaklı', icon: '🏭', sectorKey: 'depo', description: 'Depo yönetimi, sayım, sevkiyat', config: { activeModules: ['stock', 'sales', 'orders', 'warehouses', 'reports', 'audit'], defaultRoles: [{ name: 'Depo Sorumlusu', permissions: ['stock:*', 'warehouses:*', 'reports:view'] }], defaultReports: ['stock_balance', 'stock_count_variance', 'warehouse_movement'] } },
    { code: 'field_sales', name: 'Saha Satış', icon: '🚚', sectorKey: 'saha', description: 'Saha satış, plasiyer yönetimi, rota', config: { activeModules: ['sales', 'cari', 'stock', 'visits', 'targets', 'collections', 'orders', 'reports', 'pricing'], defaultRoles: [{ name: 'Saha Müdürü', permissions: ['sales:*', 'visits:view_all_team', 'targets:view', 'targets:report'] }, { name: 'Plasiyer', permissions: ['sales:read', 'sales:write', 'cari:read', 'visits:create', 'visits:checkin', 'visits:checkout', 'targets:view'] }], defaultReports: ['salesperson_performance', 'route_performance', 'visit_completion'] } },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async listTemplates(filters: { sectorKey?: string; isActive?: boolean; search?: string }) {
    const where: any = { isSystem: true };
    if (filters.sectorKey) where.sectorKey = filters.sectorKey;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search) where.name = { contains: filters.search, mode: 'insensitive' };
    const t = await this.prisma.client.industryTemplate.findMany({ where, orderBy: { usageCount: 'desc' } });
    return t.map((x) => ({ ...x, createdAt: x.createdAt.toISOString(), updatedAt: x.updatedAt.toISOString(), config: x.config as any }));
  }

  async getTemplate(id: string) {
    const t = await this.prisma.client.industryTemplate.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Şablon bulunamadı');
    return { ...t, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString(), config: t.config as any };
  }

  async seedDefaults() {
    for (const t of this.SEED_TEMPLATES) {
      const existing = await this.prisma.client.industryTemplate.findUnique({ where: { code: t.code } });
      if (!existing) await this.prisma.client.industryTemplate.create({ data: { code: t.code, name: t.name, description: t.description, icon: t.icon, sectorKey: t.sectorKey, config: t.config as any, isSystem: true, isActive: true } });
    }
  }

  async applyTemplate(tenantId: string, templateId: string, userId: string) {
    const template = await this.prisma.client.industryTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new NotFoundException('Şablon bulunamadı');
    const config = template.config as any;
    const applied: any = { appliedModules: [], createdRoleIds: [], skipped: [] };
    // 1) Modülleri aktifleştir
    const moduleMap: Record<string, string> = { sales: 'SALES', cari: 'CUSTOMERS', stock: 'STOCK', products: 'PRODUCTS', orders: 'ORDERS', collections: 'COLLECTIONS', pricing: 'PRICING', returns: 'RETURNS', reports: 'REPORTS', visits: 'VISITS', targets: 'TARGETS', audit: 'AUDIT', warehouses: 'WAREHOUSES' };
    for (const m of (config.activeModules ?? []) as string[]) {
      const code = moduleMap[m];
      if (!code) continue;
      const mod = await this.prisma.client.module.findFirst({ where: { code: code as any } });
      if (!mod) { applied.skipped.push({ type: 'module', key: m, reason: 'modül bulunamadı' }); continue; }
      try {
        await this.prisma.client.tenantModule.upsert({ where: { tenantId_moduleId: { tenantId, moduleId: mod.id } }, create: { tenantId, moduleId: mod.id, isActive: true }, update: { isActive: true } });
        applied.appliedModules.push(code);
      } catch (e: any) { applied.skipped.push({ type: 'module', key: m, reason: e.message }); }
    }
    // 2) Rolleri oluştur
    for (const r of (config.defaultRoles ?? []) as any[]) {
      try {
        const role = await this.prisma.client.role.create({ data: { tenantId, name: r.name, description: `${template.name} - ${r.name}`, isSystem: false, isActive: true } as any });
        applied.createdRoleIds.push(role.id);
      } catch (e: any) { applied.skipped.push({ type: 'role', name: r.name, reason: e.message }); }
    }
    // 3) Kullanım sayısı
    await this.prisma.client.industryTemplate.update({ where: { id: templateId }, data: { usageCount: { increment: 1 } } });
    // 4) Applied kaydı
    await this.prisma.client.tenantAppliedTemplate.create({ data: { tenantId, templateId, templateName: template.name, appliedById: userId, appliedData: applied } });
    return { applied, template: { id: template.id, name: template.name, sectorKey: template.sectorKey } };
  }

  async previewApply(tenantId: string, templateId: string) {
    const template = await this.prisma.client.industryTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new NotFoundException('Şablon bulunamadı');
    const config = template.config as any;
    // Mevcut modüller
    const existing = await this.prisma.client.tenantModule.findMany({ where: { tenantId, isActive: true }, include: { module: true } });
    const moduleMap: Record<string, string> = { sales: 'SALES', cari: 'CUSTOMERS', stock: 'STOCK', products: 'PRODUCTS', orders: 'ORDERS', collections: 'COLLECTIONS', pricing: 'PRICING', returns: 'RETURNS', reports: 'REPORTS', visits: 'VISITS', targets: 'TARGETS', audit: 'AUDIT', warehouses: 'WAREHOUSES' };
    const willAdd: string[] = [];
    for (const m of (config.activeModules ?? []) as string[]) {
      const code = moduleMap[m];
      if (!code) continue;
      if (!existing.find((e: any) => e.module.code === code)) willAdd.push(m);
    }
    const existingRoles = await this.prisma.client.role.findMany({ where: { tenantId, isDeleted: false } });
    const willCreateRoles: string[] = [];
    for (const r of (config.defaultRoles ?? []) as any[]) if (!existingRoles.find((er) => er.name === r.name)) willCreateRoles.push(r.name);
    return { template: { id: template.id, name: template.name, sectorKey: template.sectorKey, icon: template.icon }, willAddModules: willAdd, willCreateRoles, willApplyReports: config.defaultReports?.length ?? 0, willApplyDashboards: config.defaultDashboards?.length ?? 0 };
  }

  async listApplied(tenantId: string) {
    const items = await this.prisma.client.tenantAppliedTemplate.findMany({ where: { tenantId, isActive: true }, orderBy: { createdAt: 'desc' } });
    return items.map((i) => ({ ...i, createdAt: i.createdAt.toISOString(), appliedData: i.appliedData as any }));
  }
}
