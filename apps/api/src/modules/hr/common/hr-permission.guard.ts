import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HR_PERMISSION_KEY } from './require-permission.decorator';
import type { JwtPayload } from '@saas/shared';

/**
 * HR permission guard.
 * Süper admin (tid === 'SYSTEM') her zaman geçer.
 * Diğer kullanıcılar: JWT payload'ında gerekli permission kodu olmalı.
 */
@Injectable()
export class HrPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string>(HR_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Yetkilendirme gerekli');

    // Süper admin bypass
    if (user.tid === 'SYSTEM' || user.role === 'super_admin') return true;

    const perms = user.perms ?? [];
    if (!perms.includes(required)) {
      throw new ForbiddenException(`Bu işlem için yetkiniz yok: ${required}`);
    }
    return true;
  }
}
