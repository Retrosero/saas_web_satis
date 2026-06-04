import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Eye, Pencil, Power, Filter, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useBankAccounts, useDeleteBankAccount, type BankAccountWithBalance } from '@/features/banks/api';
import {
  BankAccountStatusLabel,
  BankAccountTypeLabel,
  formatCurrency,
  type BankAccountStatus,
  type BankAccountType,
} from '@saas/shared';

const STATUS_COLOR: Record<BankAccountStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PASSIVE: 'bg-gray-200 text-gray-700',
  BLOCKED: 'bg-red-100 text-red-800',
};

export function BankAccountsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BankAccountStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<BankAccountType | 'all'>('all');
  const [confirmDelete, setConfirmDelete] = useState<BankAccountWithBalance | null>(null);

  const { data, isLoading, error, refetch } = useBankAccounts({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
  });

  const deleteMut = useDeleteBankAccount();
  const accounts = data ?? [];

  const columns: DataTableColumn<BankAccountWithBalance>[] = [
    { key: 'bankName', label: 'Banka', sortable: true, render: (a) => <span className="font-semibold">{a.bankName}</span> },
    { key: 'accountName', label: 'Hesap Adı', render: (a) => a.accountName },
    { key: 'iban', label: 'IBAN', hideOnMobile: true, render: (a) => <span className="font-mono text-xs">{a.iban ?? '—'}</span> },
    { key: 'type', label: 'Tip', width: '130px', hideOnMobile: true, render: (a) => BankAccountTypeLabel[a.type] },
    { key: 'currency', label: 'PB', width: '70px', render: (a) => a.currency },
    { key: 'balance', label: 'Bakiye', width: '150px', align: 'right', render: (a) => <span className={`font-semibold ${a.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(a.balance, a.currency)}</span> },
    { key: 'status', label: 'Durum', width: '100px', render: (a) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[a.status]}`}>{BankAccountStatusLabel[a.status]}</span> },
    {
      key: 'actions', label: 'İşlem', width: '160px', render: (a) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => navigate(`/banks/transactions?accountId=${a.id}`)} className="rounded-md p-1.5 text-primary hover:bg-primary-container/40" title="Hareketler"><Eye className="h-4 w-4" /></button>
          <button onClick={() => navigate(`/banks/accounts/${a.id}/edit`)} className="rounded-md p-1.5 text-primary hover:bg-primary-container/40" title="Düzenle"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setConfirmDelete(a)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50" title="Sil"><Power className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message="Banka hesapları yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Banka Hesapları"
        description="Firmanın banka hesaplarını yönetin"
        actions={
          <button onClick={() => navigate('/banks/accounts/new')} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary">
            <Plus className="h-4 w-4" /> Yeni Banka Hesabı
          </button>
        }
      />

      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-xs font-medium">Arama</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Banka, hesap adı, IBAN..." className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
          </div>
          <div className="w-[150px]">
            <label className="mb-1 block text-xs font-medium">Durum</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
              <option value="all">Tümü</option>
              <option value="ACTIVE">{BankAccountStatusLabel.ACTIVE}</option>
              <option value="PASSIVE">{BankAccountStatusLabel.PASSIVE}</option>
              <option value="BLOCKED">{BankAccountStatusLabel.BLOCKED}</option>
            </select>
          </div>
          <div className="w-[150px]">
            <label className="mb-1 block text-xs font-medium">Tip</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
              <option value="all">Tümü</option>
              <option value="CHECKING">{BankAccountTypeLabel.CHECKING}</option>
              <option value="SAVINGS">{BankAccountTypeLabel.SAVINGS}</option>
              <option value="FOREIGN_CURRENCY">{BankAccountTypeLabel.FOREIGN_CURRENCY}</option>
              <option value="POS">{BankAccountTypeLabel.POS}</option>
            </select>
          </div>
          <button onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); }} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm">
            <Filter className="h-4 w-4" /> Temizle
          </button>
        </div>
      </div>

      {isLoading ? <LoadingState /> : accounts.length === 0 ? (
        <EmptyState icon={<Building2 className="h-12 w-12" />} title="Henüz banka hesabı yok" description="İlk banka hesabınızı ekleyerek başlayın" />
      ) : (
        <>
          <DataTable<BankAccountWithBalance> columns={columns} data={accounts} rowKey={(a) => a.id} onRowClick={(a) => navigate(`/banks/accounts/${a.id}`)} />
          <MobileCardList<BankAccountWithBalance>
            data={accounts}
            keyFn={(a) => a.id}
            onItemClick={(a) => navigate(`/banks/accounts/${a.id}`)}
            header={(a) => `${a.bankName} - ${a.accountName}`}
            subtitle={(a) => a.iban ?? '—'}
            rightBadge={(a) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[a.status]}`}>{BankAccountStatusLabel[a.status]}</span>}
            footer={(a) => <div className="flex items-center justify-between text-xs"><span className="text-on-surface-variant">{a.transactionCount} işlem</span><span className={`font-semibold ${a.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(a.balance, a.currency)}</span></div>}
          />
        </>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title="Banka Hesabı Silinsin mi?"
        description={`${confirmDelete?.bankName} - ${confirmDelete?.accountName} silinecek. Hareket içeren hesap silinemez.`}
        confirmText="Sil"
        variant="danger"
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete) {
            await deleteMut.mutateAsync(confirmDelete.id);
            setConfirmDelete(null);
          }
        }}
      />
    </div>
  );
}
