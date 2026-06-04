import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Warehouse as WarehouseIcon, MapPin, Phone, User, Hash } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { useWarehouse, useCreateWarehouse, useUpdateWarehouse } from '@/features/warehouses/api';
import toast from 'react-hot-toast';

export function WarehouseFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: existing, isLoading } = useWarehouse(isEdit ? (id ?? '') : undefined);

  const [form, setForm] = useState({
    code: '',
    name: '',
    branch: '',
    manager: '',
    city: '',
    address: '',
    phone: '',
    isDefault: false,
    notes: '',
  });

  useEffect(() => {
    if (isEdit && existing) {
      setForm({
        code: existing.code,
        name: existing.name,
        branch: existing.branch ?? '',
        manager: existing.manager ?? '',
        city: existing.city ?? '',
        address: existing.address ?? '',
        phone: existing.phone ?? '',
        isDefault: existing.isDefault,
        notes: existing.notes ?? '',
      });
    }
  }, [existing]);

  const create = useCreateWarehouse();
  const update = useUpdateWarehouse();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Kod ve ad zorunludur');
      return;
    }
    try {
      if (isEdit) {
        await update.mutateAsync({ id: id!, ...form });
        toast.success('Depo güncellendi');
        navigate(`/warehouses/${id}`);
      } else {
        const created = await create.mutateAsync(form);
        toast.success('Depo oluşturuldu');
        navigate(`/warehouses/${created.id}`);
      }
    } catch (err: unknown) {
      const msg = ((err as any)?.response?.data?.message as string) || 'İşlem başarısız';
      toast.error(msg);
    }
  };

  if (isLoading && isEdit) return <LoadingState label="Depo yükleniyor…" />;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={isEdit ? 'Depo Düzenle' : 'Yeni Depo'}
        description={isEdit ? `${form.code} — ${form.name}` : 'Yeni depo tanımı oluştur'}
        actions={
          <button onClick={() => navigate(-1)} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            Geri
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="card p-6">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <WarehouseIcon className="h-4 w-4" /> Temel Bilgiler
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              <Hash className="inline h-3 w-3 mr-1" /> Depo Kodu *
            </label>
            <input
              type="text"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              disabled={isEdit}
              placeholder="D-001"
              className="w-full h-10 px-3 rounded-md bg-surface text-sm font-mono border border-outline-variant focus:border-primary focus:outline-none disabled:opacity-60"
            />
            <p className="text-xs text-on-surface-variant mt-1">Benzersiz, değiştirilemez</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Depo Adı *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ana Depo, Şube 1 Depo…"
              className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Şube</label>
            <input
              type="text"
              value={form.branch}
              onChange={(e) => setForm({ ...form, branch: e.target.value })}
              placeholder="Merkez, Kadıköy Şubesi…"
              className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              <User className="inline h-3 w-3 mr-1" /> Sorumlu Personel
            </label>
            <input
              type="text"
              value={form.manager}
              onChange={(e) => setForm({ ...form, manager: e.target.value })}
              placeholder="Ahmet Yılmaz"
              className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <h2 className="font-semibold text-foreground mt-6 mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4" /> İletişim & Adres
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-foreground mb-1">Adres</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Caferağa Mah. Moda Cad. No:12"
              className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Şehir</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="İstanbul"
              className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              <Phone className="inline h-3 w-3 mr-1" /> Telefon
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="0216 555 1234"
              className="w-full h-10 px-3 rounded-md bg-surface text-sm font-mono border border-outline-variant focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <h2 className="font-semibold text-foreground mt-6 mb-4">Ek Ayarlar</h2>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-foreground">Varsayılan depo yap</span>
            <span className="text-xs text-on-surface-variant">— Yeni ürünler ve satışlar bu depoya bağlanır</span>
          </label>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Notlar</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-outline-variant">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-sm text-foreground hover:bg-surface-container rounded-md">
            İptal
          </button>
          <button
            type="submit"
            disabled={create.isPending || update.isPending}
            className="btn-primary disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {create.isPending || update.isPending ? 'Kaydediliyor…' : isEdit ? 'Değişiklikleri Kaydet' : '✓ Depo Oluştur'}
          </button>
        </div>
      </form>
    </div>
  );
}