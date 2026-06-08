import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Package, Save } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ErrorState } from '@/components/data/ErrorState';
import { LoadingState } from '@/components/data/LoadingState';
import { useCreateProduct, useProduct, useUpdateProduct } from '@/features/products/api';
import { useWarehouses } from '@/features/warehouses/api';
import type { ProductStatus, ProductType } from '@saas/shared';
import toast from 'react-hot-toast';

interface ProductFormValues {
  name: string;
  type: ProductType;
  status: ProductStatus;
  shortName?: string;
  primaryBarcode?: string;
  defaultWarehouseId?: string;
  vatRate: number;
  minStock: number;
  maxStock: number;
  trackStock: boolean;
  description?: string;
}

export function ProductNewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const { data: product, isLoading, isError, error, refetch } = useProduct(id);
  const { data: warehouseResponse } = useWarehouses({ status: 'ACTIVE' } as any);
  const warehouses = warehouseResponse?.data ?? [];
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: {
      type: 'GOODS',
      status: 'ACTIVE',
      vatRate: 20,
      minStock: 0,
      maxStock: 0,
      trackStock: true,
    },
  });

  useEffect(() => {
    if (!product) return;
    reset({
      name: product.name,
      type: product.type,
      status: product.status,
      shortName: product.shortName ?? '',
      primaryBarcode: product.primaryBarcode ?? '',
      defaultWarehouseId: product.defaultWarehouseId ?? '',
      vatRate: product.vatRate,
      minStock: product.minStock,
      maxStock: product.maxStock,
      trackStock: product.trackStock,
      description: product.description ?? '',
    });
  }, [product, reset]);

  const pending = create.isPending || update.isPending;

  const onSubmit = (data: ProductFormValues) => {
    const payload = {
      ...data,
      defaultWarehouseId: data.defaultWarehouseId || undefined,
      vatRate: Number(data.vatRate),
      minStock: Number(data.minStock),
      maxStock: Number(data.maxStock),
    };

    if (isEdit && id) {
      update.mutate(
        { id, data: payload },
        {
          onSuccess: () => {
            toast.success('Ürün güncellendi');
            navigate(`/products/${id}`);
          },
          onError: (err: unknown) => {
            const rawMessage = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
            const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : (rawMessage ?? 'Ürün güncellenemedi');
            toast.error(message);
          },
        },
      );
      return;
    }

    create.mutate(payload, {
      onSuccess: (created) => {
        toast.success(`Ürün oluşturuldu: ${created.code} — ${created.name}`);
        navigate(`/products/${created.id}`);
      },
      onError: (err: unknown) => {
        const rawMessage = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
        const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : (rawMessage ?? 'Ürün oluşturulamadı');
        toast.error(message);
      },
    });
  };

  if (isEdit && isLoading) return <LoadingState label="Ürün yükleniyor..." />;
  if (isEdit && isError) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <button onClick={() => navigate(isEdit && id ? `/products/${id}` : '/products')} className="btn-ghost self-start text-sm">
        <ArrowLeft className="h-4 w-4" />
        {isEdit ? 'Ürün Detayına Dön' : 'Ürün Listesine Dön'}
      </button>

      <PageHeader
        title={isEdit ? 'Ürünü Düzenle' : 'Yeni Ürün'}
        description="Ürün kartını kaydedin. Birim, marka, kategori ve varsayılan depo alanları mevcut kurallarla korunur."
        actions={
          <button type="submit" form="product-form" disabled={pending} className="btn-primary">
            <Save className="h-4 w-4" />
            {pending ? 'Kaydediliyor...' : isEdit ? 'Değişiklikleri Kaydet' : 'Ürün Oluştur'}
          </button>
        }
      />

      <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="card flex flex-col gap-4 p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">
            <Package className="h-4 w-4" />
            Temel Bilgiler
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-sm font-semibold text-foreground">Ürün Adı *</label>
              <input
                type="text"
                placeholder="Örn: Pamuklu T-Shirt M"
                {...register('name', { required: 'Ürün adı zorunlu', minLength: { value: 2, message: 'En az 2 karakter' } })}
                className="h-12 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm focus:border-primary focus:outline-none"
              />
              {errors.name && <span className="text-xs text-error">{errors.name.message}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Kısa Ad</label>
              <input type="text" {...register('shortName')} className="h-12 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm focus:border-primary focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Tip</label>
              <select {...register('type')} className="h-12 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm focus:border-primary focus:outline-none">
                <option value="GOODS">Ticari Mal</option>
                <option value="SERVICE">Hizmet</option>
                <option value="RAW_MATERIAL">Hammadde</option>
                <option value="FINISHED_GOOD">Mamul</option>
                <option value="CONSUMABLE">Sarf Malzeme</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Durum</label>
              <select {...register('status')} className="h-12 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm focus:border-primary focus:outline-none">
                <option value="ACTIVE">Aktif</option>
                <option value="DRAFT">Taslak</option>
                <option value="PASSIVE">Pasif</option>
                <option value="DISCONTINUED">Üretimi Durdu</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Barkod</label>
              <input type="text" {...register('primaryBarcode')} className="h-12 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm font-mono focus:border-primary focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Varsayılan Depo</label>
              <select {...register('defaultWarehouseId')} className="h-12 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm focus:border-primary focus:outline-none">
                <option value="">Depo seçilmedi</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.code} - {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card flex flex-col gap-4 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-on-surface-variant">Vergi ve Stok</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">KDV (%)</label>
              <input type="number" step="0.01" {...register('vatRate', { valueAsNumber: true, min: 0, max: 100 })} className="h-12 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm font-mono focus:border-primary focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Min. Stok</label>
              <input type="number" step="0.01" {...register('minStock', { valueAsNumber: true, min: 0 })} className="h-12 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm font-mono focus:border-primary focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Max. Stok</label>
              <input type="number" step="0.01" {...register('maxStock', { valueAsNumber: true, min: 0 })} className="h-12 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm font-mono focus:border-primary focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Stok Takibi</label>
              <label className="flex h-12 items-center gap-2 rounded-md border border-outline-variant bg-surface-container-lowest px-3">
                <input type="checkbox" {...register('trackStock')} className="h-4 w-4" />
                <span className="text-sm text-foreground">Açık</span>
              </label>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Açıklama</label>
            <textarea {...register('description')} rows={3} className="resize-none rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          </div>
        </div>

        <div className="card bg-tertiary-container/30 p-4 text-xs text-on-surface-variant">
          Birim seçimi bu ekranda açık değil. Kayıtta firma varsayılan birimi kullanılır; marka, kategori ve varsayılan depo bilgileri ilgili katalog modüllerinden yönetilir.
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => navigate(isEdit && id ? `/products/${id}` : '/products')} className="btn-secondary">
            İptal
          </button>
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? 'Kaydediliyor...' : isEdit ? 'Değişiklikleri Kaydet' : 'Ürün Oluştur'}
          </button>
        </div>
      </form>
    </div>
  );
}
