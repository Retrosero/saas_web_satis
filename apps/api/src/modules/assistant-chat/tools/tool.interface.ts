import type { ToolDefinition } from '../llm/llm.adapter';

export interface ToolContext {
  tenantId: string;
  userId: string;
  userName?: string;
  userRole?: string;
  userPermissions?: string[];
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  /** Markdown formatında UI'da gösterilecek kısa özet */
  display: string;
  /** Tabular data ise tablo olarak göster */
  table?: { headers: string[]; rows: any[][] };
  /** Değer önemli ise (ör: bakiye) büyük göster */
  highlight?: { label: string; value: string; color?: 'green' | 'red' | 'amber' | 'blue' };
}

export interface ITool {
  code: string;
  name: string;
  description: string;
  module: string;
  requiredPermission: string;
  definition: ToolDefinition;
  execute(args: any, ctx: ToolContext): Promise<ToolExecutionResult>;
}
