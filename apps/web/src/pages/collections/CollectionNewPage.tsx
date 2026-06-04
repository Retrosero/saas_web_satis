import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Building2, Banknote } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCreateCollection, useCustomerSearch } from '@/features/collections/api';
import { formatCurrency } from '@saas/shared';
import type { CollectionType } from '@saas/shared';
import toast from 'react-hot-toast';

export function CollectionNewPage() {
  const navigate = useNavigate();
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null);
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<CollectionType>('CASH');
  const [notes, setNotes] = useState('');

  const create = useCreateCollection();
  const { data: customers } = useCustomerSearch(customerSearch);

  const amountNum = parseFloat(amount) || 0;
  const isValid = selectedCustomer && amountNum > 0;

  const onSubmit = () => {
    if (!isValid) {
      toast.error('Müşteri seçimi ve tutar zorunludur');
      return;
    }

    create.mutate(
      {
        customerId: selectedCustomer.id,
        collectionDate: new Date(collectionDate).toISOString(),
        amount: amountNum,
        type,
        notes: notes || undefined,
      },
      {
        onSuccess: (col) => {
          toast.success('Tahsilat oluşturuldu — onaylamak için detaya gidin');
          navigate(`/collections/${col.id}`);
        },
        onError: (err: unknown) => {
          toast.error(
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
              'Tahsilat oluşturulamadı',
          );
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Yeni Tahsilat"
        description="Tahsilat kaydı — onayladığınızda cari hareket ve kasa güncellenir"
        actions={
          <button onClick={() => navigate('/collections')} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            Tahsilatlara Dön
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Müşteri seçimi */}
          <div className="card p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
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
                placeholder="Müşteri adı veya vergi no ile ara…"
                className="w-full h-10 px-4 rounded-md bg-surface-container text-sm border border-outline-variant focus:border-primary focus:outline-none"
                readOnly={!!selectedCustomer}
              />
              {selectedCustomer && (
                <button
                  onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant hover:text-error"
                >
                  Temizle
                </button>
              )}
              {showCustomerDrop && customers && customers.length > 0 && !selectedCustomer && (
                <ul className="absolute z-10 mt-1 w-full bg-surface-container border border-outline-variant rounded-md shadow-lg max-h-48 overflow-y-auto text-sm">
                  {customers.map((c) => (
                    <li
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomer({ id: c.id, name: c.name });
                        setShowCustomerDrop(false);
                      }}
                      className="px-3 py-2 hover:bg-surface-high rounded-md cursor-pointer"
                    >
                      <div className="font-medium">{c.name}</div>
                      {c.taxNumber && <div className="text-xs font-mono text-on-surface-variant">{c.taxNumber}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Tutar */}
          <div className="card p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Tutar
            </h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Tahsilat Tarihi</label>
                <input
                  type="date"
                  value={collectionDate}
                  onChange={(e) => setCollectionDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-surface-container text-sm border border-outline-variant"
                />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Tahsil Edilen Tutar (₺)</label>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full h-12 px-4 rounded-md bg-surface-container text-lg font-mono font-semibold text-foreground border border-outline-variant focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Tahsilat Türü</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CollectionType)}
                  className="w-full h-10 px-3 rounded-md bg-surface-container text-sm border border-outline-variant"
                >
                  <option value="CASH">Nakit</option>
                  <option value="BANK_TRANSFER">EFT / Havale</option>
                  <option value="POS">Kredi Kartı (POS)</option>
                  <option value="QR">QR Kod / CepBank</option>
                  <option value="CHECK">Çek</option>
                  <option value="OTHER">Diğer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Not (opsiyonel)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tahsilat notu…"
                  rows={2}
                  className="w-full px-3 py-2 rounded-md bg-surface-container text-sm border border-outline-variant resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sağ: Özet + Kaydet */}
        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <h3 className="font-semibold text-foreground mb-3">Tahsilat Özeti</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-on-surface-variant" />
                <div>
                  <div className="text-xs text-on-surface-variant">Müşteri</div>
                  <div className="font-medium text-foreground">
                    {selectedCustomer?.name ?? <span className="text-on-surface-variant">Seçilmedi</span>}
                  </div>
                </div>
              </div>
              <div className="flex justify-between border-t border-outline-variant pt-2 mt-1">
                <span className="font-semibold text-foreground">Tahsilat Tutarı</span>
                <span className="font-mono font-bold text-secondary text-lg">
                  {amountNum > 0 ? formatCurrency(amountNum) : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="card p-4 flex flex-col gap-2">
            <div className="bg-primary-container text-primary text-xs p-3 rounded-md mb-1">
              ⚠️ Tahsilat onaylandığında:<br />
              • Cari hesap alacaklandırılır<br />
              • Kasa/banka hesabı güncellenir<br />
              • Geri alınamaz
            </div>
            <button
              onClick={onSubmit}
              disabled={create.isPending || !isValid}
              className="w-full font-semibold py-3 rounded-md bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-50"
            >
              {create.isPending ? 'Kaydediliyor…' : '✓ Tahsilat Oluştur (Bekliyor)'}
            </button>
            <button
              onClick={() => navigate('/collections')}
              className="w-full py-2.5 text-sm text-on-surface-variant hover:text-foreground"
            >
              İptal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
