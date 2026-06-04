import type { AssistantToolStatus, HelpContentType } from '../enums/assistant.enum.js';

export interface HelpArticle {
  id: string;
  tenantId: string;
  module: string;                  // 'cari', 'urun', 'satis', ...
  page: string | null;              // '/customers/new', null = tüm sayfalar
  title: string;
  content: string;
  contentType: HelpContentType;
  permissionKey: string | null;     // Görüntüleme yetkisi (örn: 'cari:write')
  status: 'ACTIVE' | 'PASSIVE';
  viewCount: number;
  isDeleted: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssistantTool {
  id: string;
  tenantId: string;
  code: string;                     // 'get_customer_balance'
  name: string;
  description: string;
  module: string;
  requiredPermission: string;
  apiEndpoint: string;              // '/api/v1/customers/:id/balance'
  status: AssistantToolStatus;
  createdAt: string;
  updatedAt: string;
}
