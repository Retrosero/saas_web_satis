// Shared types for HR-3: İzin Yönetimi
import type { HrLeaveTypeCode, HrLeaveAccrualMethod, HrLeaveRequestStatus } from '../enums/hr-personnel.enum';
// Labels are exported from hr-personnel.enum.js — re-export for convenience
export { HrLeaveRequestStatusLabels, HrLeaveRequestStatusColors, HrLeaveTypeCodeLabels } from '../enums/hr-personnel.enum';

export interface HrLeaveTypeDTO {
  id: string;
  tenantId: string;
  name: string;
  code: HrLeaveTypeCode;
  color: string;
  icon: string;
  accrualMethod: HrLeaveAccrualMethod;
  defaultDaysPerYear: number;
  requiresApproval: boolean;
  requiresDocument: boolean;
  minDaysNotice: number;
  maxConsecutiveDays: number;
  canCarryOver: boolean;
  carryOverDays: number;
  isPaid: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface HrLeaveBalanceDTO {
  id: string;
  tenantId: string;
  employeeId: string;
  leaveTypeId: string;
  leaveType: HrLeaveTypeDTO;
  year: number;
  entitledDays: number;
  accruedDays: number;
  usedDays: number;
  pendingDays: number;
  carriedOverDays: number;
  availableDays: number;
  expiresAt: string | null;
  createdAt: string;
}

export interface HrLeaveRequestDTO {
  id: string;
  tenantId: string;
  employeeId: string;
  employee: {
    id: string;
    fullName: string;
    employeeNo: string;
    department: string | null;
  };
  leaveTypeId: string;
  leaveType: HrLeaveTypeDTO;
  startDate: string;
  endDate: string;
  totalDays: number;
  workingDays: number;
  reason: string | null;
  status: HrLeaveRequestStatus;
  approverId: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  documentUrl: string | null;
  replacementEmployeeId: string | null;
  createdBy: string;
  createdAt: string;
}
