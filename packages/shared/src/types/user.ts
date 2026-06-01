import type { UserStatus } from '../enums/user.enum.js';

export interface User {
  id: string;
  tenantId: string | null;
  email: string;
  phone: string | null;
  fullName: string;
  avatarUrl: string | null;
  status: UserStatus;
  lastLoginAt: string | null;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithRoles extends User {
  roles: Array<{
    roleId: string;
    roleCode: string;
    roleName: string;
    tenantId: string;
    permissions: string[];
    dataScope: 'OWN' | 'BRANCH' | 'TENANT';
    branchIds: string[];
  }>;
  activeModules: string[];
}
