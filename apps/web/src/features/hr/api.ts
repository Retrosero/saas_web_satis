import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  CreateHrEmployeeDto,
  FilterHrEmployeeDto,
  HrEmployee,
  HrEmployeeDocument,
  PaginatedResponse,
  UpdateHrEmployeeDto,
} from '@saas/shared';

// ---------- Helpers ----------

/** Sensitive data maskeleme kaldırma (TC/IBAN full görmek için). */
const INCLUDE_SENSITIVE = 'includeSensitive=true';

// ---------- Personel ----------

export function useEmployees(params?: FilterHrEmployeeDto) {
  return useQuery({
    queryKey: ['hr', 'employees', params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<HrEmployee>>('/hr/employees', {
        params,
      });
      return data;
    },
  });
}

export function useEmployee(id: string | null) {
  return useQuery({
    queryKey: ['hr', 'employees', id],
    queryFn: async () => {
      const { data } = await apiClient.get<HrEmployee>(`/hr/employees/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useEmployeeSensitive(id: string | null) {
  return useQuery({
    queryKey: ['hr', 'employees', id, 'sensitive'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ identityNumber: string | null; iban: string | null }>(
        `/hr/employees/${id}/sensitive`,
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateHrEmployeeDto) => {
      const { data } = await apiClient.post<HrEmployee>('/hr/employees', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'employees'] }),
  });
}

export function useUpdateEmployee(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateHrEmployeeDto) => {
      const { data } = await apiClient.put<HrEmployee>(`/hr/employees/${id}`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'employees'] }),
  });
}

export function useArchiveEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/hr/employees/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'employees'] }),
  });
}

export function useTerminateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, terminationDate, reason }: { id: string; terminationDate: string; reason: string }) => {
      const { data } = await apiClient.patch<HrEmployee>(`/hr/employees/${id}/terminate`, {
        terminationDate,
        reason,
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'employees'] }),
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ['hr', 'meta', 'departments'],
    queryFn: async () => {
      const { data } = await apiClient.get<string[]>('/hr/employees/meta/departments');
      return data;
    },
  });
}

export function useBranches() {
  return useQuery({
    queryKey: ['hr', 'meta', 'branches'],
    queryFn: async () => {
      const { data } = await apiClient.get<string[]>('/hr/employees/meta/branches');
      return data;
    },
  });
}

// ---------- Evraklar ----------

export function useEmployeeDocuments(employeeId: string | null) {
  return useQuery({
    queryKey: ['hr', 'employees', employeeId, 'documents'],
    queryFn: async () => {
      const { data } = await apiClient.get<HrEmployeeDocument[]>(`/hr/employees/${employeeId}/documents`);
      return data;
    },
    enabled: !!employeeId,
  });
}

export function useUploadDocument(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      file: File;
      documentType: string;
      title: string;
      issueDate?: string;
      expiryDate?: string;
      description?: string;
    }) => {
      const formData = new FormData();
      formData.append('file', input.file);
      formData.append('documentType', input.documentType);
      formData.append('title', input.title);
      if (input.issueDate) formData.append('issueDate', input.issueDate);
      if (input.expiryDate) formData.append('expiryDate', input.expiryDate);
      if (input.description) formData.append('description', input.description);

      const { data } = await apiClient.post<HrEmployeeDocument>(
        `/hr/documents/upload/${employeeId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'employees', employeeId, 'documents'] }),
  });
}

export function useUpdateDocumentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) => {
      const { data } = await apiClient.patch<HrEmployeeDocument>(`/hr/documents/${id}/status`, { status });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr'] }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/hr/documents/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr'] }),
  });
}

export function downloadDocumentUrl(id: string) {
  return `${apiClient.defaults.baseURL}/hr/documents/${id}/download`;
}

// ---------- Checklist ----------

import type { HrOnboardingChecklist, HrOffboardingChecklist, HrOnboardingItemStatus, HrOnboardingStatus } from '@saas/shared';

export function useOnboardings(params?: { status?: HrOnboardingStatus; employeeId?: string }) {
  return useQuery({
    queryKey: ['hr', 'onboardings', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Array<{
        id: string;
        employeeId: string;
        employee: { id: string; fullName: string; employeeNo: string; department: string | null };
        startDate: string;
        targetCompletionDate: string | null;
        status: HrOnboardingStatus;
        itemCount: number;
        createdAt: string;
      }> }>('/hr/checklists/onboardings', { params });
      return data.data;
    },
  });
}

