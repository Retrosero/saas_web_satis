import { z } from 'zod';

/**
 * İade kalemi validasyon şeması.
 */
export const CreateReturnItemSchema = z.object({
  productId: z.string().min(1, 'Ürün seçilmelidir'),
  unitId: z.string().optional(),
  quantity: z.number().positive('Miktar 0\'dan büyük olmalı'),
  unitPrice: z.number().nonnegative('Fiyat negatif olamaz'),
  vatRate: z.number().nonnegative().max(100, 'KDV %0-100 arası olmalı'),
  discountRate: z.number().nonnegative().max(100).optional().default(0),
  condition: z.enum(['INTACT', 'DEFECTIVE', 'DAMAGED']),
  description: z.string().optional(),
});

export const CreateReturnSchema = z.object({
  customerId: z.string().min(1, 'Cari seçilmelidir'),
  returnDate: z.string().min(1, 'İade tarihi zorunlu'),
  source: z.enum(['SALE', 'ORDER', 'DIRECT']).default('DIRECT'),
  sourceId: z.string().optional(),
  reason: z.enum(['INTACT', 'DEFECTIVE', 'WRONG_PRODUCT', 'EXCESS', 'OTHER']),
  returnToStock: z.boolean().default(true),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  items: z.array(CreateReturnItemSchema).min(1, 'En az 1 ürün gerekiyor'),
});

export const UpdateReturnSchema = CreateReturnSchema.partial();

export const ReturnActionSchema = z.object({
  action: z.enum(['submit', 'approve', 'reject', 'complete', 'cancel', 'reopen']),
  rejectionReason: z.string().optional(),
});

export type CreateReturnInput = z.infer<typeof CreateReturnSchema>;
export type CreateReturnItemInput = z.infer<typeof CreateReturnItemSchema>;
export type UpdateReturnInput = z.infer<typeof UpdateReturnSchema>;
export type ReturnActionInput = z.infer<typeof ReturnActionSchema>;
