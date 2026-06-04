import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Plus, Trash2, Package, Search, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  useCreateSale,
  useProductSearch,
  useCustomerSearch,
  type CreateSaleItemInput,
} from '@/features/sales/api';
import { formatCurrency } from '@saas/shared';
import toast from 'react-hot-toast';
import type { SaleStatus } from '@saas/shared';

interface SaleForm {
  customerId: string;
  customerName: string;
  saleDate: string;
  dueDate?: string;
  warehouseId: string;
  notes?: string;
  status: SaleStatus;
  items: CreateSaleItemInput[];
}

export function SaleNewPage() {
  const navigate = useNavigate();
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);
  const [showProductDrop, setShowProductDrop] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null);
  const [items, setItems] = useState<CreateSaleItemInput[]>([]);
  const [notes, setNotes] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<SaleStatus>('DRAFT');

  const create = useCreateSale();
  const { data: customers } = useCustomerSearch(customerSearch);
  const { data: products } = useProductSearch(productSearch);

  // Satır toplamları (KDV dahil)
  const subTotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const discountTotal = items.reduce(
    (sum, i) => sum + i.quantity * i.unitPrice * ((i.discountRate ?? 0) / 100),
    0,
  );
  const vatTotal = items.reduce(
    (sum, i) => {
      const net = i.quantity * i.unitPrice * (1 - (i.discountRate ?? 0) / 100);
      return sum + net * (i.vatRate / 100);
    },
    0,
  );
  const grandTotal = subTotal - discountTotal + vatTotal;

  const addItem = (product: { id: string; name: string }) => {
    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        quantity: 1,
        unitPrice: 0,
        vatRate: 18, // varsayılan KDV
        discountRate: 0,
        description: product.name,
      },
    ]);
    setProductSearch('');
    setShowProductDrop(false);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof CreateSaleItemInput, value: unknown) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item,
      ),
    );
  };

  const onSubmit = () => {
    if (!selectedCustomer) {
      toast.error('Müşteri seçimi zorunludur');
      return;
    }
    if (items.length === 0) {
      toast.error('En az 1 ürün eklenmelidir');
      return;
    }
    const hasInvalid = items.some(
      (i) => i.quantity <= 0 || i.unitPrice < 0 || i.vatRate < 0,
    );
    if (hasInvalid) {
      toast.error('Miktar > 0 ve birim fiyat ≥ 0 olmalıdır');
      return;
    }

    create.mutate(
      {
        customerId: selectedCustomer.id,
        saleDate: new Date(saleDate).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        status,
        items,
        notes: notes || undefined,
      },
      {
        onSuccess: (sale) => {
          toast.success(
            status === 'CONFIRMED'
              ? 'Satış oluşturuldu — stok ve cari hareketleri otomatik oluştu'
              : 'Satış taslak olarak kaydedildi',
          );
          navigate(`/sales/${sale.id}`);
        },
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Satış oluşturulamadı';
          toast.error(msg);
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Yeni Satış"
        description={
          status === 'CONFIRMED'
            ? '⚠️ Onayla butonu ile stok ve cari hareketleri otomatik oluşur — geri alınamaz'
            : 'Satışı taslak olarak kaydedin veya doğrudan onaylayın'
        }
        actions={
          <button onClick={() => navigate('/sales')} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            Satışlara Dön
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sol: Müşteri + Ürünler */}
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
                      onClick={() => { setSelectedCustomer({ id: c.id, name: c.name }); setShowCustomerDrop(false); }}
                      className="px-3 py-2 hover:bg-surface-high rounded-md cursor-pointer text-foreground"
                    >
                      <div className="font-medium">{c.name}</div>
                      {c.taxNumber && <div className="text-xs text-on-surface-variant font-mono">{c.taxNumber}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Ürünler */}
          <div className="card p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Ürünler
            </h3>
            {/* Ürün ekle */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
              <input
                type="search"
                value={productSearch}
                onChange={(e) => { setProductSearch(e.target.value); setShowProductDrop(true); }}
                onFocus={() => setShowProductDrop(true)}
                placeholder="Ürün adı veya barkod ile ara…"
                className="w-full h-10 pl-10 pr-4 rounded-md bg-surface-container text-sm border border-outline-variant focus:border-primary focus:outline-none"
              />
              {showProductDrop && products && products.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-surface-container border border-outline-variant rounded-md shadow-lg max-h-48 overflow-y-auto text-sm">
                  {products.map((p) => (
                    <li
                      key={p.id}
                      onClick={() => addItem({ id: p.id, name: p.name })}
                      className="px-3 py-2 hover:bg-surface-high rounded-md cursor-pointer text-foreground"
                    >
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-on-surface-variant">{p.code ?? p.id}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Kalemler tablosu */}
            {items.length === 0 ? (
              <div className="py-8 text-center text-sm text-on-surface-variant border border-dashed border-outline-variant rounded-md">
                Ürün arayın ve listeden seçin — kalemler buraya eklenir
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-container border-b border-outline-variant">
                    <tr>
                      <th className="text-left px-2 py-2 font-semibold text-foreground">Ürün</th>
                      <th className="text-right px-2 py-2 font-semibold text-foreground w-20">Miktar</th>
                      <th className="text-right px-2 py-2 font-semibold text-foreground w-28">Birim Fiyat</th>
                      <th className="text-right px-2 py-2 font-semibold text-foreground w-16">İsk %</th>
                      <th className="text-right px-2 py-2 font-semibold text-foreground w-16">KDV %</th>
                      <th className="text-right px-2 py-2 font-semibold text-foreground w-28">Toplam (KDV dahil)</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-b border-outline-variant last:border-0">
                        <td className="px-2 py-2 text-xs">{item.description ?? item.productId}</td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={0.01}
                            step={0.01}
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                            className="w-full h-8 px-2 text-right rounded bg-surface-container text-sm border border-outline-variant focus:border-primary focus:outline-none font-mono"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.unitPrice}
                            onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                            className="w-full h-8 px-2 text-right rounded bg-surface-container text-sm border border-outline-variant focus:border-primary focus:outline-none font-mono"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={0} max={100} step={0.5}
                            value={item.discountRate ?? 0}
                            onChange={(e) => updateItem(idx, 'discountRate', Number(e.target.value))}
                            className="w-full h-8 px-2 text-right rounded bg-surface-container text-sm border border-outline-variant focus:border-primary focus:outline-none font-mono"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={item.vatRate}
                            onChange={(e) => updateItem(idx, 'vatRate', Number(e.target.value))}
                            className="w-full h-8 px-1 text-right rounded bg-surface-container text-sm border border-outline-variant"
                          >
                            <option value={0}>0%</option>
                            <option value={1}>1%</option>
                            <option value={8}>8%</option>
                            <option value={10}>10%</option>
                            <option value={18}>18%</option>
                            <option value={20}>20%</option>
                          </select>
                        </td>
                        <td className="px-2 py-2 text-right font-mono font-semibold text-foreground">
                          {(() => {
                            const net = item.quantity * item.unitPrice * (1 - (item.discountRate ?? 0) / 100);
                            const vat = net * (item.vatRate / 100);
                            return formatCurrency(net + vat);
                          })()}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button onClick={() => removeItem(idx)} className="text-on-surface-variant hover:text-error">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sağ: Özet + Tarih + Onay */}
        <div className="flex flex-col gap-4">
          {/* Tarihler */}
          <div className="card p-4">
            <h3 className="font-semibold text-foreground mb-3">Tarih ve Durum</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Satış Tarihi</label>
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-surface-container text-sm border border-outline-variant focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Vade Tarihi (opsiyonel)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-surface-container text-sm border border-outline-variant focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Durum</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SaleStatus)}
                  className="w-full h-10 px-3 rounded-md bg-surface-container text-sm border border-outline-variant focus:border-primary focus:outline-none"
                >
                  <option value="DRAFT">Taslak</option>
                  <option value="CONFIRMED">Onayla (stok + cari hareketi otomatik oluşur)</option>
                </select>
                {status === 'CONFIRMED' && (
                  <p className="text-xs text-error mt-1">⚠️ Onay sonrası geri alınamaz!</p>
                )}
              </div>
            </div>
          </div>

          {/* Notlar */}
          <div className="card p-4">
            <h3 className="font-semibold text-foreground mb-3">Notlar</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Satış notu veya açıklama…"
              rows={3}
              className="w-full px-3 py-2 rounded-md bg-surface-container text-sm border border-outline-variant focus:border-primary focus:outline-none resize-none"
            />
          </div>

          {/* Tutar özeti */}
          <div className="card p-4">
            <h3 className="font-semibold text-foreground mb-3">Tutar Özeti</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Ara Toplam</span>
                <span className="font-mono font-medium text-foreground">{formatCurrency(subTotal)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">İskonto</span>
                  <span className="font-mono text-tertiary">−{formatCurrency(discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-on-surface-variant">KDV</span>
                <span className="font-mono font-medium text-foreground">{formatCurrency(vatTotal)}</span>
              </div>
              <div className="flex justify-between border-t border-outline-variant pt-2 mt-1">
                <span className="font-semibold text-foreground">Genel Toplam</span>
                <span className="font-mono font-bold text-primary text-lg">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Kaydet butonu */}
          <div className="card p-4 flex flex-col gap-2">
            <button
              onClick={onSubmit}
              disabled={create.isPending}
              className={`w-full font-semibold py-3 rounded-md transition-colors ${
                status === 'CONFIRMED'
                  ? 'bg-primary text-on-primary hover:bg-primary-hover'
                  : 'bg-secondary-container text-secondary hover:bg-secondary-container-hover'
              } disabled:opacity-50`}
            >
              {create.isPending ? 'Kaydediliyor…' : status === 'CONFIRMED' ? '✓ Onayla & Kaydet' : 'Taslak Olarak Kaydet'}
            </button>
            <button onClick={() => navigate('/sales')} className="w-full py-2.5 text-sm text-on-surface-variant hover:text-foreground">
              İptal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
