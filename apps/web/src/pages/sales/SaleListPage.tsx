import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, Package, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/data/EmptyState';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useSalesList } from '@/features/sales/api';
import { formatCurrency } from '@saas/shared';
import type { PaymentStatus, SaleStatus, SaleType } from '@saas/shared';
import toast from 'react-hot-toast';

const STATUS_LABEL: Record<SaleStatus, { text: string; color: string }> = {
  DRAFT: { text: 'Taslak', color: 'bg-surface-variant text-on-surface-variant' },
  CONFIRMED: { text: 'Onaylandı', color: 'bg-primary-container text-primary' },
  PARTIALLY_SHIPPED: { text: 'Kısmi Sevk', color: 'bg-tertiary-container text-tertiary' },
  SHIPPED: { text: 'Sevk Edildi', color: 'bg-secondary-container text-secondary' },
  DELIVERED: { text: 'Teslim Edildi', color: 'bg-secondary-container text-secondary' },
  PARTIALLY_PAID: { text: 'Kısmi Ödeme', color: 'bg-tertiary-container text-tertiary' },
  PAID: { text: 'Ödendi', color: 'bg-secondary-container text-secondary' },
  OVERDUE: { text: 'Vadesi Geçmiş', color: 'bg-error-container text-error' },
  CANCELLED: { text: 'İptal', color: 'bg-error-container text-error' },
  CLOSED: { text: 'Kapalı', color: 'bg-surface-variant text-on-surface-variant' },
};

const PAYMENT_LABEL: Record<PaymentStatus, { text: string; color: string }> = {
  UNPAID: { text: 'Ödenmedi', color: 'bg-error-container text-error' },
  PARTIALLY_PAID: { text: 'Kısmi Ödeme', color: 'bg-tertiary-container text-tertiary' },
  PAID: { text: 'Ödendi', color: 'bg-secondary-container text-secondary' },
};

export function SaleListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SaleStatus | undefined>();
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | undefined>();

  const { data, isLoading, isError, error, refetch } = useSalesList({
    search: search || undefined,
    status: statusFilter,
    paymentStatus: paymentFilter,
    pageSize: 100,
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Satışlar"
        description="Faturalar ve satış belgeleri — onayla, iptal et, detayı gör"
        actions={
          <button onClick={() => navigate('/sales/new')} className="btn-primary">
            <Plus className="h-4 w-4" />
            Yeni Satış
          </button>
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
            placeholder="Satış no veya müşteri adı ile ara…"
            className="w-full h-10 pl-10 pr-4 rounded-md bg-surface-container text-sm border border-outline-variant focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={statusFilter ?? ''}
          onChange={(e) => setStatusFilter((e.target.value as SaleStatus) || undefined)}
          className="h-10 px-3 rounded-md bg-surface-container text-sm border border-outline-variant"
        >
          <option value="">Tüm durumlar</option>
          <option value="DRAFT">Taslak</option>
          <option value="CONFIRMED">Onaylandı</option>
          <option value="PAID">Ödendi</option>
          <option value="PARTIALLY_PAID">Kısmi Ödeme</option>
          <option value="OVERDUE">Vadesi Geçmiş</option>
          <option value="CANCELLED">İptal</option>
        </select>
        <select
          value={paymentFilter ?? ''}
          onChange={(e) => setPaymentFilter((e.target.value as PaymentStatus) || undefined)}
          className="h-10 px-3 rounded-md bg-surface-container text-sm border border-outline-variant"
        >
          <option value="">Tüm ödemeler</option>
          <option value="PAID">Ödendi</option>
          <option value="UNPAID">Ödenmedi</option>
          <option value="PARTIALLY_PAID">Kısmi Ödeme</option>
        </select>
      </div>

      {isLoading && <LoadingState label="Satışlar yükleniyor…" />}
      {isError && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {data && data.data.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title="Henüz satış yok"
            description="Satış oluşturmak için taslak olarak kaydedin veya doğrudan onaylayın. Satış onaylandığında stok ve cari hareketleri otomatik oluşur."
            action={
              <button onClick={() => navigate('/sales/new')} className="btn-primary">
                <Plus className="h-4 w-4" />
                İlk Satışı Oluştur
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
                  <th className="text-left font-semibold text-foreground px-4 py-3">Satış No</th>
                  <th className="text-left font-semibold text-foreground px-4 py-3">Müşteri</th>
                  <th className="text-center font-semibold text-foreground px-4 py-3">Tarih</th>
                  <th className="text-right font-semibold text-foreground px-4 py-3">Tutar</th>
                  <th className="text-right font-semibold text-foreground px-4 py-3">Ödenen</th>
                  <th className="text-center font-semibold text-foreground px-4 py-3">Durum</th>
                  <th className="text-center font-semibold text-foreground px-4 py-3">Ödeme</th>
                  <th className="text-center font-semibold text-foreground px-4 py-3">Kalem</th>
                  <th className="text-right font-semibold text-foreground px-4 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((sale) => {
                  const st = STATUS_LABEL[sale.status];
                  const py = PAYMENT_LABEL[sale.paymentStatus];
                  return (
                    <tr
                      key={sale.id}
                      onClick={() => navigate(`/sales/${sale.id}`)}
                      className="border-b border-outline-variant last:border-0 hover:bg-surface-container cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium font-mono text-foreground">{sale.saleNumber}</div>
                        {sale.notes && (
                          <div className="text-xs text-on-surface-variant truncate max-w-[150px]">{sale.notes}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{sale.customerName}</div>
                        {sale.customerTaxNumber && (
                          <div className="text-xs text-on-surface-variant font-mono">{sale.customerTaxNumber}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-on-surface-variant">
                        {new Date(sale.saleDate).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                        {formatCurrency(sale.grandTotal)}
                        <div className="text-xs text-on-surface-variant">
                          {formatCurrency(sale.vatTotal)} KDV
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${
                        sale.paidAmount > 0 ? 'text-secondary' : 'text-on-surface-variant'
                      }`}>
                        {formatCurrency(sale.paidAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${st.color}`}>
                          {st.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${py.color}`}>
                          {py.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-on-surface-variant">
                        {sale.itemCount}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/sales/${sale.id}`)}
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
            <span>Toplam {data.pagination.total} satış</span>
            <span className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Bakiyeler anlık hesaplanır
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
