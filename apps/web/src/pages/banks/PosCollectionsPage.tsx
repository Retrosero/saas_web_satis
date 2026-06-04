import { useState } from 'react';
import { CreditCard, Plus, CheckCircle2, Filter } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { usePosCollections, usePosDevices, useCreatePosCollection, useSettlePosCollection } from "@/features/banks/api";
import type { PosCollection } from "@saas/shared";
import { PosCollectionStatusLabel, formatCurrency, formatDate, type PosCollectionStatus, type PosDevice } from '@saas/shared';

const STATUS_COLOR: Record<PosCollectionStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  SETTLED: 'bg-green-100 text-green-800',
  REVERSED: 'bg-red-100 text-red-800',
  PARTIAL: 'bg-blue-100 text-blue-800',
};

export function PosCollectionsPage() {
  const [page, setPage] = useState(1);
  const [posDeviceId, setPosDeviceId] = useState('all');
  const [statusFilter, setStatusFilter] = useState<PosCollectionStatus | 'all'>('all');
  const { data: devices = [] } = usePosDevices();
  const { data, isLoading, error, refetch } = usePosCollections({ page, pageSize: 25, posDeviceId: posDeviceId !== 'all' ? posDeviceId : undefined, status: statusFilter !== 'all' ? statusFilter : undefined });
  const settle = useSettlePosCollection();
  const createMut = useCreatePosCollection();
  const [showForm, setShowForm] = useState(false);
  const [formPosDeviceId, setFormPosDeviceId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formInstallment, setFormInstallment] = useState(1);
  const [formDescription, setFormDescription] = useState('');

  const rows: (PosCollection & { posDeviceName?: string; posCode?: string })[] = data?.data ?? [];
  const pagination = data?.pagination;

  const submit = async () => {
    if (!formPosDeviceId || formAmount === '') return;
    await createMut.mutateAsync({ posDeviceId: formPosDeviceId, collectionDate: formDate, amount: Number(formAmount), installment: formInstallment, description: formDescription || undefined } as any);
    setShowForm(false); setFormPosDeviceId(''); setFormAmount(''); setFormInstallment(1); setFormDescription('');
    refetch();
  };

  const columns: DataTableColumn<PosCollection & { posDeviceName?: string }>[] = [
    { key: 'collectionDate', label: 'Tarih', width: '110px', render: (r) => formatDate(r.collectionDate) },
    { key: 'posDevice', label: 'POS', hideOnMobile: true, render: (r) => r.posDeviceName ?? '—' },
    { key: 'customer', label: 'Cari', hideOnMobile: true, render: (r) => r.customerName ?? '—' },
    { key: 'installment', label: 'Taksit', width: '80px', render: (r) => r.installment },
    { key: 'amount', label: 'Brüt', width: '120px', align: 'right', render: (r) => formatCurrency(r.amount, r.currency) },
    { key: 'commission', label: 'Komisyon', width: '120px', align: 'right', hideOnMobile: true, render: (r) => <span className="text-red-600">-{formatCurrency(r.commission, r.currency)}</span> },
    { key: 'netAmount', label: 'Net', width: '120px', align: 'right', render: (r) => <span className="font-semibold text-green-700">{formatCurrency(r.netAmount, r.currency)}</span> },
    { key: 'status', label: 'Durum', width: '130px', render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[r.status]}`}>{PosCollectionStatusLabel[r.status]}</span> },
    {
      key: 'actions', label: '', width: '60px', render: (r) => r.status === 'PENDING' ? (
        <button onClick={async () => { await settle.mutateAsync(r.id); refetch(); }} className="rounded-md p-1.5 text-green-600 hover:bg-green-50" title="Banka hesabına geçir"><CheckCircle2 className="h-4 w-4" /></button>
      ) : null,
    },
  ];

  if (error) return <ErrorState message="POS tahsilatları yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="POS Tahsilatları"
        description="Kredi kartı ile yapılan tahsilatlar"
        actions={<button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary"><Plus className="h-4 w-4" /> Yeni POS Tahsilatı</button>}
      />

      {showForm && (
        <div className="rounded-lg border-2 border-primary bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold">Yeni POS Tahsilatı</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div><label className="mb-1 block text-xs font-medium">POS Cihazı *</label><select value={formPosDeviceId} onChange={(e) => setFormPosDeviceId(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm"><option value="">Seçiniz...</option>{devices.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.posCode})</option>)}</select></div>
            <div><label className="mb-1 block text-xs font-medium">Tarih *</label><input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Tutar *</label><input type="number" step="0.01" min="0" value={formAmount} onChange={(e) => setFormAmount(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Taksit</label><input type="number" min="1" max="12" value={formInstallment} onChange={(e) => setFormInstallment(Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div className="md:col-span-2"><label className="mb-1 block text-xs font-medium">Açıklama</label><textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="rounded-md border border-outline px-3 py-1.5 text-sm">İptal</button>
            <button onClick={submit} disabled={!formPosDeviceId || formAmount === ''} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-on-primary disabled:opacity-40">Kaydet</button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-[200px]"><label className="mb-1 block text-xs font-medium">POS Cihazı</label><select value={posDeviceId} onChange={(e) => { setPosDeviceId(e.target.value); setPage(1); }} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm"><option value="all">Tümü</option>{devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          <div className="w-[180px]"><label className="mb-1 block text-xs font-medium">Durum</label><select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm"><option value="all">Tümü</option>{Object.entries(PosCollectionStatusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        </div>
      </div>

      {isLoading ? <LoadingState /> : rows.length === 0 ? (
        <EmptyState icon={<CreditCard className="h-12 w-12" />} title="POS tahsilatı yok" />
      ) : (
        <>
          <DataTable<PosCollection & { posDeviceName?: string }> columns={columns} data={rows} rowKey={(r) => r.id} />
          <MobileCardList<PosCollection & { posDeviceName?: string }>
            data={rows}
            keyFn={(r) => r.id}
            header={(r) => formatCurrency(r.amount, r.currency)}
            subtitle={(r) => `${formatDate(r.collectionDate)} • ${r.posDeviceName ?? '—'}`}
            rightBadge={(r) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[r.status]}`}>{PosCollectionStatusLabel[r.status]}</span>}
            footer={(r) => <div className="flex items-center justify-between text-xs"><span className="text-red-600">-{formatCurrency(r.commission, r.currency)} komisyon</span><span className="font-semibold text-green-700">Net: {formatCurrency(r.netAmount, r.currency)}</span></div>}
          />
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface px-4 py-3">
              <span className="text-sm text-on-surface-variant">Toplam {pagination.total} kayıt — sayfa {pagination.page}/{pagination.totalPages}</span>
              <div className="flex gap-2">
                <button disabled={!pagination.hasPrev} onClick={() => setPage(page - 1)} className="rounded-md border border-outline px-3 py-1.5 text-sm disabled:opacity-40">Önceki</button>
                <button disabled={!pagination.hasNext} onClick={() => setPage(page + 1)} className="rounded-md border border-outline px-3 py-1.5 text-sm disabled:opacity-40">Sonraki</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
