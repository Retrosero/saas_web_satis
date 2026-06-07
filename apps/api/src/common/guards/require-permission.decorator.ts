import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSION_KEY = 'required_permission';

/**
 * Bir endpoint veya controller için gerekli permission kodunu belirler.
 * Kullanım:
 *   @RequirePermission('satis:sale:create')
 *   @Get()
 *   createSale() { ... }
 *
 * Birden fazla permission gerekirse (AND mantığı):
 *   @RequirePermissions(['satis:sale:create', 'satis:sale:view'])
 *
 * Herhangi biri yeterliyse (OR mantığı):
 *   @RequireAnyPermission('satis:sale:create', 'satis:sale:update')
 */
export const RequirePermission = (permission: string) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, [permission]);

export const RequirePermissions = (permissions: string[]) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, permissions);

/**
 * OR mantığı — verilen permission'lardan herhangi biri yeterli.
 */
export const RequireAnyPermission = (...permissions: string[]) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, permissions);