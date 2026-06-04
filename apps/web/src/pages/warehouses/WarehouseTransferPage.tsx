import { useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowLeftRight, Plus, Trash2, Search, Package, Check, Save, Printer, ArrowRight, AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useWarehouses, useCreateTransfer, useConfirmTransfer } from '@/features/warehouses/api';
import { formatCurrency } from '@saas/shared';
import toast from 'react-hot-toast';

interface LineItem {
  productId: string;
  productCode: string;
  productName: string;
  unitName: string;
  quantity: number;
  description: string;
}

export function WarehouseTransferPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const defaultFrom = searchParams.get('from') ?? '';

  const { data: warehouses, isLoading } = useWarehouses();
  const create = useCreateTransfer();
  const confirm = useConfirmTransfer();

  const [fromId, setFromId] = useState(defaultFrom);
  const [toId, setToId] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);

  const fromWh: any = (warehouses?.data ?? []).find((w: any) => w.id === fromId);
  const toWh: any = (warehouses?.data ?? []).find((w: any) => w.id === toId);

  const addItem = (product: { id: string; name: string }) => {
    setItems((prev) => [
      ...prev,
      { productId: product.id, productCode: '', productName: product.name, unitName: '', quantity: 1, description: '' },
    ]);
    setProductSearch('');
  };

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof LineItem, value: unknown) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  };

  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);

  const handleSave = async () => {
    if (!fromId || !toId) {
      toast.error('Çıkış ve giriş deposu seçilmelidir');
      return;
    }
    if (fromId === toId) {
      toast.error('Çıkış ve giriş deposu aynı olamaz');
      return;
    }
    if (items.length === 0) {
      toast.error('En az 1 kalem eklenmelidir');
      return;
    }
    try {
      await create.mutateAsync({
        fromWarehouseId: fromId,
        toWarehouseId: toId,
        transferDate: new Date(transferDate).toISOString(),
        description: description || undefined,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, description: i.description || undefined })),
      });
      toast.success('Transfer oluşturuldu');
      navigate('/warehouses');
    } catch (err: unknown) {
      const msg = ((err as any)?.response?.data?.message as string) || 'Transfer başarısız';
      toast.error(msg);
    }
  };

  if (isLoading) return <LoadingState label="Depolar yükleniyor…" />;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Depolar Arası Transfer"
        description="Stok bir depodan diğerine taşıma — atomik OUT + IN"
        actions={
          <button onClick={() => navigate('/warehouses')} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            Depolar
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-4">
          {/* Depo seçimi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Çıkış Deposu *</label>
              <select
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
              >
                <option value="">— Seçin —</option>
                {(warehouses?.data ?? []).map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} — {w.name}
                  </option>
                ))}
              </select>
              {fromWh && (
                <p className="text-xs text-on-surface-variant mt-1">
                  Mevcut: <strong>{(fromWh.totalStock ?? 0).toLocaleString('tr-TR')}</strong> adet stok
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Giriş Deposu *</label>
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
              >
                <option value="">— Seçin —</option>
                {(warehouses?.data ?? []).filter((w) => w.id !== fromId).map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} — {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tarih ve açıklama */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Transfer Tarihi *</label>
              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Açıklama</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Transfer sebebi / referans no…"
                className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Ürün arama */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-foreground mb-1">Ürün Ekle</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
              <input
                type="search"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Ürün kodu, adı veya barkod ile ara…"
                className="w-full h-10 pl-10 pr-4 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
              />
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Not: Gerçek uygulamada bu alan barkod okuyucu ile entegre olur (ürün barkod okutunca kalem eklenir).
            </p>
          </div>

          {/* Transfer kalemleri */}
          {items.length > 0 && (
            <div className="mt-4 border border-outline-variant rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-container border-b border-outline-variant">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-foreground">Ürün</th>
                    <th className="text-right px-3 py-2 font-semibold text-foreground w-24">Miktar</th>
                    <th className="text-right px-3 py-2 font-semibold text-foreground w-16">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-outline-variant last:border-0">
                      <td className="px-3 py-2">
                        <div className="font-medium text-foreground">{item.productName}</div>
                        <input
                          type="text"
                          placeholder="Açıklama (opsiyonel)"
                          value={item.description}
                          onChange={(e) => updateItem(idx, 'description', e.target.value)}
                          className="mt-1 w-full h-7 px-2 text-xs rounded bg-surface-container border border-outline-variant"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0.01}
                          step={0.01}
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                          className="w-full h-8 px-2 text-right rounded bg-surface text-sm font-mono border border-outline-variant focus:border-primary focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => removeItem(idx)} className="text-on-surface-variant hover:text-error">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-3 py-2 bg-surface-container text-sm flex justify-between">
                <span className="text-on-surface-variant">Toplam {items.length} kalem</span>
                <span className="font-mono font-semibold text-foreground">{totalQty.toLocaleString('tr-TR')} adet</span>
              </div>
            </div>
          )}
        </div>

        {/* Sağ: Özet */}
        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <h3 className="font-semibold text-foreground mb-3">Transfer Özeti</h3>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex-1 p-2 bg-error-container rounded">
                  <div className="text-xs text-error">Çıkış</div>
                  <div className="font-mono font-medium text-error">{fromWh?.code ?? '—'}</div>
                  <div className="text-xs text-error truncate">{fromWh?.name ?? '—'}</div>
                </div>
                <ArrowRight className="h-5 w-5 text-on-surface-variant flex-shrink-0" />
                <div className="flex-1 p-2 bg-secondary-container rounded">
                  <div className="text-xs text-secondary">Giriş</div>
                  <div className="font-mono font-medium text-secondary">{toWh?.code ?? '—'}</div>
                  <div className="text-xs text-secondary truncate">{toWh?.name ?? '—'}</div>
                </div>
              </div>
              <div className="flex justify-between pt-3 border-t border-outline-variant">
                <span className="text-on-surface-variant">Toplam Kalem</span>
                <span className="font-mono font-semibold">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Toplam Miktar</span>
                <span className="font-mono font-semibold">{totalQty.toLocaleString('tr-TR')}</span>
              </div>
            </div>
          </div>

          <div className="card p-3 bg-primary-container text-primary text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              Transfer onaylandığında iki depo için de otomatik hareket oluşturulur (kaynak: OUT, hedef: IN). Yarıda kalırsa rollback.
            </span>
          </div>

          <div className="card p-4 flex flex-col gap-2">
            <button
              onClick={handleSave}
              disabled={create.isPending || items.length === 0}
              className="w-full font-semibold py-3 rounded-md bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-50"
            >
              <Save className="inline h-4 w-4 mr-1" />
              {create.isPending ? 'Kaydediliyor…' : 'Transferi Kaydet (PENDING)'}
            </button>
            <button onClick={() => navigate(-1)} className="w-full py-2.5 text-sm text-on-surface-variant hover:text-foreground">
              İptal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}