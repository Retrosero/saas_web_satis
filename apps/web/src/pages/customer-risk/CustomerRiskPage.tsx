import { useState } from 'react';
import { RefreshCw, AlertTriangle, TrendingUp, Users, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { CustomerRiskLevel, CustomerRiskLevelLabel, CustomerRiskLevelColor, formatDate } from '@saas/shared';
import { useCustomerRiskDashboard, useRefreshCustomerRisk, useAtRiskCustomers } from '@/features/ux-bulk/api';
const COLOR_BG: Record<string, string> = { blue: 'bg-blue-100 text-blue-800', green: 'bg-green-100 text-green-800', red: 'bg-red-100 text-red-800', amber: 'bg-amber-100 text-amber-800', gray: 'bg-gray-200 text-gray-700' };

export function CustomerRiskPage() {
  const { data: dash, isLoading } = useCustomerRiskDashboard();
  const { data: atRisk } = useAtRiskCustomers({ pageSize: 30 });
  const refresh = useRefreshCustomerRisk();
  const [levelFilter, setLevelFilter] = useState<string>('');
  const filtered = (atRisk?.items ?? []).filter((r: any) => !levelFilter || r.riskLevel === levelFilter);

  const columns: DataTableColumn<any>[] = [
    { key: 'customer', label: 'Müşteri', render: (r) => <div><p className="font-semibold">{r.customerName}</p><p className="text-xs text-on-surface-variant">Skor: {r.riskScore}</p></div> },
    { key: 'level', label: 'Risk', render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_BG[CustomerRiskLevelColor[r.riskLevel as keyof typeof CustomerRiskLevelColor]]}`}>{CustomerRiskLevelLabel[r.riskLevel as keyof typeof CustomerRiskLevelLabel]}</span> },
    { key: 'balance', label: 'Bakiye', align: 'right', render: (r) => <span className="font-semibold">{Number(r.balance).toLocaleString('tr-TR')} TRY</span> },
    { key: 'order', label: 'Son Sipariş', hideOnMobile: true, render: (r) => r.daysSinceOrder != null ? `${r.daysSinceOrder} gün önce` : '—' },
    { key: 'payment', label: 'Son Ödeme', hideOnMobile: true, render: (r) => r.daysSincePayment != null ? `${r.daysSincePayment} gün önce` : '—' },
    { key: 'snapshot', label: 'Son Kontrol', hideOnMobile: true, render: (r) => <span className="text-xs text-on-surface-variant">{formatDate(r.snapshotAt)}</span> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Müşteri Risk Yönetimi" description="Riskli müşterileri tespit et, aksiyon al"
        actions={<button onClick={() => refresh.mutate()} disabled={refresh.isPending} className="flex items-center gap-1 rounded-md border border-outline px-3 py-2 text-sm"><RefreshCw className={`h-4 w-4 ${refresh.isPending ? 'animate-spin' : ''}`} /> Yenile</button>}
      />

      {isLoading ? <LoadingState /> : dash && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg border border-outline bg-surface p-3"><div className="flex items-center gap-2 text-xs text-on-surface-variant"><AlertTriangle className="h-3 w-3" /> Risk Altında</div><p className="text-2xl font-bold">{dash.totalAtRisk}</p></div>
          <div className="rounded-lg border border-green-300 bg-green-50 p-3"><div className="flex items-center gap-2 text-xs text-on-surface-variant"><Users className="h-3 w-3" /> Düşük</div><p className="text-2xl font-bold text-green-600">{dash.low}</p></div>
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3"><div className="flex items-center gap-2 text-xs text-on-surface-variant"><TrendingUp className="h-3 w-3" /> Orta</div><p className="text-2xl font-bold text-amber-600">{dash.medium}</p></div>
          <div className="rounded-lg border border-orange-300 bg-orange-50 p-3"><div className="flex items-center gap-2 text-xs text-on-surface-variant"><AlertTriangle className="h-3 w-3" /> Yüksek</div><p className="text-2xl font-bold text-orange-600">{dash.high}</p></div>
          <div className="rounded-lg border border-red-300 bg-red-50 p-3"><div className="flex items-center gap-2 text-xs text-on-surface-variant"><DollarSign className="h-3 w-3" /> Kritik</div><p className="text-2xl font-bold text-red-600">{dash.critical}</p></div>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => setLevelFilter('')} className={`rounded-md px-3 py-1.5 text-sm ${!levelFilter ? 'bg-primary text-on-primary' : 'border'}`}>Tümü</button>
        {Object.values(CustomerRiskLevel).map((l) => <button key={l} onClick={() => setLevelFilter(l)} className={`rounded-md px-3 py-1.5 text-sm ${levelFilter === l ? 'bg-primary text-on-primary' : 'border'}`}>{CustomerRiskLevelLabel[l]}</button>)}
      </div>

      {filtered.length === 0 ? <p className="rounded-lg border border-outline bg-surface p-6 text-center text-sm text-on-surface-variant">Riskli müşteri bulunamadı</p> : <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} />}
    </div>
  );
}
