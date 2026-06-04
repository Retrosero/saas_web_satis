import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCreateQuote } from '@/features/quotes/api';
import { useCustomers } from '@/features/customers/api';
import { useProducts } from '@/features/products/api';

export function QuoteFormPage() {
  const navigate = useNavigate();
  const createMut = useCreateQuote();
  const { data: customersData } = useCustomers({ pageSize: 200 } as any);
  const { data: productsData } = useProducts({ pageSize: 200 } as any);
  const [customerId, setCustomerId] = useState('');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const addItem = () => setItems([...items, { productId: '', productCode: '', productName: '', quantity: 1, unitPrice: 0, vatRate: 20, discountRate: 0 }]);
  const updateItem = (i: number, field: string, val: any) => { const next = [...items]; (next[i] as any)[field] = val; setItems(next); };
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const onProductChange = (i: number, productId: string) => {
    const product = ((productsData as any)?.items ?? []).find((p: any) => p.id === productId);
    if (product) {
      updateItem(i, 'productId', productId);
      updateItem(i, 'productCode', product.code);
      updateItem(i, 'productName', product.name);
      updateItem(i, 'unitPrice', Number(product.unitPrice ?? 0));
      updateItem(i, 'vatRate', Number(product.vatRate ?? 20));
    }
  };

  const subTotal = items.reduce((s, it) => s + (Number(it.quantity) * Number(it.unitPrice) * (1 - (Number(it.discountRate) || 0) / 100)), 0);
  const vatTotal = items.reduce((s, it) => s + (Number(it.quantity) * Number(it.unitPrice) * (1 - (Number(it.discountRate) || 0) / 100) * (Number(it.vatRate) / 100)), 0);
  const grandTotal = subTotal + vatTotal;

  const onSubmit = async () => {
    if (!customerId) return;
    setSaving(true);
    try {
      const created = await createMut.mutateAsync({ customerId, quoteDate, validUntil, notes, items: items.filter((it) => it.productId) });
      navigate(`/quotes/${created.id}`);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Yeni Teklif" description="Müşteriye gönderilecek teklif oluştur" actions={<button onClick={() => navigate('/quotes')} className="flex items-center gap-1 rounded-md border border-outline px-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" /> Geri</button>} />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-outline bg-surface p-3">
          <label className="text-xs text-on-surface-variant">Müşteri *</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="mt-1 w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm">
            <option value="">— Seçiniz —</option>
            {((customersData as any)?.items ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
          </select>
        </div>
        <div className="rounded-md border border-outline bg-surface p-3"><label className="text-xs text-on-surface-variant">Teklif Tarihi</label><input type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} className="mt-1 w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" /></div>
        <div className="rounded-md border border-outline bg-surface p-3"><label className="text-xs text-on-surface-variant">Geçerlilik</label><input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="mt-1 w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" /></div>
      </div>

      <div className="rounded-lg border border-outline bg-surface">
        <div className="flex items-center justify-between border-b border-outline-variant p-3">
          <h3 className="font-semibold">Satırlar</h3>
          <button onClick={addItem} className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm text-on-primary"><Plus className="h-3 w-3" /> Satır Ekle</button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-surface-variant text-xs uppercase"><tr><th className="px-3 py-2 text-left">Ürün</th><th className="w-20 px-2 py-2 text-right">Miktar</th><th className="w-28 px-2 py-2 text-right">Birim Fiyat</th><th className="w-16 px-2 py-2 text-right">İsk %</th><th className="w-16 px-2 py-2 text-right">KDV %</th><th className="w-32 px-2 py-2 text-right">Toplam</th><th className="w-8"></th></tr></thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-t border-outline-variant">
                <td className="px-3 py-1"><select value={it.productId} onChange={(e) => onProductChange(i, e.target.value)} className="w-full rounded border border-outline bg-surface px-2 py-1 text-sm"><option value="">— Ürün —</option>{((productsData as any)?.items ?? []).map((p: any) => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}</select></td>
                <td className="px-2 py-1"><input type="number" value={it.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} className="w-full rounded border border-outline bg-surface px-1 py-1 text-right" /></td>
                <td className="px-2 py-1"><input type="number" value={it.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value))} className="w-full rounded border border-outline bg-surface px-1 py-1 text-right" /></td>
                <td className="px-2 py-1"><input type="number" value={it.discountRate} onChange={(e) => updateItem(i, 'discountRate', Number(e.target.value))} className="w-full rounded border border-outline bg-surface px-1 py-1 text-right" /></td>
                <td className="px-2 py-1"><input type="number" value={it.vatRate} onChange={(e) => updateItem(i, 'vatRate', Number(e.target.value))} className="w-full rounded border border-outline bg-surface px-1 py-1 text-right" /></td>
                <td className="px-2 py-1 text-right font-semibold">{(Number(it.quantity) * Number(it.unitPrice) * (1 - Number(it.discountRate) / 100) * (1 + Number(it.vatRate) / 100)).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</td>
                <td className="px-1 py-1"><button onClick={() => removeItem(i)} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-3 w-3" /></button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-sm text-on-surface-variant">Satır eklemek için "Satır Ekle" butonunu kullanın</td></tr>}
          </tbody>
          <tfoot>
            <tr className="border-t border-outline-variant bg-surface-variant"><td colSpan={5} className="px-3 py-2 text-right text-sm">Ara Toplam:</td><td className="px-2 py-2 text-right text-sm">{subTotal.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</td><td></td></tr>
            <tr><td colSpan={5} className="px-3 py-2 text-right text-sm">KDV:</td><td className="px-2 py-2 text-right text-sm">{vatTotal.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</td><td></td></tr>
            <tr className="bg-blue-50"><td colSpan={5} className="px-3 py-2 text-right font-bold">Genel Toplam:</td><td className="px-2 py-2 text-right text-lg font-bold">{grandTotal.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</td><td></td></tr>
          </tfoot>
        </table>
      </div>

      <div className="rounded-lg border border-outline bg-surface p-3">
        <label className="text-xs text-on-surface-variant">Notlar</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" />
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={() => navigate('/quotes')} className="rounded-md border border-outline px-4 py-2 text-sm">İptal</button>
        <button onClick={onSubmit} disabled={saving || !customerId || items.length === 0} className="flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? 'Kaydediliyor...' : 'Oluştur'}</button>
      </div>
    </div>
  );
}
