import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Warehouse, MapPin, Phone, User, Package, Activity, ArrowLeftRight, Pencil, Power, Calendar, Edit } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useWarehouse, useDeactivateWarehouse, useWarehouseStock, useWarehouseTransfers, useUnassignedWarehouseProducts, useAssignProductsToWarehouse } from '@/features/warehouses/api';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { formatDate, formatCurrency } from '@saas/shared';
import toast from 'react-hot-toast';

const STATUS_LABEL = {
  ACTIVE: { text: 'Aktif', color: 'bg-secondary-container text-secondary' },
  PASSIVE: { text: 'Pasif', color: 'bg-surface-variant text-on-surface-variant' },
};

export function WarehouseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useWarehouse(id);
  const { data: stock } = useWarehouseStock(id);
  const { data: transfers } = useWarehouseTransfers({ fromWarehouseId: id });
  const [productSearch, setProductSearch] = useState('');
  const { data: unassignedProducts = [] } = useUnassignedWarehouseProducts(productSearch || undefined);
  const assignProducts = useAssignProductsToWarehouse();
  const deactivate = useDeactivateWarehouse();
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  if (isLoading) return <LoadingState label="Depo yükleniyor…" />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!data) return null;

  const s = STATUS_LABEL[data.status];
  const criticalStock = (stock ?? []).filter((p) => p.minStock != null && p.totalStock < p.minStock).length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={data.name}
        description={`${data.code} • ${data.branch ?? 'Ana depo'}`}
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate('/warehouses')} className="btn-ghost">
              <ArrowLeft className="h-4 w-4" />
              Depolar
            </button>
            <button onClick={() => navigate(`/warehouses/${id}/edit`)} className="btn-ghost">
              <Pencil className="h-4 w-4" />
              Düzenle
            </button>
            {data.status === 'ACTIVE' && (
              <button onClick={() => setShowDeactivateModal(true)} className="btn-ghost text-error">
                <Power className="h-4 w-4" />
                Pasife Al
              </button>
            )}
          </div>
        }
      />

      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${s.color}`}>
        {s.text}
      </span>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sol: Bilgiler + Stok */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Bilgi kartı */}
          <div className="card p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Warehouse className="h-4 w-4" /> Depo Bilgileri
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-on-surface-variant mt-0.5" />
                <div>
                  <div className="text-xs text-on-surface-variant">Adres</div>
                  <div className="text-foreground">{data.address ?? '—'}</div>
                  <div className="text-xs text-on-surface-variant">
                    {data.city ?? '—'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-on-surface-variant mt-0.5" />
                <div>
                  <div className="text-xs text-on-surface-variant">Telefon</div>
                  <div className="font-mono text-foreground">{data.phone ?? '—'}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-on-surface-variant mt-0.5" />
                <div>
                  <div className="text-xs text-on-surface-variant">Sorumlu Personel</div>
                  <div className="text-foreground">{data.manager ?? '—'}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-on-surface-variant mt-0.5" />
                <div>
                  <div className="text-xs text-on-surface-variant">Oluşturulma</div>
                  <div className="text-foreground">{formatDate(data.createdAt)}</div>
                </div>
              </div>
            </div>
            {data.notes && (
              <div className="mt-3 p-3 bg-surface-container rounded-md text-sm">
                <div className="text-xs text-on-surface-variant mb-1">Notlar</div>
                {data.notes}
              </div>
            )}
          </div>

          {/* Stok özeti */}
          <div className="card p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Package className="h-4 w-4" /> Depo Stokları
              </h3>
              <button onClick={() => navigate(`/warehouses/${id}/stock`)} className="btn-ghost text-xs">
                Tümünü Gör
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-primary-container rounded-md">
                <div className="text-xs text-on-surface-variant">Ürün Sayısı</div>
                <div className="font-mono font-bold text-2xl text-primary">
                  {(stock ?? []).length}
                </div>
              </div>
              <div className="p-3 bg-secondary-container rounded-md">
                <div className="text-xs text-on-surface-variant">Toplam Stok</div>
                <div className="font-mono font-bold text-2xl text-secondary">
                  {(stock ?? []).reduce((s, p) => s + p.totalStock, 0).toLocaleString('tr-TR')}
                </div>
              </div>
              <div className="p-3 bg-error-container rounded-md">
                <div className="text-xs text-on-surface-variant">Kritik Stok</div>
                <div className="font-mono font-bold text-2xl text-error">{criticalStock}</div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="mb-3 font-semibold text-foreground flex items-center gap-2">
              <Package className="h-4 w-4" /> Deposu Olmayan Ürün Ekle
            </h3>
            <div className="flex flex-col gap-3">
              <input
                type="search"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Ürün kodu, adı veya barkod ile ara..."
                className="w-full h-10 px-3 rounded-md bg-surface text-sm border border-outline-variant focus:border-primary focus:outline-none"
              />
              <div className="max-h-60 overflow-y-auto rounded-md border border-outline-variant">
                {unassignedProducts.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-on-surface-variant">Deposu olmayan uygun ürün bulunamadı.</div>
                ) : (
                  unassignedProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between border-b border-outline-variant px-3 py-2 last:border-0">
                      <div>
                        <div className="font-medium text-foreground">{product.name}</div>
                        <div className="text-xs font-mono text-on-surface-variant">
                          {product.code}
                          {product.primaryBarcode ? ` • ${product.primaryBarcode}` : ''}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          assignProducts.mutate(
                            { warehouseId: id!, productIds: [product.id] },
                            {
                              onSuccess: () => toast.success('Ürün depoya atandı'),
                              onError: (err: unknown) => {
                                toast.error(((err as any)?.response?.data?.message as string) || 'Ürün atanamadı');
                              },
                            },
                          )
                        }
                        disabled={assignProducts.isPending}
                        className="btn-secondary text-xs"
                      >
                        Depoya Ekle
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Son transferler */}
          {transfers && transfers.data.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-outline-variant bg-surface-container">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4" /> Son Transferler
                </h3>
              </div>
              <div className="divide-y divide-outline-variant">
                {transfers.data.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="w-full px-4 py-2 flex justify-between items-center text-left"
                  >
                    <div>
                      <div className="font-mono text-sm text-foreground">{t.transferNumber}</div>
                      <div className="text-xs text-on-surface-variant">
                        {t.fromWarehouseName} → {t.toWarehouseName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-on-surface-variant">{formatDate(t.transferDate)}</div>
                      <div className="text-xs font-medium text-foreground">{t.itemCount} kalem</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sağ: Hızlı işlemler */}
        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <h3 className="font-semibold text-foreground mb-3">Hızlı İşlemler</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => navigate(`/warehouses/${id}/stock`)} className="btn-ghost justify-start">
                <Package className="h-4 w-4" /> Depo Stokları
              </button>
              <button onClick={() => navigate(`/warehouses/transfer?from=${id}`)} className="btn-ghost justify-start">
                <ArrowLeftRight className="h-4 w-4" /> Transfer Başlat
              </button>
              <button onClick={() => navigate(`/warehouses/${id}/movements`)} className="btn-ghost justify-start">
                <Activity className="h-4 w-4" /> Hareketler
              </button>
              <button onClick={() => navigate(`/warehouses/${id}/edit`)} className="btn-ghost justify-start">
                <Edit className="h-4 w-4" /> Düzenle
              </button>
            </div>
          </div>

          {/* Varsayılan göstergesi */}
          {data.isDefault && (
            <div className="card p-4 bg-primary-container">
              <div className="text-xs text-primary">Varsayılan Depo</div>
              <div className="text-sm text-primary font-medium">Yeni ürünler ve satışlar bu depoya bağlanır</div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        onConfirm={async () => {
          await deactivate.mutateAsync(id!);
          setShowDeactivateModal(false);
          toast.success('Depo pasife alındı');
          navigate('/warehouses');
        }}
        title="Depo Pasife Alınsın mı?"
        description={
          <div>
            <p>
              <strong>{data.name}</strong> deposu pasife alınacak. Stok ve cari hareketleri korunur.
            </p>
            <p className="mt-2 text-error">Bu işlem geri alınamaz. Hareketi olan depolar pasife alınamaz.</p>
          </div>
        }
        confirmText="Evet, Pasife Al"
        loading={deactivate.isPending}
      />
    </div>
  );
}