export function useOnboarding(id: string | null) {
  return useQuery({
    queryKey: ['hr', 'onboardings', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: HrOnboardingChecklist }>(`/hr/checklists/onboardings/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useStartOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { employeeId: string; startDate: string; targetCompletionDate?: string; notes?: string }) => {
      const { data } = await apiClient.post<{ data: HrOnboardingChecklist }>('/hr/checklists/onboardings', input);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'onboardings'] }),
  });
}

export function useUpdateOnboardingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { checklistId: string; itemId: string; status: HrOnboardingItemStatus; notes?: string; documentId?: string }) => {
      const { data } = await apiClient.patch<{ data: HrOnboardingChecklist }>(
        `/hr/checklists/onboardings/${input.checklistId}/items/${input.itemId}`,
        { status: input.status, notes: input.notes, documentId: input.documentId },
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'onboardings'] }),
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<{ data: HrOnboardingChecklist }>(`/hr/checklists/onboardings/${id}/complete`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'onboardings'] }),
  });
}

export function useCancelOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<{ data: HrOnboardingChecklist }>(`/hr/checklists/onboardings/${id}/cancel`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'onboardings'] }),
  });
}

export function useOffboardings(params?: { status?: HrOnboardingStatus; employeeId?: string }) {
  return useQuery({
    queryKey: ['hr', 'offboardings', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Array<{
        id: string;
        employeeId: string;
        employee: { id: string; fullName: string; employeeNo: string; department: string | null };
        terminationDate: string;
        reason: string | null;
        status: HrOnboardingStatus;
        itemCount: number;
        createdAt: string;
      }> }>('/hr/checklists/offboardings', { params });
      return data.data;
    },
  });
}

export function useOffboarding(id: string | null) {
  return useQuery({
    queryKey: ['hr', 'offboardings', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: HrOffboardingChecklist }>(`/hr/checklists/offboardings/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useStartOffboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { employeeId: string; terminationDate: string; reason?: string; notes?: string }) => {
      const { data } = await apiClient.post<{ data: HrOffboardingChecklist }>('/hr/checklists/offboardings', input);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'offboardings'] }),
  });
}

export function useUpdateOffboardingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { checklistId: string; itemId: string; status: HrOnboardingItemStatus; notes?: string; documentId?: string }) => {
      const { data } = await apiClient.patch<{ data: HrOffboardingChecklist }>(
        `/hr/checklists/offboardings/${input.checklistId}/items/${input.itemId}`,
        { status: input.status, notes: input.notes, documentId: input.documentId },
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'offboardings'] }),
  });
}

export function useCompleteOffboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<{ data: HrOffboardingChecklist }>(`/hr/checklists/offboardings/${id}/complete`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'offboardings'] }),
  });
}

export function useCancelOffboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<{ data: HrOffboardingChecklist }>(`/hr/checklists/offboardings/${id}/cancel`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'offboardings'] }),
  });
}

// ---------- Leave Types ----------

export function useLeaveTypes() {
  return useQuery({
    queryKey: ['hr', 'leave', 'types'],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>('/hr/leave/types');
      return data;
    },
  });
}

export function useCreateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const { data } = await apiClient.post('/hr/leave/types', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'leave', 'types'] }),
  });
}

export function useUpdateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: any) => {
      const { data } = await apiClient.patch(`/hr/leave/types/${id}`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'leave', 'types'] }),
  });
}

// ---------- Leave Balances ----------

export function useLeaveBalances(params?: { employeeId?: string; year?: number; leaveTypeId?: string }) {
  return useQuery({
    queryKey: ['hr', 'leave', 'balances', params],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>('/hr/leave/balances', { params });
      return data;
    },
  });
}

export function useEmployeeBalances(employeeId: string | null, year?: number) {
  return useQuery({
    queryKey: ['hr', 'leave', 'balances', employeeId, year],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>(`/hr/leave/balances/${employeeId}`, {
        params: { year: year ?? new Date().getFullYear() },
      });
      return data;
    },
    enabled: !!employeeId,
  });
}

export function useInitializeBalances() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (year: number) => {
      const { data } = await apiClient.post<{ created: number; year: number }>('/hr/leave/balances/initialize', { year });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'leave', 'balances'] }),
  });
}

export function useAdjustBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { employeeId: string; leaveTypeId: string; year: number; adjustment: number; reason: string }) => {
      const { data } = await apiClient.post('/hr/leave/balances/adjust', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'leave', 'balances'] }),
  });
}

// ---------- Leave Requests ----------

export function useLeaveRequests(params?: {
  status?: string;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  approverId?: string;
}) {
  return useQuery({
    queryKey: ['hr', 'leave', 'requests', params],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>('/hr/leave/requests', { params });
      return data;
    },
  });
}

