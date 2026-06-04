import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { useStockCount } from '@/features/stock-count/api';

export function StockCountDifferencesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useStockCount(id);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');

  if (isLoading) return <LoadingState label="Farklar yükleniyor…" />;
  if (!data) return null;

  const items = ((data.items ?? []) as any[]).filter((i) => i.difference != null && i.difference !== 0);
  const positive = items.filter((i) => i.difference > 0);
  const negative = items.filter((i) => i.difference < 0);
  const positiveTotal = positive.reduce((s, i) => s + i.difference, 0);
  const negativeTotal = Math.abs(negative.reduce((s, i) => s + i.difference, 0));

  const filtered = items.filter((i) => {
    if (filter === 'all') return true;
    if (filter === 'positive') return i.difference > 0;
    return i.difference < 0;
  });

  const columns: DataTableColumn<any>[] = [
    {
      key: 'product',
      label: 'Ürün',
      render: (i) => (
        <div>
          <div className="font-medium">{i.productName}</div>
          <div className="text-xs font-mono text-on-surface-variant">{i.productCode}</div>
        </div>
      ),
    },
    {
      key: 'system',
      label: 'Sistem',
      align: 'right',
      render: (i) => <span className="font-mono">{i.systemQuantity.toLocaleString('tr-TR')}</span>,
    },
    {
      key: 'counted',
      label: 'Sayılan',
      align: 'right',
      render: (i) => <span className="font-mono font-semibold">{i.countedQuantity.toLocaleString('tr-TR')}</span>,
    },
    {
      key: 'diff',
      label: 'Fark',
      align: 'right',
      sortable: true,
      render: (i) => (
        <span className={`font-mono font-semibold flex items-center gap-1 justify-end ${
          i.difference > 0 ? 'text-secondary' : 'text-error'
        }`}>
          {i.difference > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {i.difference > 0 ? '+' : ''}{i.difference}
        </span>
      ),
    },
    {
      key: 'percent',
      label: '% Sapma',
      align: 'right',
      render: (i) => {
        const pct = i.systemQuantity > 0 ? (i.difference / i.systemQuantity) * 100 : 0;
        return <span className="font-mono text-xs">{pct.toFixed(1)}%</span>;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`${data.countNumber} — Sayım Farkları`}
        description={`${data.name} · ${data.warehouseName}`}
        actions={
          <button onClick={() => navigate(`/stock-counts/${id}`)} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            Sayım Detayına Dön
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card p-4 bg-secondary-container">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-secondary" />
            <span className="text-xs text-on-secondary-container">Pozitif Fark (Sayım Fazlası)</span>
          </div>
          <div className="font-mono font-bold text-2xl text-secondary mt-1">+{positiveTotal.toLocaleString('tr-TR')}</div>
          <div className="text-xs text-on-secondary-container mt-1">{positive.length} ürün</div>
        </div>
        <div className="card p-4 bg-error-container">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-error" />
            <span className="text-xs text-error">Negatif Fark (Sayım Eksiği)</span>
          </div>
          <div className="font-mono font-bold text-2xl text-error mt-1">−{negativeTotal.toLocaleString('tr-TR')}</div>
          <div className="text-xs text-error mt-1">{negative.length} ürün</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-xs text-on-surface-variant">Net Fark</span>
          </div>
          <div className={`font-mono font-bold text-2xl mt-1 ${
            (positiveTotal - negativeTotal) >= 0 ? 'text-secondary' : 'text-error'
          }`}>
            {(positiveTotal - negativeTotal > 0 ? '+' : '')}{(positiveTotal - negativeTotal).toLocaleString('tr-TR')}
          </div>
          <div className="text-xs text-on-surface-variant mt-1">{items.length} üründe fark var</div>
        </div>
      </div>

      <div className="card p-3 flex gap-1">
        {(['all', 'positive', 'negative'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 h-8 rounded-md text-xs font-medium transition-colors ${
              filter === f ? 'bg-primary text-on-primary' : 'bg-surface-container text-foreground hover:bg-surface-high'
            }`}
          >
            {f === 'all' ? `Tümü (${items.length})` : f === 'positive' ? `Fazla (${positive.length})` : `Eksik (${negative.length})`}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(i) => i.id}
        totalLabel="farklı ürün"
        emptyMessage="Bu sayımda fark yok"
      />
    </div>
  );
}