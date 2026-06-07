/**
 * Frontend permission kontrolü.
 * Backend'deki PermissionGuard ile aynı mantığı uygular.
 *
 * Kullanım:
 *   import { hasPermission, usePermission } from '@/lib/permissions';
 *
 *   // Hook (component içinde)
 *   const canCreate = usePermission('satis:sale:create');
 *
 *   // Utility (her yerde)
 *   const canView = hasPermission('cari:customer:view');
 */

import { useAuthStore } from '@/stores/auth-store';
import type { UserWithRoles } from '@saas/shared';

// ── Permission kodları ─────────────────────────────────────────────────────────

export type PermissionCode =
  // Cari
  | 'cari:customer:view'
  | 'cari:customer:read'
  | 'cari:customer:create'
  | 'cari:customer:update'
  | 'cari:customer:delete'
  | 'cari:customer:export'
  | 'cari:customer:import'
  | 'cari:customer:print'
  // Stok / Ürün
  | 'stok:product:view'
  | 'stok:product:read'
  | 'stok:product:create'
  | 'stok:product:update'
  | 'stok:product:delete'
  | 'stok:product:export'
  | 'stok:product:import'
  // Depo
  | 'depo:warehouse:view'
  | 'depo:warehouse:create'
  | 'depo:warehouse:update'
  | 'depo:warehouse:delete'
  // Satış
  | 'satis:sale:view'
  | 'satis:sale:read'
  | 'satis:sale:create'
  | 'satis:sale:update'
  | 'satis:sale:cancel'
  | 'satis:sale:export'
  | 'satis:sale:print'
  // Sipariş
  | 'siparis:order:view'
  | 'siparis:order:read'
  | 'siparis:order:create'
  | 'siparis:order:update'
  | 'siparis:order:approve'
  | 'siparis:order:cancel'
  // Tahsilat
  | 'tahsilat:collection:view'
  | 'tahsilat:collection:create'
  | 'tahsilat:collection:cancel'
  // İade
  | 'iade:return:view'
  | 'iade:return:create'
  | 'iade:return:update'
  | 'iade:return:approve'
  | 'iade:return:cancel'
  // Kasa
  | 'kasa:cash_account:view'
  | 'kasa:cash_account:create'
  | 'kasa:cash_account:update'
  | 'kasa:cash_movement:view'
  | 'kasa:cash_movement:create'
  // Banka
  | 'banka:bank_account:view'
  | 'banka:bank_account:create'
  | 'banka:bank_account:update'
  // Raporlar
  | 'raporlar:report:view'
  | 'raporlar:report:export'
  // İK / HR
  | 'ik:hr:view'
  | 'ik:personnel:view'
  | 'ik:personnel:create'
  | 'ik:personnel:update'
  | 'ik:personnel:delete'
  | 'ik:documents:view'
  | 'ik:documents:upload'
  | 'ik:sensitive_data:view'
  // Ayarlar
  | 'ayarlar:user:view'
  | 'ayarlar:user:create'
  | 'ayarlar:user:update'
  | 'ayarlar:user:delete'
  | 'ayarlar:role:view'
  | 'ayarlar:role:create'
  | 'ayarlar:role:update'
  | 'ayarlar:role:delete'
  | 'ayarlar:role:manage'
  | 'ayarlar:tenant:manage';

// ── User'dan permission listesini çıkar ───────────────────────────────────────

function extractUserPermissions(user: UserWithRoles | null): string[] {
  if (!user) return [];

  // Super admin
  if (user.roles.some((r) => r.roleCode === 'super_admin')) return ['*'];
  // Sistem admin
  if (user.tenantId === null) return ['*'];

  return user.roles.flatMap((r) => r.permissions ?? []);
}

// ── Tek permission kontrolü ───────────────────────────────────────────────────

function hasOnePermission(userPerms: string[], required: string): boolean {
  // Super admin (joker)
  if (userPerms.includes('*')) return true;

  // Tam eşleşme
  if (userPerms.includes(required)) return true;

  // Action ikamesi: view → read (view izni olan read de yapabilir)
  const parts = required.split(':');
  if (parts.length === 3) {
    const [mod, res, action] = parts;
    if (action === 'read' && userPerms.includes(`${mod}:${res}:view`)) return true;
    if (action === 'view' && userPerms.includes(`${mod}:${res}:read`)) return true;
  }

  return false;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Kullanıcının verilen permission'a sahip olup olmadığını döner.
 * Her yerde kullanılabilir (component, utility, hook).
 */
export function hasPermission(required: PermissionCode | string): boolean {
  const user = useAuthStore.getState().user;
  const perms = extractUserPermissions(user);
  return hasOnePermission(perms, required);
}

/**
 * Birden fazla permission gerekli mi? (AND mantığı)
 * Tüm verilen permission'lar gerekli.
 */
export function hasAllPermissions(required: string[]): boolean {
  return required.every((p) => hasPermission(p));
}

/**
 * Birden fazla permission'dan herhangi biri yeterli mi? (OR mantığı)
 */
export function hasAnyPermission(...required: string[]): boolean {
  return required.some((p) => hasPermission(p));
}

/**
 * Kullanıcının rol kodunu döner.
 */
export function getUserRole(): string | null {
  const user = useAuthStore.getState().user;
  return user?.roles[0]?.roleCode ?? null;
}

/**
 * Super admin mi?
 */
export function isSuperAdmin(): boolean {
  const user = useAuthStore.getState().user;
  if (!user) return false;
  if (user.tenantId === null) return true;
  return user.roles.some((r) => r.roleCode === 'super_admin');
}

/**
 * Belirli bir modüle erişim var mı?
 */
export function hasModuleAccess(moduleCode: string): boolean {
  const user = useAuthStore.getState().user;
  if (!user) return false;
  if (isSuperAdmin()) return true;
  return user.activeModules?.includes(moduleCode) ?? false;
}