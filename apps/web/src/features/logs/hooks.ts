import { useQuery } from '@tanstack/react-query';
import { logsApi } from './api';

export function useSuperAuditLogs(params: Parameters<typeof logsApi.listSuperAudit>[0] = {}) {
  return useQuery({
    queryKey: ['super-admin', 'logs', 'audit', params],
    queryFn: () => logsApi.listSuperAudit(params),
    staleTime: 5_000,
  });
}
export function useSuperAuditStats(tenantId?: string) {
  return useQuery({
    queryKey: ['super-admin', 'logs', 'audit-stats', tenantId],
    queryFn: () => logsApi.superAuditStats(tenantId),
    staleTime: 30_000,
  });
}
export function useSuperErrorLogs(params: Parameters<typeof logsApi.listSuperError>[0] = {}) {
  return useQuery({
    queryKey: ['super-admin', 'logs', 'error', params],
    queryFn: () => logsApi.listSuperError(params),
    staleTime: 5_000,
  });
}
export function useSuperSecurityLogs(params: Parameters<typeof logsApi.listSuperSecurity>[0] = {}) {
  return useQuery({
    queryKey: ['super-admin', 'logs', 'security', params],
    queryFn: () => logsApi.listSuperSecurity(params),
    staleTime: 5_000,
  });
}

export function useTenantAuditLogs(params: Parameters<typeof logsApi.listTenantAudit>[0] = {}) {
  return useQuery({
    queryKey: ['tenant-logs', 'audit', params],
    queryFn: () => logsApi.listTenantAudit(params),
    staleTime: 5_000,
  });
}
export function useTenantSecurityLogs(
  params: Parameters<typeof logsApi.listTenantSecurity>[0] = {},
) {
  return useQuery({
    queryKey: ['tenant-logs', 'security', params],
    queryFn: () => logsApi.listTenantSecurity(params),
    staleTime: 5_000,
  });
}
