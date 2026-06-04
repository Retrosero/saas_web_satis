import { useState } from 'react';
import { TrendingDown, Building2, CreditCard } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { StatCard } from '@/components/cards/StatCard';
import { usePosCommissionReport, usePosDevices } from '@/features/banks/api';
import { formatCurrency } from '@saas/shared';

export function PosCommissionPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [posDeviceId, setPosDeviceId] = useState('all');
  const { data: devices = [] } = usePosDevices();
  const { data: report, isLoading, error, refetch } = usePosCommissionReport({
    from: from || undefined, to: to || undefined, posDeviceId: posDeviceId !== 'all' ? posDeviceId : undefined,
  });

  const columns: DataTableColumn<any>[] = [
    { key: 'deviceName', label: 'POS Cihazı', render: (r) => <span className="font-semibold">{r.deviceName}</span> },
    { key: 'count', label: 'İşlem Sayısı', width: '130px', align: 'right', render: (r) => r.count },
    { key: 'gross', label: 'Brüt Toplam', width: '160px', align: 'right', render: (r) => formatCurrency(r.gross) },
    { key: 'commission', label: 'Komisyon', width: '160px', align: 'right', render: (r) => <span className="text-red-600">{formatCurrency(r.commission)}</span> },
    { key: 'net', label: 'Net', width: '160px', align: 'right', render: (r) => <span className="font-semibold text-green-700">{formatCurrency(r.net)}</span> },
    { key: 'rate', label: 'Oran', width: '100px', align: 'right', render: (r) => `${r.gross > 0 ? ((r.commission / r.gross) * 100).toFixed(2) : 0}%` },
  ];

  if (error) return <ErrorState message="Komisyon raporu yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader title="POS Komisyon Takibi" description="Cihaz bazında brüt/komisyon/net tutarlar" />

      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-[200px]"><label className="mb-1 block text-xs font-medium">POS Cihazı</label><select value={posDeviceId} onChange={(e) => setPosDeviceId(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm"><option value="all">Tüm Cihazlar</option>{devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          <div className="w-[170px]"><label className="mb-1 block text-xs font-medium">Başlangıç</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
          <div className="w-[170px]"><label className="mb-1 block text-xs font-medium">Bitiş</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Brüt Toplam" value={formatCurrency(report?.totalGross ?? 0)} icon={<CreditCard className="h-5 w-5" />} />
        <StatCard label="Toplam Komisyon" value={formatCurrency(report?.totalCommission ?? 0)} icon={<TrendingDown className="h-5 w-5" />} />
        <StatCard label="Net Tutar" value={formatCurrency(report?.totalNet ?? 0)} icon={<Building2 className="h-5 w-5" />} />
      </div>

      {isLoading ? <LoadingState /> : (
        <DataTable columns={columns} data={report?.byDevice ?? []} rowKey={(r) => r.posDeviceId} />
      )}
    </div>
  );
}
