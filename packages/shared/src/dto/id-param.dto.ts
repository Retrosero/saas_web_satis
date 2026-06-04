import { z } from 'zod';

export const IdParamSchema = z.object({
  id: z.string().min(1, 'Geçersiz kimlik'),
});

export type IdParam = z.infer<typeof IdParamSchema>;
