import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare, Square, Clock, AlertCircle, FileText, Package, Wallet, Users, ShoppingCart, Bell, ChevronRight, X,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/data/EmptyState';
import toast from 'react-hot-toast';

type TaskType = 'approval' | 'overdue' | 'low-stock' | 'pending-payment' | 'info';
type TaskPriority = 'high' | 'medium' | 'low';
type TaskStatus = 'pending' | 'done' | 'dismissed';

interface Task {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  refType?: 'customer' | 'product' | 'sale' | 'collection' | 'order';
  refId?: string;
  refLabel?: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  dueDate?: string;
}

const MOCK_TASKS: Task[] = [
  {
    id: '1',
    type: 'approval',
    title: '3 tahsilat onay bekliyor',
    description: 'Müşterilerden gelen ödemeler kasanıza aktarılmak için onayınızı bekliyor.',
    refType: 'collection',
    priority: 'high',
    status: 'pending',
    createdAt: '2026-06-02 09:30',
    dueDate: '2026-06-02',
  },
  {
    id: '2',
    type: 'overdue',
    title: 'ABC Ltd\'nin 3 faturası vadesi geçti',
    description: 'Toplam 12.450 ₺ tutarında 3 satış faturası 30+ gündür ödenmedi.',
    refType: 'customer',
    refId: 'cust-1',
    refLabel: 'ABC Ltd.',
    priority: 'high',
    status: 'pending',
    createdAt: '2026-06-01',
  },
  {
    id: '3',
    type: 'low-stock',
    title: '5 ürün minimum stoğun altında',
    description: 'Bu ürünler için acilen yeni sipariş vermeniz önerilir.',
    refType: 'product',
    priority: 'medium',
    status: 'pending',
    createdAt: '2026-06-01',
  },
  {
    id: '4',
    type: 'pending-payment',
    title: 'DEF A.Ş. için 8.500 ₺ ödeme planlandı',
    description: 'Bugün yapılması gereken ödeme — onaylayın veya erteleyin.',
    refType: 'collection',
    priority: 'medium',
    status: 'pending',
    createdAt: '2026-06-02 08:00',
    dueDate: '2026-06-02',
  },
  {
    id: '5',
    type: 'info',
    title: 'Yeni sipariş: OR-2026-000045',
    description: 'GHI Ticaret\'ten 3 kalemlik yeni sipariş alındı.',
    refType: 'order',
    refLabel: 'OR-2026-000045',
    priority: 'low',
    status: 'pending',
    createdAt: '2026-06-02 07:45',
  },
  {
    id: '6',
    type: 'overdue',
    title: '2 tahsilat hatırlatma gönderilmeli',
    description: 'Vadesi 7 günden fazla geçen 2 tahsilat için müşteriye hatırlatma atılmalı.',
    refType: 'customer',
    refLabel: 'XYZ Ltd.',
    priority: 'medium',
    status: 'pending',
    createdAt: '2026-05-30',
  },
  {
    id: '7',
    type: 'approval',
    title: 'S-2026-000123 iptal talebi',
    description: 'Müşteri 25.000 ₺\'lik satıştan vazgeçti. İptal onayı bekliyor.',
    refType: 'sale',
    refLabel: 'S-2026-000123',
    priority: 'high',
    status: 'pending',
    createdAt: '2026-06-01 16:20',
  },
  {
    id: '8',
    type: 'info',
    title: 'Aylık rapor hazır',
    description: 'Mayıs 2026 ciro, tahsilat ve stok raporları oluşturuldu.',
    priority: 'low',
    status: 'done',
    createdAt: '2026-06-01 09:00',
  },
];

const TYPE_ICON: Record<TaskType, React.ReactNode> = {
  approval: <CheckSquare className="h-4 w-4" />,
  overdue: <AlertCircle className="h-4 w-4" />,
  'low-stock': <Package className="h-4 w-4" />,
  'pending-payment': <Wallet className="h-4 w-4" />,
  info: <Bell className="h-4 w-4" />,
};

const TYPE_LABEL: Record<TaskType, string> = {
  approval: 'Onay Bekliyor',
  overdue: 'Vadesi Geçen',
  'low-stock': 'Stok Uyarısı',
  'pending-payment': 'Ödeme',
  info: 'Bilgi',
};

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  high: 'border-l-error',
  medium: 'border-l-tertiary',
  low: 'border-l-on-surface-variant',
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  high: 'Yüksek',
  medium: 'Orta',
  low: 'Düşük',
};

