import { z } from 'zod';

/** Login isteği. */
export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'E-posta veya kullanıcı adı zorunludur')
    .max(255, 'E-posta çok uzun'),
  password: z
    .string()
    .min(1, 'Şifre zorunludur')
    .max(128, 'Şifre çok uzun'),
  tenantCode: z.string().trim().max(64).optional(),
  remember: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/** Refresh token isteği. */
export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Yenileme anahtarı zorunludur'),
});

export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

/** Şifre sıfırlama isteği. */
export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email('Geçerli bir e-posta girin'),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

/** Yeni şifre belirleme. */
export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Sıfırlama anahtarı zorunludur'),
    newPassword: z
      .string()
      .min(8, 'Şifre en az 8 karakter olmalıdır')
      .max(128, 'Şifre en fazla 128 karakter olabilir')
      .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermelidir')
      .regex(/[a-z]/, 'Şifre en az bir küçük harf içermelidir')
      .regex(/[0-9]/, 'Şifre en az bir rakam içermelidir'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
