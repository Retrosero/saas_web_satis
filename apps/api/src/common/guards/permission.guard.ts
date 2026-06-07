import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSION_KEY } from './require-permission.decorator.js';
import type { JwtPayload } from '@saas/shared';

/**
 * Genel permission guard.
 * — Super admin (role=super_admin veya tid=SYSTEM) her zaman geçer
 * — Action parametresi 'view' ise 'read' da yeterli (view ⊇ read)
 * — Birden fazla permission varsa AND mantığı (hepsi gerekli)
 * — TenantGuard zaten çalıştığı için tenant kontrolü yok
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // decorator yok → herkes girebilir
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Yetkilendirme gerekli');

    // Super admin bypass
    if (user.tid === 'SYSTEM' || user.role === 'super_admin') return true;

    const userPerms: string[] = (user as any).perms ?? [];

    for (const perm of required) {
      if (!this.hasPermission(userPerms, perm)) {
        throw new ForbiddenException(`Bu işlem için yetkiniz yok: ${perm}`);
      }
    }

    return true;
  }

  /**
   * 'satis:sale:view' izni var ve 'satis:sale:read' istendiyse → geçerli (view ⊇ read)
   * 'satis:sale:view' izni var ve 'satis:sale:create' istendiyse → geçmez
   */
  private hasPermission(userPerms: string[], required: string): boolean {
    // Tam eşleşme
    if (userPerms.includes(required)) return true;

    // Action ikamesi: view → read (view izni olan read de yapabilir)
    const [mod, res, action] = required.split(':');
    if (action === 'read' && userPerms.includes(`${mod}:${res}:view`)) return true;

    // read → view (read izni olan view de yapabilir)
    if (action === 'view' && userPerms.includes(`${mod}:${res}:read`)) return true;

    return false;
  }
}