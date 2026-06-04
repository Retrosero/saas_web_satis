/**
 * FAZ HR-1: İK Personel Özlük Kartı Enumları
 */

export const HrGender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const;
export type HrGender = (typeof HrGender)[keyof typeof HrGender];

export const MaritalStatus = {
  SINGLE: 'SINGLE',
  MARRIED: 'MARRIED',
  DIVORCED: 'DIVORCED',
  WIDOWED: 'WIDOWED',
} as const;
export type MaritalStatus = (typeof MaritalStatus)[keyof typeof MaritalStatus];

export const EmploymentStatus = {
  ACTIVE: 'ACTIVE',
  ON_LEAVE: 'ON_LEAVE',
  SUSPENDED: 'SUSPENDED',
  RESIGNED: 'RESIGNED',
  TERMINATED: 'TERMINATED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type EmploymentStatus = (typeof EmploymentStatus)[keyof typeof EmploymentStatus];

export const ContractType = {
  INDEFINITE: 'INDEFINITE',
  DEFINITE: 'DEFINITE',
  PART_TIME: 'PART_TIME',
  INTERNSHIP: 'INTERNSHIP',
  SEASONAL: 'SEASONAL',
  OUTSOURCE: 'OUTSOURCE',
} as const;
export type ContractType = (typeof ContractType)[keyof typeof ContractType];

export const WorkingType = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  HOURLY: 'HOURLY',
  TEMPORARY: 'TEMPORARY',
  INTERN: 'INTERN',
  OUTSOURCE: 'OUTSOURCE',
} as const;
export type WorkingType = (typeof WorkingType)[keyof typeof WorkingType];

export const HrDocumentType = {
  IDENTITY_COPY: 'IDENTITY_COPY',
  EMPLOYMENT_CONTRACT: 'EMPLOYMENT_CONTRACT',
  KVKK_CONSENT: 'KVKK_CONSENT',
  HEALTH_REPORT: 'HEALTH_REPORT',
  CRIMINAL_RECORD: 'CRIMINAL_RECORD',
  DIPLOMA_CERTIFICATE: 'DIPLOMA_CERTIFICATE',
  RESIDENCE_CERTIFICATE: 'RESIDENCE_CERTIFICATE',
  PHOTO: 'PHOTO',
  OSH_TRAINING: 'OSH_TRAINING',
  INVENTORY_FORM: 'INVENTORY_FORM',
  SGK_ENTRY_DECLARATION: 'SGK_ENTRY_DECLARATION',
  TERMINATION_PAPERS: 'TERMINATION_PAPERS',
  OTHER: 'OTHER',
} as const;
export type HrDocumentType = (typeof HrDocumentType)[keyof typeof HrDocumentType];

export const HrDocumentTypeLabels: Record<HrDocumentType, string> = {
  IDENTITY_COPY: 'Kimlik Fotokopisi',
  EMPLOYMENT_CONTRACT: 'İş Sözleşmesi',
  KVKK_CONSENT: 'KVKK Aydınlatma/Onay',
  HEALTH_REPORT: 'Sağlık Raporu',
  CRIMINAL_RECORD: 'Adli Sicil Belgesi',
  DIPLOMA_CERTIFICATE: 'Diploma/Sertifika',
  RESIDENCE_CERTIFICATE: 'İkametgah',
  PHOTO: 'Fotoğraf',
  OSH_TRAINING: 'İSG Eğitim Belgesi',
  INVENTORY_FORM: 'Zimmet Formu',
  SGK_ENTRY_DECLARATION: 'SGK İşe Giriş Bildirgesi',
  TERMINATION_PAPERS: 'İşten Çıkış Evrakı',
  OTHER: 'Diğer',
};

export const HrOnboardingStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING_DOCS: 'PENDING_DOCS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type HrOnboardingStatus = (typeof HrOnboardingStatus)[keyof typeof HrOnboardingStatus];

export const HrOnboardingItemStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  BLOCKED: 'BLOCKED',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
} as const;
export type HrOnboardingItemStatus = (typeof HrOnboardingItemStatus)[keyof typeof HrOnboardingItemStatus];

export const HrDocumentStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;
export type HrDocumentStatus = (typeof HrDocumentStatus)[keyof typeof HrDocumentStatus];

export const WorkingTypeLabels: Record<WorkingType, string> = {
  FULL_TIME: 'Tam Zamanlı',
  PART_TIME: 'Yarı Zamanlı',
  HOURLY: 'Saatlik',
  TEMPORARY: 'Geçici',
  INTERN: 'Stajyer',
  OUTSOURCE: 'Dış Kaynak',
};

export const EmploymentStatusLabels: Record<EmploymentStatus, string> = {
  ACTIVE: 'Aktif',
  ON_LEAVE: 'İzinli',
  SUSPENDED: 'Askıda',
  RESIGNED: 'İstifa',
  TERMINATED: 'Çıkarıldı',
  ARCHIVED: 'Arşivlendi',
};

