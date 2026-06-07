import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, Plus, Search, Building2, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/data/EmptyState';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useCollectionsList } from '@/features/collections/api';
import { usePermission } from '@/lib/usePermission';
import { formatCurrency } from '@saas/shared';
import type { CollectionStatus, CollectionType } from '@saas/shared';

const STATUS_LABEL: Record<CollectionStatus, { text: string; color: string }> = {
  PENDING: { text: 'Bekliyor', color: 'bg-surface-variant text-on-surface-variant' },
  CONFIRMED: { text: 'Onaylandı', color: 'bg-secondary-container text-secondary' },
  CANCELLED: { text: 'İptal', color: 'bg-error-container text-error' },
  REFUNDED: { text: 'İade', color: 'bg-tertiary-container text-tertiary' },
};

const TYPE_LABEL: Record<CollectionType, string> = {
  CASH: 'Nakit',
  BANK_TRANSFER: 'EFT/Havale',
  POS: 'Kredi Kartı',
  QR: 'QR Kod',
  CHECK: 'Çek',
  OTHER: 'Diğer',
};

export function CollectionListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CollectionStatus | undefined>();

  const { data, isLoading, isError, error, refetch } = useCollectionsList({
    search: search || undefined,
    status: statusFilter,
    pageSize: 100,
  });

  const canCreate = usePermission('tahsilat:collection:create');

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Tahsilatlar"
        description="Müşterilerden tahsil edilen ödemeler — onayla, iptal et"
        actions={
          canCreate ? (
            <button onClick={() => navigate('/collections/new')} className="btn-primary">
              <Plus className="h-4 w-4" />
              Yeni Tahsilat
            </button>
          ) : null
        }
      />

      <div className="card p-3 flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tahsilat no veya müşteri adı ile ara…"
            className="w-full h-10 pl-10 pr-4 rounded-md bg-surface-container text-sm border border-outline-variant focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={statusFilter ?? ''}
          onChange={(e) => setStatusFilter((e.target.value as CollectionStatus) || undefined)}
          className="h-10 px-3 rounded-md bg-surface-container text-sm border border-outline-variant"
        >
          <option value="">Tüm durumlar</option>
          <option value="PENDING">Bekliyor</option>
          <option value="CONFIRMED">Onaylandı</option>
          <option value="CANCELLED">İptal</option>
          <option value="REFUNDED">İade</option>
        </select>
      </div>

      {isLoading && <LoadingState label="Tahsilatlar yükleniyor…" />}
      {isError && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {data && data.data.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<Banknote className="h-8 w-8" />}
            title="Henüz tahsilat yok"
            description="Müşterilerden tahsilat yapmak için yeni tahsilat oluşturun. Tahsilat onaylandığında cari hesap güncellenir."
            action={
              canCreate ? (
                <button onClick={() => navigate('/collections/new')} className="btn-primary">
                  <Plus className="h-4 w-4" />
                  İlk Tahsilatı Oluştur
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
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Tahsilat No</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Müşteri</th>
                  <th className="text-center px-4 py-3 font-semibold text-foreground">Tarih</th>
                  <th className="text-center px-4 py-3 font-semibold text-foreground">Tür</th>
                  <th className="text-right px-4 py-3 font-semibold text-foreground">Tutar</th>
                  <th className="text-center px-4 py-3 font-semibold text-foreground">Durum</th>
                  <th className="text-right px-4 py-3 font-semibold text-foreground">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((col) => {
                  const st = STATUS_LABEL[col.status];
                  return (
                    <tr
                      key={col.id}
                      onClick={() => navigate(`/collections/${col.id}`)}
                      className="border-b border-outline-variant last:border-0 hover:bg-surface-container cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium font-mono text-foreground">{col.collectionNumber}</div>
                        {col.linkedSaleId && (
                          <div className="text-xs text-primary">→ Satışa bağlı</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-foreground">
                          <Building2 className="h-3.5 w-3.5 text-on-surface-variant" />
                          <span className="font-medium">{col.customerName}</span>
                        </div>
                        {col.customerTaxNumber && (
                          <div className="text-xs font-mono text-on-surface-variant">{col.customerTaxNumber}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-on-surface-variant">
                        {new Date(col.collectionDate).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-on-surface-variant">
                        {TYPE_LABEL[col.type]}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-secondary">
                        {formatCurrency(col.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${st.color}`}>
                          {st.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/collections/${col.id}`)}
                          className="btn-ghost text-xs"
                        >
                          Detay
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-outline-variant bg-surface-container text-xs text-on-surface-variant flex justify-between">
            <span>Toplam {data.pagination.total} tahsilat</span>
            <span className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Onaylanan tahsilatlar cari hesabı otomatik günceller
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
