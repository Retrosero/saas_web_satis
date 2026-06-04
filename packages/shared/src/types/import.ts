import type { ImportEntityType, ImportSource, ImportStatus } from '../enums/import.enum.js';

export interface ImportBatch {
  id: string;
  tenantId: string;
  name: string;
  source: ImportSource;
  entityType: ImportEntityType;
  status: ImportStatus;
  fileName: string | null;
  fileSize: number | null;
  rowCount: number;
  columnMapping: Record<string, string> | null;
  successCount: number;
  errorCount: number;
  duplicateCount: number;
  isDeleted: boolean;
  startedAt: string | null;
  completedAt: string | null;
  rolledBackAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImportRow {
  id: string;
  batchId: string;
  rowNumber: number;
  sourceData: Record<string, any>;
  mappedData: Record<string, any> | null;
  status: ImportStatus;
  errorMessage: string | null;
  createdRefId: string | null;
  createdAt: string;
}
