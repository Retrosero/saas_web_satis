import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Undo2, Save, Send, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { PageGuard } from '@/components/data/PageGuard';
import { useCreateReturn, useUpdateReturn, useReturn, useReturnAction } from '@/features/returns/api';
import { apiClient } from '@/lib/api-client';
import {
  ReturnItemConditionLabel,
  ReturnReasonLabel,
  ReturnSourceLabel,
  type ReturnReason,
  type ReturnSource,
  type ReturnItemCondition,
  type CreateReturnItemInput,
} from '@saas/shared';
import { formatCurrency } from '@saas/shared';

interface Product {
  id: string;
  code: string;
  name: string;
  defaultUnitId?: string | null;
  defaultSalePrice?: number;
  defaultVatRate?: number;
}

interface Customer {
  id: string;
  code: string;
  name: string;
}

export function ReturnFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;

  const { data: existing, isLoading } = useReturn(id ?? '');
  const createMut = useCreateReturn();
  const updateMut = useUpdateReturn(id ?? '');
  const actionMut = useReturnAction(id ?? '');

  const [customerId, setCustomerId] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 10));
  const [source, setSource] = useState<ReturnSource>('DIRECT');
  const [sourceId, setSourceId] = useState('');
  const [reason, setReason] = useState<ReturnReason>('INTACT');
  const [returnToStock, setReturnToStock] = useState(true);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<CreateReturnItemInput & { _key: string }>>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiClient.get<any>('/customers', { params: { pageSize: 200 } }).then((r) => setCustomers(r.data.data ?? []));
    apiClient.get<any>('/products', { params: { pageSize: 200 } }).then((r) => setProducts(r.data.data ?? []));
  }, []);

  useEffect(() => {
    if (existing && isEdit) {
      setCustomerId(existing.customerId);
      setReturnDate(existing.returnDate.slice(0, 10));
      setSource(existing.source);
      setSourceId(existing.sourceId ?? '');
      setReason(existing.reason);
      setReturnToStock(existing.returnToStock);
      setNotes(existing.notes ?? '');
      setItems(existing.items.map((it) => ({ ...it, productId: it.productId, unitId: it.unitId ?? undefined, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice), vatRate: Number(it.vatRate), discountRate: Number(it.discountRate), condition: it.condition, description: it.description ?? undefined, _key: it.id })));
    }
  }, [existing, isEdit]);

  const addItem = () => {
    setItems([...items, {
      _key: `tmp-${Date.now()}-${Math.random()}`,
      productId: '', unitId: undefined, quantity: 1, unitPrice: 0, vatRate: 20, discountRate: 0,
      condition: 'INTACT' as ReturnItemCondition, description: '',
    }]);
  };

  const updateItem = (key: string, patch: Partial<CreateReturnItemInput>) => {
    setItems(items.map((it) => (it._key === key ? { ...it, ...patch } : it)));
  };

  const removeItem = (key: string) => setItems(items.filter((it) => it._key !== key));

  const pickProduct = (key: string, productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    updateItem(key, {
      productId,
      unitId: p.defaultUnitId ?? undefined,
      unitPrice: p.defaultSalePrice ?? 0,
      vatRate: p.defaultVatRate ?? 20,
    });
  };

  // Toplam hesap
  const totals = items.reduce(
    (acc, it) => {
      const gross = it.quantity * it.unitPrice;
      const disc = (gross * (it.discountRate ?? 0)) / 100;
      const net = gross - disc;
      const vat = (net * it.vatRate) / 100;
      acc.subTotal += net;
      acc.vatTotal += vat;
      return acc;
    },
    { subTotal: 0, vatTotal: 0 },
  );
  const grandTotal = totals.subTotal + totals.vatTotal;

  const filteredProducts = products.filter(
    (p) => !search || p.code.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const submit = async (andSubmit: boolean) => {
    const payload = {
      customerId, returnDate, source, sourceId: sourceId || undefined,
      reason, returnToStock, notes: notes || undefined,
      items: items.map((it) => ({
        productId: it.productId, unitId: it.unitId,
        quantity: Number(it.quantity), unitPrice: Number(it.unitPrice),
        vatRate: Number(it.vatRate), discountRate: Number(it.discountRate ?? 0),
        condition: it.condition, description: it.description || undefined,
      })),
    };
    if (isEdit) {
      await updateMut.mutateAsync(payload);
      if (andSubmit) await actionMut.mutateAsync({ action: 'submit' });
    } else {
      const created = await createMut.mutateAsync(payload as any);
      if (andSubmit && created?.id) {
        const m = useReturnAction(created.id);
        await m.mutateAsync({ action: 'submit' });
      }
    }
    navigate('/returns');
  };

  if (isLoading && isEdit) return <LoadingState />;

  return (
    <div>
      <div className="space-y-4">
        <PageHeader
          title={isEdit ? 'İade Düzenle' : 'Yeni İade'}
          description="Müşteriden alınan ürünleri iade olarak kayıt edin"
          actions={
            <button onClick={() => navigate('/returns')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm">
              <ArrowLeft className="h-4 w-4" /> Geri
            </button>
          }
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-outline-variant bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold">İade Bilgileri</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Cari *</label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
                  <option value="">Seçiniz...</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium">İade Tarihi *</label>
                  <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Kaynak</label>
                  <select value={source} onChange={(e) => setSource(e.target.value as ReturnSource)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
                    <option value="DIRECT">{ReturnSourceLabel.DIRECT}</option>
                    <option value="SALE">{ReturnSourceLabel.SALE}</option>
                    <option value="ORDER">{ReturnSourceLabel.ORDER}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">İade Nedeni *</label>
                <select value={reason} onChange={(e) => setReason(e.target.value as ReturnReason)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
                  {Object.entries(ReturnReasonLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={returnToStock} onChange={(e) => setReturnToStock(e.target.checked)} />
                Ürünler depoya geri alınsın
              </label>
              <div>
                <label className="mb-1 block text-xs font-medium">Açıklama</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-outline-variant bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold">Özet</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-on-surface-variant">Kalem Sayısı</dt><dd className="font-medium">{items.length}</dd></div>
              <div className="flex justify-between"><dt className="text-on-surface-variant">Ara Toplam (KDV Hariç)</dt><dd className="font-medium">{formatCurrency(totals.subTotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-on-surface-variant">KDV Toplamı</dt><dd className="font-medium">{formatCurrency(totals.vatTotal)}</dd></div>
              <div className="flex justify-between border-t border-outline-variant pt-2 text-base font-semibold">
                <dt>Genel Toplam</dt><dd>{formatCurrency(grandTotal)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Kalemler */}
        <div className="rounded-lg border border-outline-variant bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">İade Kalemleri</h3>
            <button onClick={addItem} className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-on-primary">
              <Plus className="h-4 w-4" /> Ürün Ekle
            </button>
          </div>

          <div className="mb-3">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ürün ara (kod veya ad)..." className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
          </div>

          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-on-surface-variant">Henüz kalem eklenmedi. Yukarıdaki "Ürün Ekle" butonu ile başlayın.</p>
          ) : (
            <div className="space-y-2">
              {items.map((it) => {
                const p = products.find((x) => x.id === it.productId);
                const lineSub = it.quantity * it.unitPrice * (1 - (it.discountRate ?? 0) / 100);
                const lineVat = lineSub * (it.vatRate / 100);
                return (
                  <div key={it._key} className="grid grid-cols-12 gap-2 rounded-md border border-outline-variant p-2">
                    <div className="col-span-12 md:col-span-3">
                      <label className="mb-1 block text-[10px] font-medium">Ürün</label>
                      <select value={it.productId} onChange={(e) => pickProduct(it._key, e.target.value)} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm">
                        <option value="">Seçiniz...</option>
                        {filteredProducts.map((p) => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-4 md:col-span-1">
                      <label className="mb-1 block text-[10px] font-medium">Miktar</label>
                      <input type="number" step="0.01" min="0" value={it.quantity} onChange={(e) => updateItem(it._key, { quantity: Number(e.target.value) })} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <label className="mb-1 block text-[10px] font-medium">Birim Fiyat</label>
                      <input type="number" step="0.01" min="0" value={it.unitPrice} onChange={(e) => updateItem(it._key, { unitPrice: Number(e.target.value) })} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="mb-1 block text-[10px] font-medium">KDV %</label>
                      <input type="number" step="0.01" min="0" max="100" value={it.vatRate} onChange={(e) => updateItem(it._key, { vatRate: Number(e.target.value) })} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="mb-1 block text-[10px] font-medium">İsk. %</label>
                      <input type="number" step="0.01" min="0" max="100" value={it.discountRate ?? 0} onChange={(e) => updateItem(it._key, { discountRate: Number(e.target.value) })} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" />
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <label className="mb-1 block text-[10px] font-medium">Durum</label>
                      <select value={it.condition} onChange={(e) => updateItem(it._key, { condition: e.target.value as ReturnItemCondition })} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm">
                        {Object.entries(ReturnItemConditionLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div className="col-span-4 md:col-span-1">
                      <label className="mb-1 block text-[10px] font-medium">Toplam</label>
                      <div className="rounded-md bg-surface-variant px-2 py-1.5 text-sm font-semibold">{formatCurrency(lineSub + lineVat)}</div>
                    </div>
                    <div className="col-span-2 md:col-span-1 flex items-end">
                      <button onClick={() => removeItem(it._key)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50" title="Sil">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Aksiyonlar */}
        <div className="flex justify-end gap-2">
          <button onClick={() => navigate('/returns')} className="rounded-md border border-outline px-4 py-2 text-sm">İptal</button>
          <button
            onClick={() => submit(false)}
            disabled={!customerId || items.length === 0 || createMut.isPending || updateMut.isPending}
            className="flex items-center gap-2 rounded-md border border-primary bg-surface px-4 py-2 text-sm font-medium text-primary hover:bg-primary-container disabled:opacity-40"
          >
            <Save className="h-4 w-4" /> Taslak Kaydet
          </button>
          <button
            onClick={() => submit(true)}
            disabled={!customerId || items.length === 0 || createMut.isPending || updateMut.isPending}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary/90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" /> Kaydet ve Onaya Gönder
          </button>
        </div>
      </div>
    </div>
  );
}
