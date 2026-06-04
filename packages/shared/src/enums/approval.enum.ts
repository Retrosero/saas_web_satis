export enum ApprovalTriggerType {
  SALE_OVER_LIMIT = 'SALE_OVER_LIMIT',
  DISCOUNT_OVER = 'DISCOUNT_OVER',
  RETURN_OVER = 'RETURN_OVER',
  PRICE_CHANGE = 'PRICE_CHANGE',
  COLLECTION_WRITE_OFF = 'COLLECTION_WRITE_OFF',
  EXPENSE_OVER = 'EXPENSE_OVER',
  EMPLOYEE_ADD = 'EMPLOYEE_ADD',
  CASH_TRANSFER_OVER = 'CASH_TRANSFER_OVER',
  INVOICE_CANCEL = 'INVOICE_CANCEL',
  CAMPAIGN_OVER = 'CAMPAIGN_OVER',
  STOCK_COUNT_OVER = 'STOCK_COUNT_OVER',
  WAREHOUSE_TRANSFER = 'WAREHOUSE_TRANSFER',
}

export const ApprovalTriggerTypeLabel: Record<ApprovalTriggerType, string> = {
  [ApprovalTriggerType.SALE_OVER_LIMIT]: 'Limit Üstü Satış',
  [ApprovalTriggerType.DISCOUNT_OVER]: 'Yüksek İskonto',
  [ApprovalTriggerType.RETURN_OVER]: 'Yüksek İade',
  [ApprovalTriggerType.PRICE_CHANGE]: 'Fiyat Değişimi',
  [ApprovalTriggerType.COLLECTION_WRITE_OFF]: 'Tahsilat Silme',
  [ApprovalTriggerType.EXPENSE_OVER]: 'Limit Üstü Gider',
  [ApprovalTriggerType.EMPLOYEE_ADD]: 'Yeni Personel',
  [ApprovalTriggerType.CASH_TRANSFER_OVER]: 'Limit Üstü Kasa Transferi',
  [ApprovalTriggerType.INVOICE_CANCEL]: 'Fatura İptali',
  [ApprovalTriggerType.CAMPAIGN_OVER]: 'Yüksek Kampanya İndirimi',
  [ApprovalTriggerType.STOCK_COUNT_OVER]: 'Büyük Sayım Farkı',
  [ApprovalTriggerType.WAREHOUSE_TRANSFER]: 'Depo Transferi',
};

export enum ApprovalMode {
  SEQUENTIAL = 'SEQUENTIAL',
  PARALLEL = 'PARALLEL',
  UNANIMOUS = 'UNANIMOUS',
}

export const ApprovalModeLabel: Record<ApprovalMode, string> = {
  [ApprovalMode.SEQUENTIAL]: 'Sıralı',
  [ApprovalMode.PARALLEL]: 'Paralel',
  [ApprovalMode.UNANIMOUS]: 'Oybirliği',
};

export enum ApprovalStepType {
  ROLE_BASED = 'ROLE_BASED',
  USER_BASED = 'USER_BASED',
  DYNAMIC_FIELD = 'DYNAMIC_FIELD',
  SPECIFIC_USERS = 'SPECIFIC_USERS',
}

export const ApprovalStepTypeLabel: Record<ApprovalStepType, string> = {
  [ApprovalStepType.ROLE_BASED]: 'Rol Bazlı',
  [ApprovalStepType.USER_BASED]: 'Kullanıcı Bazlı',
  [ApprovalStepType.DYNAMIC_FIELD]: 'Dinamik Alan',
  [ApprovalStepType.SPECIFIC_USERS]: 'Belirli Kullanıcılar',
};

export enum ApprovalRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  DELEGATED = 'DELEGATED',
}

export const ApprovalRequestStatusLabel: Record<ApprovalRequestStatus, string> = {
  [ApprovalRequestStatus.PENDING]: 'Bekliyor',
  [ApprovalRequestStatus.APPROVED]: 'Onaylandı',
  [ApprovalRequestStatus.REJECTED]: 'Reddedildi',
  [ApprovalRequestStatus.CANCELLED]: 'İptal',
  [ApprovalRequestStatus.EXPIRED]: 'Süresi Doldu',
  [ApprovalRequestStatus.DELEGATED]: 'Devredildi',
};

export const ApprovalRequestStatusColor: Record<ApprovalRequestStatus, string> = {
  [ApprovalRequestStatus.PENDING]: 'amber',
  [ApprovalRequestStatus.APPROVED]: 'green',
  [ApprovalRequestStatus.REJECTED]: 'red',
  [ApprovalRequestStatus.CANCELLED]: 'gray',
  [ApprovalRequestStatus.EXPIRED]: 'gray',
  [ApprovalRequestStatus.DELEGATED]: 'blue',
};

export enum ApprovalActionType {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DELEGATED = 'DELEGATED',
  RETURNED = 'RETURNED',
  COMMENTED = 'COMMENTED',
}

export const ApprovalActionTypeLabel: Record<ApprovalActionType, string> = {
  [ApprovalActionType.APPROVED]: 'Onaylandı',
  [ApprovalActionType.REJECTED]: 'Reddedildi',
  [ApprovalActionType.DELEGATED]: 'Devredildi',
  [ApprovalActionType.RETURNED]: 'Geri Çevrildi',
  [ApprovalActionType.COMMENTED]: 'Yorum',
};

export enum ApprovalPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export const ApprovalPriorityLabel: Record<ApprovalPriority, string> = {
  [ApprovalPriority.LOW]: 'Düşük',
  [ApprovalPriority.NORMAL]: 'Normal',
  [ApprovalPriority.HIGH]: 'Yüksek',
  [ApprovalPriority.URGENT]: 'Acil',
};

export const ApprovalPriorityColor: Record<ApprovalPriority, string> = {
  [ApprovalPriority.LOW]: 'gray',
  [ApprovalPriority.NORMAL]: 'blue',
  [ApprovalPriority.HIGH]: 'amber',
  [ApprovalPriority.URGENT]: 'red',
};
