/**
 * Seed script — modüller, planlar, permission katalogu, sistem rolleri, süper admin.
 *
 * Çalıştırma: `pnpm --filter @saas/api prisma:seed`
 */
import { PrismaClient, Prisma } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

interface ModuleSeed { code: string; name: string; category: 'core' | 'operations' | 'finance' | 'hr' | 'integration' | 'addon'; defaultRoute: string; icon: string; sortOrder: number; description: string; }
interface PermissionSeed { code: string; module: string; resource: string; action: 'view' | 'read' | 'create' | 'update' | 'delete' | 'export' | 'import' | 'print' | 'approve' | 'cancel' | 'manage'; description: string; }
interface PlanSeed { code: 'starter' | 'standard' | 'professional' | 'enterprise' | 'custom'; name: string; description: string; monthlyPrice: number; yearlyPrice: number; userLimit: number; branchLimit: number; warehouseLimit: number; apiKeyLimit: number; webhookLimit: number; storageMbLimit: number; modules: string[]; }

const MODULES: ModuleSeed[] = [
  { code: 'dashboard', name: 'Panel', category: 'core', defaultRoute: '/dashboard', icon: 'dashboard', sortOrder: 10, description: 'Ana kontrol paneli ve KPI özetleri' },
  { code: 'cari', name: 'Cari Hesaplar', category: 'operations', defaultRoute: '/customers', icon: 'group', sortOrder: 20, description: 'Müşteri ve tedarikçi cari hesap yönetimi' },
  { code: 'stok', name: 'Stok Yönetimi', category: 'operations', defaultRoute: '/products', icon: 'inventory_2', sortOrder: 30, description: 'Ürün, barkod, marka, kategori ve stok takibi' },
  { code: 'satis', name: 'Satış', category: 'operations', defaultRoute: '/sales', icon: 'point_of_sale', sortOrder: 40, description: 'Satış işlemleri, sepet ve fiş yönetimi' },
  { code: 'siparis', name: 'Siparişler', category: 'operations', defaultRoute: '/orders', icon: 'shopping_cart', sortOrder: 50, description: 'Müşteri ve tedarik sipariş takibi' },
  { code: 'tahsilat', name: 'Tahsilat', category: 'finance', defaultRoute: '/collections', icon: 'payments', sortOrder: 60, description: 'Cari tahsilat ve ödeme kayıtları' },
  { code: 'kasa', name: 'Kasa', category: 'finance', defaultRoute: '/cash', icon: 'account_balance_wallet', sortOrder: 70, description: 'Kasa tanımları ve nakit hareketleri' },
  { code: 'banka', name: 'Banka', category: 'finance', defaultRoute: '/bank', icon: 'account_balance', sortOrder: 75, description: 'Banka hesapları ve hareketleri' },
  { code: 'pos', name: 'POS', category: 'finance', defaultRoute: '/pos', icon: 'credit_card', sortOrder: 78, description: 'POS cihaz tanımları ve işlemleri' },
  { code: 'depo', name: 'Depo', category: 'operations', defaultRoute: '/warehouses', icon: 'warehouse', sortOrder: 80, description: 'Depo yönetimi' },
  { code: 'sayim', name: 'Stok Sayım', category: 'operations', defaultRoute: '/stock-counts', icon: 'fact_check', sortOrder: 85, description: 'Sayım başlık ve kalemleri' },
  { code: 'iade', name: 'İade', category: 'operations', defaultRoute: '/returns', icon: 'assignment_return', sortOrder: 88, description: 'Satış ve alım iadeleri' },
  { code: 'raporlar', name: 'Raporlar', category: 'operations', defaultRoute: '/reports', icon: 'analytics', sortOrder: 100, description: 'Günlük satış, cari bakiye, stok ve tahsilat raporları' },
  { code: 'ik', name: 'İnsan Kaynakları', category: 'hr', defaultRoute: '/hr', icon: 'badge', sortOrder: 110, description: 'Personel yönetimi' },
  { code: 'zimmet', name: 'Zimmet', category: 'hr', defaultRoute: '/assignments', icon: 'inventory', sortOrder: 115, description: 'Personel zimmet takibi' },
  { code: 'servis', name: 'Servis / Bakım', category: 'operations', defaultRoute: '/service', icon: 'build', sortOrder: 120, description: 'Servis ve bakım talepleri' },
  { code: 'bayi_portali', name: 'Bayi Portalı', category: 'addon', defaultRoute: '/portal', icon: 'storefront', sortOrder: 130, description: 'Bayi ve müşteri portalı' },
  { code: 'api_webhook', name: 'API & Webhook', category: 'integration', defaultRoute: '/api-webhooks', icon: 'webhook', sortOrder: 140, description: 'Public API ve webhook entegrasyonları' },
  { code: 'erp_entegrasyon', name: 'ERP Entegrasyonu', category: 'integration', defaultRoute: '/erp', icon: 'sync_alt', sortOrder: 145, description: 'Mikro, Logo, Netsis, Paraşüt adaptörleri' },
  { code: 'veri_tasima', name: 'Veri Taşıma', category: 'integration', defaultRoute: '/import', icon: 'upload_file', sortOrder: 150, description: 'Excel ve ERP veri taşıma' },
  { code: 'log_audit', name: 'Log & Audit', category: 'core', defaultRoute: '/logs', icon: 'history', sortOrder: 200, description: 'Sistem işlem ve hata logları' },
  { code: 'destek', name: 'Destek Merkezi', category: 'addon', defaultRoute: '/support', icon: 'help', sortOrder: 205, description: 'Destek talepleri' },
  { code: 'bildirim', name: 'Bildirimler', category: 'core', defaultRoute: '/notifications', icon: 'notifications', sortOrder: 210, description: 'Sistem bildirimleri ve görevler' },
  { code: 'asistan', name: 'Akıllı Asistan', category: 'addon', defaultRoute: '/assistant', icon: 'smart_toy', sortOrder: 220, description: 'Modül yardımı ve bilgi tabanı' },
  { code: 'ayarlar', name: 'Ayarlar', category: 'core', defaultRoute: '/settings', icon: 'settings', sortOrder: 900, description: 'Firma, kullanıcı ve sistem ayarları' },
];

