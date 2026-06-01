import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, type LoginInput } from '@saas/shared';
import { TextInput } from '@/components/forms/TextInput';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { useLogin } from '@/features/auth/hooks';
import { LogIn, Building2, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '', remember: false },
  });

  const onSubmit = (data: LoginInput) => login.mutate(data);

  return (
    <div className="card p-6 sm:p-8 animate-fade-in">
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="h-12 w-12 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
          <Building2 className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">SaaS Panel</h1>
        <p className="text-sm text-on-surface-variant">Hesabınıza giriş yapın</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {login.isError && (
          <div className="flex items-start gap-2 rounded-md bg-error-container p-3 text-sm text-error">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{(login.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Giriş başarısız'}</span>
          </div>
        )}

        <TextInput
          label="E-posta"
          type="email"
          autoComplete="email"
          required
          placeholder="ornek@firma.com"
          {...register('email')}
          error={errors.email?.message}
        />

        <PasswordInput
          label="Şifre"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          {...register('password')}
          error={errors.password?.message}
        />

        <TextInput
          label="Firma Kodu (opsiyonel)"
          placeholder="örn. AKDENIZ"
          hint="Süper admin girişinde boş bırakın"
          {...register('tenantCode')}
          error={errors.tenantCode?.message}
        />

        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input type="checkbox" className="rounded border-outline-variant" {...register('remember')} />
          Beni hatırla
        </label>

        <button
          type="submit"
          disabled={isSubmitting || login.isPending}
          className="btn-primary mt-2 h-12"
        >
          <LogIn className="h-4 w-4" />
          {login.isPending ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </button>

        <div className="text-center text-sm text-on-surface-variant">
          <a href="#" className="text-primary hover:underline">
            Şifremi unuttum
          </a>
        </div>
      </form>

      <div className="mt-6 pt-6 border-t border-outline-variant">
        <p className="text-xs text-on-surface-variant text-center">
          Demo: <span className="font-mono">admin@sistem.local</span> / <span className="font-mono">ChangeMe123!</span>
        </p>
      </div>
    </div>
  );
}
