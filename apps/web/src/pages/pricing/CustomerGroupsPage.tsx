import { useState } from 'react';
import { Users, Plus, Pencil, Trash2, UserPlus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { useCustomerGroups, useCreateCustomerGroup } from '@/features/pricing/api';
import { formatDate, type CustomerPriceGroup } from '@saas/shared';

export function CustomerGroupsPage() {
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState(''); const [name, setName] = useState(''); const [description, setDescription] = useState('');
  const [defaultDiscountRate, setDefaultDiscountRate] = useState<number | ''>(0);
  const { data: groups = [], isLoading, error, refetch } = useCustomerGroups();
  const createMut = useCreateCustomerGroup();

  const submit = async () => {
    if (!code || !name) return;
    await createMut.mutateAsync({ code, name, description: description || undefined, defaultDiscountRate: defaultDiscountRate === '' ? 0 : Number(defaultDiscountRate) });
    setShowForm(false); setCode(''); setName(''); setDescription(''); setDefaultDiscountRate(0);
    refetch();
  };

  const columns: DataTableColumn<CustomerPriceGroup>[] = [
    { key: 'code', label: 'Kod', width: '140px', render: (g) => <span className="font-mono font-semibold">{g.code}</span> },
    { key: 'name', label: 'Ad', render: (g) => <span className="font-semibold">{g.name}</span> },
    { key: 'memberCount', label: 'Cari', width: '80px', align: 'right', render: (g) => g.memberCount },
    { key: 'defaultDiscountRate', label: 'Varsayılan İskonto', width: '160px', render: (g) => `%${g.defaultDiscountRate}` },
    { key: 'isActive', label: 'Durum', width: '100px', render: (g) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${g.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{g.isActive ? 'Aktif' : 'Pasif'}</span> },
    { key: 'createdAt', label: 'Oluşturma', width: '140px', hideOnMobile: true, render: (g) => formatDate(g.createdAt) },
  ];

  if (error) return <ErrorState message="Gruplar yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader title="Müşteri Fiyat Grupları" description="Cari gruplarına özel fiyat ve iskonto tanımları" actions={<button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Plus className="h-4 w-4" /> Yeni Grup</button>} />

      {showForm && (
        <div className="rounded-lg border-2 border-primary bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold">Yeni Müşteri Grubu</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div><label className="mb-1 block text-xs font-medium">Kod *</label><input value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" /></div>
            <div><label className="mb-1 block text-xs font-medium">Ad *</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Varsayılan İskonto %</label><input type="number" step="0.01" min="0" max="100" value={defaultDiscountRate} onChange={(e) => setDefaultDiscountRate(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div className="md:col-span-2"><label className="mb-1 block text-xs font-medium">Açıklama</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="rounded-md border border-outline px-3 py-1.5 text-sm">İptal</button>
            <button onClick={submit} disabled={!code || !name} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-on-primary disabled:opacity-40">Kaydet</button>
          </div>
        </div>
      )}

      {isLoading ? <LoadingState /> : groups.length === 0 ? (
        <EmptyState icon={<Users className="h-12 w-12" />} title="Henüz grup yok" description="Müşteri grupları oluşturarak toplu fiyat/iskonto yönetin" />
      ) : (
        <>
          <DataTable<CustomerPriceGroup> columns={columns} data={groups} rowKey={(g) => g.id} />
          <MobileCardList<CustomerPriceGroup> data={groups} keyFn={(g) => g.id} header={(g) => `${g.code} - ${g.name}`} subtitle={(g) => `${g.memberCount} cari • %${g.defaultDiscountRate} iskonto`} rightBadge={(g) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${g.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{g.isActive ? 'Aktif' : 'Pasif'}</span>} footer={(g) => <span className="text-xs text-on-surface-variant">{g.description || '—'}</span>} />
        </>
      )}
    </div>
  );
}
