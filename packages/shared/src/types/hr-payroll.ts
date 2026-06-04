// Shared types for HR-4: Bordro Hazırlık
// Hesaplama yapılmaz — sadece veri girişi, onay ve export

import type {
  PayrollPeriodType,
  PayrollPeriodStatus,
  PayrollRecordStatus,
  SupplementType,
} from '../enums/hr-personnel.enum.js';

export interface HrPayrollPeriodDTO {
  id: string;
  tenantId: string;
  year: number;
  period: number;
  periodType: PayrollPeriodType;
  startDate: string;
  endDate: string;
  status: PayrollPeriodStatus;
  totalGross: number | null;
  totalNet: number | null;
  employeeCount: number | null;
  confirmedBy: string | null;
  confirmedAt: string | null;
  exportedBy: string | null;
  exportedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface HrPayrollRecordDTO {
  id: string;
  tenantId: string;
  periodId: string;
  employeeId: string;
  employee: {
    id: string;
    fullName: string;
    employeeNo: string;
    department: string | null;
    position: string | null;
  };
  workingDays: number;
  absentDays: number;
  overtimeHours: number;
  lateHours: number;
  baseSalary: number;
  grossPay: number;
  sgkEmployee: number;
  unemploymentEmployee: number;
  incomeTax: number;
  netPay: number;
  status: PayrollRecordStatus;
  exportedAt: string | null;
  createdAt: string;
}

export interface HrPayrollSupplementDTO {
  id: string;
  tenantId: string;
  periodId: string;
  employeeId: string;
  recordId: string | null;
  type: SupplementType;
  name: string;
  amount: number;
  isDeduction: boolean;
  notes: string | null;
  createdAt: string;
}