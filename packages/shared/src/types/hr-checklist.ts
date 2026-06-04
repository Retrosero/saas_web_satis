/**
 * FAZ HR-2: Checklist Tipleri
 */

import type { HrOnboardingItemStatus, HrOnboardingStatus } from '../enums/hr-personnel.enum.js';

export interface HrChecklistItem {
  id: string;
  itemKey: string;
  title: string;
  description: string | null;
  isRequired: boolean;
  isCompleted: boolean;
  completedAt: string | null;
  completedBy: string | null;
  status: HrOnboardingItemStatus;
  notes: string | null;
  documentId: string | null;
  sortOrder: number;
}

export interface HrOnboardingChecklist {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    fullName: string;
    employeeNo: string;
    department?: string | null;
  };
  startDate: string;
  targetCompletionDate: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  status: HrOnboardingStatus;
  notes: string | null;
  progress: {
    total: number;
    completed: number;
    required: number;
    requiredCompleted: number;
    percent: number;
    isReadyToComplete: boolean;
  };
  items: HrChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface HrOffboardingChecklist {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    fullName: string;
    employeeNo: string;
    department?: string | null;
  };
  terminationDate: string;
  reason: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  status: HrOnboardingStatus;
  notes: string | null;
  progress: {
    total: number;
    completed: number;
    required: number;
    requiredCompleted: number;
    percent: number;
    isReadyToComplete: boolean;
  };
  items: HrChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export const HrOnboardingStatusLabels: Record<HrOnboardingStatus, string> = {
  NOT_STARTED: 'Başlamadı',
  IN_PROGRESS: 'Devam Ediyor',
  PENDING_DOCS: 'Eksik Evrak Var',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal Edildi',
};

export const HrOnboardingItemStatusLabels: Record<HrOnboardingItemStatus, string> = {
  PENDING: 'Bekliyor',
  IN_PROGRESS: 'Devam Ediyor',
  DONE: 'Tamamlandı',
  BLOCKED: 'Engellendi',
  NOT_APPLICABLE: 'Geçerli Değil',
};

export const HrOnboardingStatusColors: Record<HrOnboardingStatus, string> = {
  NOT_STARTED: 'bg-zinc-100 text-zinc-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  PENDING_DOCS: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};
