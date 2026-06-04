import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Barcode, Play, CheckSquare, Send, CheckCircle, X, Package, AlertCircle, Edit, TrendingUp, TrendingDown,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import {
  useStockCount, useStartStockCount, useCompleteStockCount, useSubmitForApproval, useApproveStockCount, useCancelStockCount,
} from '@/features/stock-count/api';
import { formatDate } from '@saas/shared';
import toast from 'react-hot-toast';

const STATUS_LABEL = {
  DRAFT: { text: 'Taslak', color: 'bg-surface-variant text-on-surface-variant' },
  IN_PROGRESS: { text: 'Devam Ediyor', color: 'bg-primary-container text-primary' },
  COMPLETED: { text: 'Tamamlandı', color: 'bg-secondary-container text-secondary' },
  PENDING_APPROVAL: { text: 'Onay Bekliyor', color: 'bg-tertiary-container text-tertiary' },
  APPROVED: { text: 'Onaylandı', color: 'bg-secondary-container text-secondary' },
  CANCELLED: { text: 'İptal', color: 'bg-error-container text-error' },
} as const;

const ITEM_STATUS = {
  PENDING: { text: 'Bekliyor', color: 'bg-surface-variant text-on-surface-variant' },
  COUNTED: { text: 'Sayıldı', color: 'bg-secondary-container text-secondary' },
  SKIPPED: { text: 'Atlandı', color: 'bg-surface-variant text-on-surface-variant' },
  RECOUNT_NEEDED: { text: 'Yeniden Say', color: 'bg-error-container text-error' },
} as const;

