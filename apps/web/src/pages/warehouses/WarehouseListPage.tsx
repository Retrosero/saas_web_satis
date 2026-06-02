import { useState } from 'react';
import { Warehouse as WarehouseIcon, Plus, Search, MapPin, Phone, User, Star } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/data/EmptyState';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useWarehouses } from '@/features/warehouses/api';
import { formatNumber } from '@saas/shared';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useCreateWarehouse } from '@/features/warehouses/api';

export function WarehouseListPage() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading, isError, error, refetch } = useWarehouses({ search: search || undefined, pageSize: 100 });
  const create = useCreateWarehouse();

  const handleCreate = async (input: { name: string; address?: string; city?: string; manager?: string; phone?: string }) => {
    try {
      await create.mutateAsync(input);
      toast.success('Depo oluşturuldu');
      setShowCreate(false);
      refetch();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'İşlem başarısız';
      toast.error(message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Depolar"
        description="Stok tutulan fiziksel konumlar — ürünlerin depoya göre dağılımı"
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Yeni Depo
          </button>
        }
      />

      <div className="card p-3 flex">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Depo kodu veya adı…"
            className="w-full h-10 pl-10 pr-4 rounded-md bg-surface-container text-sm border border-outline-variant focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {isLoading && <LoadingState label="Depolar yükleniyor…" />}
      {isError && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {data && data.data.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<WarehouseIcon className="h-8 w-8" />}
            title="Henüz depo yok"
            description="Ürünlerin tutulacağı fiziksel depolar oluşturun. İlk depo otomatik 'varsayılan' olarak işaretlenir."
            action={
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                <Plus className="h-4 w-4" />
                İlk Depoyu Oluştur
              </button>
            }
          />
        </div>
      )}
      {data && data.data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.data.map((w) => (
            <div key={w.id} className="card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{w.name}</h3>
                    {w.isDefault && <Star className="h-4 w-4 text-tertiary fill-tertiary" />}
                  </div>
                  <div className="text-xs text-on-surface-variant font-mono mt-0.5">{w.code}</div>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    w.status === 'ACTIVE' ? 'bg-secondary-container text-secondary' : 'bg-surface-variant text-on-surface-variant'
                  }`}
                >
                  {w.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 text-xs text-on-surface-variant">
                {w.address && (
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3 w-3 mt-0.5" />
                    <span>
                      {w.address}
                      {w.city && ` ${w.city}`}
                    </span>
                  </div>
                )}
                {w.manager && (
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3" /> {w.manager}
                  </div>
                )}
                {w.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> {w.phone}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-outline-variant flex justify-between text-xs">
                <div>
                  <div className="text-on-surface-variant">Ürün</div>
                  <div className="font-mono font-semibold text-foreground">{formatNumber(w.productCount)}</div>
                </div>
                <div>
                  <div className="text-on-surface-variant">Hareket</div>
                  <div className="font-mono font-semibold text-foreground">{formatNumber(w.stockMovementCount)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateWarehouseModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} isPending={create.isPending} />}
    </div>
  );
}

function CreateWarehouseModal({ onClose, onSubmit, isPending }: { onClose: () => void; onSubmit: (input: { name: string; address?: string; city?: string; manager?: string; phone?: string }) => void; isPending: boolean }) {
  const { register, handleSubmit } = useForm<{ name: string; address?: string; city?: string; manager?: string; phone?: string }>({
    defaultValues: { name: '', address: '', city: '', manager: '', phone: '' },
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-foreground mb-4">Yeni Depo</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Depo Adı *</label>
            <input
              type="text"
              placeholder="Merkez Depo"
              {...register('name', { required: true })}
              className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Şehir</label>
              <input type="text" {...register('city')} className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Telefon</label>
              <input type="tel" {...register('phone')} className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Adres</label>
            <input type="text" {...register('address')} className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Depo Sorumlusu</label>
            <input type="text" {...register('manager')} className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none" />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="btn-secondary">İptal</button>
            <button type="submit" disabled={isPending} className="btn-primary">{isPending ? 'Oluşturuluyor…' : 'Oluştur'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