export function useLeaveRequest(id: string | null) {
  return useQuery({
    queryKey: ['hr', 'leave', 'requests', id],
    queryFn: async () => {
      const { data } = await apiClient.get<any>(`/hr/leave/requests/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      employeeId: string;
      leaveTypeId: string;
      startDate: string;
      endDate: string;
      reason?: string;
      documentUrl?: string;
      replacementEmployeeId?: string;
    }) => {
      const { data } = await apiClient.post('/hr/leave/requests', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'leave', 'requests'] }),
  });
}

export function useApproveLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<any>(`/hr/leave/requests/${id}/approve`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'leave', 'requests'] }),
  });
}

export function useRejectLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data } = await apiClient.post<any>(`/hr/leave/requests/${id}/reject`, { reason });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'leave', 'requests'] }),
  });
}

export function useCancelLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data } = await apiClient.post<any>(`/hr/leave/requests/${id}/cancel`, { reason });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'leave', 'requests'] }),
  });
}

// ---------- Payroll Periods ----------

export function usePayrollPeriods(params?: { year?: number; status?: string; periodType?: string }) {
  return useQuery({
    queryKey: ['hr', 'payroll', 'periods', params],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>('/hr/payroll/periods', { params });
      return data;
    },
  });
}

export function usePayrollPeriod(id: string | null) {
  return useQuery({
    queryKey: ['hr', 'payroll', 'periods', id],
    queryFn: async () => {
      const { data } = await apiClient.get<any>(`/hr/payroll/periods/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreatePayrollPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      year: number;
      period: number;
      periodType: string;
      startDate: string;
      endDate: string;
      notes?: string;
    }) => {
      const { data } = await apiClient.post('/hr/payroll/periods', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'payroll', 'periods'] }),
  });
}

export function useUpdatePayrollPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: any) => {
      const { data } = await apiClient.patch(`/hr/payroll/periods/${id}`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'payroll', 'periods'] }),
  });
}

export function useConfirmPayrollPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<any>(`/hr/payroll/periods/${id}/confirm`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'payroll', 'periods'] }),
  });
}

export function useExportPayrollPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<any>(`/hr/payroll/periods/${id}/export`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'payroll', 'periods'] }),
  });
}

export function useClosePayrollPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<any>(`/hr/payroll/periods/${id}/close`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'payroll', 'periods'] }),
  });
}

// ---------- Payroll Records ----------

export function usePayrollRecords(periodId: string | null, params?: { status?: string }) {
  return useQuery({
    queryKey: ['hr', 'payroll', 'records', periodId, params],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>('/hr/payroll/records', { params: { periodId: periodId!, ...params } });
      return data;
    },
    enabled: !!periodId,
  });
}

export function useUpsertPayrollRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const { data } = await apiClient.post('/hr/payroll/records', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'payroll', 'records'] }),
  });
}

export function useInitializePayrollRecords() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (periodId: string) => {
      const { data } = await apiClient.post<{ created: number }>(`/hr/payroll/periods/${periodId}/initialize`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'payroll', 'records'] }),
  });
}

// ---------- Payroll Supplements ----------

export function usePayrollSupplements(periodId: string | null, employeeId?: string) {
  return useQuery({
    queryKey: ['hr', 'payroll', 'supplements', periodId, employeeId],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>('/hr/payroll/supplements', {
        params: { periodId: periodId!, ...(employeeId ? { employeeId } : {}) },
      });
      return data;
    },
    enabled: !!periodId,
  });
}

export function useAddPayrollSupplement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const { data } = await apiClient.post('/hr/payroll/supplements', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'payroll', 'supplements'] }),
  });
}

export function useDeletePayrollSupplement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/hr/payroll/supplements/${id}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'payroll', 'supplements'] }),
  });
}

// ---------- Payroll Params (HR-5) ----------

export function usePayrollParams(year?: number) {
  return useQuery({
    queryKey: ['hr', 'payroll-params', year],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>('/hr/payroll-params', { params: year ? { year } : {} });
      return data;
    },
  });
}

export function useUpsertPayrollParam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { year: number; paramKey: string; paramValue: number; description?: string }) => {
      const { data } = await apiClient.post('/hr/payroll-params', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'payroll-params'] }),
  });
}

export function useSeedPayrollParams() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (year: number) => {
      const { data } = await apiClient.post(`/hr/payroll-params/seed`, { year });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'payroll-params'] }),
  });
}

// ---------- Absences (HR-6) ----------

export function useAbsences(params?: { employeeId?: string; absenceType?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['hr', 'absences', params],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>('/hr/absences', { params });
      return data;
    },
  });
}

export function useCreateAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const { data } = await apiClient.post('/hr/absences', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'absences'] }),
  });
}

export function useDeleteAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/hr/absences/${id}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'absences'] }),
  });
}

// ---------- Disciplinary (HR-6) ----------

export function useDisciplinaryCases(params?: { employeeId?: string; isClosed?: boolean }) {
  return useQuery({
    queryKey: ['hr', 'disciplinary', params],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>('/hr/disciplinary', { params });
      return data;
    },
  });
}

