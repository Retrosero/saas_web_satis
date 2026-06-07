import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Phone, Mail, MapPin, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/data/EmptyState';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useCustomers, useDeactivateCustomer } from '@/features/customers/api';
import { usePermission } from '@/lib/usePermission';
import { formatCurrency } from '@saas/shared';
import type { CustomerStatus, CustomerType } from '@saas/shared';
import toast from 'react-hot-toast';

const TYPE_LABEL: Record<CustomerType, { text: string; color: string }> = {
  CUSTOMER: { text: 'Müşteri', color: 'bg-primary-container text-primary' },
  SUPPLIER: { text: 'Tedarikçi', color: 'bg-tertiary-container text-tertiary' },
  BOTH: { text: 'Müşteri+Tedarikçi', color: 'bg-secondary-container text-secondary' },
};

const STATUS_LABEL: Record<CustomerStatus, { text: string; color: string }> = {
  ACTIVE: { text: 'Aktif', color: 'bg-secondary-container text-secondary' },
  PASSIVE: { text: 'Pasif', color: 'bg-surface-variant text-on-surface-variant' },
  BLOCKED: { text: 'Bloke', color: 'bg-error-container text-error' },
};

export function CustomerListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CustomerType | undefined>();
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | undefined>();

  const { data, isLoading, isError, error, refetch } = useCustomers({
    search: search || undefined,
    type: typeFilter,
    status: statusFilter,
    pageSize: 100,
  });
  const deactivate = useDeactivateCustomer();

  const canCreate = usePermission('cari:customer:create');
  const canDelete = usePermission('cari:customer:delete');

  const handleDeactivate = (id: string, name: string) => {
    if (!confirm(`"${name}" carisini pasife almak istediğinizden emin misiniz? Hareketleri saklanır.`)) return;
    deactivate.mutate(id, {
      onSuccess: () => toast.success('Cari pasife alındı'),
      onError: (err: unknown) => {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'İşlem başarısız';
        toast.error(message);
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Cari Hesaplar"
        description="Müşteri ve tedarikçi hesaplarınız — bakiyeler anlık hesaplanır"
        actions={
          canCreate ? (
            <button onClick={() => navigate('/customers/new')} className="btn-primary">
              <Plus className="h-4 w-4" />
              Yeni Cari
            </button>
          ) : null
        }
      />

      {/* Filtre çubuğu */}
      <div className="card p-3 flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kodu, adı, vergi no, telefon veya e-posta…"
            className="w-full h-10 pl-10 pr-4 rounded-md bg-surface-container text-sm border border-outline-variant focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={typeFilter ?? ''}
          onChange={(e) => setTypeFilter((e.target.value as CustomerType) || undefined)}
          className="h-10 px-3 rounded-md bg-surface-container text-sm border border-outline-variant"
        >
          <option value="">Tüm tipler</option>
          <option value="CUSTOMER">Müşteri</option>
          <option value="SUPPLIER">Tedarikçi</option>
          <option value="BOTH">Müşteri+Tedarikçi</option>
        </select>
        <select
          value={statusFilter ?? ''}
          onChange={(e) => setStatusFilter((e.target.value as CustomerStatus) || undefined)}
          className="h-10 px-3 rounded-md bg-surface-container text-sm border border-outline-variant"
        >
          <option value="">Tüm durumlar</option>
          <option value="ACTIVE">Aktif</option>
          <option value="PASSIVE">Pasif</option>
          <option value="BLOCKED">Bloke</option>
        </select>
      </div>

      {isLoading && <LoadingState label="Cariler yükleniyor…" />}
      {isError && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {data && data.data.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="Henüz cari hesap yok"
            description="Müşteri veya tedarikçi ekleyerek başlayın. Cari hesapları fatura, tahsilat ve kasa işlemlerinde kullanılır."
            action={
              canCreate ? (
                <button onClick={() => navigate('/customers/new')} className="btn-primary">
                  <Plus className="h-4 w-4" />
                  İlk Cariyi Oluştur
                </button>
              ) : null
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
                  <th className="text-left font-semibold text-foreground px-4 py-3">Cari</th>
                  <th className="text-left font-semibold text-foreground px-4 py-3">Tip</th>
                  <th className="text-left font-semibold text-foreground px-4 py-3">İletişim</th>
                  <th className="text-right font-semibold text-foreground px-4 py-3">Bakiye</th>
                  <th className="text-center font-semibold text-foreground px-4 py-3">Durum</th>
                  <th className="text-right font-semibold text-foreground px-4 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((c) => {
                  const t = TYPE_LABEL[c.type];
                  const s = STATUS_LABEL[c.status];
                  const balanceClass =
                    c.balance > 0
                      ? 'text-secondary'
                      : c.balance < 0
                      ? 'text-error'
                      : 'text-on-surface-variant';
                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/customers/${c.id}`)}
                      className="border-b border-outline-variant last:border-0 hover:bg-surface-container cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{c.name}</div>
                        <div className="text-xs text-on-surface-variant font-mono mt-0.5">{c.code}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${t.color}`}>
                          {t.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">
                        {c.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {c.phone}
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" /> {c.email}
                          </div>
                        )}
                        {c.city && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" /> {c.city}
                          </div>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${balanceClass}`}>
                        {formatCurrency(c.balance)}
                        {c.movementCount > 0 && (
                          <div className="text-xs font-normal text-on-surface-variant">
                            {c.movementCount} hareket
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${s.color}`}>
                          {s.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {canDelete && c.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleDeactivate(c.id, c.name)}
                            disabled={deactivate.isPending}
                            className="btn-ghost text-xs text-tertiary"
                          >
                            Pasife al
                          </button>
                        ) : (
                          <span className="text-xs text-on-surface-variant">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-outline-variant bg-surface-container text-xs text-on-surface-variant flex justify-between">
            <span>Toplam {data.pagination.total} cari</span>
            {data.pagination.total > 0 && (
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Bakiyeler anlık hesaplanır (event-sourcing)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
