import type { AggregateType, ChartType, ReportShareScope } from '../enums/report.enum';

export interface PivotConfig {
  rows: string[];            // group by alanları (örn: ['customer.city', 'product.brand'])
  columns: string[];         // group by (cross-tab)
  values: Array<{ field: string; aggregate: AggregateType; alias: string }>;
  filters: Array<{ field: string; operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'IN' | 'LIKE'; value: any }>;
  sortBy?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
}

export interface ReportTemplate {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  config: PivotConfig;
  chartType: ChartType;
  shareScope: ReportShareScope;
  sharedRoles: string[];
  sharedUsers: string[];
  isFavorite: boolean;
  isActive: boolean;
  lastRunAt: string | null;
  runCount: number;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportResult {
  columns: Array<{ key: string; label: string; type: 'string' | 'number' }>;
  rows: Array<Record<string, any>>;
  totals: Record<string, number>;
  rowCount: number;
  duration: number;
  executedAt: string;
}

export interface PresetReport {
  code: string;
  name: string;
  description: string;
  config: PivotConfig;
}