export function useCreateDisciplinaryCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const { data } = await apiClient.post('/hr/disciplinary', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'disciplinary'] }),
  });
}

export function useCloseDisciplinaryCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: any) => {
      const { data } = await apiClient.post(`/hr/disciplinary/${id}/close`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'disciplinary'] }),
  });
}

// ---------- Career (HR-7) ----------

export function useCareerRecords(employeeId?: string) {
  return useQuery({
    queryKey: ['hr', 'career', employeeId],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>('/hr/career', { params: employeeId ? { employeeId } : {} });
      return data;
    },
  });
}

export function useCreateCareerRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const { data } = await apiClient.post('/hr/career', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'career'] }),
  });
}

// ---------- Training (HR-7) ----------

export function useTrainings(params?: { status?: string }) {
  return useQuery({
    queryKey: ['hr', 'trainings', params],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>('/hr/trainings', { params });
      return data;
    },
  });
}

export function useCreateTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const { data } = await apiClient.post('/hr/trainings', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'trainings'] }),
  });
}

export function useAddTrainingParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ trainingId, employeeId }: any) => {
      const { data } = await apiClient.post(`/hr/trainings/${trainingId}/participants`, { employeeId });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'trainings'] }),
  });
}

// ---------- Performance (HR-7) ----------

export function usePerformanceReviews(params?: { employeeId?: string; period?: string; status?: string }) {
  return useQuery({
    queryKey: ['hr', 'performance', params],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>('/hr/performance', { params });
      return data;
    },
  });
}

export function useUpsertPerformanceReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const { data } = await apiClient.post('/hr/performance', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'performance'] }),
  });
}

export function useCompletePerformanceReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: any) => {
      const { data } = await apiClient.post(`/hr/performance/${id}/complete`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'performance'] }),
  });
}

// ---------- HR-8: Puantaj (Yoklama) ----------

export function usePunchList(date: string | undefined) {
  return useQuery({
    queryKey: ['hr', 'punch', date],
    queryFn: async () => {
      if (!date) return [];
      const { data } = await apiClient.get<any[]>('/hr/punch', { params: { date } });
      return data;
    },
    enabled: !!date,
  });
}

export function useUpsertPunch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const { data } = await apiClient.post('/hr/punch', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'punch'] }),
  });
}

export function useEmployeePunchSummary(employeeId: string | undefined, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['hr', 'punch', 'summary', employeeId, startDate, endDate],
    queryFn: async () => {
      if (!employeeId) return null;
      const { data } = await apiClient.get('/hr/punch/summary', { params: { employeeId, startDate, endDate } });
      return data;
    },
    enabled: !!employeeId,
  });
}

export function useSyncPunchToPayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { periodId: string }) => {
      const { data } = await apiClient.post('/hr/punch/sync-to-payroll', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr', 'punch'] });
      qc.invalidateQueries({ queryKey: ['hr', 'payroll'] });
    },
  });
}

// ---------- HR-9: Avans ----------

export function useAdvances(params?: { employeeId?: string; status?: string }) {
  return useQuery({
    queryKey: ['hr', 'advances', params],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>('/hr/advances', { params });
      return data;
    },
  });
}

export function useCreateAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const { data } = await apiClient.post('/hr/advances', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'advances'] }),
  });
}

export function useApproveAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/hr/advances/${id}/approve`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'advances'] }),
  });
}

export function usePayAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, deductionMonth }: { id: string; deductionMonth?: string }) => {
      const { data } = await apiClient.post(`/hr/advances/${id}/pay`, { deductionMonth });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'advances'] }),
  });
}

export function useRejectAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/hr/advances/${id}/reject`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'advances'] }),
  });
}

export function useDeductAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, periodId }: { id: string; periodId: string }) => {
      const { data } = await apiClient.post(`/hr/advances/${id}/deduct`, { periodId });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr', 'advances'] });
      qc.invalidateQueries({ queryKey: ['hr', 'payroll'] });
    },
  });
}

export function useEmployeeActiveAdvanceTotal(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['hr', 'advances', 'active-total', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      const { data } = await apiClient.get('/hr/advances/active-total', { params: { employeeId } });
      return data;
    },
    enabled: !!employeeId,
  });
}

// ---------- HR-10: Excel Export ----------

export function useExportPayrollExcel() {
  return useMutation({
    mutationFn: async (periodId: string) => {
      const response = await apiClient.post(`/hr/payroll/${periodId}/export-excel`, {}, { responseType: 'blob' });
      // Yanıttan dosya adını çıkar
      const disposition = response.headers['content-disposition'] ?? '';
      const match = disposition.match(/filename="(.+)"/);
      const filename = match?.[1] ?? `bordro-${periodId}.xlsx`;

      // Blob indir
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { filename };
    },
  });
}
