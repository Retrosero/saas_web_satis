import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  Hash,
  Calendar,
  TrendingUp,
  TrendingDown,
  FileText,
  Power,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { EmptyState } from '@/components/data/EmptyState';
import {
  useCustomer,
  useCustomerStatement,
  useDeactivateCustomer,
  useDeleteCustomer,
} from '@/features/customers/api';
import { formatCurrency, formatDate } from '@saas/shared';
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

const REF_TYPE_LABEL: Record<string, string> = {
  SALE: 'Satış',
  SALE_CANCEL: 'Satış İptal',
  COLLECTION: 'Tahsilat',
  COLLECTION_CANCEL: 'Tahsilat İptal',
  RETURN: 'İade',
  ADJUST: 'Düzeltme',
  OPENING_BALANCE: 'Açılış',
  TRANSFER: 'Transfer',
};

export function CustomerDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [refTypeFilter, setRefTypeFilter] = useState<string | undefined>();

  const { data: customer, isLoading, isError, error, refetch } = useCustomer(id);
  const { data: statement, isLoading: statementLoading } = useCustomerStatement(id, {
    refType: refTypeFilter,
  });
  const deactivate = useDeactivateCustomer();
  const remove = useDeleteCustomer();

  if (isLoading) return <LoadingState label="Cari yükleniyor…" />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!customer) return <EmptyState title="Cari bulunamadı" icon={<AlertCircle className="h-8 w-8" />} />;

  const t = TYPE_LABEL[customer.type];
  const s = STATUS_LABEL[customer.status];

  const handleDeactivate = () => {
    if (!confirm(`"${customer.name}" carisini pasife almak istediğinizden emin misiniz?`)) return;
    deactivate.mutate(customer.id, {
      onSuccess: () => toast.success('Cari pasife alındı'),
      onError: (err: unknown) => {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'İşlem başarısız';
        toast.error(message);
      },
    });
  };

  const handleDelete = () => {
    if (!confirm(`"${customer.name}" carisini silmek istediğinizden emin misiniz? Bu işlem GERİ ALINAMAZ.`)) return;
    remove.mutate(customer.id, {
      onSuccess: () => {
        toast.success('Cari silindi');
        navigate('/customers');
      },
      onError: (err: unknown) => {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Silinemedi';
        toast.error(message);
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => navigate('/customers')} className="btn-ghost self-start text-sm">
        <ArrowLeft className="h-4 w-4" />
        Cari Listesine Dön
      </button>

      <PageHeader
        title={customer.name}
        description={
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.color}`}>{t.text}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.color}`}>{s.text}</span>
            <span className="text-xs text-on-surface-variant font-mono">{customer.code}</span>
          </div>
        }
        actions={
          <div className="flex gap-2">
            {customer.status === 'ACTIVE' && (
              <button onClick={handleDeactivate} disabled={deactivate.isPending} className="btn-secondary text-sm">
                <Power className="h-4 w-4" />
                Pasife Al
              </button>
            )}
            {customer.movementCount === 0 && (
              <button onClick={handleDelete} disabled={remove.isPending} className="btn-ghost text-sm text-error">
                Sil
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sol kolon: Bilgiler */}
        <div className="flex flex-col gap-4">
          {/* Cari bilgileri */}
          <div className="card p-5 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Cari Bilgileri
            </h3>
            <div className="flex flex-col gap-2 text-sm">
              {customer.contactName && (
                <div>
                  <span className="text-on-surface-variant">Yetkili:</span> {customer.contactName}
                </div>
              )}
              {customer.taxNumber && (
                <div className="flex items-center gap-2">
                  <Hash className="h-3 w-3 text-on-surface-variant" />
                  <span className="text-on-surface-variant">VKN:</span>
                  <span className="font-mono">{customer.taxNumber}</span>
                  {customer.taxOffice && <span className="text-on-surface-variant">/ {customer.taxOffice}</span>}
                </div>
              )}
              {customer.identityNumber && (
                <div className="flex items-center gap-2">
                  <Hash className="h-3 w-3 text-on-surface-variant" />
                  <span className="text-on-surface-variant">TCKN:</span>
                  <span className="font-mono">{customer.identityNumber}</span>
                </div>
              )}
              {customer.iban && (
                <div>
                  <span className="text-on-surface-variant">IBAN:</span>{' '}
                  <span className="font-mono text-xs">{customer.iban}</span>
                </div>
              )}
            </div>
          </div>

          {/* İletişim */}
          <div className="card p-5 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide">İletişim</h3>
            <div className="flex flex-col gap-2 text-sm">
              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-foreground hover:text-primary">
                  <Phone className="h-3 w-3 text-on-surface-variant" /> {customer.phone}
                  {customer.phone2 && <span className="text-on-surface-variant">/ {customer.phone2}</span>}
                </a>
              )}
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-foreground hover:text-primary">
                  <Mail className="h-3 w-3 text-on-surface-variant" /> {customer.email}
                </a>
              )}
              {customer.website && (
                <a
                  href={customer.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-foreground hover:text-primary"
                >
                  <Globe className="h-3 w-3 text-on-surface-variant" /> {customer.website}
                </a>
              )}
              {customer.address && (
                <div className="flex items-start gap-2 text-foreground">
                  <MapPin className="h-3 w-3 mt-1 text-on-surface-variant" />
                  <div>
                    {customer.address}
                    {customer.city && <span> {customer.city}</span>}
                    {customer.district && <span> / {customer.district}</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Finansal */}
          <div className="card p-5 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide">Finansal</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-on-surface-variant text-xs">Kredi Limiti</div>
                <div className="font-mono font-semibold">{formatCurrency(customer.creditLimit)}</div>
              </div>
              <div>
                <div className="text-on-surface-variant text-xs">Vade</div>
                <div className="font-mono font-semibold">{customer.paymentTermDays} gün</div>
              </div>
            </div>
            {customer.notes && (
              <div className="pt-2 border-t border-outline-variant">
                <div className="text-on-surface-variant text-xs mb-1">Notlar</div>
                <div className="text-sm text-foreground whitespace-pre-wrap">{customer.notes}</div>
              </div>
            )}
          </div>

          {/* Tarihçe */}
          <div className="card p-5 flex flex-col gap-2 text-xs text-on-surface-variant">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" /> Oluşturuldu: {formatDate(customer.createdAt)}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" /> Güncellendi: {formatDate(customer.updatedAt)}
            </div>
          </div>
        </div>

        {/* Sağ kolon: Bakiye özeti + Ekstre */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Bakiye özeti */}
          {statement && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="card p-5">
                <div className="text-xs text-on-surface-variant uppercase tracking-wide mb-1">Bakiye</div>
                <div
                  className={`text-2xl font-bold font-mono ${
                    statement.balance > 0
                      ? 'text-secondary'
                      : statement.balance < 0
                      ? 'text-error'
                      : 'text-on-surface-variant'
                  }`}
                >
                  {formatCurrency(statement.balance)}
                </div>
                <div className="text-xs text-on-surface-variant mt-1">
                  {statement.balance > 0 ? 'Alacak' : statement.balance < 0 ? 'Borç' : 'Eşit'}
                </div>
              </div>
              <div className="card p-5">
                <div className="text-xs text-on-surface-variant uppercase tracking-wide mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Toplam Borç (DEBIT)
                </div>
                <div className="text-2xl font-bold font-mono text-foreground">{formatCurrency(statement.totalDebit)}</div>
              </div>
              <div className="card p-5">
                <div className="text-xs text-on-surface-variant uppercase tracking-wide mb-1 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" /> Toplam Alacak (CREDIT)
                </div>
                <div className="text-2xl font-bold font-mono text-foreground">{formatCurrency(statement.totalCredit)}</div>
              </div>
            </div>
          )}

          {/* Ekstre */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Cari Hareketleri (Ekstre)
              </h3>
              <div className="flex items-center gap-2">
                <Filter className="h-3 w-3 text-on-surface-variant" />
                <select
                  value={refTypeFilter ?? ''}
                  onChange={(e) => setRefTypeFilter(e.target.value || undefined)}
                  className="h-8 px-2 rounded-md bg-surface text-xs border border-outline-variant"
                >
                  <option value="">Tümü</option>
                  {Object.entries(REF_TYPE_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {statementLoading && <LoadingState label="Hareketler yükleniyor…" />}
            {statement && statement.movements.length === 0 && (
              <div className="p-8 text-center text-sm text-on-surface-variant">
                Bu cariye ait hareket yok.
                {refTypeFilter && ' Filtreyi temizleyerek tüm hareketleri görebilirsiniz.'}
              </div>
            )}
            {statement && statement.movements.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-container-low border-b border-outline-variant">
                    <tr>
                      <th className="text-left font-semibold text-foreground px-4 py-2">Tarih</th>
                      <th className="text-left font-semibold text-foreground px-4 py-2">Tip</th>
                      <th className="text-left font-semibold text-foreground px-4 py-2">Referans</th>
                      <th className="text-left font-semibold text-foreground px-4 py-2">Açıklama</th>
                      <th className="text-right font-semibold text-foreground px-4 py-2">Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statement.movements.map((m) => (
                      <tr
                        key={m.id}
                        className={`border-b border-outline-variant last:border-0 ${
                          m.reversesId ? 'bg-error-container/30 line-through' : ''
                        }`}
                      >
                        <td className="px-4 py-2 text-xs font-mono text-on-surface-variant whitespace-nowrap">
                          {new Date(m.movementDate).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              m.type === 'DEBIT' ? 'bg-primary-container text-primary' : 'bg-tertiary-container text-tertiary'
                            }`}
                          >
                            {m.type === 'DEBIT' ? 'Borç' : 'Alacak'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs">
                          <div className="text-foreground">{REF_TYPE_LABEL[m.refType] ?? m.refType}</div>
                          {m.refNumber && <div className="text-on-surface-variant font-mono">{m.refNumber}</div>}
                        </td>
                        <td className="px-4 py-2 text-xs text-on-surface-variant">{m.description ?? '—'}</td>
                        <td
                          className={`px-4 py-2 text-right font-mono font-semibold ${
                            m.type === 'DEBIT' ? 'text-primary' : 'text-tertiary'
                          }`}
                        >
                          {m.type === 'DEBIT' ? '+' : '−'}
                          {formatCurrency(m.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {statement && statement.movements.length > 0 && (
              <div className="px-4 py-2 border-t border-outline-variant bg-surface-container text-xs text-on-surface-variant">
                {statement.movements.length} hareket gösteriliyor
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
