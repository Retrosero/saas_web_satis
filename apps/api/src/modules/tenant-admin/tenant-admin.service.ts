import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import { hashPassword } from '../../common/utils/hash';
import { NotificationsService } from '../notifications/notifications.service';
import type { PaginatedResponse } from '@saas/shared';
import { TenantStatus, ModuleCategory, NotificationCategory } from '@saas/shared';

@Injectable()
export class TenantAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ---------------- Tenant Info ----------------

  async getTenantInfo(tenantId: string) {
    const t = await this.prisma.client.tenant.findUnique({
      where: { id: tenantId },
      include: { settings: true },
    });
    if (!t || t.isDeleted) throw new NotFoundException('Firma bulunamadı');
    return {
      id: t.id,
      code: t.code,
      name: t.name,
      workingMode: t.workingMode,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
      settings: t.settings
        ? {
            id: t.settings.id,
            currency: t.settings.currency,
            locale: t.settings.locale,
            taxOffice: t.settings.taxOffice,
            taxNumber: t.settings.taxNumber,
            defaultWarehouseId: t.settings.defaultWarehouseId,
            companyInfo: t.settings.companyInfo,
          }
        : null,
    };
  }

  async updateTenantInfo(
    tenantId: string,
    input: { name?: string; currency?: string; taxOffice?: string; taxNumber?: string; companyInfo?: Record<string, unknown> },
  ) {
    const t = await this.prisma.client.tenant.findUnique({ where: { id: tenantId }, include: { settings: true } });
    if (!t || t.isDeleted) throw new NotFoundException('Firma bulunamadı');

    if (input.name !== undefined) {
      await this.prisma.client.tenant.update({
        where: { id: tenantId },
        data: { name: input.name },
      });
    }
    if (input.currency !== undefined || input.taxOffice !== undefined || input.taxNumber !== undefined || input.companyInfo !== undefined) {
      const data: Record<string, unknown> = {};
      if (input.currency) data.currency = input.currency;
      if (input.taxOffice !== undefined) data.taxOffice = input.taxOffice;
      if (input.taxNumber !== undefined) data.taxNumber = input.taxNumber;
      if (input.companyInfo !== undefined) data.companyInfo = input.companyInfo;
      if (t.settings) {
        await this.prisma.client.tenantSettings.update({
          where: { tenantId },
          data,
        });
      } else {
        await this.prisma.client.tenantSettings.create({
          data: { tenantId, currency: input.currency ?? 'TRY', locale: 'tr-TR', ...data },
        });
      }
    }
    return this.getTenantInfo(tenantId);
  }

  // ---------------- Subscription ----------------

  async getSubscription(tenantId: string) {
    const sub = await this.prisma.client.subscription.findFirst({
      where: { tenantId, status: { in: ['TRIAL', 'ACTIVE', 'PAST_DUE'] } },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
    if (!sub) return null;
    return {
      id: sub.id,
      plan: {
        id: sub.plan.id,
        code: sub.plan.code,
        name: sub.plan.name,
        description: sub.plan.description,
        monthlyPrice: sub.plan.monthlyPrice.toString(),
        yearlyPrice: sub.plan.yearlyPrice.toString(),
        currency: sub.plan.currency,
        userLimit: sub.plan.userLimit,
        branchLimit: sub.plan.branchLimit,
        warehouseLimit: sub.plan.warehouseLimit,
        apiKeyLimit: sub.plan.apiKeyLimit,
        webhookLimit: sub.plan.webhookLimit,
        storageMbLimit: sub.plan.storageMbLimit,
      },
      status: sub.status,
      startAt: sub.startAt.toISOString(),
      endAt: sub.endAt?.toISOString() ?? null,
      trialEndAt: sub.trialEndAt?.toISOString() ?? null,
      autoRenew: sub.autoRenew,
    };
  }

  async getSubscriptionUsage(tenantId: string) {
    const sub = await this.getSubscription(tenantId);
    if (!sub) {
      return {
        plan: null,
        usage: { userCount: 0, activeModuleCount: 0 },
        limits: null,
      };
    }
    const [userCount, activeModuleCount] = await Promise.all([
      this.prisma.client.user.count({ where: { tenantId, isDeleted: false } }),
      this.prisma.client.tenantModule.count({ where: { tenantId, isActive: true } }),
    ]);
    return {
      plan: sub,
      usage: { userCount, activeModuleCount },
      limits: {
        userLimit: sub.plan.userLimit,
        branchLimit: sub.plan.branchLimit,
        warehouseLimit: sub.plan.warehouseLimit,
        apiKeyLimit: sub.plan.apiKeyLimit,
        webhookLimit: sub.plan.webhookLimit,
        storageMbLimit: sub.plan.storageMbLimit,
      },
    };
  }

  // ---------------- Modules ----------------

  async getModules(tenantId: string) {
    const tenantModules = await this.prisma.client.tenantModule.findMany({
      where: { tenantId, isActive: true },
      include: { module: true },
    });
    const allModules = await this.prisma.client.module.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
    return {
      active: tenantModules.map((tm) => ({
        code: tm.module.code,
        name: tm.module.name,
        category: tm.module.category,
        icon: tm.module.icon,
        source: tm.source,
        validUntil: tm.validUntil?.toISOString() ?? null,
      })),
      available: allModules
        .filter((m) => !tenantModules.some((tm) => tm.module.code === m.code))
        .map((m) => ({
          code: m.code,
          name: m.name,
          category: m.category,
          icon: m.icon,
          defaultRoute: m.defaultRoute,
        })),
      byCategory: allModules.reduce<Record<string, typeof allModules>>((acc, m) => {
        const list = acc[m.category] ?? [];
        list.push(m);
        acc[m.category] = list;
        return acc;
      }, {}),
    };
  }

  async toggleModule(tenantId: string, moduleCode: string, isActive: boolean, actorUserId: string) {
    const mod = await this.prisma.client.module.findUnique({ where: { code: moduleCode } });
    if (!mod) throw new NotFoundException('Modül bulunamadı');

    const existing = await this.prisma.client.tenantModule.findUnique({
      where: { tenantId_moduleId: { tenantId, moduleId: mod.id } },
    });

    let result;
    if (existing) {
      result = await this.prisma.client.tenantModule.update({
        where: { id: existing.id },
        data: { isActive, source: 'manual_override' },
      });
    } else {
      result = await this.prisma.client.tenantModule.create({
        data: { tenantId, moduleId: mod.id, isActive, source: 'manual_override' },
      });
    }

    // Tüm tenant kullanıcılarına bildirim gönder
    await this.notifications.create({
      tenantId,
      userId: null,
      type: isActive ? 'SUCCESS' : 'WARNING',
      category: 'MODULE' as NotificationCategory,
      title: isActive ? `Modül aktif edildi: ${mod.name}` : `Modül devre dışı: ${mod.name}`,
      message: isActive
        ? `${mod.name} modülü hesabınız için aktif edildi.`
        : `${mod.name} modülü devre dışı bırakıldı.`,
      link: mod.defaultRoute,
    });

    return {
      code: mod.code,
      isActive: result.isActive,
      source: result.source,
    };
  }

  // ---------------- Users ----------------

  async listUsers(tenantId: string, params: { page: number; pageSize: number; search?: string }) {
    const where: Record<string, unknown> = { tenantId, isDeleted: false };
    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { fullName: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.client.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: { userRoles: { include: { role: { select: { code: true, name: true } } } } },
      }),
      this.prisma.client.user.count({ where }),
    ]);
    return {
      data: data.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        status: u.status,
        phone: u.phone,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
        roles: u.userRoles.map((ur) => ({ code: ur.role.code, name: ur.role.name, roleId: ur.roleId })),
      })),
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.ceil(total / params.pageSize),
        hasNext: params.page * params.pageSize < total,
        hasPrev: params.page > 1,
      },
    };
  }

  async createUser(
    tenantId: string,
    input: { email: string; fullName: string; phone?: string; password: string; roleCode: string },
  ) {
    // Kullanıcı limiti kontrolü
    const sub = await this.getSubscription(tenantId);
    if (sub) {
      const currentCount = await this.prisma.client.user.count({ where: { tenantId, isDeleted: false } });
      if (currentCount >= sub.plan.userLimit) {
        throw new BadRequestException(
          `Kullanıcı limiti doldu (${sub.plan.userLimit}). Daha fazla kullanıcı için planı yükseltin.`,
        );
      }
    }
    // Email benzersiz mi
    const existing = await this.prisma.client.user.findFirst({
      where: { tenantId, email: input.email.toLowerCase(), isDeleted: false },
    });
    if (existing) throw new ConflictException('Bu e-posta ile kullanıcı zaten mevcut');
    // Rol
    const role = await this.prisma.client.role.findFirst({
      where: { tenantId, code: input.roleCode },
    });
    if (!role) throw new NotFoundException('Rol bulunamadı');
    // Şifre hash
    const passwordHash = await hashPassword(input.password);

    const user = await this.prisma.client.user.create({
      data: {
        tenantId,
        email: input.email.toLowerCase(),
        fullName: input.fullName,
        phone: input.phone,
        passwordHash,
        status: 'ACTIVE',
      },
    });
    await this.prisma.client.userRole.create({
      data: { userId: user.id, roleId: role.id, tenantId, dataScope: 'TENANT' },
    });

    // Bildirim gönder
    await this.notifications.create({
      tenantId,
      userId: user.id,
      type: 'SUCCESS',
      category: 'USER' as NotificationCategory,
      title: 'Hesabınız oluşturuldu',
      message: `${input.fullName} olarak SaaS Panel hesabınız hazır. Şifreniz: ${input.password} (güvenlik için ilk girişte değiştirin).`,
      link: '/dashboard',
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roleCode: input.roleCode,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async updateUser(
    tenantId: string,
    userId: string,
    input: { fullName?: string; phone?: string; status?: 'ACTIVE' | 'INACTIVE' | 'LOCKED' },
  ) {
    const user = await this.prisma.client.user.findFirst({ where: { id: userId, tenantId } });
    if (!user || user.isDeleted) throw new NotFoundException('Kullanıcı bulunamadı');
    const data: Record<string, unknown> = {};
    if (input.fullName !== undefined) data.fullName = input.fullName;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.status !== undefined) data.status = input.status;
    const updated = await this.prisma.client.user.update({ where: { id: userId }, data });
    return {
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      phone: updated.phone,
      status: updated.status,
    };
  }

  async deleteUser(tenantId: string, userId: string) {
    const user = await this.prisma.client.user.findFirst({ where: { id: userId, tenantId } });
    if (!user || user.isDeleted) throw new NotFoundException('Kullanıcı bulunamadı');
    // Super admin'i silmeyi engelle
    if (user.tenantId === null) throw new ForbiddenException('Süper admin silinemez');
    await this.prisma.client.user.update({
      where: { id: userId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return { deleted: true };
  }

  async assignRole(tenantId: string, userId: string, roleCode: string) {
    const user = await this.prisma.client.user.findFirst({ where: { id: userId, tenantId } });
    if (!user || user.isDeleted) throw new NotFoundException('Kullanıcı bulunamadı');
    const role = await this.prisma.client.role.findFirst({ where: { tenantId, code: roleCode } });
    if (!role) throw new NotFoundException('Rol bulunamadı');
    // Mevcut rolleri sil, yenisini ekle
    await this.prisma.client.userRole.deleteMany({ where: { userId, tenantId } });
    await this.prisma.client.userRole.create({
      data: { userId, roleId: role.id, tenantId, dataScope: 'TENANT' },
    });
    return { userId, roleCode };
  }

  // ---------------- Roles ----------------

  async listRoles(tenantId: string) {
    const roles = await this.prisma.client.role.findMany({
      where: { tenantId },
      include: { _count: { select: { permissions: true, userRoles: true } } },
      orderBy: { name: 'asc' },
    });
    return roles.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      permissionCount: r._count.permissions,
      userCount: r._count.userRoles,
    }));
  }

  async createRole(
    tenantId: string,
    input: { code: string; name: string; description?: string; permissionCodes: string[] },
  ) {
    const exists = await this.prisma.client.role.findFirst({ where: { tenantId, code: input.code } });
    if (exists) throw new ConflictException('Bu kod ile rol zaten mevcut');
    // Yetki kontrolü
    const perms = await this.prisma.client.permission.findMany({
      where: { code: { in: input.permissionCodes } },
    });
    if (perms.length !== input.permissionCodes.length) {
      throw new BadRequestException('Geçersiz permission kodu');
    }
    const role = await this.prisma.client.role.create({
      data: {
        tenantId,
        code: input.code,
        name: input.name,
        description: input.description,
        isSystem: false,
      },
    });
    await this.prisma.client.rolePermission.createMany({
      data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
    });
    return { id: role.id, code: role.code, name: role.name, permissionCount: perms.length };
  }

  async updateRolePermissions(tenantId: string, roleId: string, permissionCodes: string[]) {
    const role = await this.prisma.client.role.findFirst({ where: { id: roleId, tenantId } });
    if (!role) throw new NotFoundException('Rol bulunamadı');
    if (role.isSystem) {
      // Sistem rolleri için sadece ekleme, çıkarma yapılabilir ama silme yok
    }
    const perms = await this.prisma.client.permission.findMany({
      where: { code: { in: permissionCodes } },
    });
    if (perms.length !== permissionCodes.length) {
      throw new BadRequestException('Geçersiz permission kodu');
    }
    // Mevcut rolleri sil, yenilerini ekle
    await this.prisma.client.rolePermission.deleteMany({ where: { roleId } });
    await this.prisma.client.rolePermission.createMany({
      data: perms.map((p) => ({ roleId, permissionId: p.id })),
    });
    return { roleId, permissionCount: perms.length };
  }
}
