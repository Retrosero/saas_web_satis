import { z } from 'zod';
import { CustomerType } from '../enums/common.enum.js';

export const CreateCustomerSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Cari kodu zorunludur')
    .max(32, 'Cari kodu en fazla 32 karakter olabilir'),
  name: z
    .string()
    .trim()
    .min(1, 'Cari adı zorunludur')
    .max(200, 'Cari adı en fazla 200 karakter olabilir'),
  type: z.nativeEnum(CustomerType).default(CustomerType.CUSTOMER),
  taxNumber: z.string().trim().max(20).nullable().optional(),
  taxOffice: z.string().trim().max(100).nullable().optional(),
  phone: z.string().trim().max(32).nullable().optional(),
  email: z.string().trim().email('Geçerli bir e-posta girin').nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  city: z.string().trim().max(100).nullable().optional(),
  country: z.string().trim().max(100).default('Türkiye'),
  currency: z.string().trim().length(3).default('TRY'),
  creditLimit: z.number().min(0).default(0),
  paymentTermDays: z.number().int().min(0).max(365).default(0),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;

export const UpdateCustomerSchema = CreateCustomerSchema.partial();
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
