import { useState } from 'react';
import { Download, Filter, FileText, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { usePortalStatement } from '@/features/portal/api';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { formatCurrency, formatDate } from '@saas/shared';
import type { PortalStatementItem } from '@/features/portal/api';

const MOVEMENT_LABEL: Record<string, string> = {
  DEBIT: 'Borç', CREDIT: 'Alacak',
};

export function PortalStatementPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data, isLoading, error, refetch } = usePortalStatement({ from: from || undefined, to: to || undefined, pageSize: 100 });
  const rows: PortalStatementItem[] = data?.data ?? [];

  const columns: DataTableColumn<PortalStatementItem>[] = [
    { key: 'movementDate', label: 'Tarih', width: '110px', render: (r) => formatDate(r.movementDate) },
    { key: 'type', label: 'Tip', width: '90px', render: (r) => <span className="flex items-center gap-1">{r.type === 'DEBIT' ? <ArrowUpCircle className="h-4 w-4 text-red-600" /> : <ArrowDownCircle className="h-4 w-4 text-green-600" />}{MOVEMENT_LABEL[r.type] ?? r.type}</span> },
    { key: 'description', label: 'Açıklama', render: (r) => r.description ?? '—' },
    { key: 'refNumber', label: 'Belge No', width: '140px', render: (r) => r.refNumber ? <span className="font-mono text-xs">{r.refNumber}</span> : '—' },
    { key: 'amount', label: 'Tutar', width: '150px', align: 'right', render: (r) => <span className={`font-semibold ${r.amountTry >= 0 ? 'text-green-700' : 'text-red-700'}`}>{r.amountTry >= 0 ? '+' : ''}{formatCurrency(r.amountTry, r.currency)}</span> },
  ];

  const exportCSV = () => {
    const csv = [
      ['Tarih', 'Tip', 'Açıklama', 'Belge No', 'Tutar'].join(','),
      ...rows.map((r) => [formatDate(r.movementDate), MOVEMENT_LABEL[r.type] ?? r.type, `"${r.description ?? ''}"`, r.refNumber ?? '', r.amountTry].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ekstre-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (error) return <ErrorState message="Ekstre yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-outline-variant bg-surface p-4">
        <div className="w-[170px]"><label className="mb-1 block text-xs font-medium">Başlangıç</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <div className="w-[170px]"><label className="mb-1 block text-xs font-medium">Bitiş</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <button onClick={exportCSV} disabled={rows.length === 0} className="ml-auto flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm disabled:opacity-40">
          <Download className="h-4 w-4" /> CSV İndir
        </button>
      </div>

      {isLoading ? <LoadingState /> : rows.length === 0 ? (
        <EmptyState icon={<FileText className="h-12 w-12" />} title="Hareket bulunamadı" />
      ) : (
        <DataTable<PortalStatementItem> columns={columns} data={rows} rowKey={(r) => r.id} />
      )}
    </div>
  );
}
