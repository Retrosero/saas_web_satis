import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse, RiskLevel } from '@saas/shared';

export interface AuditLog {
  id: string;
  tenantId: string | null;
  tenant: { id: string; code: string; name: string } | null;
  userId: string | null;
  user: { id: string; email: string; fullName: string } | null;
  module: string;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  changedFields: string[];
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  riskLevel: RiskLevel;
  createdAt: string;
}

export interface ErrorLog {
  id: string;
  tenantId: string | null;
  userId: string | null;
  level: string;
  message: string;
  path: string | null;
  method: string | null;
  statusCode: number | null;
  requestId: string | null;
  createdAt: string;
}

export interface SecurityLog {
  id: string;
  tenantId: string | null;
  userId: string | null;
  user: { id: string; email: string; fullName: string } | null;
  event: string;
  ipAddress: string | null;
  userAgent: string | null;
  riskLevel: RiskLevel;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditStats {
  last24h: number;
  critical: number;
  high: number;
}

export const logsApi = {
  // Süper admin
  async listSuperAudit(params: {
    page?: number;
    pageSize?: number;
    module?: string;
    action?: string;
    riskLevel?: RiskLevel;
    userId?: string;
    entityType?: string;
    tenantId?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<PaginatedResponse<AuditLog>> {
    const res = await apiClient.get<{ data: PaginatedResponse<AuditLog> }>('/super-admin/logs/audit', { params });
    return res.data.data;
  },

  async superAuditStats(tenantId?: string): Promise<AuditStats> {
    const res = await apiClient.get<{ data: AuditStats }>('/super-admin/logs/audit/stats', { params: { tenantId } });
    return res.data.data;
  },

  async listSuperError(params: {
    page?: number;
    pageSize?: number;
    level?: string;
    path?: string;
    statusCode?: number;
    tenantId?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<PaginatedResponse<ErrorLog>> {
    const res = await apiClient.get<{ data: PaginatedResponse<ErrorLog> }>('/super-admin/logs/error', { params });
    return res.data.data;
  },

  async listSuperSecurity(params: {
    page?: number;
    pageSize?: number;
    event?: string;
    riskLevel?: RiskLevel;
    userId?: string;
    ipAddress?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<PaginatedResponse<SecurityLog>> {
    const res = await apiClient.get<{ data: PaginatedResponse<SecurityLog> }>('/super-admin/logs/security', { params });
    return res.data.data;
  },

  // Tenant
  async listTenantAudit(params: {
    page?: number;
    pageSize?: number;
    module?: string;
    action?: string;
    riskLevel?: RiskLevel;
    userId?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<PaginatedResponse<AuditLog>> {
    const res = await apiClient.get<{ data: PaginatedResponse<AuditLog> }>('/settings/logs/audit', { params });
    return res.data.data;
  },

  async listTenantSecurity(params: {
    page?: number;
    pageSize?: number;
    event?: string;
    userId?: string;
    ipAddress?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<PaginatedResponse<SecurityLog>> {
    const res = await apiClient.get<{ data: PaginatedResponse<SecurityLog> }>('/settings/logs/security', { params });
    return res.data.data;
  },
};
