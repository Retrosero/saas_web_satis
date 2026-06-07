/**
 * Permission kontrolleri için React hook'ları.
 * PermissionCode tipi ve ana mantık: lib/permissions.ts
 */
import { useAuthStore } from '@/stores/auth-store';
import { isSuperAdmin as checkSuperAdmin, hasPermission as checkPerm } from './permissions';

export type { PermissionCode } from './permissions';

/**
 * Tek permission kontrolü (reactive).
 * Kullanıcı değiştiğinde otomatik güncellenir.
 *
 * @example
 * const CreateSaleButton = () => {
 *   const canCreate = usePermission('satis:sale:create');
 *   if (!canCreate) return null;
 *   return <Button>Yeni Satış</Button>;
 * };
 */
export function usePermission(permission: string): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  if (checkSuperAdmin()) return true;
  return checkPerm(permission);
}

/**
 * Birden fazla permission (AND — tümü gerekli).
 */
export function useAllPermissions(permissions: string[]): boolean {
  return permissions.every((p) => usePermission(p));
}

/**
 * Birden fazla permission (OR — herhangi biri yeterli).
 */
export function useAnyPermission(...permissions: string[]): boolean {
  return permissions.some((p) => usePermission(p));
}

/**
 * Belirli bir modüle erişim var mı?
 */
export function useModuleAccess(moduleCode: string): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  if (checkSuperAdmin()) return true;
  return user.activeModules?.includes(moduleCode) ?? false;
}

/**
 * Kullanıcı rolü.
 */
export function useUserRole(): string | null {
  const user = useAuthStore((s) => s.user);
  return user?.roles[0]?.roleCode ?? null;
}

/**
 * Super admin mi?
 */
export function useIsSuperAdmin(): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  return checkSuperAdmin();
}