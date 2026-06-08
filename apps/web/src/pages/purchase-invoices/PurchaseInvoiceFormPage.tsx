import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Package, Search, Trash2, Warehouse } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  useCreatePurchaseInvoice,
  usePurchaseInvoice,
  useSupplierSearch,
  useProductSearch,
  type CreatePurchaseInvoiceItemInput,
} from '@/features/purchase-invoices/api';
import { useWarehouses } from '@/features/warehouses/api';
import { ErrorState } from '@/components/data/ErrorState';
import { LoadingState } from '@/components/data/LoadingState';
import { formatCurrency } from '@saas/shared';
import type { PurchaseInvoiceStatus } from '@saas/shared';
import toast from 'react-hot-toast';

export function PurchaseInvoiceFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [supplierSearch, setSupplierSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showSupplierDrop, setShowSupplierDrop] = useState(false);
  const [showProductDrop, setShowProductDrop] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<{ id: string; name: string } | null>(null);
  const [items, setItems] = useState<CreatePurchaseInvoiceItemInput[]>([]);
  const [notes, setNotes] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [warehouseId, setWarehouseId] = useState('');

  const create = useCreatePurchaseInvoice();
  const { data: invoice, isLoading, isError, error, refetch } = usePurchaseInvoice(id);
  const { data: suppliers = [], isFetching: isSuppliersFetching } = useSupplierSearch(supplierSearch);
  const { data: products = [], isFetching: isProductsFetching } = useProductSearch(productSearch);
  const { data: warehouseResponse } = useWarehouses({ status: 'ACTIVE' } as never);
  const warehouses = warehouseResponse?.data ?? [];

  useEffect(() => {
    if (!invoice) return;
    setSelectedSupplier({ id: invoice.supplierId, name: invoice.supplierName });
    setItems(
      invoice.items.map((item) => ({
        productId: item.productId,
        unitId: item.unitId ?? undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        discountRate: item.discountRate,
        description: item.description ?? undefined,
      })),
    );
    setNotes(invoice.notes ?? '');
    setInvoiceDate(invoice.invoiceDate.slice(0, 10));
    setDueDate(invoice.dueDate ? invoice.dueDate.slice(0, 10) : '');
    setWarehouseId(invoice.warehouseId);
  }, [invoice]);

  const pending = create.isPending;
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

  const updateItem = (index: number, field: keyof CreatePurchaseInvoiceItemInput, value: unknown) => {
    setItems((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const submit = (status: PurchaseInvoiceStatus) => {
    if (!selectedSupplier) {
      toast.error('Tedarikçi seçimi zorunludur');
      return;
    }
    if (items.length === 0) {
      toast.error('En az 1 ürün eklenmelidir');
      return;
    }
    if (!warehouseId) {
      toast.error('Depo seçimi zorunludur');
      return;
    }
    const invalidItem = items.find(
      (item) =>
        !item.productId ||
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0 ||
        !Number.isFinite(item.unitPrice) ||
        item.unitPrice <= 0 ||
        !Number.isFinite(item.vatRate) ||
        item.vatRate < 0,
    );
    if (invalidItem) {
      toast.error('Tüm satırlarda miktar, birim fiyat ve KDV bilgileri geçerli olmalıdır');
      return;
    }

    const payload = {
      supplierId: selectedSupplier.id,
      invoiceDate: new Date(invoiceDate).toISOString(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      warehouseId,
      status,
      items,
      notes: notes || undefined,
    };

    create.mutate(payload, {
      onSuccess: (created) => {
        toast.success(status === 'CONFIRMED' ? 'Alış faturası kaydedildi ve onaylandı' : 'Fatura taslak olarak kaydedildi');
        navigate(`/purchase-invoices/${created.id}`);
      },
      onError: (err: unknown) => {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Fatura oluşturulamadı');
      },
    });
  };

  if (isEdit && isLoading) return <LoadingState label="Fatura yükleniyor..." />;
  if (isEdit && isError) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={isEdit ? 'Alış Faturasını Düzenle' : 'Yeni Alış Faturası'}
        description="Tedarikçilerden yapılan alımlar için fatura oluşturun"
        actions={
          <button onClick={() => navigate(isEdit && id ? `/purchase-invoices/${id}` : '/purchase-invoices')} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            Geri Dön
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border border-outline-variant bg-surface p-4">
            <h3 className="mb-4 text-sm font-medium">Tedarikçi</h3>
            <div className="relative">
              <label className="block text-sm font-medium">Tedarikçi Ara</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  placeholder="Tedarikçi adı veya vergi no..."
                  value={supplierSearch}
                  onChange={(event) => {
                    setSupplierSearch(event.target.value);
                    setShowSupplierDrop(true);
                  }}
                  onFocus={() => setShowSupplierDrop(true)}
                  disabled={isEdit}
                  className="w-full h-10 rounded-md border border-outline-variant bg-surface pl-10 pr-3 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
                />
              </div>
              {showSupplierDrop && !isEdit && supplierSearch && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-outline-variant bg-surface shadow-lg">
                  {isSuppliersFetching ? (
                    <div className="p-3 text-center text-sm text-on-surface-variant">Yükleniyor...</div>
                  ) : suppliers.length === 0 ? (
                    <div className="p-3 text-center text-sm text-on-surface-variant">Tedarikçi bulunamadı</div>
                  ) : (
                    suppliers.map((supplier) => (
                      <button
                        key={supplier.id}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-surface-container"
                        onClick={() => {
                          setSelectedSupplier({ id: supplier.id, name: supplier.name });
                          setSupplierSearch(supplier.name);
                          setShowSupplierDrop(false);
                        }}
                      >
                        <div className="font-medium">{supplier.name}</div>
                        {supplier.taxNumber && <div className="text-xs text-on-surface-variant">VKN: {supplier.taxNumber}</div>}
                      </button>
                    ))
                  )}
                </div>
              )}
              {selectedSupplier && !isEdit && (
                <div className="mt-2 flex items-center gap-2 rounded-md bg-secondary-container p-2 text-sm text-secondary">
                  <Building2 className="h-4 w-4" />
                  <span>{selectedSupplier.name}</span>
                  <button
                    onClick={() => {
                      setSelectedSupplier(null);
                      setSupplierSearch('');
                    }}
                    className="ml-auto hover:opacity-80"
                  >
                    Temizle
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-outline-variant bg-surface p-4">
            <h3 className="mb-4 text-sm font-medium">Ürün Kalemleri</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium">Ürün Ara</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  placeholder="Ürün kodu, adı veya barkod..."
                  value={productSearch}
                  onChange={(event) => {
                    setProductSearch(event.target.value);
                    setShowProductDrop(true);
                  }}
                  onFocus={() => setShowProductDrop(true)}
                  className="w-full h-10 rounded-md border border-outline-variant bg-surface pl-10 pr-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              {showProductDrop && productSearch && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-outline-variant bg-surface shadow-lg">
                  {isProductsFetching ? (
                    <div className="p-3 text-center text-sm text-on-surface-variant">Yükleniyor...</div>
                  ) : products.length === 0 ? (
                    <div className="p-3 text-center text-sm text-on-surface-variant">Ürün bulunamadı</div>
                  ) : (
                    products.map((product) => (
                      <button
                        key={product.id}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-surface-container"
                        onClick={() => addItem({ id: product.id, name: product.name })}
                      >
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-on-surface-variant" />
                          <span className="font-medium">{product.name}</span>
                          <span className="text-xs text-on-surface-variant">({product.code})</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {items.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-on-surface-variant">
                  <div className="col-span-4">Ürün</div>
                  <div className="col-span-2">Miktar</div>
                  <div className="col-span-2">Birim Fiyat</div>
                  <div className="col-span-1">KDV %</div>
                  <div className="col-span-2">Toplam</div>
                  <div className="col-span-1"></div>
                </div>
                {items.map((item, index) => (
                  <div key={`${item.productId}-${index}`} className="grid grid-cols-12 items-center gap-2 rounded-md border border-outline-variant bg-surface-container p-2">
                    <div className="col-span-4 truncate text-sm">{item.description}</div>
                    <input
                      type="number"
                      min={1}
                      className="col-span-2 h-8 rounded-md border border-outline-variant bg-surface px-2 text-sm focus:border-primary focus:outline-none"
                      value={item.quantity}
                      onChange={(event) => updateItem(index, 'quantity', Number(event.target.value))}
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      className="col-span-2 h-8 rounded-md border border-outline-variant bg-surface px-2 text-sm focus:border-primary focus:outline-none"
                      value={item.unitPrice}
                      onChange={(event) => updateItem(index, 'unitPrice', Number(event.target.value))}
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="col-span-1 h-8 rounded-md border border-outline-variant bg-surface px-2 text-sm focus:border-primary focus:outline-none"
                      value={item.vatRate}
                      onChange={(event) => updateItem(index, 'vatRate', Number(event.target.value))}
                    />
                    <div className="col-span-2 text-right text-sm font-medium">
                      {formatCurrency(item.quantity * item.unitPrice * (1 - (item.discountRate ?? 0) / 100) * (1 + item.vatRate / 100))}
                    </div>
                    <button onClick={() => removeItem(index)} className="col-span-1 flex justify-end text-on-surface-variant hover:text-error">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-outline-variant p-8 text-center text-on-surface-variant">
                <Package className="mx-auto mb-2 h-8 w-8" />
                <p>Henüz ürün eklenmedi</p>
                <p className="text-xs">Yukarıdan ürün arayarak ekleyin</p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-outline-variant bg-surface p-4">
            <h3 className="mb-4 text-sm font-medium">Notlar</h3>
            <textarea
              placeholder="Fatura ile ilgili notlar..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="w-full rounded-md border border-outline-variant bg-surface p-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-outline-variant bg-surface p-4">
            <h3 className="mb-4 text-sm font-medium">Tarih Bilgileri</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Fatura Tarihi</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(event) => setInvoiceDate(event.target.value)}
                  className="mt-1 w-full h-10 rounded-md border border-outline-variant bg-surface px-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Vade Tarihi (Opsiyonel)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="mt-1 w-full h-10 rounded-md border border-outline-variant bg-surface px-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-outline-variant bg-surface p-4">
            <h3 className="mb-4 text-sm font-medium">Depo</h3>
            <div className="relative">
              <select
                value={warehouseId}
                onChange={(event) => setWarehouseId(event.target.value)}
                className="w-full h-10 rounded-md border border-outline-variant bg-surface px-3 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">Depo seçin</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}{warehouse.isDefault ? ' (Varsayılan)' : ''}
                  </option>
                ))}
              </select>
              <Warehouse className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            </div>
          </div>

          <div className="rounded-lg border border-outline-variant bg-surface p-4">
            <h3 className="mb-4 text-sm font-medium">Fatura Özeti</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Ara Toplam</span>
                <span>{formatCurrency(subTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">İskonto</span>
                <span className="text-error">-{formatCurrency(discountTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">KDV</span>
                <span>{formatCurrency(vatTotal)}</span>
              </div>
              <div className="flex justify-between border-t border-outline-variant pt-2 font-medium">
                <span>Genel Toplam</span>
                <span className="text-lg">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={() => submit('DRAFT')} disabled={pending}>
              Taslak Olarak Kaydet
            </button>
            <button className="btn-primary flex-1" onClick={() => submit('CONFIRMED')} disabled={pending}>
              Kaydet ve Onayla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
