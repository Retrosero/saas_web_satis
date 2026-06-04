import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Warehouse as WarehouseIcon, ClipboardList, Hash, Calendar, User } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useWarehouses } from '@/features/warehouses/api';
import { useCreateStockCount } from '@/features/stock-count/api';
import toast from 'react-hot-toast';

export function StockCountNewPage() {
  const navigate = useNavigate();
  const { data: warehouses } = useWarehouses({ status: 'ACTIVE' } as any);
  const create = useCreateStockCount();

  const [form, setForm] = useState({
    warehouseId: '',
    name: '',
    description: '',
    countType: 'FULL' as 'FULL' | 'PARTIAL' | 'CYCLE' | 'SPOT' | 'CATEGORY',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.warehouseId) {
      toast.error('Depo seçimi zorunludur');
      return;
    }
    if (!form.name.trim()) {
      toast.error('Sayım adı zorunludur');
      return;
    }
    try {
      const created = await create.mutateAsync(form);
      toast.success('Sayım oluşturuldu — şimdi başlatabilirsiniz');
      navigate(`/stock-counts/${created.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Sayım oluşturulamadı');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Yeni Stok Sayımı"
        description="Depo bazlı sayım başlat — Taslak olarak oluşturulur, sonra başlatılır"
        actions={
          <button onClick={() => navigate('/stock-counts')} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            Sayımlara Dön
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="card p-6 max-w-2xl">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <ClipboardList className="h-4 w-4" /> Sayım Bilgileri
        </h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              <WarehouseIcon className="inline h-3 w-3 mr-1" /> Depo *
            </label>
            <select
              required
              value={form.warehouseId}
              onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
              className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
            >
              <option value="">— Depo seçin —</option>
              {(warehouses?.data ?? []).map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.code} — {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              <Hash className="inline h-3 w-3 mr-1" /> Sayım Adı *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="2026 Haziran Dönemsel Sayım"
              className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Sayım Tipi</label>
            <select
              value={form.countType}
              onChange={(e) => setForm({ ...form, countType: e.target.value as any })}
              className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
            >
              <option value="FULL">Tam Sayım — Tüm ürünler</option>
              <option value="PARTIAL">Kısmi — Belirli ürünler</option>
              <option value="CYCLE">Dönemsel — Sayım turu</option>
              <option value="SPOT">Ani Kontrol</option>
              <option value="CATEGORY">Kategori Bazlı</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Açıklama</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Bu sayımın amacı / notlar…"
              className="w-full px-3 py-2 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-outline-variant">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-sm hover:bg-surface-container rounded-md">
            İptal
          </button>
          <button
            type="submit"
            disabled={create.isPending}
            className="btn-primary disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {create.isPending ? 'Oluşturuluyor…' : '✓ Sayım Oluştur (Taslak)'}
          </button>
        </div>
      </form>
    </div>
  );
}