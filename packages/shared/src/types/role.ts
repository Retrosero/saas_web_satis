import type { DataScope } from '../enums/user.enum.js';
import type { Permission } from './permission.js';

export interface Role {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface UserRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  tenantId: string;
  dataScope: DataScope;
  branchIds: string[];
}