export const ContractTypeLabels: Record<ContractType, string> = {
  INDEFINITE: 'Süresiz',
  DEFINITE: 'Süreli',
  PART_TIME: 'Kısmi Süreli',
  INTERNSHIP: 'Staj',
  SEASONAL: 'Mevsimlik',
  OUTSOURCE: 'Dış Kaynak',
};

// ============================================================================
// FAZ HR-3: İzin Yönetimi Enumları
// ============================================================================

export const HrLeaveTypeCode = {
  ANNUAL: 'ANNUAL',
  WEEKLY: 'WEEKLY',
  UNPAID: 'UNPAID',
  MATERNITY: 'MATERNITY',
  PATERNITY: 'PATERNITY',
  SICK: 'SICK',
  DEATH: 'DEATH',
  EXCUSE: 'EXCUSE',
  COMPENSATION: 'COMPENSATION',
  MARRIAGE: 'MARRIAGE',
} as const;
export type HrLeaveTypeCode = (typeof HrLeaveTypeCode)[keyof typeof HrLeaveTypeCode];

export const HrLeaveAccrualMethod = {
  STANDARD: 'STANDARD',
  MONTHLY: 'MONTHLY',
  NONE: 'NONE',
} as const;
export type HrLeaveAccrualMethod = (typeof HrLeaveAccrualMethod)[keyof typeof HrLeaveAccrualMethod];

export const HrLeaveRequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;
export type HrLeaveRequestStatus = (typeof HrLeaveRequestStatus)[keyof typeof HrLeaveRequestStatus];

export const HrLeaveTypeCodeLabels: Record<HrLeaveTypeCode, string> = {
  ANNUAL: 'Yıllık İzin',
  WEEKLY: 'Haftalık İzin',
  UNPAID: 'Ücretsiz İzin',
  MATERNITY: 'Doğum İzni',
  PATERNITY: 'Babalık İzni',
  SICK: 'Hastalık İzni',
  DEATH: 'Ölüm İzni',
  EXCUSE: 'Mazeret İzni',
  COMPENSATION: 'Fazla Mesai İzni',
  MARRIAGE: 'Evlilik İzni',
};

export const HrLeaveAccrualMethodLabels: Record<HrLeaveAccrualMethod, string> = {
  STANDARD: 'Yıl başında tam',
  MONTHLY: 'Aylık eşit',
  NONE: 'Sınırsız',
};

export const HrLeaveRequestStatusLabels: Record<HrLeaveRequestStatus, string> = {
  PENDING: 'Beklemede',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  CANCELLED: 'İptal Edildi',
};

export const HrLeaveRequestStatusColors: Record<HrLeaveRequestStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-zinc-100 text-zinc-600',
};

// =====================================================================
// HR-4: BORDRO HAZIRLIK
// =====================================================================

export const PayrollPeriodType = {
  MONTHLY: 'MONTHLY',
  WEEKLY: 'WEEKLY',
} as const;
export type PayrollPeriodType = (typeof PayrollPeriodType)[keyof typeof PayrollPeriodType];

export const PayrollPeriodStatus = {
  DRAFT: 'DRAFT',
  REVIEW: 'REVIEW',
  CONFIRMED: 'CONFIRMED',
  EXPORTED: 'EXPORTED',
  CLOSED: 'CLOSED',
} as const;
export type PayrollPeriodStatus = (typeof PayrollPeriodStatus)[keyof typeof PayrollPeriodStatus];

export const PayrollRecordStatus = {
  DRAFT: 'DRAFT',
  REVIEW: 'REVIEW',
  CONFIRMED: 'CONFIRMED',
  EXPORTED: 'EXPORTED',
} as const;
export type PayrollRecordStatus = (typeof PayrollRecordStatus)[keyof typeof PayrollRecordStatus];

export const SupplementType = {
  BONUS: 'BONUS',
  INCENTIVE: 'INCENTIVE',
  ALLOWANCE: 'ALLOWANCE',
  DEDUCTION: 'DEDUCTION',
  SOCIAL_SEC: 'SOCIAL_SEC',
  TAX: 'TAX',
  OTHER: 'OTHER',
} as const;
export type SupplementType = (typeof SupplementType)[keyof typeof SupplementType];

// =====================================================================
// HR-6: DEVAMSIZLIK & DİSİPLİN
// =====================================================================

export const AbsenceType = {
  UNPAID_LEAVE: 'UNPAID_LEAVE',
  SICK: 'SICK',
  UNAUTHORIZED: 'UNAUTHORIZED',
  LATE: 'LATE',
  EARLY_LEAVE: 'EARLY_LEAVE',
  OTHER: 'OTHER',
} as const;
export type AbsenceType = (typeof AbsenceType)[keyof typeof AbsenceType];

export const DisciplinaryActionType = {
  WARNING: 'WARNING',
  SUSPENSION: 'SUSPENSION',
  SALARY_CUT: 'SALARY_CUT',
  TERMINATION: 'TERMINATION',
  OTHER: 'OTHER',
} as const;
export type DisciplinaryActionType = (typeof DisciplinaryActionType)[keyof typeof DisciplinaryActionType];

