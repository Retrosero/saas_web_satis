import {
  DataCheckType,
  DataCheckSeverity,
  DataCheckRunStatus,
  DataCheckResultStatus,
  DataCheckFrequency,
} from '../enums/audit.enum';

export interface DataCheckRule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  checkType: DataCheckType;
  severity: DataCheckSeverity;
  isActive: boolean;
  parameters: Record<string, any>;
  query?: string;
  autoFixable: boolean;
  notifyUsers: string[];
  lastRunAt?: string;
  runCount: number;
  lastResultCount: number;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataCheckRun {
  id: string;
  tenantId: string;
  ruleId: string;
  ruleName: string;
  checkType: DataCheckType;
  status: DataCheckRunStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  resultCount: number;
  errorCount: number;
  warning?: string;
  parameters: Record<string, any>;
  triggeredBy?: string;
  summary: Record<string, any>;
  createdAt: string;
}

export interface DataCheckResult {
  id: string;
  tenantId: string;
  ruleId: string;
  runId?: string;
  checkType: DataCheckType;
  severity: DataCheckSeverity;
  status: DataCheckResultStatus;
  entityType: string;
  entityId: string;
  entityLabel: string;
  entityNumber?: string;
  description: string;
  details: Record<string, any>;
  suggestedFix?: string;
  autoFixable: boolean;
  fixedAt?: string;
  fixedById?: string;
  fixedByName?: string;
  fixNote?: string;
  acknowledgedAt?: string;
  acknowledgedById?: string;
  ignoredAt?: string;
  ignoredById?: string;
  ignoreReason?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  ruleName?: string;
}

export interface DataCheckSchedule {
  id: string;
  tenantId: string;
  name: string;
  ruleIds: string[];
  schedule: DataCheckFrequency;
  hour: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  notifyOnComplete: boolean;
  notifyUserIds: string[];
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataCheckActionLog {
  id: string;
  tenantId: string;
  resultId: string;
  actionType: string;
  actorId?: string;
  actorName?: string;
  note?: string;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  createdAt: string;
}

export interface DataCheckStats {
  total: number;
  open: number;
  acknowledged: number;
  fixed: number;
  ignored: number;
  bySeverity: Array<{ severity: DataCheckSeverity; count: number }>;
  byCheckType: Array<{ checkType: DataCheckType; count: number }>;
  byEntityType: Array<{ entityType: string; count: number }>;
  fixRate: number;
  avgFixTimeMs?: number;
}
