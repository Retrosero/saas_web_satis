import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeftRight, Plus, CheckCircle2, Filter } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { useBankTransactions, useReconcileTransaction, type BankTransactionWithAccount } from '@/features/banks/api';
import {
  BankTransactionTypeLabel,
  formatCurrency,
  formatDate,
  type BankTransactionType,
} from '@saas/shared';

const TYPE_OPTIONS: Array<{ value: BankTransactionType | 'all'; label: string }> = [
  { value: 'all', label: 'Tümü' },
  { value: 'DEPOSIT', label: BankTransactionTypeLabel.DEPOSIT },
  { value: 'WITHDRAWAL', label: BankTransactionTypeLabel.WITHDRAWAL },
  { value: 'TRANSFER', label: BankTransactionTypeLabel.TRANSFER },
  { value: 'FEE', label: BankTransactionTypeLabel.FEE },
  { value: 'COLLECTION', label: BankTransactionTypeLabel.COLLECTION },
  { value: 'PAYMENT', label: BankTransactionTypeLabel.PAYMENT },
  { value: 'POS_COLLECTION', label: BankTransactionTypeLabel.POS_COLLECTION },
  { value: 'INTEREST', label: BankTransactionTypeLabel.INTEREST },
  { value: 'OTHER', label: BankTransactionTypeLabel.OTHER },
];

export function BankTransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<BankTransactionType | 'all'>('all');
  const [page, setPage] = useState(1);
  const accountId = searchParams.get('accountId') ?? undefined;

  const { data, isLoading, error, refetch } = useBankTransactions({
    page, pageSize: 25,
    bankAccountId: accountId,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    search: search || undefined,
  });
  const reconcile = useReconcileTransaction();

  const rows = data?.data ?? [];
  const pagination = data?.pagination;

  const columns: DataTableColumn<BankTransactionWithAccount>[] = [
    { key: 'txnDate', label: 'Tarih', width: '110px', sortable: true, render: (r) => formatDate(r.txnDate) },
    { key: 'bankAccountName', label: 'Hesap', hideOnMobile: true, render: (r) => r.bankAccountName ?? '—' },
    { key: 'type', label: 'Tip', width: '150px', render: (r) => BankTransactionTypeLabel[r.type] },
    { key: 'description', label: 'Açıklama', render: (r) => r.description ?? '—' },
    { key: 'amount', label: 'Tutar', width: '150px', align: 'right', render: (r) => <span className={`font-semibold ${r.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>{r.amount >= 0 ? '+' : ''}{formatCurrency(r.amount, r.currency)}</span> },
    { key: 'isReconciled', label: 'Mutabık', width: '100px', render: (r) => r.isReconciled ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Evet</span> : <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">Hayır</span> },
    {
      key: 'actions', label: '', width: '60px', render: (r) => !r.isReconciled ? (
        <button onClick={async () => { await reconcile.mutateAsync(r.id); refetch(); }} className="rounded-md p-1.5 text-green-600 hover:bg-green-50" title="Mutabık işaretle"><CheckCircle2 className="h-4 w-4" /></button>
      ) : null,
    },
  ];

  if (error) return <ErrorState message="Banka hareketleri yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Banka Hareketleri"
        description={accountId ? 'Belirli bir hesabın hareketleri' : 'Tüm banka hesaplarının hareketleri'}
        actions={
          <button onClick={() => setSearchParams({})} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm">
            <Filter className="h-4 w-4" /> Hesap Filtresini Kaldır
          </button>
        }
      />

      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]"><label className="mb-1 block text-xs font-medium">Arama</label><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Açıklamada ara..." className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
          <div className="w-[180px]"><label className="mb-1 block text-xs font-medium">Tip</label><select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value as any); setPage(1); }} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">{TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
        </div>
      </div>

      {isLoading ? <LoadingState /> : rows.length === 0 ? (
        <EmptyState icon={<ArrowLeftRight className="h-12 w-12" />} title="Hareket bulunamadı" />
      ) : (
        <>
          <DataTable<BankTransactionWithAccount> columns={columns} data={rows} rowKey={(r) => r.id} />
          <MobileCardList<BankTransactionWithAccount>
            data={rows}
            keyFn={(r) => r.id}
            header={(r) => BankTransactionTypeLabel[r.type]}
            subtitle={(r) => `${formatDate(r.txnDate)} • ${r.bankAccountName ?? '—'}`}
            footer={(r) => <div className="flex items-center justify-between text-xs"><span className="text-on-surface-variant">{r.description ?? '—'}</span><span className={`font-semibold ${r.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>{r.amount >= 0 ? '+' : ''}{formatCurrency(r.amount, r.currency)}</span></div>}
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
