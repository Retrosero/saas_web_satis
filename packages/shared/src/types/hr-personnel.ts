/**
 * FAZ HR-1: İK Personel Özlük Kartı Tipleri
 */

import type {
  ContractType,
  EmploymentStatus,
  HrDocumentStatus,
  HrDocumentType,
  HrGender,
  MaritalStatus,
  WorkingType,
} from '../enums/hr-personnel.enum';

/**
 * Personel özlük kartı (maskeli DTO)
 * identityNumber ve iban varsayılan maskeli gelir.
 * İstemci `includeSensitive=true` veya `hr.sensitive_data.view` yetkisi isterse full.
 */
export interface HrEmployee {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  fullName: string;
  identityNumber?: string;              // maskeli
  identityNumberVisible?: string;       // full (sensitive)
  birthDate?: string | null;
  gender?: HrGender | null;
  maritalStatus?: MaritalStatus | null;
  bloodType?: string | null;
  phone?: string;
  email?: string;
  address?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string;
  iban?: string;                         // maskeli
  ibanVisible?: string;                  // full (sensitive)
  photoUrl?: string | null;
  status: EmploymentStatus;
  hireDate?: string | null;
  terminationDate?: string | null;
  terminationReason?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  employment?: HrEmployeeEmploymentInfo | null;
  documentCount?: number;
}

export interface HrEmployeeEmploymentInfo {
  id: string;
  employeeId: string;
  department?: string | null;
  branch?: string | null;
  position?: string | null;
  workingType: WorkingType;
  contractType: ContractType;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  probationMonths: number;
  probationEndDate?: string | null;
  sgkRegistrationNo?: string | null;
  sgkEmployerNo?: string | null;
  sgkWorkplaceCode?: string | null;
  jobDescription?: string | null;
  weeklyHours?: number | null;
  workLocation?: string | null;
  isActive: boolean;
}

export interface HrEmployeeDocument {
  id: string;
  employeeId: string;
  documentType: HrDocumentType;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: HrDocumentStatus;
  issueDate?: string | null;
  expiryDate?: string | null;
  description?: string | null;
  uploadedBy: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  downloadUrl?: string;  // signed, kısa süreli
}

export interface CreateHrEmployeeDto {
  employeeNo?: string;          // opsiyonel: otomatik üretilir
  firstName: string;
  lastName: string;
  identityNumber?: string;
  birthDate?: string;
  gender?: HrGender;
  maritalStatus?: MaritalStatus;
  bloodType?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  iban?: string;
  hireDate?: string;
  terminationDate?: string;
  terminationReason?: string;
  notes?: string;
  employment?: Partial<HrEmployeeEmploymentInfo>;
}

export interface UpdateHrEmployeeDto extends Partial<CreateHrEmployeeDto> {
  status?: EmploymentStatus;
}

export interface FilterHrEmployeeDto {
  page?: number;
  pageSize?: number;
  search?: string;       // ad, soyad, sicil no, tc, telefon
  status?: EmploymentStatus;
  department?: string;
  branch?: string;
  workingType?: WorkingType;
  includeSensitive?: boolean;  // false = masked
}