export function StockCountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { data, isLoading, isError, error, refetch } = useStockCount(id);
  const start = useStartStockCount();
  const complete = useCompleteStockCount();
  const submit = useSubmitForApproval();
  const approve = useApproveStockCount();
  const cancel = useCancelStockCount();

  if (isLoading) return <LoadingState label="Sayım yükleniyor…" />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!data) return null;

  const items = (data.items ?? []) as any[];
  const counted = items.filter((i) => i.status === 'COUNTED').length;
  const pending = items.filter((i) => i.status === 'PENDING').length;
  const differences = items.filter((i) => i.difference != null && i.difference !== 0);
  const positiveDiff = differences.filter((i) => i.difference > 0).reduce((s, i) => s + i.difference, 0);
  const negativeDiff = Math.abs(differences.filter((i) => i.difference < 0).reduce((s, i) => s + i.difference, 0));
  const st = (STATUS_LABEL as any)[data.status];

  const filteredItems = items.filter((i) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return i.productName.toLowerCase().includes(s) || (i.barcode ?? '').toLowerCase().includes(s);
  });

  const columns: DataTableColumn<any>[] = [
    {
      key: 'product',
      label: 'Ürün',
      render: (i) => (
        <div>
          <div className="font-medium text-foreground">{i.productName}</div>
          <div className="text-xs font-mono text-on-surface-variant">{i.productCode}{i.barcode ? ` · ${i.barcode}` : ''}</div>
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
      render: (i) => i.countedQuantity != null ? <span className="font-mono font-semibold text-foreground">{i.countedQuantity.toLocaleString('tr-TR')}</span> : <span className="text-on-surface-variant">—</span>,
    },
    {
      key: 'difference',
      label: 'Fark',
      align: 'right',
      render: (i) => {
        if (i.difference == null) return '—';
        if (i.difference === 0) return <span className="font-mono text-on-surface-variant">0</span>;
        return (
          <span className={`font-mono font-semibold flex items-center gap-1 justify-end ${
            i.difference > 0 ? 'text-secondary' : 'text-error'
          }`}>
            {i.difference > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {i.difference > 0 ? '+' : ''}{i.difference}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Durum',
      align: 'center',
      render: (i) => {
        const s = (ITEM_STATUS as any)[i.status];
        return <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${s?.color}`}>{s?.text}</span>;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`${data.countNumber} — ${data.name}`}
        description={`${data.warehouseName} · ${data.countType}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => navigate('/stock-counts')} className="btn-ghost">
              <ArrowLeft className="h-4 w-4" />
              Sayımlar
            </button>
            {data.status === 'DRAFT' && (
              <button
                onClick={() => start.mutate(id!, { onSuccess: () => toast.success('Sayım başlatıldı') })}
                className="btn-primary"
              >
                <Play className="h-4 w-4" />
                Sayımı Başlat
              </button>
            )}
            {data.status === 'IN_PROGRESS' && (
              <>
                <button onClick={() => navigate(`/stock-counts/${id}/barcode`)} className="btn-primary">
                  <Barcode className="h-4 w-4" />
                  Barkodla Say
                </button>
                <button
                  onClick={() => complete.mutate(id!, { onSuccess: () => toast.success('Sayım tamamlandı') })}
                  className="btn-ghost"
                >
                  <CheckSquare className="h-4 w-4" />
                  Tamamla
                </button>
              </>
            )}
            {data.status === 'COMPLETED' && (
              <button
                onClick={() => submit.mutate(id!, { onSuccess: () => toast.success('Onaya gönderildi') })}
                className="btn-primary"
              >
                <Send className="h-4 w-4" />
                Onaya Gönder
              </button>
            )}
            {data.status === 'PENDING_APPROVAL' && (
              <button
                onClick={() => approve.mutate(id!, { onSuccess: () => toast.success('Sayım onaylandı — ADJUST hareketleri oluşturuldu') })}
                className="btn-primary"
              >
                <CheckCircle className="h-4 w-4" />
                Onayla
              </button>
            )}
            {(data.status === 'DRAFT' || data.status === 'IN_PROGRESS' || data.status === 'PENDING_APPROVAL') && (
              <button onClick={() => setShowCancelModal(true)} className="btn-ghost text-error">
                <X className="h-4 w-4" />
                İptal
              </button>
            )}
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${st?.color}`}>
          {st?.text}
        </span>
      </div>

      {/* Özet kartları */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="card p-3">
          <div className="text-xs text-on-surface-variant">Toplam Ürün</div>
          <div className="font-mono font-bold text-2xl text-foreground">{items.length}</div>
        </div>
        <div className="card p-3 bg-secondary-container">
          <div className="text-xs text-on-secondary-container">Sayıldı</div>
          <div className="font-mono font-bold text-2xl text-secondary">{counted}</div>
        </div>
        <div className="card p-3">
          <div className="text-xs text-on-surface-variant">Bekleyen</div>
          <div className="font-mono font-bold text-2xl text-on-surface-variant">{pending}</div>
        </div>
        <div className="card p-3 bg-secondary-container">
          <div className="text-xs text-on-secondary-container">Pozitif Fark</div>
          <div className="font-mono font-bold text-lg text-secondary">+{positiveDiff.toLocaleString('tr-TR')}</div>
        </div>
        <div className="card p-3 bg-error-container">
          <div className="text-xs text-error">Negatif Fark</div>
          <div className="font-mono font-bold text-lg text-error">−{negativeDiff.toLocaleString('tr-TR')}</div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredItems}
        rowKey={(i) => i.id}
        search={{ value: search, onChange: setSearch, placeholder: 'Ürün adı veya barkod…' }}
        totalLabel="kalem"
        emptyMessage="Sayım kalemi yok"
      />

      <MobileCardList
        data={filteredItems}
        keyFn={(i) => i.id}
        header={(i) => i.productName}
        subtitle={(i) => `Sistem: ${i.systemQuantity} → Sayılan: ${i.countedQuantity ?? '—'}`}
        rightBadge={(i) => {
          if (i.difference == null || i.difference === 0) return null;
          return (
            <span className={`font-mono font-semibold ${i.difference > 0 ? 'text-secondary' : 'text-error'}`}>
              {i.difference > 0 ? '+' : ''}{i.difference}
            </span>
          );
        }}
      />

      <ConfirmModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={async () => {
          await cancel.mutateAsync(id!);
          setShowCancelModal(false);
          toast.success('Sayım iptal edildi');
          navigate('/stock-counts');
        }}
        title="Sayım İptal Edilsin mi?"
        description={
          <span>
            <strong>{data.name}</strong> sayımı iptal edilecek. Henüz onaylanmamışsa hareket oluşmamıştır.
          </span>
        }
        confirmText="Evet, İptal Et"
        loading={cancel.isPending}
      />
    </div>
  );
}