const PERMISSIONS: PermissionSeed[] = [
  { code: 'cari:customer:view', module: 'cari', resource: 'customer', action: 'view', description: 'Cari listesi/detayı görüntüleme' },
  { code: 'cari:customer:create', module: 'cari', resource: 'customer', action: 'create', description: 'Cari oluşturma' },
  { code: 'cari:customer:update', module: 'cari', resource: 'customer', action: 'update', description: 'Cari düzenleme' },
  { code: 'cari:customer:delete', module: 'cari', resource: 'customer', action: 'delete', description: 'Cari silme' },
  { code: 'cari:customer:export', module: 'cari', resource: 'customer', action: 'export', description: 'Cari dışa aktarma' },
  { code: 'cari:customer:import', module: 'cari', resource: 'customer', action: 'import', description: 'Cari içe aktarma' },
  { code: 'stok:product:view', module: 'stok', resource: 'product', action: 'view', description: 'Ürün görüntüleme' },
  { code: 'stok:product:create', module: 'stok', resource: 'product', action: 'create', description: 'Ürün oluşturma' },
  { code: 'stok:product:update', module: 'stok', resource: 'product', action: 'update', description: 'Ürün düzenleme' },
  { code: 'stok:product:delete', module: 'stok', resource: 'product', action: 'delete', description: 'Ürün silme' },
  { code: 'stok:product:export', module: 'stok', resource: 'product', action: 'export', description: 'Ürün dışa aktarma' },
  { code: 'stok:product:import', module: 'stok', resource: 'product', action: 'import', description: 'Ürün içe aktarma' },
  { code: 'satis:sale:view', module: 'satis', resource: 'sale', action: 'view', description: 'Satış görüntüleme' },
  { code: 'satis:sale:create', module: 'satis', resource: 'sale', action: 'create', description: 'Satış oluşturma' },
  { code: 'satis:sale:update', module: 'satis', resource: 'sale', action: 'update', description: 'Satış düzenleme' },
  { code: 'satis:sale:cancel', module: 'satis', resource: 'sale', action: 'cancel', description: 'Satış iptal' },
  { code: 'satis:sale:export', module: 'satis', resource: 'sale', action: 'export', description: 'Satış dışa aktarma' },
  { code: 'siparis:order:view', module: 'siparis', resource: 'order', action: 'view', description: 'Sipariş görüntüleme' },
  { code: 'siparis:order:create', module: 'siparis', resource: 'order', action: 'create', description: 'Sipariş oluşturma' },
  { code: 'siparis:order:update', module: 'siparis', resource: 'order', action: 'update', description: 'Sipariş düzenleme' },
  { code: 'siparis:order:cancel', module: 'siparis', resource: 'order', action: 'cancel', description: 'Sipariş iptal' },
  { code: 'tahsilat:collection:view', module: 'tahsilat', resource: 'collection', action: 'view', description: 'Tahsilat görüntüleme' },
  { code: 'tahsilat:collection:create', module: 'tahsilat', resource: 'collection', action: 'create', description: 'Tahsilat oluşturma' },
  { code: 'tahsilat:collection:cancel', module: 'tahsilat', resource: 'collection', action: 'cancel', description: 'Tahsilat iptal' },
  { code: 'kasa:cash_account:view', module: 'kasa', resource: 'cash_account', action: 'view', description: 'Kasa görüntüleme' },
  { code: 'kasa:cash_account:create', module: 'kasa', resource: 'cash_account', action: 'create', description: 'Kasa oluşturma' },
  { code: 'kasa:cash_movement:view', module: 'kasa', resource: 'cash_movement', action: 'view', description: 'Kasa hareketi görüntüleme' },
  { code: 'kasa:cash_movement:create', module: 'kasa', resource: 'cash_movement', action: 'create', description: 'Kasa hareketi oluşturma' },
  { code: 'raporlar:report:view', module: 'raporlar', resource: 'report', action: 'view', description: 'Rapor görüntüleme' },
  { code: 'raporlar:report:export', module: 'raporlar', resource: 'report', action: 'export', description: 'Rapor dışa aktarma' },
  { code: 'log_audit:audit_log:view', module: 'log_audit', resource: 'audit_log', action: 'view', description: 'Audit log görüntüleme' },
  { code: 'ayarlar:user:view', module: 'ayarlar', resource: 'user', action: 'view', description: 'Kullanıcı görüntüleme' },
  { code: 'ayarlar:user:create', module: 'ayarlar', resource: 'user', action: 'create', description: 'Kullanıcı oluşturma' },
  { code: 'ayarlar:user:update', module: 'ayarlar', resource: 'user', action: 'update', description: 'Kullanıcı düzenleme' },
  { code: 'ayarlar:user:delete', module: 'ayarlar', resource: 'user', action: 'delete', description: 'Kullanıcı silme' },
  { code: 'ayarlar:role:manage', module: 'ayarlar', resource: 'role', action: 'manage', description: 'Rol yönetimi' },
  { code: 'ayarlar:tenant:manage', module: 'ayarlar', resource: 'tenant', action: 'manage', description: 'Firma yönetimi' },
  { code: 'bildirim:notification:view', module: 'bildirim', resource: 'notification', action: 'view', description: 'Bildirim görüntüleme' },
  { code: 'bildirim:notification:update', module: 'bildirim', resource: 'notification', action: 'update', description: 'Bildirim güncelleme' },
];

