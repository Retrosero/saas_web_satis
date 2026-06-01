import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.module';
import { TenantStatus } from '@saas/shared';

/** Tenant aktif mi ve kullanıcı buna erişebilir mi kontrol eder. */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { tid?: string; sub?: string } }>();
    const tenantId = request.user?.tid;
    if (!tenantId || tenantId === 'SYSTEM') return true; // süper admin bypass

    const tenant = await this.prisma.client.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, status: true, isActive: true, isDeleted: true },
    });
    if (!tenant || tenant.isDeleted) {
      throw new ForbiddenException('Firma bulunamadı');
    }
    if (!tenant.isActive || tenant.status === TenantStatus.SUSPENDED || tenant.status === TenantStatus.CANCELLED) {
      throw new ForbiddenException('Firma hesabı askıya alınmış');
    }
    return true;
  }
}
