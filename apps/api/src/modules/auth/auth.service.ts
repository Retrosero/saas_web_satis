import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from '../../prisma/prisma.module';
import { hashPassword, verifyPassword } from '../../common/utils/hash';
import type { JwtPayload, UserWithRoles, LoginInput } from '@saas/shared';
import * as crypto from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Süper admin veya tenant kullanıcısı için login. */
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(input: LoginInput, meta: { userAgent?: string; ipAddress?: string }): Promise<{
    accessToken: string;
    refreshToken: string;
    user: UserWithRoles;
  }> {
    let tenantId: string | null = null;
    let user = await this.prisma.client.user.findFirst({
      where: {
        email: input.email.toLowerCase(),
        tenantId: null, // önce süper admin
        isDeleted: false,
      },
      include: {
        userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        tenant: true,
      },
    });

    if (!user && input.tenantCode) {
      const tenant = await this.prisma.client.tenant.findUnique({ where: { code: input.tenantCode } });
      if (!tenant) throw new UnauthorizedException('Geçersiz e-posta veya şifre');
      tenantId = tenant.id;
      user = await this.prisma.client.user.findFirst({
        where: { email: input.email.toLowerCase(), tenantId, isDeleted: false },
        include: {
          userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
          tenant: true,
        },
      });
    }

    if (!user) throw new UnauthorizedException('Geçersiz e-posta veya şifre');
    if (user.status !== 'ACTIVE' || !user.isActive) {
      throw new UnauthorizedException('Kullanıcı hesabı aktif değil');
    }
    const ok = await verifyPassword(user.passwordHash, input.password);
    if (!ok) throw new UnauthorizedException('Geçersiz e-posta veya şifre');

    const userWithRoles = await this.toUserWithRoles(user.id);
    const tid = user.tenantId ?? 'SYSTEM';
    const payload: JwtPayload = {
      sub: user.id,
      tid,
      role: userWithRoles.roles[0]?.roleCode ?? 'super_admin',
      perms: userWithRoles.roles.flatMap((r: { permissions: string[] }) => r.permissions),
      mods: userWithRoles.activeModules,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.access.secret'),
      expiresIn: this.config.get<string>('jwt.access.expiresIn'),
    });
    const refreshToken = crypto.randomBytes(48).toString('base64url');
    const refreshExpiresIn = this.config.get<string>('jwt.refresh.expiresIn') ?? '7d';
    const expiresAt = new Date(Date.now() + this.parseExpiry(refreshExpiresIn));
    await this.prisma.client.refreshToken.create({
      data: {
        userId: user.id,
        tenantId: tid,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    });
    await this.prisma.client.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { accessToken, refreshToken, user: userWithRoles };
  }

  async refresh(refreshToken: string, meta: { userAgent?: string; ipAddress?: string }): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const tokenHash = this.hashToken(refreshToken);
    const record = await this.prisma.client.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } } } },
    });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş yenileme anahtarı');
    }
    // Rotation: eski kaydı iptal et, yenisini oluştur
    await this.prisma.client.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    const userWithRoles = await this.toUserWithRoles(record.userId);
    const payload: JwtPayload = {
      sub: record.user.id,
      tid: record.tenantId,
      role: userWithRoles.roles[0]?.roleCode ?? 'user',
      perms: userWithRoles.roles.flatMap((r: { permissions: string[] }) => r.permissions),
      mods: userWithRoles.activeModules,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.access.secret'),
      expiresIn: this.config.get<string>('jwt.access.expiresIn'),
    });
    const newRefresh = crypto.randomBytes(48).toString('base64url');
    const refreshExpiresIn = this.config.get<string>('jwt.refresh.expiresIn') ?? '7d';
    const expiresAt = new Date(Date.now() + this.parseExpiry(refreshExpiresIn));
    await this.prisma.client.refreshToken.create({
      data: {
        userId: record.userId,
        tenantId: record.tenantId,
        tokenHash: this.hashToken(newRefresh),
        expiresAt,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    });
    return { accessToken, refreshToken: newRefresh };
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    await this.prisma.client.refreshToken.updateMany({
      where: { tokenHash: this.hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Çıkış başarılı' };
  }

  async me(userId: string): Promise<UserWithRoles> {
    return this.toUserWithRoles(userId);
  }

  // ---------- helpers ----------

  private async toUserWithRoles(userId: string): Promise<UserWithRoles> {
    const u = await this.prisma.client.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: { include: { permissions: { include: { permission: true } } } },
          },
        },
        tenant: true,
      },
    });
    if (!u) throw new UnauthorizedException('Kullanıcı bulunamadı');

    const roles = u.userRoles.map((ur) => ({
      roleId: ur.roleId,
      roleCode: ur.role.code,
      roleName: ur.role.name,
      tenantId: ur.tenantId,
      permissions: ur.role.permissions.map((rp) => rp.permission.code),
      dataScope: ur.dataScope,
      branchIds: ur.branchIds,
    }));

    // Aktif modülleri tenant_modules + plan_modules birleşiminden getir
    let activeModules: string[] = [];
    if (u.tenantId) {
      const tenantMods = await this.prisma.client.tenantModule.findMany({
        where: { tenantId: u.tenantId, isActive: true, OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }] },
        include: { module: true },
      });
      activeModules = tenantMods.map((m) => m.module.code);
    } else {
      // Süper admin tüm aktif modülleri görür
      const allMods = await this.prisma.client.module.findMany({ where: { isActive: true } });
      activeModules = allMods.map((m) => m.code);
    }

    return {
      id: u.id,
      tenantId: u.tenantId,
      email: u.email,
      phone: u.phone,
      fullName: u.fullName,
      avatarUrl: u.avatarUrl,
      status: u.status,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      mfaEnabled: u.mfaEnabled,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      roles,
      activeModules,
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseExpiry(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const n = Number(match[1]);
    const unit = match[2];
    const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit as 's' | 'm' | 'h' | 'd'] ?? 86_400_000;
    return n * mult;
  }
}
