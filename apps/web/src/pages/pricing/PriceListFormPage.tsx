import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ListTree, Save, ArrowLeft, Plus, Trash2, Upload, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { usePriceList, useCreatePriceList, useUpdatePriceList } from '@/features/pricing/api';
import { formatCurrency, type PriceListStatus } from '@saas/shared';

export function PriceListFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const { data: existing, isLoading } = usePriceList(id ?? '');
  const createMut = useCreatePriceList();
  const updateMut = useUpdatePriceList(id ?? '');

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('TRY');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [status, setStatus] = useState<PriceListStatus>('DRAFT');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<Array<{ productCode: string; productName: string; newPrice: number; vatRate: number; _key: string }>>([]);

  useEffect(() => {
    if (existing && isEdit) {
      setCode(existing.code); setName(existing.name); setCurrency(existing.currency);
      setValidFrom(existing.validFrom?.slice(0, 10) ?? ''); setValidTo(existing.validTo?.slice(0, 10) ?? '');
      setStatus(existing.status); setDescription(existing.description ?? '');
    }
  }, [existing, isEdit]);

  if (isLoading && isEdit) return <LoadingState />;

  const addItem = () => setItems([...items, { productCode: '', productName: '', newPrice: 0, vatRate: 20, _key: `tmp-${Date.now()}` }]);
  const updateItem = (k: string, patch: any) => setItems(items.map((i) => i._key === k ? { ...i, ...patch } : i));
  const removeItem = (k: string) => setItems(items.filter((i) => i._key !== k));

  const total = items.reduce((s, i) => s + (i.newPrice * (1 + i.vatRate / 100)), 0);

  const submit = async () => {
    const payload = {
      code, name, currency,
      validFrom: validFrom || undefined, validTo: validTo || undefined,
      status, description: description || undefined,
    };
    if (isEdit) await updateMut.mutateAsync(payload);
    else await createMut.mutateAsync(payload);
    navigate('/pricing/price-lists');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={isEdit ? 'Fiyat Listesi Düzenle' : 'Yeni Fiyat Listesi'}
        description="Ürün bazlı fiyat tanımları"
        actions={<button onClick={() => navigate('/pricing/price-lists')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" /> Geri</button>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-lg border border-outline-variant bg-surface p-4 space-y-3">
          <h3 className="text-sm font-semibold">Liste Bilgileri</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-medium">Kod *</label><input value={code} onChange={(e) => setCode(e.target.value)} disabled={isEdit} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono disabled:opacity-50" /></div>
            <div><label className="mb-1 block text-xs font-medium">Ad *</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Para Birimi</label><select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm"><option>TRY</option><option>USD</option><option>EUR</option><option>GBP</option></select></div>
            <div><label className="mb-1 block text-xs font-medium">Durum</label><select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm"><option value="DRAFT">Taslak</option><option value="ACTIVE">Aktif</option><option value="PASSIVE">Pasif</option></select></div>
            <div><label className="mb-1 block text-xs font-medium">Geçerlilik Başlangıç</label><input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Geçerlilik Bitiş</label><input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
          </div>
          <div><label className="mb-1 block text-xs font-medium">Açıklama</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface p-4">
          <h3 className="mb-2 text-sm font-semibold">Özet</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>Kalem</dt><dd className="font-medium">{items.length}</dd></div>
            <div className="flex justify-between"><dt>Toplam</dt><dd className="font-semibold">{formatCurrency(total, currency)}</dd></div>
          </dl>
        </div>
      </div>

      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Ürün Fiyatları</h3>
          <div className="flex gap-2">
            <button onClick={addItem} className="flex items-center gap-2 rounded-md border border-primary bg-surface px-3 py-1.5 text-xs font-medium text-primary"><Plus className="h-3 w-3" /> Ürün Ekle</button>
            <button className="flex items-center gap-2 rounded-md border border-outline px-3 py-1.5 text-xs"><Upload className="h-3 w-3" /> Excel'den</button>
          </div>
        </div>
        {items.length === 0 ? <p className="py-4 text-center text-sm text-on-surface-variant">Henüz kalem eklenmedi</p> : (
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it._key} className="grid grid-cols-12 gap-2 rounded-md border border-outline-variant p-2">
                <div className="col-span-3"><label className="text-[10px]">Ürün Kodu</label><input value={it.productCode} onChange={(e) => updateItem(it._key, { productCode: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm font-mono" /></div>
                <div className="col-span-4"><label className="text-[10px]">Ürün Adı</label><input value={it.productName} onChange={(e) => updateItem(it._key, { productName: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" /></div>
                <div className="col-span-2"><label className="text-[10px]">Fiyat</label><input type="number" step="0.01" min="0" value={it.newPrice} onChange={(e) => updateItem(it._key, { newPrice: Number(e.target.value) })} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" /></div>
                <div className="col-span-2"><label className="text-[10px]">KDV %</label><input type="number" step="0.01" min="0" max="100" value={it.vatRate} onChange={(e) => updateItem(it._key, { vatRate: Number(e.target.value) })} className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm" /></div>
                <div className="col-span-1 flex items-end"><button onClick={() => removeItem(it._key)} className="rounded-md p-1.5 text-red-600"><X className="h-4 w-4" /></button></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={() => navigate('/pricing/price-lists')} className="rounded-md border border-outline px-4 py-2 text-sm">İptal</button>
        <button onClick={submit} disabled={!code || !name || createMut.isPending || updateMut.isPending} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-40"><Save className="h-4 w-4" /> {isEdit ? 'Güncelle' : 'Kaydet'}</button>
      </div>
    </div>
  );
}