const PLANS: PlanSeed[] = [
  { code: 'starter', name: 'Başlangıç', description: 'Küçük işletmeler için temel modüller', monthlyPrice: 499, yearlyPrice: 4990, userLimit: 3, branchLimit: 1, warehouseLimit: 1, apiKeyLimit: 0, webhookLimit: 0, storageMbLimit: 2048, modules: ['dashboard', 'cari', 'stok', 'satis', 'tahsilat', 'kasa', 'raporlar'] },
  { code: 'standard', name: 'Standart', description: 'Büyüyen işletmeler için genişletilmiş özellikler', monthlyPrice: 999, yearlyPrice: 9990, userLimit: 10, branchLimit: 3, warehouseLimit: 3, apiKeyLimit: 2, webhookLimit: 5, storageMbLimit: 10240, modules: ['dashboard', 'cari', 'stok', 'satis', 'siparis', 'tahsilat', 'kasa', 'banka', 'raporlar', 'bildirim'] },
  { code: 'professional', name: 'Profesyonel', description: 'Kurumsal operasyonlar için tam özellik seti', monthlyPrice: 2499, yearlyPrice: 24990, userLimit: 50, branchLimit: 10, warehouseLimit: 10, apiKeyLimit: 10, webhookLimit: 25, storageMbLimit: 51200, modules: ['dashboard', 'cari', 'stok', 'satis', 'siparis', 'tahsilat', 'kasa', 'banka', 'pos', 'depo', 'sayim', 'iade', 'raporlar', 'api_webhook', 'bildirim', 'log_audit'] },
  { code: 'enterprise', name: 'Kurumsal', description: 'Büyük ölçekli firmalar için sınırsız', monthlyPrice: 0, yearlyPrice: 0, userLimit: 9999, branchLimit: 9999, warehouseLimit: 9999, apiKeyLimit: 9999, webhookLimit: 9999, storageMbLimit: 512000, modules: MODULES.map((m) => m.code) },
];

