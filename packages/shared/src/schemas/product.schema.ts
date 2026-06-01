import { z } from 'zod';

export const CreateProductSchema = z.object({
  code: z.string().trim().min(1, 'Ürün kodu zorunludur').max(64),
  name: z.string().trim().min(1, 'Ürün adı zorunludur').max(200),
  shortName: z.string().trim().max(80).nullable().optional(),
  brandId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  defaultWarehouseId: z.string().nullable().optional(),
  unit: z.string().trim().min(1).max(20).default('Adet'),
  vatRate: z.number().min(0).max(100).default(20),
  basePrice: z.number().min(0).default(0),
  costPrice: z.number().min(0).default(0),
  currency: z.string().trim().length(3).default('TRY'),
  minStock: z.number().min(0).default(0),
  maxStock: z.number().min(0).default(0),
  barcode: z.string().trim().max(64).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.partial();
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
