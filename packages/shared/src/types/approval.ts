import {
  ApprovalTriggerType,
  ApprovalMode,
  ApprovalStepType,
  ApprovalRequestStatus,
  ApprovalActionType,
  ApprovalPriority,
} from '../enums/approval.enum';

export interface ApprovalCondition {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS' | 'IN' | 'BETWEEN';
  value: any;
  joinWith?: 'AND' | 'OR';
}

export interface ApprovalStepConfig {
  // ROLE_BASED
  roleIds?: string[];
  // USER_BASED
  userId?: string;
  // DYNAMIC_FIELD
  fieldRef?: string; // ör: 'salesperson.managerId' - entity'den dinamik user
  // SPECIFIC_USERS
  userIds?: string[];
  roleNames?: string[]; // rol adı ile (kullanım kolaylığı)
}

export interface ApprovalStep {
  id: string;
  ruleId: string;
  stepOrder: number;
  name: string;
  stepType: ApprovalStepType;
  config: ApprovalStepConfig;
  requireAll: boolean;
  minApprovals: number;
  timeoutHours?: number;
  isOptional: boolean;
  description?: string;
}

export interface ApprovalRule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  triggerType: ApprovalTriggerType;
  moduleName?: string;
  conditions: ApprovalCondition[];
  mode: ApprovalMode;
  amountField?: string;
  amountThreshold?: number;
  expiryHours: number;
  isActive: boolean;
  priority: number;
  triggerCount: number;
  lastTriggeredAt?: string;
  settings: { allowDelegation?: boolean; allowReturn?: boolean; notifyOnPending?: boolean; autoEscalate?: boolean };
  steps: ApprovalStep[];
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalAction {
  id: string;
  requestId: string;
  stepId: string;
  stepOrder: number;
  stepName: string;
  actionType: ApprovalActionType;
  actorId: string;
  actorName?: string;
  actorRole?: string;
  comment?: string;
  attachments: any[];
  delegatedToId?: string;
  delegatedToName?: string;
  createdAt: string;
}

export interface ApprovalRequest {
  id: string;
  tenantId: string;
  ruleId: string;
  ruleName: string;
  triggerType: ApprovalTriggerType;
  entityType: string;
  entityId: string;
  entityNumber?: string;
  entityLabel: string;
  amount?: number;
  amountCurrency?: string;
  requesterId: string;
  requesterName?: string;
  requesterData: Record<string, any>;
  priority: ApprovalPriority;
  status: ApprovalRequestStatus;
  currentStep: number;
  totalSteps: number;
  approvedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  expiredAt?: string;
  expiresAt?: string;
  finalComment?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  actions?: ApprovalAction[];
  currentStepInfo?: ApprovalStep;
  pendingApprovers?: Array<{ id: string; name: string }>;
}

export interface ApprovalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  cancelled: number;
  avgApprovalTimeMs?: number;
  byTrigger: Array<{ triggerType: ApprovalTriggerType; count: number }>;
  byPriority: Array<{ priority: ApprovalPriority; count: number }>;
}