async function main(): Promise<void> {
  console.log('🌱 Seed başlıyor...');

  // 1. Modüller
  console.log('  → Modüller ekleniyor...');
  for (const m of MODULES) {
    await prisma.module.upsert({
      where: { code: m.code },
      create: m,
      update: { name: m.name, category: m.category, defaultRoute: m.defaultRoute, icon: m.icon, sortOrder: m.sortOrder, description: m.description },
    });
  }

  // 2. Permission kataloğu
  console.log('  → Permission kataloğu ekleniyor...');
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: p.code },
      create: p,
      update: { module: p.module, resource: p.resource, action: p.action, description: p.description },
    });
  }

  // 3. Planlar
  console.log('  → Planlar ekleniyor...');
  const moduleByCode = new Map<string, { id: string }>();
  for (const m of MODULES) {
    const found = await prisma.module.findUnique({ where: { code: m.code } });
    if (found) moduleByCode.set(m.code, { id: found.id });
  }
  for (const p of PLANS) {
    const plan = await prisma.plan.upsert({
      where: { code: p.code },
      create: {
        code: p.code,
        name: p.name,
        description: p.description,
        monthlyPrice: new Prisma.Decimal(p.monthlyPrice),
        yearlyPrice: new Prisma.Decimal(p.yearlyPrice),
        currency: 'TRY',
        userLimit: p.userLimit,
        branchLimit: p.branchLimit,
        warehouseLimit: p.warehouseLimit,
        apiKeyLimit: p.apiKeyLimit,
        webhookLimit: p.webhookLimit,
        storageMbLimit: p.storageMbLimit,
      },
      update: { name: p.name, description: p.description },
    });
    // Plan modülleri
    for (const modCode of p.modules) {
      const mod = moduleByCode.get(modCode);
      if (!mod) continue;
      await prisma.planModule.upsert({
        where: { planId_moduleId: { planId: plan.id, moduleId: mod.id } },
        create: { planId: plan.id, moduleId: mod.id, isIncluded: true },
        update: { isIncluded: true },
      });
    }
  }

  // 4. Sistem rolleri (süper admin)
  console.log('  → Sistem rolleri ekleniyor...');
  const allPerms = await prisma.permission.findMany();
  const allMods = await prisma.module.findMany();
  const existingSuperAdminRole = await prisma.role.findFirst({
    where: { tenantId: null, code: 'super_admin' },
  });
  const superAdminRole = existingSuperAdminRole
    ? await prisma.role.update({
        where: { id: existingSuperAdminRole.id },
        data: {
          name: 'Süper Admin',
          description: 'Tüm sistemi yönetir',
          isSystem: true,
          isActive: true,
          isDeleted: false,
        },
      })
    : await prisma.role.create({
        data: { tenantId: null, code: 'super_admin', name: 'Süper Admin', description: 'Tüm sistemi yönetir', isSystem: true },
      });
  for (const p of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: p.id } },
      create: { roleId: superAdminRole.id, permissionId: p.id },
      update: {},
    });
  }

  // 5. Süper admin kullanıcı
  console.log('  → Süper admin kullanıcı oluşturuluyor...');
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? 'admin@sistem.local';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const superAdminName = process.env.SUPER_ADMIN_NAME ?? 'Sistem Yöneticisi';
  const passwordHash = await argon2.hash(superAdminPassword, { type: argon2.argon2id });
  const normalizedSuperAdminEmail = superAdminEmail.toLowerCase();
  const existingSuperAdminUser = await prisma.user.findFirst({
    where: { tenantId: null, email: normalizedSuperAdminEmail },
  });
  const superAdminUser = existingSuperAdminUser
    ? await prisma.user.update({
        where: { id: existingSuperAdminUser.id },
        data: {
          passwordHash,
          fullName: superAdminName,
          status: 'ACTIVE',
          mfaEnabled: false,
          isActive: true,
          isDeleted: false,
        },
      })
    : await prisma.user.create({
        data: {
          tenantId: null,
          email: normalizedSuperAdminEmail,
          passwordHash,
          fullName: superAdminName,
          status: 'ACTIVE',
          mfaEnabled: false,
        },
      });
  await prisma.userRole.upsert({
    where: { userId_roleId_tenantId: { userId: superAdminUser.id, roleId: superAdminRole.id, tenantId: 'SYSTEM' } },
    create: { userId: superAdminUser.id, roleId: superAdminRole.id, tenantId: 'SYSTEM', dataScope: 'TENANT' },
    update: {},
  });

  console.log('✅ Seed tamamlandı.');
  console.log(`   Süper admin: ${superAdminEmail} / ${superAdminPassword}`);
  console.log(`   ${MODULES.length} modül, ${PERMISSIONS.length} permission, ${PLANS.length} plan, 1 süper admin`);

  // -------------------------------------------------------------------------
  // 6. DEMO TENANT (SaaS çekirdek tablolar ile)
  // -------------------------------------------------------------------------
  // Not: Operasyonel tablolar (customers, products, warehouses, vb.) henüz
  // schema'da yok. Bunlar FAZ 6 (Cari) + FAZ 7 (Stok) fazlarında eklenecek.
  // Bu nedenle demo tenant sadece tenant + users + roles ile oluşturulur.
  // -------------------------------------------------------------------------
  const demoTenantCode = 'demo';
  const existingDemo = await prisma.tenant.findUnique({ where: { code: demoTenantCode } });
  if (!existingDemo) {
    console.log('  → Demo tenant oluşturuluyor...');
    const demoTenant = await prisma.tenant.create({
      data: {
        code: demoTenantCode,
        name: 'Demo Firma A.Ş.',
        workingMode: 'SAAS_MASTER',
        status: 'ACTIVE',
      },
    });

    // Demo tenant ayarları
    await prisma.tenantSettings.create({
      data: {
        tenantId: demoTenant.id,
        companyInfo: { name: 'Demo Firma A.Ş.', taxNumber: '1234567890' },
        currency: 'TRY',
        taxOffice: 'Merkez',
        taxNumber: '1234567890',
        locale: 'tr-TR',
      },
    });

    // Demo tenant için "standard" planı ata
    const standardPlan = await prisma.plan.findUnique({
      where: { code: 'standard' },
      include: { planModules: true },
    });
    if (standardPlan) {
      await prisma.subscription.create({
        data: {
          tenantId: demoTenant.id,
          planId: standardPlan.id,
          status: 'ACTIVE',
          startAt: new Date(),
          autoRenew: true,
        },
      });
      if (standardPlan.planModules.length > 0) {
        await prisma.tenantModule.createMany({
          data: standardPlan.planModules.map((pm) => ({
            tenantId: demoTenant.id,
            moduleId: pm.moduleId,
            isActive: pm.isIncluded,
            source: 'plan',
          })),
        });
      }
    }

    // Demo tenant için örnek roller
    console.log('  → Demo tenant rolleri oluşturuluyor...');
    const allPerms = await prisma.permission.findMany();
    const tenantAdminRole = await prisma.role.create({
      data: {
        tenantId: demoTenant.id,
        code: 'tenant_admin',
        name: 'Firma Yöneticisi',
        description: 'Firma içi tüm yetkiler',
        isSystem: true,
      },
    });
    for (const p of allPerms) {
      await prisma.rolePermission.create({
        data: { roleId: tenantAdminRole.id, permissionId: p.id },
      });
    }

    const accountantRole = await prisma.role.create({
      data: {
        tenantId: demoTenant.id,
        code: 'accountant',
        name: 'Muhasebeci',
        description: 'Cari, tahsilat, kasa, banka, raporlar',
        isSystem: true,
      },
    });
    const accountantPerms = allPerms.filter((p) =>
      p.module === 'cari' || p.module === 'tahsilat' || p.module === 'kasa' || p.module === 'banka' || p.module === 'raporlar',
    );
    for (const p of accountantPerms) {
      await prisma.rolePermission.create({
        data: { roleId: accountantRole.id, permissionId: p.id },
      });
    }

    // Demo tenant için 2 örnek kullanıcı
    console.log('  → Demo tenant kullanıcıları oluşturuluyor...');
    const tenantAdminUser = await prisma.user.create({
      data: {
        tenantId: demoTenant.id,
        email: 'admin@demo.local',
        passwordHash: await argon2.hash('Demo123!', { type: argon2.argon2id }),
        fullName: 'Demo Firma Yöneticisi',
        status: 'ACTIVE',
      },
    });
    await prisma.userRole.create({
      data: {
        userId: tenantAdminUser.id,
        roleId: tenantAdminRole.id,
        tenantId: demoTenant.id,
        dataScope: 'TENANT',
      },
    });

    const accountantUser = await prisma.user.create({
      data: {
        tenantId: demoTenant.id,
        email: 'muhasebe@demo.local',
        passwordHash: await argon2.hash('Demo123!', { type: argon2.argon2id }),
        fullName: 'Demo Muhasebeci',
        status: 'ACTIVE',
      },
    });
    await prisma.userRole.create({
      data: {
        userId: accountantUser.id,
        roleId: accountantRole.id,
        tenantId: demoTenant.id,
        dataScope: 'TENANT',
      },
    });

    console.log('   Demo tenant verileri hazır.');
    console.log(`   Demo firma: ${demoTenantCode}`);
    console.log(`     - Firma yöneticisi: admin@demo.local / Demo123!`);
    console.log(`     - Muhasebeci: muhasebe@demo.local / Demo123!`);
    console.log(`     - 2 rol (tenant_admin, accountant)`);

    // Örnek bildirimler
    console.log('  → Örnek bildirimler oluşturuluyor...');
    const sampleNotifications = [
      {
        tenantId: demoTenant.id,
        userId: null,
        type: 'INFO' as const,
        category: 'SYSTEM' as const,
        title: 'SaaS Platformuna Hoş Geldiniz!',
        message: 'Demo firmanız başarıyla oluşturuldu. Standart paket 14 gün ücretsiz deneme olarak aktiftir.',
        link: '/dashboard',
        isRead: false,
        metadata: { source: 'onboarding' },
      },
      {
        tenantId: demoTenant.id,
        userId: null,
        type: 'WARNING' as const,
        category: 'PLAN' as const,
        title: 'Deneme süreniz 13 gün sonra dolacak',
        message: 'Standart paket deneme süreniz 14 gün sonra sona erecek. Yükseltme yapabilir veya iptal edebilirsiniz.',
        link: '/settings',
        isRead: false,
      },
      {
        tenantId: demoTenant.id,
        userId: null,
        type: 'INFO' as const,
        category: 'MODULE' as const,
        title: 'Yeni modüller aktif',
        message: 'Cari, Stok, Satış, Sipariş, Tahsilat, Kasa, Banka ve Raporlar modülleri hesabınıza tanımlandı.',
        isRead: true,
        readAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        tenantId: null, // süper admin'e
        userId: null,
        type: 'INFO' as const,
        category: 'TENANT' as const,
        title: 'Yeni firma kaydı: Demo Firma A.Ş.',
        message: 'Sisteme yeni bir firma eklendi. Standart paket atandı.',
        link: '/super-admin/tenants',
        isRead: false,
      },
      {
        tenantId: null,
        userId: null,
        type: 'WARNING' as const,
        category: 'SYSTEM' as const,
        title: 'Sistem bakımı planlandı',
        message: 'Yarın 03:00-04:00 (UTC) saatleri arasında planlı bakım yapılacak. Kısa süreli kesintiler olabilir.',
        isRead: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        tenantId: null,
        userId: null,
        type: 'SUCCESS' as const,
        category: 'SYSTEM' as const,
        title: 'Sistem güncellemesi tamamlandı',
        message: 'Sistem 0.2.0 sürümüne güncellendi. Yeni özellikler: gelişmiş raporlar, performans iyileştirmeleri.',
        isRead: true,
        readAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ];
    for (const n of sampleNotifications) {
      await prisma.notification.create({ data: n });
    }
    console.log(`     - ${sampleNotifications.length} örnek bildirim`);

    console.log('   Operasyonel veriler (cari, ürün, vb.) FAZ 6+ sonrası eklenecek.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

