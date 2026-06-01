/**
 * Tüm tablolarda ortak bulunan alanlar.
 * Prisma tarafında da bu interface'in karşılığı uygulanmalı.
 */
export interface BaseEntity {
  id: string;
  tenantId: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
}

/** ERP entegrasyonu açık tablolarda ek olarak bulunacak alanlar. */
export interface ErpSyncFields {
  sourceSystem: string | null;
  externalId: string | null;
  externalUpdatedAt: string | null;
  lastSeenInSourceAt: string | null;
  sourceStatus: string | null;
  syncStatus: string | null;
}

/** Import/veri taşıma ile gelen kayıtlar için ek alanlar. */
export interface ImportFields {
  importBatchId: string | null;
  importStatus: string | null;
  importError: string | null;
}

/** API standart response envelope. */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    pagination?: Pagination;
    requestId?: string;
    timestamp?: string;
  };
}

/** Standart hata response. */
export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  details?: unknown;
  requestId?: string;
  timestamp?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
