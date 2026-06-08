import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Banknote } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ErrorState } from '@/components/data/ErrorState';
import { LoadingState } from '@/components/data/LoadingState';
import { useCollection, useCreateCollection, useCustomerSearch, useUpdateCollection } from '@/features/collections/api';
import { formatCurrency } from '@saas/shared';
import type { CollectionType } from '@saas/shared';
import toast from 'react-hot-toast';

export function CollectionNewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null);
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<CollectionType>('CASH');
  const [notes, setNotes] = useState('');

  const create = useCreateCollection();
  const update = useUpdateCollection();
  const { data: collection, isLoading, isError, error, refetch } = useCollection(id);
  const { data: customers } = useCustomerSearch(customerSearch);

  useEffect(() => {
    if (!collection) return;
    setSelectedCustomer({ id: collection.customerId, name: collection.customerName });
    setCollectionDate(collection.collectionDate.slice(0, 10));
    setAmount(String(collection.amount));
    setType(collection.type);
    setNotes(collection.notes ?? '');
  }, [collection]);

  const amountNum = parseFloat(amount) || 0;
  const isValid = selectedCustomer && amountNum > 0;
  const pending = create.isPending || update.isPending;

  const onSubmit = () => {
    if (!isValid) {
      toast.error('Müşteri seçimi ve tutar zorunludur');
      return;
    }

    const payload = {
      customerId: selectedCustomer.id,
      collectionDate: new Date(collectionDate).toISOString(),
      amount: amountNum,
      type,
      notes: notes || undefined,
    };

    if (isEdit && id) {
      update.mutate(
        { id, input: payload },
        {
          onSuccess: () => {
            toast.success('Tahsilat güncellendi');
            navigate(`/collections/${id}`);
          },
          onError: (err: unknown) => {
            toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Tahsilat güncellenemedi');
          },
        },
      );
      return;
    }

    create.mutate(payload, {
      onSuccess: (col) => {
        toast.success('Tahsilat oluşturuldu — onaylamak için detaya gidin');
        navigate(`/collections/${col.id}`);
      },
      onError: (err: unknown) => {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Tahsilat oluşturulamadı');
      },
    });
  };

  if (isEdit && isLoading) return <LoadingState label="Tahsilat yükleniyor..." />;
  if (isEdit && isError) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={isEdit ? 'Tahsilatı Düzenle' : 'Yeni Tahsilat'}
        description="Tahsilat kaydı — onaylandığında cari hareket ve kasa güncellenir"
        actions={
          <button onClick={() => navigate(isEdit && id ? `/collections/${id}` : '/collections')} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            {isEdit ? 'Tahsilat Detayına Dön' : 'Tahsilatlara Dön'}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="card p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
              <Building2 className="h-4 w-4" />
              Müşteri
            </h3>
            <div className="relative">
              <input
                type="search"
                value={selectedCustomer ? selectedCustomer.name : customerSearch}
                onChange={(e) => {
                  setSelectedCustomer(null);
                  setCustomerSearch(e.target.value);
                  setShowCustomerDrop(true);
                }}
                onFocus={() => setShowCustomerDrop(true)}
                placeholder="Müşteri adı veya vergi no ile ara..."
                className="h-10 w-full rounded-md border border-outline-variant bg-surface-container px-4 text-sm focus:border-primary focus:outline-none"
                readOnly={!!selectedCustomer}
              />
              {selectedCustomer && <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant hover:text-error">Temizle</button>}
              {showCustomerDrop && customers && customers.length > 0 && !selectedCustomer && (
                <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-outline-variant bg-surface-container text-sm shadow-lg">
                  {customers.map((customer) => (
                    <li key={customer.id} onClick={() => { setSelectedCustomer({ id: customer.id, name: customer.name }); setShowCustomerDrop(false); }} className="cursor-pointer rounded-md px-3 py-2 hover:bg-surface-high">
                      <div className="font-medium">{customer.name}</div>
                      {customer.taxNumber && <div className="text-xs font-mono text-on-surface-variant">{customer.taxNumber}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
              <Banknote className="h-4 w-4" />
              Tutar
            </h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs text-on-surface-variant">Tahsilat Tarihi</label>
                <input type="date" value={collectionDate} onChange={(e) => setCollectionDate(e.target.value)} className="h-10 w-full rounded-md border border-outline-variant bg-surface-container px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-on-surface-variant">Tahsil Edilen Tutar (₺)</label>
                <input type="number" min={0.01} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 w-full rounded-md border border-outline-variant bg-surface-container px-4 text-lg font-mono font-semibold text-foreground focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-on-surface-variant">Tahsilat Türü</label>
                <select value={type} onChange={(e) => setType(e.target.value as CollectionType)} className="h-10 w-full rounded-md border border-outline-variant bg-surface-container px-3 text-sm">
                  <option value="CASH">Nakit</option>
                  <option value="BANK_TRANSFER">EFT / Havale</option>
                  <option value="POS">Kredi Kartı (POS)</option>
                  <option value="QR">QR Kod / CepBank</option>
                  <option value="CHECK">Çek</option>
                  <option value="OTHER">Diğer</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-on-surface-variant">Not</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full resize-none rounded-md border border-outline-variant bg-surface-container px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <h3 className="mb-3 font-semibold text-foreground">Tahsilat Özeti</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-on-surface-variant" />
                <div>
                  <div className="text-xs text-on-surface-variant">Müşteri</div>
                  <div className="font-medium text-foreground">{selectedCustomer?.name ?? <span className="text-on-surface-variant">Seçilmedi</span>}</div>
                </div>
              </div>
              <div className="mt-1 flex justify-between border-t border-outline-variant pt-2">
                <span className="font-semibold text-foreground">Tahsilat Tutarı</span>
                <span className="font-mono text-lg font-bold text-secondary">{amountNum > 0 ? formatCurrency(amountNum) : '—'}</span>
              </div>
            </div>
          </div>

          <div className="card flex flex-col gap-2 p-4">
            <div className="mb-1 rounded-md bg-primary-container p-3 text-xs text-primary">
              Tahsilat onaylandığında cari hesap alacaklandırılır ve kasa/banka hesabı güncellenir.
            </div>
            <button onClick={onSubmit} disabled={pending || !isValid} className="w-full rounded-md bg-primary py-3 font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-50">
              {pending ? 'Kaydediliyor...' : isEdit ? 'Tahsilatı Güncelle' : 'Tahsilat Oluştur (Bekliyor)'}
            </button>
            <button onClick={() => navigate(isEdit && id ? `/collections/${id}` : '/collections')} className="w-full py-2.5 text-sm text-on-surface-variant hover:text-foreground">
              İptal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
