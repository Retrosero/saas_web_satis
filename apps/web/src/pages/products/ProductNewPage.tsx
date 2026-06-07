import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Package, Save } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCreateProduct } from '@/features/products/api';
import type { ProductStatus, ProductType } from '@saas/shared';
import toast from 'react-hot-toast';

interface NewProductForm {
  name: string;
  type: ProductType;
  status: ProductStatus;
  shortName?: string;
  primaryBarcode?: string;
  vatRate: number;
  minStock: number;
  maxStock: number;
  trackStock: boolean;
  description?: string;
}

export function ProductNewPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<NewProductForm>({
    defaultValues: {
      type: 'GOODS',
      status: 'ACTIVE',
      vatRate: 20,
      minStock: 0,
      maxStock: 0,
      trackStock: true,
    },
  });

  const create = useCreateProduct();

  const onSubmit = (data: NewProductForm) => {
    create.mutate(
      {
        ...data,
        vatRate: Number(data.vatRate),
        minStock: Number(data.minStock),
        maxStock: Number(data.maxStock),
      },
      {
        onSuccess: (created) => {
          toast.success(`Ürün oluşturuldu: ${created.code} — ${created.name}`);
          navigate(`/products/${created.id}`);
        },
        onError: (err: unknown) => {
          const rawMessage = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
          const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : (rawMessage ?? 'Ürün oluşturulamadı');
          toast.error(message);
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <button onClick={() => navigate('/products')} className="btn-ghost self-start text-sm">
        <ArrowLeft className="h-4 w-4" />
        Ürün Listesine Dön
      </button>

      <PageHeader
        title="Yeni Ürün"
        description="Ürün kartı oluşturun. Birim (unit), marka, kategori ve depo bilgileri sonradan güncellenebilir."
        actions={
          <button type="submit" form="new-product-form" disabled={create.isPending} className="btn-primary">
            <Save className="h-4 w-4" />
            {create.isPending ? 'Oluşturuluyor…' : 'Ürün Oluştur'}
          </button>
        }
      />

      <form id="new-product-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="card p-6 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide flex items-center gap-2">
            <Package className="h-4 w-4" />
            Temel Bilgiler
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-sm font-semibold text-foreground">Ürün Adı *</label>
              <input
                type="text"
                placeholder="Örn: Pamuklu T-Shirt M"
                {...register('name', { required: 'Ürün adı zorunlu', minLength: { value: 2, message: 'En az 2 karakter' } })}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none"
              />
              {errors.name && <span className="text-xs text-error">{errors.name.message}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Kısa Ad</label>
              <input
                type="text"
                placeholder="P.S. T-Shirt M"
                {...register('shortName')}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Tip</label>
              <select
                {...register('type')}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none"
              >
                <option value="GOODS">Ticari Mal</option>
                <option value="SERVICE">Hizmet (stok takipsiz)</option>
                <option value="RAW_MATERIAL">Hammadde</option>
                <option value="FINISHED_GOOD">Mamul</option>
                <option value="CONSUMABLE">Sarf Malzeme</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Durum</label>
              <select
                {...register('status')}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none"
              >
                <option value="ACTIVE">Aktif</option>
                <option value="DRAFT">Taslak</option>
                <option value="PASSIVE">Pasif</option>
                <option value="DISCONTINUED">Üretimi Durdu</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Barkod (Primary)</label>
              <input
                type="text"
                placeholder="8690123456789"
                {...register('primaryBarcode')}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm font-mono focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="card p-6 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide">Vergi & Stok</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">KDV (%)</label>
              <input
                type="number"
                step="0.01"
                {...register('vatRate', { valueAsNumber: true, min: 0, max: 100 })}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm font-mono focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Min. Stok</label>
              <input
                type="number"
                step="0.01"
                {...register('minStock', { valueAsNumber: true, min: 0 })}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm font-mono focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Max. Stok</label>
              <input
                type="number"
                step="0.01"
                {...register('maxStock', { valueAsNumber: true, min: 0 })}
                className="h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm font-mono focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Stok Takibi</label>
              <label className="flex items-center gap-2 h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest">
                <input type="checkbox" {...register('trackStock')} className="h-4 w-4" />
                <span className="text-sm text-foreground">Açık</span>
              </label>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Açıklama</label>
            <textarea
              {...register('description')}
              rows={3}
              className="px-3 py-2 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary focus:outline-none resize-none"
            />
          </div>
        </div>

        <div className="card p-4 bg-tertiary-container/30 text-xs text-on-surface-variant">
          ℹ️ Birim seçimi bu ekranda henüz açık değil. Kayıtta firma varsayılan birimi kullanılır; marka, kategori ve varsayılan depo bilgileri ayrı katalog modüllerinden güncellenebilir.
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => navigate('/products')} className="btn-secondary">
            İptal
          </button>
          <button type="submit" disabled={create.isPending} className="btn-primary">
            {create.isPending ? 'Oluşturuluyor…' : 'Ürün Oluştur'}
          </button>
        </div>
      </form>
    </div>
  );
}
