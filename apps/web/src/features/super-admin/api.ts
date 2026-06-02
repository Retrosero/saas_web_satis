import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse, TenantStatus } from '@saas/shared';

// ---------- Tipler ----------

export interface SuperAdminOverview {
  counts: {
    tenants: { total: number; active: number; trial: number; suspended: number };
    users: { total: number };
    modules: { total: number };
    plans: { total: number };
  };
  recent: {
    tenants: Array<{ id: string; code: string; name: string; status: string; createdAt: string }>;
    users: Array<{
      id: string;
      email: string;
      fullName: string;
      status: string;
      createdAt: string;
      tenantId: string | null;
    }>;
    errors: Array<{
      id: string;
      level: string;
      message: string;
      path: string | null;
      createdAt: string;
    }>;
  };
}

export interface AdminTenant {
  id: string;
  code: string;
  name: string;
  workingMode: 'SAAS_MASTER' | 'ERP_MASTER';
  status: TenantStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTenantDetail extends AdminTenant {
  settings: {
    id: string;
    tenantId: string;
    companyInfo: Record<string, unknown>;
    currency: string;
    locale: string;
    taxOffice: string | null;
    taxNumber: string | null;
  } | null;
  subscription: {
    id: string;
    planId: string;
    status: string;
    startAt: string;
    endAt: string | null;
    trialEndAt: string | null;
  } | null;
  stats: { userCount: number; activeModuleCount: number };
  adminUser: { id: string; email: string; fullName: string } | null;
}

export interface AdminPlan {
  id: string;
  code: string;
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
  activeSubscribers: number;
  moduleCount: number;
  modules: Array<{ code: string; name: string; icon: string }>;
}

export interface AdminModule {
  id: string;
  code: string;
  name: string;
  category: string;
  defaultRoute: string;
  icon: string;
  sortOrder: number;
  description: string | null;
  isActive: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'PENDING';
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  tenant: { id: string; code: string; name: string } | null;
  roles: Array<{ code: string; name: string }>;
}

// ---------- API ----------

export const superAdminApi = {
  async getOverview(): Promise<SuperAdminOverview> {
    const res = await apiClient.get<{ data: SuperAdminOverview }>('/super-admin/overview');
    return res.data.data;
  },

  async listTenants(
    params: {
      page?: number;
      pageSize?: number;
      search?: string;
      status?: TenantStatus;
    } = {},
  ): Promise<PaginatedResponse<AdminTenant>> {
    const res = await apiClient.get<{ data: PaginatedResponse<AdminTenant> }>(
      '/super-admin/tenants',
      { params },
    );
    return res.data.data;
  },

  async getTenant(id: string): Promise<AdminTenantDetail> {
    const res = await apiClient.get<{ data: AdminTenantDetail }>(`/super-admin/tenants/${id}`);
    return res.data.data;
  },

  async createTenant(input: {
    code: string;
    name: string;
    workingMode?: 'SAAS_MASTER' | 'ERP_MASTER';
    planCode?: 'starter' | 'standard' | 'professional' | 'enterprise';
  }): Promise<AdminTenant> {
    const res = await apiClient.post<{ data: AdminTenant }>('/super-admin/tenants', input);
    return res.data.data;
  },

  async updateTenantStatus(id: string, status: TenantStatus): Promise<AdminTenant> {
    const res = await apiClient.patch<{ data: AdminTenant }>(`/super-admin/tenants/${id}/status`, {
      status,
    });
    return res.data.data;
  },

  async assignPlan(id: string, planCode: string): Promise<{ activatedModules: number }> {
    const res = await apiClient.post<{ data: { activatedModules: number } }>(
      `/super-admin/tenants/${id}/assign-plan`,
      { planCode },
    );
    return res.data.data;
  },

  async listPlans(): Promise<AdminPlan[]> {
    const res = await apiClient.get<{ data: AdminPlan[] }>('/super-admin/plans');
    return res.data.data;
  },

  async listModules(): Promise<AdminModule[]> {
    const res = await apiClient.get<{ data: AdminModule[] }>('/super-admin/modules');
    return res.data.data;
  },

  async listUsers(
    params: {
      page?: number;
      pageSize?: number;
      search?: string;
      tenantId?: string;
    } = {},
  ): Promise<PaginatedResponse<AdminUser>> {
    const res = await apiClient.get<{ data: PaginatedResponse<AdminUser> }>('/super-admin/users', {
      params,
    });
    return res.data.data;
  },
};