export const AbsenceTypeLabels: Record<AbsenceType, string> = {
  UNPAID_LEAVE: 'Ücretsiz İzin',
  SICK: 'Hastalık',
  UNAUTHORIZED: 'İzinsiz Devamsızlık',
  LATE: 'Geç Kalma',
  EARLY_LEAVE: 'Erken Çıkış',
  OTHER: 'Diğer',
};

export const AbsenceTypeColors: Record<AbsenceType, string> = {
  UNPAID_LEAVE: 'bg-amber-100 text-amber-800',
  SICK: 'bg-red-100 text-red-800',
  UNAUTHORIZED: 'bg-red-100 text-red-800',
  LATE: 'bg-orange-100 text-orange-800',
  EARLY_LEAVE: 'bg-orange-100 text-orange-800',
  OTHER: 'bg-zinc-100 text-zinc-600',
};

export const DisciplinaryActionTypeLabels: Record<DisciplinaryActionType, string> = {
  WARNING: 'Uyarı',
  SUSPENSION: 'Tecil/Mesai Durdurma',
  SALARY_CUT: 'Maaş Kesintisi',
  TERMINATION: 'İşten Çıkarma',
  OTHER: 'Diğer',
};

export const DisciplinaryActionTypeColors: Record<DisciplinaryActionType, string> = {
  WARNING: 'bg-amber-100 text-amber-800',
  SUSPENSION: 'bg-orange-100 text-orange-800',
  SALARY_CUT: 'bg-red-100 text-red-800',
  TERMINATION: 'bg-red-100 text-red-800',
  OTHER: 'bg-zinc-100 text-zinc-600',
};

// =====================================================================
// HR-7: KARİYER, EĞİTİM, PERFORMANS
// =====================================================================

export const TrainingStatus = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type TrainingStatus = (typeof TrainingStatus)[keyof typeof TrainingStatus];

export const PerformanceReviewStatus = {
  PENDING: 'PENDING',
  SELF_REVIEW: 'SELF_REVIEW',
  MANAGER_REVIEW: 'MANAGER_REVIEW',
  COMPLETED: 'COMPLETED',
} as const;
export type PerformanceReviewStatus = (typeof PerformanceReviewStatus)[keyof typeof PerformanceReviewStatus];

export const CareerRecordType = {
  PROMOTION: 'PROMOTION',
  TRANSFER: 'TRANSFER',
  SALARY_CHANGE: 'SALARY_CHANGE',
  TITLE_CHANGE: 'TITLE_CHANGE',
} as const;
export type CareerRecordType = (typeof CareerRecordType)[keyof typeof CareerRecordType];

export const TrainingStatusLabels: Record<TrainingStatus, string> = {
  PLANNED: 'Planlandı',
  IN_PROGRESS: 'Devam Ediyor',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal Edildi',
};

export const PerformanceReviewStatusLabels: Record<PerformanceReviewStatus, string> = {
  PENDING: 'Beklemede',
  SELF_REVIEW: 'Öz Değerlendirme',
  MANAGER_REVIEW: 'Yönetici Değerlendirmesi',
  COMPLETED: 'Tamamlandı',
};

export const CareerRecordTypeLabels: Record<CareerRecordType, string> = {
  PROMOTION: 'Terfi',
  TRANSFER: 'Transfer',
  SALARY_CHANGE: 'Maaş Değişikliği',
  TITLE_CHANGE: 'Unvan Değişikliği',
};

// SupplementType was defined earlier in this file (after PayrollRecordStatus)

export const PayrollPeriodStatusLabels: Record<PayrollPeriodStatus, string> = {
  DRAFT: 'Taslak',
  REVIEW: 'İncelemede',
  CONFIRMED: 'Onaylandı',
  EXPORTED: 'Dışa Aktarıldı',
  CLOSED: 'Kapatıldı',
};

export const PayrollPeriodStatusColors: Record<PayrollPeriodStatus, string> = {
  DRAFT: 'bg-zinc-100 text-zinc-700',
  REVIEW: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  EXPORTED: 'bg-blue-100 text-blue-800',
  CLOSED: 'bg-purple-100 text-purple-800',
};

export const PayrollRecordStatusLabels: Record<PayrollRecordStatus, string> = {
  DRAFT: 'Veri Girişi',
  REVIEW: 'İnceleme',
  CONFIRMED: 'Kesin',
  EXPORTED: 'Dışa Aktarıldı',
};

export const SupplementTypeLabels: Record<SupplementType, string> = {
  BONUS: 'Prim',
  INCENTIVE: 'İkramiye',
  ALLOWANCE: 'Ek Ödeme',
  DEDUCTION: 'Kesinti',
  SOCIAL_SEC: 'SGK Kesintisi',
  TAX: 'Vergi',
  OTHER: 'Diğer',
};
