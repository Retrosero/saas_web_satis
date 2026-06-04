import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Activity, Plus, Minus, ArrowLeftRight, Settings } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { useWarehouse } from '@/features/warehouses/api';
import { formatDate, formatCurrency } from '@saas/shared';

const TYPE_ICON = {
  IN: <Plus className="h-3 w-3" />,
  OUT: <Minus className="h-3 w-3" />,
  TRANSFER: <ArrowLeftRight className="h-3 w-3" />,
  ADJUST: <Settings className="h-3 w-3" />,
};

const TYPE_LABEL = {
  IN: 'Giriş',
  OUT: 'Çıkış',
  TRANSFER: 'Transfer',
  ADJUST: 'Düzeltme',
};

const TYPE_COLOR = {
  IN: 'bg-secondary-container text-secondary',
  OUT: 'bg-error-container text-error',
  TRANSFER: 'bg-tertiary-container text-tertiary',
  ADJUST: 'bg-surface-variant text-on-surface',
};

// Mock movements for now
const MOCK_MOVEMENTS = [
  { id: '1', date: '2026-06-02 14:30', productCode: 'U001', productName: 'Ürün 1', type: 'IN' as const, quantity: 50, refNumber: 'S-2026-000045', description: 'Alış faturası' },
  { id: '2', date: '2026-06-02 10:15', productCode: 'U002', productName: 'Ürün 2', type: 'OUT' as const, quantity: 5, refNumber: 'S-2026-000046', description: 'Müşteri satışı' },
  { id: '3', date: '2026-06-01 16:45', productCode: 'U003', productName: 'Ürün 3', type: 'TRANSFER' as const, quantity: 20, refNumber: 'TR-2026-000012', description: 'Şube 1\'e transfer' },
  { id: '4', date: '2026-06-01 09:20', productCode: 'U001', productName: 'Ürün 1', type: 'ADJUST' as const, quantity: -3, refNumber: 'ADJ-2026-000005', description: 'Sayım farkı' },
  { id: '5', date: '2026-05-31 14:00', productCode: 'U002', productName: 'Ürün 2', type: 'IN' as const, quantity: 100, refNumber: 'S-2026-000040', description: 'Stok girişi' },
];

export function WarehouseMovementsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: warehouse, isLoading } = useWarehouse(id);

  const rows = MOCK_MOVEMENTS;

  const columns: DataTableColumn<(typeof rows)[number]>[] = [
    {
      key: 'date',
      label: 'Tarih',
      width: '160px',
      sortable: true,
      render: (m) => <span className="font-mono text-xs">{m.date}</span>,
    },
    {
      key: 'product',
      label: 'Ürün',
      render: (m) => (
        <div>
          <div className="font-medium text-foreground">{m.productName}</div>
          <div className="text-xs font-mono text-on-surface-variant">{m.productCode}</div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Tip',
      align: 'center',
      width: '110px',
      render: (m) => (
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOR[m.type]}`}>
          {TYPE_ICON[m.type]}
          {TYPE_LABEL[m.type]}
        </span>
      ),
    },
    {
      key: 'quantity',
      label: 'Miktar',
      align: 'right',
      sortable: true,
      render: (m) => (
        <span className={`font-mono font-semibold ${
          m.type === 'IN' ? 'text-secondary' : m.type === 'OUT' ? 'text-error' : 'text-tertiary'
        }`}>
          {m.quantity > 0 ? '+' : ''}{m.quantity}
        </span>
      ),
    },
    {
      key: 'ref',
      label: 'Referans',
      hideOnMobile: true,
      render: (m) => <span className="font-mono text-xs">{m.refNumber ?? '—'}</span>,
    },
    {
      key: 'description',
      label: 'Açıklama',
      hideOnMobile: true,
      render: (m) => <span className="text-xs text-on-surface-variant">{m.description}</span>,
    },
  ];

  if (isLoading) return <LoadingState label="Depo yükleniyor…" />;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={warehouse ? `${warehouse.code} — Hareketler` : 'Depo Hareketleri'}
        description={warehouse ? `${warehouse.name} — Tüm stok hareketleri` : 'Bu depodaki tüm stok hareketleri'}
        actions={
          <button onClick={() => navigate(`/warehouses/${id}`)} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            Depoya Dön
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(m) => m.id}
        totalLabel="hareket"
        emptyMessage="Bu depoda henüz hareket yok"
      />

      <MobileCardList
        data={rows}
        keyFn={(m) => m.id}
        header={(m) => `${TYPE_LABEL[m.type]} — ${m.productName}`}
        subtitle={(m) => m.date}
        rightBadge={(m) => (
          <span className={`font-mono font-semibold ${
            m.type === 'IN' ? 'text-secondary' : m.type === 'OUT' ? 'text-error' : 'text-tertiary'
          }`}>
            {m.quantity > 0 ? '+' : ''}{m.quantity}
          </span>
        )}
        footer={(m) => m.description}
      />
    </div>
  );
}