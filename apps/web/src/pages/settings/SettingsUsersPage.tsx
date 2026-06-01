import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Users, Plus, Search, X, UserPlus, Edit2, Trash2, Shield } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { EmptyState } from '@/components/data/EmptyState';
import { TextInput } from '@/components/forms/TextInput';
import { useTenantUsers, useTenantRoles, useCreateUser, useDeleteUser, useAssignRole } from '@/features/tenant-admin/hooks';
import { formatDateTime, formatNumber } from '@saas/shared';
import toast from 'react-hot-toast';

export function SettingsUsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showInvite, setShowInvite] = useState(false);

  const { data, isLoading, isError, error, refetch } = useTenantUsers({ search, page, pageSize: 20 });
  const { data: roles } = useTenantRoles();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const assignRole = useAssignRole();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Kullanıcılar"
        description="Firmanızdaki kullanıcılar"
        actions={
          <button onClick={() => setShowInvite(true)} className="btn-primary">
            <UserPlus className="h-4 w-4" />
            Kullanıcı Davet Et
          </button>
        }
      />

      <div className="card p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="E-posta veya ad ile ara…"
            className="w-full h-10 pl-10 pr-4 rounded-md bg-surface-container text-sm border border-outline-variant focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {isLoading && <LoadingState size="lg" />}
      {isError && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {data && data.data.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="Kullanıcı bulunamadı"
            description="Yeni kullanıcı davet ederek başlayabilirsiniz."
            action={
              <button onClick={() => setShowInvite(true)} className="btn-primary">
                <UserPlus className="h-4 w-4" />
                İlk Kullanıcıyı Davet Et
              </button>
            }
          />
        </div>
      )}

      {data && data.data.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container border-b border-outline-variant">
                <tr>
                  <th className="text-left font-semibold text-foreground px-4 py-3">Kullanıcı</th>
                  <th className="text-left font-semibold text-foreground px-4 py-3">Telefon</th>
                  <th className="text-left font-semibold text-foreground px-4 py-3">Rol</th>
                  <th className="text-left font-semibold text-foreground px-4 py-3">Durum</th>
                  <th className="text-left font-semibold text-foreground px-4 py-3">Son Giriş</th>
                  <th className="text-right font-semibold text-foreground px-4 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((u) => (
                  <tr key={u.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary-container text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {u.fullName?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate">{u.fullName}</div>
                          <div className="text-xs text-on-surface-variant truncate">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{u.phone ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 ? (
                          <span className="text-xs text-on-surface-variant">—</span>
                        ) : (
                          u.roles.map((r) => (
                            <span
                              key={r.code}
                              className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-surface-container text-foreground"
                            >
                              <Shield className="h-3 w-3" /> {r.code}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          u.status === 'ACTIVE'
                            ? 'bg-secondary-container text-secondary'
                            : u.status === 'LOCKED'
                            ? 'bg-error-container text-error'
                            : 'bg-surface-variant text-on-surface-variant'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant text-xs">
                      {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Hiç giriş yok'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <select
                          onChange={async (e) => {
                            if (!e.target.value) return;
                            try {
                              await assignRole.mutateAsync({ userId: u.id, roleCode: e.target.value });
                              toast.success('Rol güncellendi');
                            } catch (err: unknown) {
                              toast.error('Rol değiştirilemedi');
                            }
                            e.target.value = '';
                          }}
                          className="text-xs h-8 px-2 rounded border border-outline-variant bg-surface-container"
                          defaultValue=""
                        >
                          <option value="" disabled>Rol ata…</option>
                          {roles?.filter((r) => !u.roles.some((ur) => ur.code === r.code)).map((r) => (
                            <option key={r.code} value={r.code}>{r.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={async () => {
                            if (!confirm(`${u.fullName} kullanıcısını silmek istediğinize emin misiniz?`)) return;
                            try {
                              await deleteUser.mutateAsync(u.id);
                              toast.success('Kullanıcı silindi');
                            } catch {
                              toast.error('Silinemedi');
                            }
                          }}
                          className="p-1.5 text-on-surface-variant hover:text-error rounded"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-outline-variant bg-surface-container flex items-center justify-between text-xs text-on-surface-variant">
            <span>Toplam {formatNumber(data.pagination.total)} kullanıcı</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!data.pagination.hasPrev} className="btn-ghost text-xs">Önceki</button>
              <span>Sayfa {data.pagination.page} / {data.pagination.totalPages}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={!data.pagination.hasNext} className="btn-ghost text-xs">Sonraki</button>
            </div>
          </div>
        </div>
      )}

      {showInvite && (
        <InviteUserModal
          roles={roles ?? []}
          onClose={() => setShowInvite(false)}
          onCreated={() => { setShowInvite(false); refetch(); }}
          onSubmit={async (data) => {
            try {
              await createUser.mutateAsync(data);
              toast.success('Kullanıcı davet edildi');
            } catch (err: unknown) {
              const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Hata';
              toast.error(msg);
              throw err;
            }
          }}
        />
      )}
    </div>
  );
}

interface InviteForm {
  email: string;
  fullName: string;
  phone: string;
  password: string;
  roleCode: string;
}

function InviteUserModal({ roles, onClose, onCreated, onSubmit }: { roles: Array<{ code: string; name: string }>; onClose: () => void; onCreated: () => void; onSubmit: (data: InviteForm) => Promise<void> }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<InviteForm>({
    defaultValues: { email: '', fullName: '', phone: '', password: '', roleCode: roles[0]?.code ?? '' },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Kullanıcı Davet Et</h2>
          <button onClick={onClose} className="p-1 text-on-surface-variant hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form
          onSubmit={handleSubmit(async (data) => {
            await onSubmit(data);
            onCreated();
          })}
          className="flex flex-col gap-3"
        >
          <TextInput
            label="E-posta"
            type="email"
            required
            placeholder="kullanici@firma.com"
            {...register('email', { required: 'Zorunlu' })}
            error={errors.email?.message}
          />
          <TextInput
            label="Ad Soyad"
            required
            placeholder="Ad Soyad"
            {...register('fullName', { required: 'Zorunlu', minLength: { value: 2, message: 'En az 2 karakter' } })}
            error={errors.fullName?.message}
          />
          <TextInput
            label="Telefon (opsiyonel)"
            placeholder="+90 555 000 0000"
            {...register('phone')}
            error={errors.phone?.message}
          />
          <TextInput
            label="Geçici Şifre"
            type="text"
            required
            placeholder="En az 8 karakter"
            {...register('password', { required: 'Zorunlu', minLength: { value: 8, message: 'En az 8 karakter' } })}
            error={errors.password?.message}
            hint="Kullanıcı ilk girişte değiştirmelidir"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Rol</label>
            <select
              {...register('roleCode', { required: true })}
              className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none"
            >
              {roles.map((r) => (
                <option key={r.code} value={r.code}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="btn-secondary">İptal</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              <Plus className="h-4 w-4" />
              {isSubmitting ? 'Davet ediliyor…' : 'Davet Et'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
