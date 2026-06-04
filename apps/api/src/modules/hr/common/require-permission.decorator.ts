import { SetMetadata } from '@nestjs/common';

export const HR_PERMISSION_KEY = 'hr_permission';

/**
 * Permission decorator'ı.
 * Kullanım:
 *   @RequireHrPermission('ik:personnel:view')
 *   @RequireHrPermission('ik:sensitive_data:view')   // TC/IBAN full göstermek için
 */
export const RequireHrPermission = (permission: string) =>
  SetMetadata(HR_PERMISSION_KEY, permission);
