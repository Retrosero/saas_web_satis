import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.module';
import { TenantsService } from '../tenants/tenants.service';
import { hashPassword } from '../../common/utils/hash';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { WorkingMode, TenantStatus, PlanCode, ModuleCode } from '@saas/shared';

class CreateTenantDto {
  code!: string;
  name!: string;
  workingMode?: WorkingMode;
  planCode?: PlanCode;
}

class UpdateTenantStatusDto {
  status!: TenantStatus;
}

class ToggleTenantModuleDto {
  moduleCode!: ModuleCode;
  isActive!: boolean;
  validUntil?: string; // ISO date
  note?: string;
}

class AssignPlanDto {
  planCode!: PlanCode;
}

@ApiTags('super-admin')
@Controller('super-admin')
export class SuperAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantsService,
  ) {}

  @Get('overview')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Süper admin paneli özet verileri' })
  async overview() {
    const [tenantTotal, activeTenants, trialTenants, suspendedTenants, userTotal, moduleTotal, planTotal, recentTenants, recentUsers, recentErrors] = await Promise.all([
      this.prisma.client.tenant.count({ where: { isDeleted: false } }),
      this.prisma.client.tenant.count({ where: { status: 'ACTIVE', isDeleted: false } }),
      this.prisma.client.tenant.count({ where: { status: 'TRIAL', isDeleted: false } }),
      this.prisma.client.tenant.count({ where: { status: 'SUSPENDED', isDeleted: false } }),
      this.prisma.client.user.count({ where: { isDeleted: false } }),
      this.prisma.client.module.count({ where: { isActive: true } }),
      this.prisma.client.plan.count({ where: { isActive: true } }),
      this.prisma.client.tenant.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, code: true, name: true, status: true, createdAt: true },
      }),
      this.prisma.client.user.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, email: true, fullName: true, status: true, createdAt: true, tenantId: true },
      }),
      this.prisma.client.errorLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, level: true, message: true, path: true, createdAt: true },
      }),
    ]);
    return {
      counts: {
        tenants: { total: tenantTotal, active: activeTenants, trial: trialTenants, suspended: suspendedTenants },
        users: { total: userTotal },
        modules: { total: moduleTotal },
        plans: { total: planTotal },
      },
      recent: {
        tenants: recentTenants.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
        users: recentUsers.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })),
        errors: recentErrors.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })),
      },
    };
  }

  @Get('tenants')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tüm firmaları listele (süper admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: TenantStatus })
  async listTenants(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('search') search?: string,
    @Query('status') status?: TenantStatus,
  ) {
    return this.tenants.list({
      page: Number(page),
      pageSize: Number(pageSize),
      search,
      status,
    });
  }

  @Get('tenants/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Firma detayı (süper admin)' })
  async getTenant(@Param('id') id: string) {
    const t = await this.prisma.client.tenant.findUnique({ where: { id } });
    if (!t || t.isDeleted) throw new NotFoundException('Firma bulunamadı');
    const [settings, subscription, userCount, moduleCount, adminUser] = await Promise.all([
      this.prisma.client.tenantSettings.findUnique({ where: { tenantId: id } }),
      this.prisma.client.subscription.findFirst({ where: { tenantId: id }, orderBy: { createdAt: 'desc' }, include: { plan: true } }),
      this.prisma.client.user.count({ where: { tenantId: id, isDeleted: false } }),
      this.prisma.client.tenantModule.count({ where: { tenantId: id, isActive: true } }),
      this.prisma.client.user.findFirst({ where: { tenantId: id, userRoles: { some: { role: { code: 'tenant_admin' } } } }, select: { id: true, email: true, fullName: true } }),
    ]);
    return {
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      settings: settings
        ? { ...settings, companyInfo: settings.companyInfo, createdAt: settings.createdAt.toISOString(), updatedAt: settings.updatedAt.toISOString() }
        : null,
      subscription: subscription
        ? {
            ...subscription,
            startAt: subscription.startAt.toISOString(),
            endAt: subscription.endAt?.toISOString() ?? null,
            trialEndAt: subscription.trialEndAt?.toISOString() ?? null,
            createdAt: subscription.createdAt.toISOString(),
            updatedAt: subscription.updatedAt.toISOString(),
          }
        : null,
      stats: { userCount, activeModuleCount: moduleCount },
      adminUser,
    };
  }

  @Post('tenants')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yeni firma oluştur' })
  async createTenant(@Body() dto: CreateTenantDto) {
    const exists = await this.prisma.client.tenant.findUnique({ where: { code: dto.code.toUpperCase() } });
    if (exists) throw new ConflictException('Bu kod ile firma zaten mevcut');
    const t = await this.tenants.create({
      code: dto.code,
      name: dto.name,
      workingMode: dto.workingMode,
    });
    if (dto.planCode) {
      const plan = await this.prisma.client.plan.findUnique({
        where: { code: dto.planCode },
        include: { planModules: true },
      });
      if (plan) {
        await this.prisma.client.subscription.create({
          data: {
            tenantId: t.id,
            planId: plan.id,
            status: 'TRIAL',
            trialEndAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            startAt: new Date(),
            autoRenew: true,
          },
        });
        if (plan.planModules.length > 0) {
          await this.prisma.client.tenantModule.createMany({
            data: plan.planModules.map((pm) => ({
              tenantId: t.id,
              moduleId: pm.moduleId,
              isActive: pm.isIncluded,
              source: 'plan',
            })),
          });
        }
      }
    }
    return t;
  }

  @Patch('tenants/:id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Firma durumunu değiştir' })
  async updateTenantStatus(@Param('id') id: string, @Body() dto: UpdateTenantStatusDto) {
    const t = await this.prisma.client.tenant.findUnique({ where: { id } });
    if (!t || t.isDeleted) throw new NotFoundException('Firma bulunamadı');
    return this.tenants.update(id, { status: dto.status });
  }

  @Post('tenants/:id/assign-plan')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Firmaya plan ata' })
  async assignPlan(@Param('id') id: string, @Body() dto: AssignPlanDto) {
    const tenant = await this.prisma.client.tenant.findUnique({ where: { id } });
    if (!tenant || tenant.isDeleted) throw new NotFoundException('Firma bulunamadı');
    const plan = await this.prisma.client.plan.findUnique({
      where: { code: dto.planCode },
      include: { planModules: true },
    });
    if (!plan) throw new NotFoundException('Plan bulunamadı');
    // Mevcut aktif abonelik iptal
    await this.prisma.client.subscription.updateMany({
      where: { tenantId: id, status: { in: ['TRIAL', 'ACTIVE'] } },
      data: { status: 'CANCELLED', endAt: new Date() },
    });
    // Yeni abonelik
    const sub = await this.prisma.client.subscription.create({
      data: {
        tenantId: id,
        planId: plan.id,
        status: 'ACTIVE',
        startAt: new Date(),
        autoRenew: true,
      },
    });
    // Modülleri güncelle: eski plan'dan olmayan yeni modülleri ekle, eski plan modüllerini kapat
    const newModuleIds = plan.planModules.filter((pm) => pm.isIncluded).map((pm) => pm.moduleId);
    // Mevcut tüm tenant_module'leri pasifleştir
    await this.prisma.client.tenantModule.updateMany({
      where: { tenantId: id, source: 'plan' },
      data: { isActive: false },
    });
    // Yeni plan modüllerini aktif et veya oluştur
    for (const modId of newModuleIds) {
      const existing = await this.prisma.client.tenantModule.findUnique({
        where: { tenantId_moduleId: { tenantId: id, moduleId: modId } },
      });
      if (existing) {
        await this.prisma.client.tenantModule.update({
          where: { id: existing.id },
          data: { isActive: true, source: 'plan' },
        });
      } else {
        await this.prisma.client.tenantModule.create({
          data: { tenantId: id, moduleId: modId, isActive: true, source: 'plan' },
        });
      }
    }
    return { subscription: sub, activatedModules: newModuleIds.length };
  }

  @Post('tenants/:id/modules/toggle')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Firma için modül aç/kapat (manuel override)' })
  async toggleTenantModule(@Param('id') id: string, @Body() dto: ToggleTenantModuleDto) {
    const tenant = await this.prisma.client.tenant.findUnique({ where: { id } });
    if (!tenant || tenant.isDeleted) throw new NotFoundException('Firma bulunamadı');
    const module = await this.prisma.client.module.findUnique({ where: { code: dto.moduleCode } });
    if (!module) throw new NotFoundException('Modül bulunamadı');

    const existing = await this.prisma.client.tenantModule.findUnique({
      where: { tenantId_moduleId: { tenantId: id, moduleId: module.id } },
    });
    if (existing) {
      return this.prisma.client.tenantModule.update({
        where: { id: existing.id },
        data: {
          isActive: dto.isActive,
          source: 'manual_override',
          validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
          note: dto.note ?? null,
        },
      });
    }
    return this.prisma.client.tenantModule.create({
      data: {
        tenantId: id,
        moduleId: module.id,
        isActive: dto.isActive,
        source: 'manual_override',
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        note: dto.note ?? null,
      },
    });
  }

  @Get('plans')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tüm planları listele' })
  async listPlans() {
    const plans = await this.prisma.client.plan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: 'asc' },
      include: {
        planModules: {
          include: { module: { select: { code: true, name: true, icon: true } } },
        },
        _count: { select: { subscriptions: { where: { status: { in: ['TRIAL', 'ACTIVE'] } } } } },
      },
    });
    return plans.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      monthlyPrice: p.monthlyPrice.toString(),
      yearlyPrice: p.yearlyPrice.toString(),
      currency: p.currency,
      userLimit: p.userLimit,
      branchLimit: p.branchLimit,
      warehouseLimit: p.warehouseLimit,
      apiKeyLimit: p.apiKeyLimit,
      webhookLimit: p.webhookLimit,
      storageMbLimit: p.storageMbLimit,
      activeSubscribers: p._count.subscriptions,
      moduleCount: p.planModules.length,
      modules: p.planModules.map((pm) => pm.module),
    }));
  }

  @Get('modules')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tüm sistem modüllerini listele' })
  async listModules() {
    const modules = await this.prisma.client.module.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
    return modules.map((m) => ({
      id: m.id,
      code: m.code,
      name: m.name,
      category: m.category,
      defaultRoute: m.defaultRoute,
      icon: m.icon,
      sortOrder: m.sortOrder,
      description: m.description,
      isActive: m.isActive,
    }));
  }

  @Get('users')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tüm kullanıcıları listele (süper admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'tenantId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async listUsers(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('tenantId') tenantId?: string,
    @Query('search') search?: string,
  ) {
    const where: { isDeleted: boolean; tenantId?: string | null; OR?: Array<Record<string, unknown>> } = { isDeleted: false };
    if (tenantId !== undefined) where.tenantId = tenantId === 'super' ? null : tenantId;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [users, total] = await Promise.all([
      this.prisma.client.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        include: {
          tenant: { select: { id: true, code: true, name: true } },
          userRoles: { include: { role: { select: { code: true, name: true } } } },
        },
      }),
      this.prisma.client.user.count({ where }),
    ]);
    return {
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        status: u.status,
        mfaEnabled: u.mfaEnabled,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
        tenant: u.tenant,
        roles: u.userRoles.map((ur) => ur.role),
      })),
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
        hasNext: Number(page) * Number(pageSize) < total,
        hasPrev: Number(page) > 1,
      },
    };
  }

  @Get('bootstrap-info')
  @Public()
  @ApiOperation({ summary: 'Sistem sağlık ve bootstrap bilgisi' })
  async bootstrapInfo() {
    const superAdminExists = await this.prisma.client.user.findFirst({
      where: { tenantId: null, isDeleted: false },
      select: { id: true, email: true, fullName: true },
    });
    return {
      superAdminExists: !!superAdminExists,
      superAdminEmail: superAdminExists?.email ?? null,
      timestamp: new Date().toISOString(),
    };
  }
}