export function TasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('pending');
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');

  const filtered = tasks.filter((t) => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    return true;
  });

  const counts = {
    pending: tasks.filter((t) => t.status === 'pending').length,
    done: tasks.filter((t) => t.status === 'done').length,
    high: tasks.filter((t) => t.priority === 'high' && t.status === 'pending').length,
  };

  const handleComplete = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'done' } : t)));
    toast.success('Görev tamamlandı');
  };

  const handleDismiss = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'dismissed' } : t)));
    toast.success('Görev kapatıldı');
  };

  const handleClick = (task: Task) => {
    if (task.refId && task.refType) {
      const paths: Record<string, string> = {
        customer: `/customers/${task.refId}`,
        product: `/products/${task.refId}`,
        sale: `/sales/${task.refId}`,
        collection: `/collections/${task.refId}`,
        order: `/orders/${task.refId}`,
      };
      navigate(paths[task.refType] ?? '/tasks');
    } else if (task.type === 'low-stock') {
      navigate('/products');
    } else if (task.type === 'pending-payment' || task.type === 'approval') {
      navigate('/collections');
    } else if (task.refType === 'order') {
      navigate('/orders');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Görev & Bildirim Merkezi"
        description="Yapılacaklar, vadesi geçenler, stok uyarıları — tümü tek bakışta"
      />

      {/* İstatistik kartları */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="text-xs text-on-surface-variant">Bekleyen</div>
          <div className="font-mono font-bold text-2xl text-foreground">{counts.pending}</div>
        </div>
        <div className="card p-4 bg-error-container">
          <div className="text-xs text-error">Yüksek Öncelik</div>
          <div className="font-mono font-bold text-2xl text-error">{counts.high}</div>
        </div>
        <div className="card p-4 bg-secondary-container">
          <div className="text-xs text-on-secondary-container">Tamamlanan</div>
          <div className="font-mono font-bold text-2xl text-secondary">{counts.done}</div>
        </div>
      </div>

      {/* Filtre çubuğu */}
      <div className="card p-3 flex flex-col sm:flex-row gap-2">
        <div className="flex gap-1 flex-1">
          {(['all', 'pending', 'done'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 h-8 rounded-md text-xs font-medium transition-colors ${
                filter === f ? 'bg-primary text-on-primary' : 'bg-surface-container text-foreground hover:bg-surface-high'
              }`}
            >
              {f === 'all' ? 'Tümü' : f === 'pending' ? 'Bekleyen' : 'Tamamlanan'}
            </button>
          ))}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TaskType | 'all')}
          className="h-8 px-2 rounded-md bg-surface-container text-xs border border-outline-variant"
        >
          <option value="all">Tüm Tipler</option>
          {Object.entries(TYPE_LABEL).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Görev listesi */}
      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<CheckSquare className="h-8 w-8" />}
            title="Görev kalmadı"
            description={filter === 'done' ? 'Henüz tamamlanan görev yok' : 'Tüm görevler tamamlandı 🎉'}
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-outline-variant">
            {filtered.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 p-4 border-l-4 ${
                  PRIORITY_COLOR[task.priority]
                } ${task.status === 'done' ? 'opacity-60' : ''} hover:bg-surface-container`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => task.status === 'pending' && handleComplete(task.id)}
                  disabled={task.status !== 'pending'}
                  className="flex-shrink-0"
                >
                  {task.status === 'done' ? (
                    <CheckSquare className="h-5 w-5 text-secondary" />
                  ) : (
                    <Square className="h-5 w-5 text-on-surface-variant hover:text-primary" />
                  )}
                </button>

                {/* Tip ikonu */}
                <div className={`p-1.5 rounded-md ${
                  task.type === 'overdue' ? 'bg-error-container text-error' :
                  task.type === 'low-stock' ? 'bg-tertiary-container text-tertiary' :
                  task.type === 'pending-payment' || task.type === 'approval' ? 'bg-primary-container text-primary' :
                  'bg-surface-variant text-on-surface-variant'
                }`}>
                  {TYPE_ICON[task.type]}
                </div>

                {/* İçerik */}
                <button
                  onClick={() => handleClick(task)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className={`font-medium ${task.status === 'done' ? 'line-through text-on-surface-variant' : 'text-foreground'}`}>
                    {task.title}
                  </div>
                  <div className="text-xs text-on-surface-variant mt-0.5 truncate">
                    {task.description}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-on-surface-variant">
                    <span className="font-medium text-primary">{TYPE_LABEL[task.type]}</span>
                    <span>·</span>
                    <span>{PRIORITY_LABEL[task.priority]} öncelik</span>
                    {task.dueDate && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {task.dueDate}
                        </span>
                      </>
                    )}
                    {task.refLabel && (
                      <>
                        <span>·</span>
                        <span className="font-mono">{task.refLabel}</span>
                      </>
                    )}
                  </div>
                </button>

                {/* Aksiyonlar */}
                <div className="flex items-center gap-1">
                  {task.status === 'pending' && (
                    <button
                      onClick={() => handleDismiss(task.id)}
                      className="btn-ghost p-1.5"
                      title="Kapat"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleClick(task)}
                    className="btn-ghost p-1.5"
                    title="Detaya git"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hızlı linkler */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { icon: <Users className="h-4 w-4" />, label: 'Borçlular', to: '/customers?status=overdue' },
          { icon: <Package className="h-4 w-4" />, label: 'Stok Uyarıları', to: '/products?lowStock=true' },
          { icon: <ShoppingCart className="h-4 w-4" />, label: 'Bekleyen Siparişler', to: '/orders?status=PENDING' },
          { icon: <FileText className="h-4 w-4" />, label: 'Onay Bekleyen Tahsilatlar', to: '/collections?status=PENDING' },
        ].map((link) => (
          <button
            key={link.to}
            onClick={() => navigate(link.to)}
            className="card p-3 text-left flex items-center gap-2 hover:border-primary"
          >
            <div className="text-primary">{link.icon}</div>
            <span className="text-sm font-medium text-foreground">{link.label}</span>
            <ChevronRight className="h-3 w-3 text-on-surface-variant ml-auto" />
          </button>
        ))}
      </div>
    </div>
  );
}