import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Search, Power, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/data/EmptyState';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import {
  useAdminTenants,
  useCreateTenant,
  useUpdateTenantStatus,
} from '@/features/super-admin/hooks';
import type { TenantStatus } from '@saas/shared';
import toast from 'react-hot-toast';

const STATUS_LABEL: Record<
  TenantStatus,
  { text: string; color: string; icon: typeof CheckCircle2 }
> = {
  ACTIVE: { text: 'Aktif', color: 'bg-secondary-container text-secondary', icon: CheckCircle2 },
  TRIAL: { text: 'Deneme', color: 'bg-primary-container text-primary', icon: Clock },
  PENDING: { text: 'Bekliyor', color: 'bg-surface-variant text-on-surface-variant', icon: Clock },
  SUSPENDED: { text: 'Askıda', color: 'bg-tertiary/10 text-tertiary', icon: Power },
  CANCELLED: { text: 'İptal', color: 'bg-error-container text-error', icon: XCircle },
};

export function TenantsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TenantStatus | undefined>();
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, isError, error, refetch } = useAdminTenants({
    search,
    status: statusFilter,
    pageSize: 50,
  });
  const create = useCreateTenant();
  const updateStatus = useUpdateTenantStatus();

  const handleToggle = (id: string, current: TenantStatus) => {
    const next: TenantStatus = current === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    updateStatus.mutate(
      { id, status: next },
      {
        onSuccess: () => toast.success(`Firma ${next === 'ACTIVE' ? 'aktif' : 'askıya alındı'}`),
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Firmalar"
        description="Süper admin — tüm tenant'ları yönet"
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Yeni Firma
          </button>
        }
      />

      {/* Filtre çubuğu */}
      <div className="card flex flex-col gap-2 p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Firma adı veya kodu ile ara…"
            className="h-10 w-full rounded-md border border-outline-variant bg-surface-container pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={statusFilter ?? ''}
          onChange={(e) => setStatusFilter((e.target.value as TenantStatus) || undefined)}
          className="h-10 rounded-md border border-outline-variant bg-surface-container px-3 text-sm"
        >
          <option value="">Tüm durumlar</option>
          <option value="ACTIVE">Aktif</option>
          <option value="TRIAL">Deneme</option>
          <option value="PENDING">Bekliyor</option>
          <option value="SUSPENDED">Askıda</option>
          <option value="CANCELLED">İptal</option>
        </select>
      </div>

      {isLoading && <LoadingState label="Firmalar yükleniyor…" />}
      {isError && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {data && data.data.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<Building2 className="h-8 w-8" />}
            title="Henüz firma yok"
            description="Süper admin paneli üzerinden firma oluşturabilir, plan atayabilir ve modülleri yönetebilirsiniz."
            action={
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                <Plus className="h-4 w-4" />
                İlk Firmayı Oluştur
              </button>
            }
          />
        </div>
      )}
      {data && data.data.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-outline-variant bg-surface-container">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Firma</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Kod</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Mod</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Durum</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Oluşturulma</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((t) => {
                  const s = STATUS_LABEL[t.status];
                  const StatusIcon = s.icon;
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-outline-variant last:border-0 hover:bg-surface-container"
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/super-admin/tenants/${t.id}`)}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {t.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">
                        {t.code}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-on-surface-variant">
                          {t.workingMode === 'SAAS_MASTER' ? 'SaaS' : 'ERP'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${s.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {s.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">
                        {new Date(t.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleToggle(t.id, t.status)}
                          disabled={updateStatus.isPending}
                          className={`btn-ghost text-xs ${
                            t.status === 'ACTIVE' ? 'text-tertiary' : 'text-secondary'
                          }`}
                        >
                          {t.status === 'ACTIVE' ? 'Askıya al' : 'Aktif et'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-outline-variant bg-surface-container px-4 py-3 text-xs text-on-surface-variant">
            Toplam {data.pagination.total} firma
          </div>
        </div>
      )}

      {showCreate && (
        <CreateTenantModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

interface CreateForm {
  code: string;
  name: string;
  planCode: 'starter' | 'standard' | 'professional' | 'enterprise';
}

function CreateTenantModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateForm>({
    defaultValues: { code: '', name: '', planCode: 'standard' },
  });
  const create = useCreateTenant();
  const code = watch('code');

  const onSubmit = (data: CreateForm) => {
    create.mutate(
      { code: data.code.toUpperCase(), name: data.name, planCode: data.planCode },
      {
        onSuccess: () => {
          toast.success('Firma oluşturuldu');
          onCreated();
        },
        onError: (err: unknown) => {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Firma oluşturulamadı';
          toast.error(message);
        },
      },
    );
  };

  return (
    <div
      className="bg-foreground/30 fixed inset-0 z-50 flex animate-fade-in items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Yeni Firma Oluştur</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Firma Kodu</label>
            <input
              type="text"
              placeholder="ÖRN: ABC"
              maxLength={32}
              {...register('code', {
                required: 'Zorunlu',
                minLength: { value: 2, message: 'En az 2 karakter' },
              })}
              className="h-12 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm uppercase focus:border-primary focus:outline-none"
            />
            {errors.code && <span className="text-xs text-error">{errors.code.message}</span>}
            <span className="text-xs text-on-surface-variant">
              Önizleme: <span className="font-mono">{code?.toUpperCase() || 'ABC'}</span>
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Firma Adı</label>
            <input
              type="text"
              placeholder="ABC Ticaret Ltd. Şti."
              {...register('name', {
                required: 'Zorunlu',
                minLength: { value: 2, message: 'En az 2 karakter' },
              })}
              className="h-12 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm focus:border-primary focus:outline-none"
            />
            {errors.name && <span className="text-xs text-error">{errors.name.message}</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Plan</label>
            <select
              {...register('planCode', { required: true })}
              className="h-12 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm focus:border-primary focus:outline-none"
            >
              <option value="starter">Başlangıç (₺499/ay)</option>
              <option value="standard">Standart (₺999/ay)</option>
              <option value="professional">Profesyonel (₺2499/ay)</option>
              <option value="enterprise">Kurumsal (özel fiyat)</option>
            </select>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              İptal
            </button>
            <button type="submit" disabled={create.isPending} className="btn-primary">
              {create.isPending ? 'Oluşturuluyor…' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
