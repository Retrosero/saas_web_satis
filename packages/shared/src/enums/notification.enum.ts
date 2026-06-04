export enum NotificationTriggerType {
  SALE_CREATED = 'SALE_CREATED',
  SALE_CANCELLED = 'SALE_CANCELLED',
  SALE_OVER_LIMIT = 'SALE_OVER_LIMIT',
  COLLECTION_RECEIVED = 'COLLECTION_RECEIVED',
  PAYMENT_DUE = 'PAYMENT_DUE',
  LOW_STOCK = 'LOW_STOCK',
  PRICE_CHANGE = 'PRICE_CHANGE',
  CAMPAIGN_APPLIED = 'CAMPAIGN_APPLIED',
  RETURN_CREATED = 'RETURN_CREATED',
  RETURN_APPROVED = 'RETURN_APPROVED',
  STOCK_COUNT_VARIANCE = 'STOCK_COUNT_VARIANCE',
  CASH_TRANSACTION = 'CASH_TRANSACTION',
}

export const NotificationTriggerTypeLabel: Record<NotificationTriggerType, string> = {
  [NotificationTriggerType.SALE_CREATED]: 'Yeni Satış',
  [NotificationTriggerType.SALE_CANCELLED]: 'Satış İptali',
  [NotificationTriggerType.SALE_OVER_LIMIT]: 'Limit Üstü Satış',
  [NotificationTriggerType.COLLECTION_RECEIVED]: 'Tahsilat Alındı',
  [NotificationTriggerType.PAYMENT_DUE]: 'Vade Yaklaşıyor',
  [NotificationTriggerType.LOW_STOCK]: 'Stok Eşik Altı',
  [NotificationTriggerType.PRICE_CHANGE]: 'Fiyat Değişimi',
  [NotificationTriggerType.CAMPAIGN_APPLIED]: 'Kampanya Uygulandı',
  [NotificationTriggerType.RETURN_CREATED]: 'İade Oluşturuldu',
  [NotificationTriggerType.RETURN_APPROVED]: 'İade Onaylandı',
  [NotificationTriggerType.STOCK_COUNT_VARIANCE]: 'Sayım Farkı',
  [NotificationTriggerType.CASH_TRANSACTION]: 'Kasa Hareketi',
};

export const NotificationTriggerTypeCategory: Record<NotificationTriggerType, string> = {
  [NotificationTriggerType.SALE_CREATED]: 'SALE',
  [NotificationTriggerType.SALE_CANCELLED]: 'SALE',
  [NotificationTriggerType.SALE_OVER_LIMIT]: 'SALE',
  [NotificationTriggerType.COLLECTION_RECEIVED]: 'COLLECTION',
  [NotificationTriggerType.PAYMENT_DUE]: 'COLLECTION',
  [NotificationTriggerType.LOW_STOCK]: 'STOCK',
  [NotificationTriggerType.STOCK_COUNT_VARIANCE]: 'STOCK',
  [NotificationTriggerType.PRICE_CHANGE]: 'PRICE',
  [NotificationTriggerType.CAMPAIGN_APPLIED]: 'PRICE',
  [NotificationTriggerType.RETURN_CREATED]: 'RETURN',
  [NotificationTriggerType.RETURN_APPROVED]: 'RETURN',
  [NotificationTriggerType.CASH_TRANSACTION]: 'CASH',
};

export enum NotificationConditionOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_OR_EQUAL = 'GREATER_OR_EQUAL',
  LESS_OR_EQUAL = 'LESS_OR_EQUAL',
  CONTAINS = 'CONTAINS',
  IN = 'IN',
  BETWEEN = 'BETWEEN',
}

export const NotificationConditionOperatorLabel: Record<NotificationConditionOperator, string> = {
  [NotificationConditionOperator.EQUALS]: '=',
  [NotificationConditionOperator.NOT_EQUALS]: '≠',
  [NotificationConditionOperator.GREATER_THAN]: '>',
  [NotificationConditionOperator.LESS_THAN]: '<',
  [NotificationConditionOperator.GREATER_OR_EQUAL]: '≥',
  [NotificationConditionOperator.LESS_OR_EQUAL]: '≤',
  [NotificationConditionOperator.CONTAINS]: 'içerir',
  [NotificationConditionOperator.IN]: 'içinde',
  [NotificationConditionOperator.BETWEEN]: 'arasında',
};

export enum NotificationActionType {
  SEND_NOTIFICATION = 'SEND_NOTIFICATION',
  SEND_EMAIL = 'SEND_EMAIL',
  SEND_SMS = 'SEND_SMS',
  CALL_WEBHOOK = 'CALL_WEBHOOK',
  CREATE_TASK = 'CREATE_TASK',
  ALERT = 'ALERT',
}

export const NotificationActionTypeLabel: Record<NotificationActionType, string> = {
  [NotificationActionType.SEND_NOTIFICATION]: 'Bildirim Gönder',
  [NotificationActionType.SEND_EMAIL]: 'E-posta Gönder',
  [NotificationActionType.SEND_SMS]: 'SMS Gönder',
  [NotificationActionType.CALL_WEBHOOK]: 'Webhook Tetikle',
  [NotificationActionType.CREATE_TASK]: 'Görev Oluştur',
  [NotificationActionType.ALERT]: 'Alarm Ver',
};

export enum NotificationChannelType {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WEBHOOK = 'WEBHOOK',
}

export const NotificationChannelTypeLabel: Record<NotificationChannelType, string> = {
  [NotificationChannelType.IN_APP]: 'Uygulama İçi',
  [NotificationChannelType.EMAIL]: 'E-posta (SMTP)',
  [NotificationChannelType.SMS]: 'SMS',
  [NotificationChannelType.WEBHOOK]: 'Webhook (HTTP)',
};

export const NotificationChannelTypeIcon: Record<NotificationChannelType, string> = {
  [NotificationChannelType.IN_APP]: '🔔',
  [NotificationChannelType.EMAIL]: '✉️',
  [NotificationChannelType.SMS]: '📱',
  [NotificationChannelType.WEBHOOK]: '🔗',
};

export enum NotificationLogStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export const NotificationLogStatusLabel: Record<NotificationLogStatus, string> = {
  [NotificationLogStatus.PENDING]: 'Bekliyor',
  [NotificationLogStatus.SENT]: 'Gönderildi',
  [NotificationLogStatus.FAILED]: 'Başarısız',
  [NotificationLogStatus.CANCELLED]: 'İptal',
};

export enum NotificationRecipientType {
  USER = 'USER',
  ROLE = 'ROLE',
  ALL_TENANT_USERS = 'ALL_TENANT_USERS',
  SPECIFIC_USERS = 'SPECIFIC_USERS',
  CUSTOMER = 'CUSTOMER',
  SALESPERSON = 'SALESPERSON',
}

export const NotificationRecipientTypeLabel: Record<NotificationRecipientType, string> = {
  [NotificationRecipientType.USER]: 'Tek Kullanıcı',
  [NotificationRecipientType.ROLE]: 'Rol Bazlı',
  [NotificationRecipientType.ALL_TENANT_USERS]: 'Tüm Kullanıcılar',
  [NotificationRecipientType.SPECIFIC_USERS]: 'Belirli Kullanıcılar',
  [NotificationRecipientType.CUSTOMER]: 'Müşteri',
  [NotificationRecipientType.SALESPERSON]: 'Satış Temsilcisi',
};

// Eski sistem bildirim tipleri (uyumluluk)
export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SYSTEM = 'SYSTEM',
}
