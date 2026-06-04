import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Barcode, Package, Check, X, ScanLine } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { useStockCount, useRecordCount } from '@/features/stock-count/api';
import toast from 'react-hot-toast';

export function StockCountBarcodePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: count, isLoading } = useStockCount(id);
  const recordCount = useRecordCount(id!);

  const [barcode, setBarcode] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [scannedItems, setScannedItems] = useState<Array<{ productCode: string; productName: string; quantity: number; time: string }>>([]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) {
      toast.error('Barkod veya ürün kodu girin');
      return;
    }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Geçerli bir miktar girin');
      return;
    }
    try {
      const result: any = await recordCount.mutateAsync({
        productId: barcode,
        countedQuantity: qty,
        barcode,
      });
      setScannedItems((prev) => [
        {
          productCode: result?.productCode ?? barcode,
          productName: result?.productName ?? 'Bilinmeyen ürün',
          quantity: qty,
          time: new Date().toLocaleTimeString('tr-TR'),
        },
        ...prev.slice(0, 19),
      ]);
      setBarcode('');
      toast.success(`${qty} adet sayıldı`);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Sayım kaydedilemedi';
      toast.error(msg);
    }
  };

  if (isLoading) return <LoadingState label="Sayım yükleniyor…" />;
  if (!count) return null;

  const items = (count.items ?? []) as any[];
  const countedItems = items.filter((i) => i.status === 'COUNTED');
  const pendingItems = items.filter((i) => i.status === 'PENDING');
  const countedPct = items.length > 0 ? (countedItems.length / items.length) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Barkodla Sayım — ${count.countNumber}`}
        description={`${count.warehouseName} · ${count.name}`}
        actions={
          <button onClick={() => navigate(`/stock-counts/${id}`)} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            Sayım Detayına Dön
          </button>
        }
      />

      {/* İlerleme */}
      <div className="card p-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-foreground">İlerleme</span>
          <span className="text-sm font-mono text-foreground">
            {countedItems.length} / {items.length} ({countedPct.toFixed(0)}%)
          </span>
        </div>
        <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
          <div className="h-full bg-secondary transition-all" style={{ width: `${countedPct}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Barkod girişi */}
        <div className="lg:col-span-2 card p-6">
          <div className="text-center mb-4">
            <ScanLine className="h-12 w-12 mx-auto text-primary" />
            <h2 className="text-lg font-semibold text-foreground mt-2">Barkod Okutun</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Barkod okuyucu otomatik olarak bu alana odaklanır
            </p>
          </div>

          <form onSubmit={handleScan} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Barkod veya Ürün Kodu</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="8691234500011 veya U-001"
                autoFocus
                className="w-full h-12 px-4 rounded-md bg-surface text-lg font-mono border border-outline-variant focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Sayılan Miktar</label>
              <input
                type="number"
                min={0.01}
                step={0.01}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full h-12 px-4 rounded-md bg-surface text-2xl font-mono text-center border border-outline-variant focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={recordCount.isPending}
              className="w-full h-12 rounded-md bg-primary text-on-primary font-semibold hover:bg-primary-hover disabled:opacity-50"
            >
              <Barcode className="inline h-5 w-5 mr-2" />
              {recordCount.isPending ? 'Kaydediliyor…' : '✓ Say'}
            </button>
          </form>

          {/* Son okutulanlar */}
          {scannedItems.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-foreground mb-2">Son Okutulanlar</h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {scannedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-secondary-container rounded text-sm">
                    <Check className="h-4 w-4 text-secondary" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{item.productName}</div>
                      <div className="text-xs font-mono text-on-surface-variant">{item.productCode} · {item.time}</div>
                    </div>
                    <span className="font-mono font-semibold text-secondary">{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sağ: Kalan ürünler */}
        <div className="card p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" /> Henüz Sayılmadı
          </h3>
          <div className="text-xs text-on-surface-variant mb-2">{pendingItems.length} ürün kaldı</div>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {pendingItems.slice(0, 30).map((item) => (
              <div key={item.id} className="p-2 bg-surface-container rounded text-xs">
                <div className="font-medium text-foreground truncate">{item.productName}</div>
                <div className="text-on-surface-variant">Sistem: <span className="font-mono">{item.systemQuantity.toLocaleString('tr-TR')}</span></div>
              </div>
            ))}
            {pendingItems.length > 30 && (
              <div className="text-xs text-on-surface-variant text-center py-2">+{pendingItems.length - 30} ürün daha…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}