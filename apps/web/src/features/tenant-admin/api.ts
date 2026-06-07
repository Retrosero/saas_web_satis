import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse, ModuleCategory } from '@saas/shared';

// ---------- Tipler ----------

export interface TenantInfo {
  id: string;
  code: string;
  name: string;
  workingMode: 'SAAS_MASTER' | 'ERP_MASTER';
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'PENDING' | 'CANCELLED';
  createdAt: string;
  settings: {
    id: string;
    currency: string;
    locale: string;
    taxOffice: string | null;
    taxNumber: string | null;
    defaultWarehouseId: string | null;
    companyInfo: Record<string, unknown>;
  } | null;
}

export interface PlanInfo {
  id: string;
  code: 'starter' | 'standard' | 'professional' | 'enterprise';
  name: string;
  description: string | null;
  monthlyPrice: string;
  yearlyPrice: string;
  currency: string;
  userLimit: number;
  branchLimit: number;
  warehouseLimit: number;
  apiKeyLimit: number;
  webhookLimit: number;
  storageMbLimit: number;
}

export interface SubscriptionInfo {
  plan: PlanInfo;
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
  startAt: string;
  endAt: string | null;
  trialEndAt: string | null;
  autoRenew: boolean;
}

export interface SubscriptionUsage {
  plan: SubscriptionInfo | null;
  usage: { userCount: number; activeModuleCount: number };
  limits: {
    userLimit: number;
    branchLimit: number;
    warehouseLimit: number;
    apiKeyLimit: number;
    webhookLimit: number;
    storageMbLimit: number;
  } | null;
}

export interface ActiveModule {
  code: string;
  name: string;
  category: ModuleCategory;
  icon: string;
  defaultRoute: string;
  source: 'plan' | 'manual_override';
  validUntil: string | null;
}

export interface AvailableModule {
  code: string;
  name: string;
  category: ModuleCategory;
  icon: string;
  defaultRoute: string;
}

export interface TenantUser {
  id: string;
  email: string;
  fullName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'PENDING';
  phone: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  roles: Array<{ code: string; name: string; roleId: string }>;
}

export interface TenantRole {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionCount: number;
  userCount: number;
}

// ---------- API ----------

export const tenantAdminApi = {
  async getMe(): Promise<TenantInfo> {
    const res = await apiClient.get<{ data: TenantInfo }>('/tenant-admin/me');
    return res.data.data;
  },

  async updateMe(input: Partial<{ name: string; currency: string; taxOffice: string; taxNumber: string; companyInfo: Record<string, unknown> }>): Promise<TenantInfo> {
    const res = await apiClient.patch<{ data: TenantInfo }>('/tenant-admin/me', input);
    return res.data.data;
  },

  async getSubscription(): Promise<SubscriptionUsage> {
    const res = await apiClient.get<{ data: SubscriptionUsage }>('/tenant-admin/subscription');
    return res.data.data;
  },

  async getModules(): Promise<{
    active: ActiveModule[];
    available: AvailableModule[];
    byCategory: Record<string, AvailableModule[]>;
  }> {
    const res = await apiClient.get<{ data: { active: ActiveModule[]; available: AvailableModule[]; byCategory: Record<string, AvailableModule[]> } }>('/tenant-admin/modules');
    return res.data.data;
  },

  async toggleModule(code: string, isActive: boolean): Promise<{ code: string; isActive: boolean; source: string }> {
    const res = await apiClient.post<{ data: { code: string; isActive: boolean; source: string } }>(`/tenant-admin/modules/${code}/toggle`, { isActive });
    return res.data.data;
  },

  async listUsers(params: { page?: number; pageSize?: number; search?: string } = {}): Promise<PaginatedResponse<TenantUser>> {
    const res = await apiClient.get<{ data: PaginatedResponse<TenantUser> }>('/tenant-admin/users', { params });
    return res.data.data;
  },

  async createUser(input: { email: string; fullName: string; phone?: string; password: string; roleCode: string }): Promise<{ id: string; email: string; fullName: string; roleCode: string; createdAt: string }> {
    const res = await apiClient.post<{ data: { id: string; email: string; fullName: string; roleCode: string; createdAt: string } }>('/tenant-admin/users', input);
    return res.data.data;
  },

  async updateUser(id: string, input: { fullName?: string; phone?: string; status?: 'ACTIVE' | 'INACTIVE' | 'LOCKED' }): Promise<TenantUser> {
    const res = await apiClient.patch<{ data: TenantUser }>(`/tenant-admin/users/${id}`, input);
    return res.data.data;
  },

  async deleteUser(id: string): Promise<{ deleted: boolean }> {
    const res = await apiClient.delete<{ data: { deleted: boolean } }>(`/tenant-admin/users/${id}`);
    return res.data.data;
  },

  async assignRole(userId: string, roleCode: string): Promise<{ userId: string; roleCode: string }> {
    const res = await apiClient.post<{ data: { userId: string; roleCode: string } }>(`/tenant-admin/users/${userId}/role`, { roleCode });
    return res.data.data;
  },

  async listRoles(): Promise<TenantRole[]> {
    const res = await apiClient.get<{ data: TenantRole[] }>('/tenant-admin/roles');
    return res.data.data;
  },
};
