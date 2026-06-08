import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Package, Search, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  useCreateSale,
  useCustomerSearch,
  useProductSearch,
  useSale,
  useUpdateSale,
  type CreateSaleItemInput,
} from '@/features/sales/api';
import { useWarehouses } from '@/features/warehouses/api';
import { ErrorState } from '@/components/data/ErrorState';
import { LoadingState } from '@/components/data/LoadingState';
import { formatCurrency } from '@saas/shared';
import type { SaleStatus } from '@saas/shared';
import toast from 'react-hot-toast';

export function SaleNewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);
  const [showProductDrop, setShowProductDrop] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null);
  const [items, setItems] = useState<CreateSaleItemInput[]>([]);
  const [notes, setNotes] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [warehouseId, setWarehouseId] = useState('');

  const create = useCreateSale();
  const update = useUpdateSale();
  const { data: sale, isLoading, isError, error, refetch } = useSale(id);
  const { data: customers = [], isFetching: isCustomersFetching } = useCustomerSearch(customerSearch);
  const { data: products = [], isFetching: isProductsFetching } = useProductSearch(productSearch);
  const { data: warehouseResponse } = useWarehouses({ status: 'ACTIVE' } as any);
  const warehouses = warehouseResponse?.data ?? [];

  useEffect(() => {
    if (!sale) return;
    setSelectedCustomer({ id: sale.customerId, name: sale.customerName });
    setItems(
      sale.items.map((item) => ({
        productId: item.productId,
        unitId: item.unitId ?? undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        discountRate: item.discountRate,
        description: item.description ?? undefined,
      })),
    );
    setNotes(sale.notes ?? '');
    setSaleDate(sale.saleDate.slice(0, 10));
    setDueDate(sale.dueDate ? sale.dueDate.slice(0, 10) : '');
    setWarehouseId(sale.warehouseId ?? '');
  }, [sale]);

  const pending = create.isPending || update.isPending;
  const subTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice * ((item.discountRate ?? 0) / 100), 0);
  const vatTotal = items.reduce((sum, item) => {
    const net = item.quantity * item.unitPrice * (1 - (item.discountRate ?? 0) / 100);
    return sum + net * (item.vatRate / 100);
  }, 0);
  const grandTotal = subTotal - discountTotal + vatTotal;

  const addItem = (product: { id: string; name: string }) => {
    setItems((prev) => [
      ...prev,
      { productId: product.id, quantity: 1, unitPrice: 0, vatRate: 20, discountRate: 0, description: product.name },
    ]);
    setProductSearch('');
    setShowProductDrop(false);
  };

  const updateItem = (index: number, field: keyof CreateSaleItemInput, value: unknown) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const submit = (status: SaleStatus) => {
    if (!selectedCustomer) {
      toast.error('Müşteri seçimi zorunludur');
      return;
    }
    if (items.length === 0) {
      toast.error('En az 1 ürün eklenmelidir');
      return;
    }
    if (status === 'CONFIRMED' && !warehouseId) {
      toast.error('Normal satış için depo seçimi zorunludur');
      return;
    }

    const payload = {
      customerId: selectedCustomer.id,
      saleDate: new Date(saleDate).toISOString(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      warehouseId: warehouseId || undefined,
      status,
      items,
      notes: notes || undefined,
    };

    if (isEdit && id) {
      update.mutate(
        { id, input: payload },
        {
          onSuccess: () => {
            toast.success('Satış güncellendi');
            navigate(`/sales/${id}`);
          },
          onError: (err: unknown) => {
            toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Satış güncellenemedi');
          },
        },
      );
      return;
    }

    create.mutate(payload, {
      onSuccess: (created) => {
        toast.success(status === 'CONFIRMED' ? 'Normal satış kaydedildi' : 'Satış taslak olarak kaydedildi');
        navigate(`/sales/${created.id}`);
      },
      onError: (err: unknown) => {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Satış oluşturulamadı');
      },
    });
  };

  if (isEdit && isLoading) return <LoadingState label="Satış yükleniyor..." />;
  if (isEdit && isError) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={isEdit ? 'Satışı Düzenle' : 'Yeni Satış'}
        description="Satışı taslak olarak kaydedin veya depo seçip normal satış olarak onaylayın"
        actions={
          <button onClick={() => navigate(isEdit && id ? `/sales/${id}` : '/sales')} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            {isEdit ? 'Satış Detayına Dön' : 'Satışlara Dön'}
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
                className="w-full h-10 rounded-md border border-outline-variant bg-surface-container px-4 text-sm focus:border-primary focus:outline-none"
                readOnly={!!selectedCustomer}
              />
              {selectedCustomer && (
                <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant hover:text-error">
                  Temizle
                </button>
              )}
              {showCustomerDrop && !selectedCustomer && (
                <ul className="mt-2 max-h-48 overflow-y-auto rounded-md border border-outline-variant bg-surface-container text-sm shadow-lg">
                  {isCustomersFetching ? (
                    <li className="px-3 py-2 text-on-surface-variant">Müşteriler yükleniyor...</li>
                  ) : customers.length > 0 ? (
                    customers.map((customer) => (
                      <li key={customer.id} onClick={() => { setSelectedCustomer({ id: customer.id, name: customer.name }); setShowCustomerDrop(false); }} className="cursor-pointer rounded-md px-3 py-2 text-foreground hover:bg-surface-high">
                        <div className="font-medium">{customer.name}</div>
                        {customer.taxNumber && <div className="font-mono text-xs text-on-surface-variant">{customer.taxNumber}</div>}
                      </li>
                    ))
                  ) : (
                    <li className="px-3 py-2 text-on-surface-variant">Aramaya uygun müşteri bulunamadı</li>
                  )}
                </ul>
              )}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
              <Package className="h-4 w-4" />
              Ürünler
            </h3>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="search"
                value={productSearch}
                onChange={(e) => { setProductSearch(e.target.value); setShowProductDrop(true); }}
                onFocus={() => setShowProductDrop(true)}
                placeholder="Ürün adı veya barkod ile ara..."
                className="w-full h-10 rounded-md border border-outline-variant bg-surface-container pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
              />
              {showProductDrop && (
                <ul className="mt-2 max-h-48 overflow-y-auto rounded-md border border-outline-variant bg-surface-container text-sm shadow-lg">
                  {isProductsFetching ? (
                    <li className="px-3 py-2 text-on-surface-variant">Ürünler yükleniyor...</li>
                  ) : products.length > 0 ? (
                    products.map((product) => (
                      <li key={product.id} onClick={() => addItem({ id: product.id, name: product.name })} className="cursor-pointer rounded-md px-3 py-2 text-foreground hover:bg-surface-high">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-on-surface-variant">{product.code ?? product.id}</div>
                      </li>
                    ))
                  ) : (
                    <li className="px-3 py-2 text-on-surface-variant">Aramaya uygun ürün bulunamadı</li>
                  )}
                </ul>
              )}
            </div>

            {items.length === 0 ? (
              <div className="rounded-md border border-dashed border-outline-variant py-8 text-center text-sm text-on-surface-variant">Ürün arayın ve listeden seçin</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-outline-variant bg-surface-container">
                    <tr>
                      <th className="px-2 py-2 text-left font-semibold text-foreground">Ürün</th>
                      <th className="w-20 px-2 py-2 text-right font-semibold text-foreground">Miktar</th>
                      <th className="w-28 px-2 py-2 text-right font-semibold text-foreground">Birim Fiyat</th>
                      <th className="w-16 px-2 py-2 text-right font-semibold text-foreground">İsk %</th>
                      <th className="w-16 px-2 py-2 text-right font-semibold text-foreground">KDV %</th>
                      <th className="w-28 px-2 py-2 text-right font-semibold text-foreground">Toplam</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const net = item.quantity * item.unitPrice * (1 - (item.discountRate ?? 0) / 100);
                      const vat = net * (item.vatRate / 100);
                      return (
                        <tr key={index} className="border-b border-outline-variant last:border-0">
                          <td className="px-2 py-2 text-xs">{item.description ?? item.productId}</td>
                          <td className="px-2 py-2"><input type="number" min={0.01} step={0.01} value={item.quantity} onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))} className="h-8 w-full rounded border border-outline-variant bg-surface-container px-2 text-right font-mono text-sm focus:border-primary focus:outline-none" /></td>
                          <td className="px-2 py-2"><input type="number" min={0} step={0.01} value={item.unitPrice} onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))} className="h-8 w-full rounded border border-outline-variant bg-surface-container px-2 text-right font-mono text-sm focus:border-primary focus:outline-none" /></td>
                          <td className="px-2 py-2"><input type="number" min={0} max={100} step={0.5} value={item.discountRate ?? 0} onChange={(e) => updateItem(index, 'discountRate', Number(e.target.value))} className="h-8 w-full rounded border border-outline-variant bg-surface-container px-2 text-right font-mono text-sm focus:border-primary focus:outline-none" /></td>
                          <td className="px-2 py-2"><input type="number" min={0} max={100} step={0.01} value={item.vatRate} onChange={(e) => updateItem(index, 'vatRate', Number(e.target.value))} className="h-8 w-full rounded border border-outline-variant bg-surface-container px-2 text-right font-mono text-sm focus:border-primary focus:outline-none" /></td>
                          <td className="px-2 py-2 text-right font-mono font-semibold text-foreground">{formatCurrency(net + vat)}</td>
                          <td className="px-2 py-2 text-center"><button onClick={() => removeItem(index)} className="text-on-surface-variant hover:text-error"><Trash2 className="h-3.5 w-3.5" /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <h3 className="mb-3 font-semibold text-foreground">Tarih ve Depo</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs text-on-surface-variant">Satış Tarihi</label>
                <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} className="h-10 w-full rounded-md border border-outline-variant bg-surface-container px-3 text-sm focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-on-surface-variant">Vade Tarihi</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-10 w-full rounded-md border border-outline-variant bg-surface-container px-3 text-sm focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-on-surface-variant">Depo</label>
                <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="h-10 w-full rounded-md border border-outline-variant bg-surface-container px-3 text-sm focus:border-primary focus:outline-none">
                  <option value="">Depo seçin</option>
                  {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} - {warehouse.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="mb-3 font-semibold text-foreground">Notlar</h3>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full resize-none rounded-md border border-outline-variant bg-surface-container px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          </div>

          <div className="card p-4">
            <h3 className="mb-3 font-semibold text-foreground">Tutar Özeti</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant">Ara Toplam</span><span className="font-mono font-medium text-foreground">{formatCurrency(subTotal)}</span></div>
              {discountTotal > 0 && <div className="flex justify-between"><span className="text-on-surface-variant">İskonto</span><span className="font-mono text-tertiary">-{formatCurrency(discountTotal)}</span></div>}
              <div className="flex justify-between"><span className="text-on-surface-variant">KDV</span><span className="font-mono font-medium text-foreground">{formatCurrency(vatTotal)}</span></div>
              <div className="mt-1 flex justify-between border-t border-outline-variant pt-2"><span className="font-semibold text-foreground">Genel Toplam</span><span className="font-mono text-lg font-bold text-primary">{formatCurrency(grandTotal)}</span></div>
            </div>
          </div>

          <div className="card flex flex-col gap-2 p-4">
            <button onClick={() => submit('DRAFT')} disabled={pending} className="w-full rounded-md bg-secondary-container py-3 font-semibold text-secondary transition-colors hover:bg-secondary-container-hover disabled:opacity-50">
              {pending ? 'Kaydediliyor...' : isEdit ? 'Taslak Olarak Güncelle' : 'Taslak Olarak Kaydet'}
            </button>
            {!isEdit && (
              <button onClick={() => submit('CONFIRMED')} disabled={pending} className="w-full rounded-md bg-primary py-3 font-semibold text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-50">
                {pending ? 'Kaydediliyor...' : 'Normal Satış Olarak Kaydet'}
              </button>
            )}
            <button onClick={() => navigate(isEdit && id ? `/sales/${id}` : '/sales')} className="w-full py-2.5 text-sm text-on-surface-variant hover:text-foreground">
              İptal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
