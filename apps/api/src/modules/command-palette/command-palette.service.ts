import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';

@Injectable()
export class CommandPaletteService implements OnModuleInit {
  private readonly logger = new Logger(CommandPaletteService.name);

  // 12 hazır komut
  private readonly SEED_COMMANDS: any[] = [
    { code: 'new_sale', name: 'Yeni Satış Oluştur', description: 'Yeni satış faturası oluştur', category: 'CREATE', targetRoute: '/sales/new', requiredPermission: 'sales:write', requiredModule: 'SALES', icon: '🛒', shortcut: 'Ctrl+Shift+N' },
    { code: 'new_customer', name: 'Yeni Cari Ekle', description: 'Yeni müşteri/tedarikçi kartı aç', category: 'CREATE', targetRoute: '/customers/new', requiredPermission: 'customers:write', requiredModule: 'CUSTOMERS', icon: '👥', shortcut: 'Ctrl+Shift+C' },
    { code: 'new_product', name: 'Yeni Ürün Ekle', description: 'Yeni ürün kartı oluştur', category: 'CREATE', targetRoute: '/products/new', requiredPermission: 'products:write', requiredModule: 'PRODUCTS', icon: '📦', shortcut: 'Ctrl+Shift+P' },
    { code: 'new_collection', name: 'Tahsilat Al', description: 'Müşteriden tahsilat kaydet', category: 'CREATE', targetRoute: '/collections/new', requiredPermission: 'collections:write', requiredModule: 'COLLECTIONS', icon: '💰' },
    { code: 'new_order', name: 'Sipariş Oluştur', description: 'Yeni sipariş kaydı', category: 'CREATE', targetRoute: '/orders/new', requiredPermission: 'orders:write', requiredModule: 'ORDERS', icon: '📋' },
    { code: 'new_quote', name: 'Teklif Oluştur', description: 'Müşteriye teklif hazırla', category: 'CREATE', targetRoute: '/quotes/new', requiredPermission: 'quotes:create', requiredModule: 'SALES', icon: '📄' },
    { code: 'stock_count', name: 'Stok Sayımı Başlat', description: 'Depo sayım işlemi başlat', category: 'ACTION', targetRoute: '/stock/count', requiredPermission: 'stock:write', requiredModule: 'STOCK', icon: '🔢' },
    { code: 'weekly_sales', name: 'Haftalık Satış Raporu', description: 'Bu haftanın satış performansı', category: 'NAVIGATION', targetRoute: '/reports/weekly-sales', requiredPermission: 'reports:view', requiredModule: 'REPORTS', icon: '📈' },
    { code: 'customer_balance', name: 'Cari Bakiye Raporu', description: 'Tüm carilerin bakiye dökümü', category: 'NAVIGATION', targetRoute: '/reports/customer-balance', requiredPermission: 'reports:view', requiredModule: 'REPORTS', icon: '💼' },
    { code: 'add_user', name: 'Kullanıcı Ekle', description: 'Yeni çalışan davet et', category: 'CREATE', targetRoute: '/users/new', requiredPermission: 'users:write', requiredModule: null, icon: '👤' },
    { code: 'log_center', name: 'Log Merkezi', description: 'Sistem loglarını gör', category: 'NAVIGATION', targetRoute: '/logs', requiredPermission: 'logs:view', requiredModule: null, icon: '📜' },
    { code: 'ai_assistant', name: 'AI Asistan', description: 'Yapay zeka ile sohbet başlat', category: 'NAVIGATION', targetRoute: '/assistant-chat', requiredPermission: null, requiredModule: null, icon: '🤖' },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    for (const c of this.SEED_COMMANDS) {
      const existing = await this.prisma.client.commandDefinition.findUnique({ where: { code: c.code } });
      if (!existing) await this.prisma.client.commandDefinition.create({ data: c });
    }
    this.logger.log(`${this.SEED_COMMANDS.length} komut tanımı seed edildi`);
  }

  async list(filters: { category?: string; search?: string }) {
    const where: any = { isActive: true };
    if (filters.category) where.category = filters.category;
    if (filters.search) where.name = { contains: filters.search, mode: 'insensitive' };
    return this.prisma.client.commandDefinition.findMany({ where, orderBy: { sortOrder: 'asc' } });
  }
}
