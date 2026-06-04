import { z } from 'zod';

/** Sayfalama isteği için Zod şeması. */
export const PaginationRequestSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().trim().max(200).optional(),
});

export type PaginationRequest = z.infer<typeof PaginationRequestSchema>;

/** Liste response. */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
