import { useState } from 'react';
import { Image, Upload, Trash2, ImageOff, ImagePlus, Barcode, FileCode, FileText } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useProductImagesDashboard, useBatchUploadImages, useDeleteProductImage, useProductImages } from '@/features/ux-bulk/api';

export function ProductImagesPage() {
  const { data: dash, isLoading } = useProductImagesDashboard();
  const { data: list } = useProductImages({ pageSize: 50 });
  const batch = useBatchUploadImages();
  const delMut = useDeleteProductImage();
  const [matchBy, setMatchBy] = useState<'filename' | 'barcode' | 'productCode'>('filename');
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const onSimulateBatch = async () => {
    const files = Array.from({ length: 5 }, (_, i) => ({ fileName: `urun-${i + 1}.jpg`, r2Key: `tenant/x/urun-${i + 1}.jpg`, url: `https://cdn/urun-${i + 1}.jpg`, fileSize: 100_000 + i * 1000, mimeType: 'image/jpeg' }));
    const r = await batch.mutateAsync({ files, matchBy });
    alert(`Batch: ${r.success} başarılı, ${r.failed} başarısız`);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Ürün Görselleri" description="Toplu görsel yükleme ve eşleştirme" />

      {isLoading ? <LoadingState /> : dash && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-outline bg-surface p-3"><div className="flex items-center gap-2 text-xs text-on-surface-variant"><Image className="h-3 w-3" /> Toplam Ürün</div><p className="text-2xl font-bold">{dash.totalProducts}</p></div>
          <div className="rounded-lg border border-green-300 bg-green-50 p-3"><div className="flex items-center gap-2 text-xs text-on-surface-variant"><ImagePlus className="h-3 w-3" /> Görselli</div><p className="text-2xl font-bold text-green-600">{dash.productsWithImages}</p></div>
          <div className="rounded-lg border border-red-300 bg-red-50 p-3"><div className="flex items-center gap-2 text-xs text-on-surface-variant"><ImageOff className="h-3 w-3" /> Görselsiz</div><p className="text-2xl font-bold text-red-600">{dash.productsWithoutImages}</p></div>
          <div className="rounded-lg border border-blue-300 bg-blue-50 p-3"><div className="flex items-center gap-2 text-xs text-on-surface-variant"><FileText className="h-3 w-3" /> Depolama</div><p className="text-2xl font-bold text-blue-600">{dash.storageUsedMB} MB</p></div>
        </div>
      )}

      <div className="rounded-lg border border-outline bg-surface p-3">
        <h3 className="mb-2 font-semibold">Toplu Yükle</h3>
        <p className="mb-2 text-xs text-on-surface-variant">Eşleştirme kuralı:</p>
        <div className="flex flex-wrap gap-2 text-sm">
          {[{ v: 'filename', l: 'Dosya Adı', i: FileText }, { v: 'barcode', l: 'Barkod', i: Barcode }, { v: 'productCode', l: 'Ürün Kodu', i: FileCode }].map((m) => {
            const Icon = m.i;
            return <button key={m.v} onClick={() => setMatchBy(m.v as any)} className={`flex items-center gap-1 rounded-md px-3 py-1.5 ${matchBy === m.v ? 'bg-primary text-on-primary' : 'border'}`}><Icon className="h-3 w-3" /> {m.l}</button>;
          })}
        </div>
        <button onClick={onSimulateBatch} disabled={batch.isPending} className="mt-3 flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm text-white"><Upload className="h-4 w-4" /> {batch.isPending ? 'Yükleniyor...' : 'Demo Batch Yükle'}</button>
      </div>

      {list && list.items.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {list.items.map((img: any) => (
            <div key={img.id} className="group relative overflow-hidden rounded-lg border border-outline bg-surface">
              <img src={img.url} alt={img.altText ?? img.fileName} className="h-32 w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40"><button onClick={() => setConfirmDel(img.id)} className="rounded-full bg-red-600 p-2 text-white opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button></div>
              <p className="truncate p-2 text-xs">{img.fileName}</p>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal open={!!confirmDel} title="Görsel Silinsin mi?" confirmText="Sil" variant="danger" onClose={() => setConfirmDel(null)} onConfirm={async () => { if (confirmDel) { await delMut.mutateAsync(confirmDel); setConfirmDel(null); } }} />
    </div>
  );
}
