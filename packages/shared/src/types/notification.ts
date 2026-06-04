import {
  NotificationTriggerType,
  NotificationConditionOperator,
  NotificationActionType,
  NotificationChannelType,
  NotificationLogStatus,
  NotificationRecipientType,
} from '../enums/notification.enum';

export interface NotificationRuleCondition {
  field: string;
  operator: NotificationConditionOperator;
  value: any;
  joinWith?: 'AND' | 'OR';
}

export interface NotificationRuleAction {
  type: NotificationActionType;
  template: string; // {{customer.name}} gibi değişkenler içerebilir
  subject?: string;
  payload?: Record<string, any>;
}

export interface NotificationRuleRecipient {
  type: NotificationRecipientType;
  targetIds?: string[];
  roleIds?: string[];
  fieldRef?: string; // entity.customerId gibi
}

export interface NotificationRuleTriggerSettings {
  // SALE_OVER_LIMIT: { amountLimit }
  // LOW_STOCK: { thresholdMode: 'PRODUCT'|'WAREHOUSE'|'GLOBAL' }
  // PAYMENT_DUE: { daysBeforeDue: number[] }
  // PRICE_CHANGE: { percentThreshold }
  // COLLECTION_RECEIVED: { minAmount }
  [key: string]: any;
}

export interface NotificationRule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  triggerType: NotificationTriggerType;
  conditions: NotificationRuleCondition[];
  actions: NotificationRuleAction[];
  recipients: NotificationRuleRecipient[];
  channelIds: string[];
  priority: number;
  isActive: boolean;
  cooldownMinutes: number;
  lastTriggeredAt?: string;
  triggerCount: number;
  settings: NotificationRuleTriggerSettings;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationChannelConfig {
  // EMAIL
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPasswordRef?: string; // NotificationChannelSecret.id
  fromAddress?: string;
  fromName?: string;
  useTls?: boolean;
  // SMS
  smsProvider?: string;
  smsApiKeyRef?: string;
  fromNumber?: string;
  // WEBHOOK
  webhookUrl?: string;
  webhookMethod?: 'GET' | 'POST' | 'PUT';
  webhookHeaders?: Record<string, string>;
  webhookAuthType?: 'NONE' | 'BEARER' | 'BASIC' | 'API_KEY';
  webhookAuthRef?: string;
}

export interface NotificationChannel {
  id: string;
  tenantId: string;
  name: string;
  type: NotificationChannelType;
  description?: string;
  config: NotificationChannelConfig;
  isActive: boolean;
  isDefault: boolean;
  testStatus?: 'OK' | 'FAILED';
  testAt?: string;
  testError?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLog {
  id: string;
  tenantId: string;
  ruleId?: string;
  ruleName?: string;
  channelId?: string;
  channelName?: string;
  channelType?: NotificationChannelType;
  triggerType: NotificationTriggerType;
  recipientType: NotificationRecipientType;
  recipientId?: string;
  recipientName?: string;
  recipientContact?: string;
  subject?: string;
  body: string;
  payload: Record<string, any>;
  status: NotificationLogStatus;
  attempts: number;
  lastAttemptAt?: string;
  sentAt?: string;
  failedAt?: string;
  error?: string;
  durationMs?: number;
  createdAt: string;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  tenantId: string;
  channels: { inApp?: boolean; email?: boolean; sms?: boolean; emailAddress?: string; phone?: string };
  categories: Record<string, boolean>;
  quietHours: { enabled: boolean; startTime: string; endTime: string };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationInbox {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  ruleName?: string;
}
