import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CustomerRiskLevel, BulkOperationType, BulkOperationStatus } from '@saas/shared';

// Customer Risk
export function useCustomerRiskDashboard() {
  return useQuery({
    queryKey: ['customer-risk', 'dashboard'],
    queryFn: async () => { const { data } = await apiClient.get<any>('/customer-risk/dashboard'); return data; },
  });
}
export function useRefreshCustomerRisk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => { const { data } = await apiClient.post<any>('/customer-risk/refresh'); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer-risk'] }),
  });
}
export function useAtRiskCustomers(params?: { level?: CustomerRiskLevel; minBalance?: number; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['customer-risk', 'at-risk', params],
    queryFn: async () => { const { data } = await apiClient.get<{ items: any[]; total: number }>('/customer-risk/at-risk', { params }); return data; },
  });
}
export function useCustomerRiskConfigs() {
  return useQuery({
    queryKey: ['customer-risk', 'configs'],
    queryFn: async () => { const { data } = await apiClient.get<any[]>('/customer-risk/configs'); return data; },
  });
}
export function useUpsertRiskConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => { const { data } = await apiClient.post<any>('/customer-risk/configs', input); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer-risk'] }),
  });
}

// Product Recommendations
export function useProductRecommendations(customerId?: string) {
  return useQuery({
    queryKey: ['product-recommendations', 'for-customer', customerId],
    queryFn: async () => { const { data } = await apiClient.get<any[]>(`/product-recommendations/for-customer/${customerId}`); return data; },
    enabled: !!customerId,
  });
}
export function useRecommendationRules() {
  return useQuery({
    queryKey: ['product-recommendations', 'rules'],
    queryFn: async () => { const { data } = await apiClient.get<any[]>('/product-recommendations/rules'); return data; },
  });
}
export function useCreateRecommendationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => { const { data } = await apiClient.post<any>('/product-recommendations/rules', input); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-recommendations', 'rules'] }),
  });
}

// Bulk Operations
export function useBulkOperations(params?: { type?: BulkOperationType; status?: BulkOperationStatus; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['bulk-operations', params],
    queryFn: async () => { const { data } = await apiClient.get<{ items: any[]; total: number }>('/bulk-operations', { params }); return data; },
  });
}
export function useBulkPreview() {
  return useMutation({
    mutationFn: async (input: { type: BulkOperationType; filters: any; update: any }) => { const { data } = await apiClient.post<{ totalMatched: number; sample: any[] }>('/bulk-operations/preview', input); return data; },
  });
}
export function useCreateBulkOperation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => { const { data } = await apiClient.post<any>('/bulk-operations', input); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bulk-operations'] }),
  });
}
export function useExecuteBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { data } = await apiClient.post<any>(`/bulk-operations/${id}/execute`); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bulk-operations'] }),
  });
}
export function useRollbackBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { data } = await apiClient.post<any>(`/bulk-operations/${id}/rollback`); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bulk-operations'] }),
  });
}

// Labels
export function useLabelTemplates() {
  return useQuery({
    queryKey: ['labels', 'templates'],
    queryFn: async () => { const { data } = await apiClient.get<any[]>('/labels/templates'); return data; },
  });
}
export function useCreateLabelTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => { const { data } = await apiClient.post<any>('/labels/templates', input); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labels', 'templates'] }),
  });
}
export function useDeleteLabelTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/labels/templates/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labels', 'templates'] }),
  });
}
export function usePrintLabels() {
  return useMutation({
    mutationFn: async (input: { templateId: string; productIds: string[]; copies?: number }) => { const { data } = await apiClient.post<{ ok: boolean; jobId: string; totalLabels: number }>('/labels/print', input); return data; },
  });
}

// Product Images
export function useProductImagesDashboard() {
  return useQuery({
    queryKey: ['product-images', 'dashboard'],
    queryFn: async () => { const { data } = await apiClient.get<any>('/product-images/dashboard'); return data; },
  });
}
export function useProductImages(params?: { productId?: string; isMain?: boolean; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['product-images', params],
    queryFn: async () => { const { data } = await apiClient.get<{ items: any[]; total: number }>('/product-images', { params }); return data; },
  });
}
export function useAddProductImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => { const { data } = await apiClient.post<any>('/product-images', input); return data; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['product-images'] }); qc.invalidateQueries({ queryKey: ['product-images', 'dashboard'] }); },
  });
}
export function useBatchUploadImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { files: any[]; matchBy: 'filename' | 'barcode' | 'productCode' }) => { const { data } = await apiClient.post<{ batchId: string; total: number; success: number; failed: number }>('/product-images/batch-upload', input); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-images'] }),
  });
}
export function useDeleteProductImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/product-images/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-images'] }),
  });
}

// Customer Segments
export function useCustomerSegments() {
  return useQuery({
    queryKey: ['customer-segments'],
    queryFn: async () => { const { data } = await apiClient.get<any[]>('/customer-segments'); return data; },
  });
}
export function useCustomerSegment(id?: string) {
  return useQuery({
    queryKey: ['customer-segments', id],
    queryFn: async () => { const { data } = await apiClient.get<any>(`/customer-segments/${id}`); return data; },
    enabled: !!id,
  });
}
export function useCreateSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => { const { data } = await apiClient.post<any>('/customer-segments', input); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer-segments'] }),
  });
}
export function useDeleteSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/customer-segments/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer-segments'] }),
  });
}
export function useRefreshSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { data } = await apiClient.post<any>(`/customer-segments/${id}/refresh`); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer-segments'] }),
  });
}

// Cleanup
export function useCleanupDashboard() {
  return useQuery({
    queryKey: ['cleanup', 'dashboard'],
    queryFn: async () => { const { data } = await apiClient.get<any>('/cleanup/dashboard'); return data; },
  });
}
export function useCleanupJobs() {
  return useQuery({
    queryKey: ['cleanup', 'jobs'],
    queryFn: async () => { const { data } = await apiClient.get<any[]>('/cleanup/jobs'); return data; },
  });
}
export function useCleanupPreview() {
  return useMutation({
    mutationFn: async (input: { type: any; filters: any }) => { const { data } = await apiClient.post<any>('/cleanup/preview', input); return data; },
  });
}
export function useRunCleanup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { type: any; filters: any; archive?: boolean }) => { const { data } = await apiClient.post<any>('/cleanup/run', input); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cleanup'] }),
  });
}
