import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  ImportBatch,
  ImportEntityType,
  ImportSource,
  ImportStatus,
  PaginatedResponse,
} from '@saas/shared';

export function useImportBatches(params?: { status?: ImportStatus; entityType?: ImportEntityType }) {
  return useQuery({
    queryKey: ['import', 'batches', params],
    queryFn: async () => {
      const { data } = await apiClient.get<ImportBatch[]>('/import/batches', { params });
      return data;
    },
  });
}

export function useImportBatch(id: string) {
  return useQuery({
    queryKey: ['import', 'batches', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ImportBatch>(`/import/batches/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateImportBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; source: ImportSource; entityType: ImportEntityType; fileName?: string; fileSize?: number }) => {
      const { data } = await apiClient.post<ImportBatch>('/import/batches', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['import', 'batches'] }),
  });
}

export function useParseImport(id: string) {
  return useMutation({
    mutationFn: async (input: { content: string; fileName: string; fileSize: number }) => {
      const { data } = await apiClient.post<{ rowCount: number; sample: any[]; columns: string[] }>(`/import/batches/${id}/parse`, input);
      return data;
    },
  });
}

export function useSetMapping(id: string) {
  return useMutation({
    mutationFn: async (mapping: Record<string, string>) => {
      const { data } = await apiClient.put<ImportBatch>(`/import/batches/${id}/mapping`, { mapping });
      return data;
    },
  });
}

export function useImportPreview(id: string, page = 1, pageSize = 50) {
  return useQuery({
    queryKey: ['import', 'preview', id, page, pageSize],
    queryFn: async () => {
      const { data } = await apiClient.get<{ rows: any[]; total: number; errorCount: number }>(`/import/batches/${id}/preview`, { params: { page, pageSize } });
      return data;
    },
    enabled: !!id,
  });
}

export function useExecuteImport(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ success: number; errors: number; duplicates: number }>(`/import/batches/${id}/execute`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['import'] }),
  });
}

export function useRollbackImport(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ deleted: number }>(`/import/batches/${id}/rollback`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['import'] }),
  });
}

export function useDeleteImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/import/batches/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['import'] }),
  });
}
