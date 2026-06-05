import { useState } from 'react';
import { CreditCard, Plus, Pencil, Power, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { usePosDevices, useCreatePosDevice, useUpdatePosDevice, useBankAccounts } from '@/features/banks/api';
import { PosStatusLabel, type PosDevice, type PosStatus } from '@saas/shared';

const STATUS_COLOR: Record<PosStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PASSIVE: 'bg-gray-200 text-gray-700',
};

export function PosDevicesPage() {
  const { data: devices = [], isLoading, error, refetch } = usePosDevices();
  const { data: accounts = [] } = useBankAccounts();
  const createMut = useCreatePosDevice();
  const updateMut = useUpdatePosDevice();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PosDevice | null>(null);
  const [bankAccountId, setBankAccountId] = useState('');
  const [name, setName] = useState('');
  const [posCode, setPosCode] = useState('');
  const [commissionRate, setCommissionRate] = useState<number | ''>('');
  const [blockDays, setBlockDays] = useState<number | ''>(1);

  const reset = () => { setShowForm(false); setEditing(null); setBankAccountId(''); setName(''); setPosCode(''); setCommissionRate(''); setBlockDays(1); };

  const startEdit = (d: PosDevice) => {
    setEditing(d);
    setBankAccountId(d.bankAccountId);
    setName(d.name);
    setPosCode(d.posCode);
    setCommissionRate(d.commissionRate);
    setBlockDays(d.blockDays);
    setShowForm(true);
  };

  const submit = async () => {
    if (!bankAccountId || !name || !posCode || commissionRate === '') return;
    const payload = { bankAccountId, name, posCode, commissionRate: Number(commissionRate), blockDays: Number(blockDays) || 1 };
    if (editing) await updateMut.mutateAsync({ id: editing.id, ...payload });
    else await createMut.mutateAsync(payload);
    reset();
    refetch();
  };

  const toggleStatus = async (d: PosDevice) => {
    await updateMut.mutateAsync({ id: d.id, status: d.status === 'ACTIVE' ? 'PASSIVE' : 'ACTIVE' });
    refetch();
  };

  const columns: DataTableColumn<PosDevice>[] = [
    { key: 'name', label: 'POS Adı', render: (d) => <span className="font-semibold">{d.name}</span> },
    { key: 'posCode', label: 'POS Kodu', width: '130px', render: (d) => <span className="font-mono">{d.posCode}</span> },
    { key: 'bankAccount', label: 'Bağlı Hesap', hideOnMobile: true, render: (d) => accounts.find((a) => a.id === d.bankAccountId)?.accountName ?? '—' },
    { key: 'commissionRate', label: 'Komisyon', width: '110px', render: (d) => `%${d.commissionRate}` },
    { key: 'blockDays', label: 'Bloke Gün', width: '110px', render: (d) => `${d.blockDays} gün` },
    { key: 'status', label: 'Durum', width: '100px', render: (d) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[d.status]}`}>{PosStatusLabel[d.status]}</span> },
    {
      key: 'actions', label: '', width: '100px', render: (d) => (
        <div className="flex items-center gap-1">
          <button onClick={() => startEdit(d)} className="rounded-md p-1.5 text-primary hover:bg-primary-container/40" title="Düzenle"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => toggleStatus(d)} className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50" title="Aktiflik değiştir"><Power className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message="POS cihazları yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="POS Hesapları"
        description="POS cihazlarını ve komisyon oranlarını yönetin"
        actions={<button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary"><Plus className="h-4 w-4" /> Yeni POS Hesabı</button>}
      />

      {showForm && (
        <div className="rounded-lg border-2 border-primary bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold">{editing ? 'POS Düzenle' : 'Yeni POS'}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div><label className="mb-1 block text-xs font-medium">POS Adı *</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">POS Kodu *</label><input value={posCode} onChange={(e) => setPosCode(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" /></div>
            <div><label className="mb-1 block text-xs font-medium">Bağlı Banka Hesabı *</label><select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm"><option value="">Seçiniz...</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.bankName} - {a.accountName}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3"><div><label className="mb-1 block text-xs font-medium">Komisyon % *</label><input type="number" step="0.01" min="0" max="100" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div><div><label className="mb-1 block text-xs font-medium">Bloke Gün</label><input type="number" min="0" value={blockDays} onChange={(e) => setBlockDays(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div></div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={reset} className="rounded-md border border-outline px-3 py-1.5 text-sm">İptal</button>
            <button onClick={submit} disabled={!bankAccountId || !name || !posCode || commissionRate === ''} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-on-primary disabled:opacity-40">{editing ? 'Güncelle' : 'Kaydet'}</button>
          </div>
        </div>
      )}

      {isLoading ? <LoadingState /> : devices.length === 0 ? (
        <EmptyState icon={<CreditCard className="h-12 w-12" />} title="Henüz POS cihazı yok" />
      ) : (
        <>
          <DataTable<PosDevice> columns={columns} data={devices} rowKey={(d) => d.id} />
          <MobileCardList<PosDevice> data={devices} keyFn={(d) => d.id} header={(d) => d.name} subtitle={(d) => `Kod: ${d.posCode} • %${d.commissionRate} komisyon`} rightBadge={(d) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[d.status]}`}>{PosStatusLabel[d.status]}</span>} footer={(d) => <span className="text-xs text-on-surface-variant">{d.blockDays} gün bloke</span>} />
        </>
      )}
    </div>
  );
}
