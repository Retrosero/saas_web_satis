import { useNavigate } from 'react-router-dom';
import { Wallet, ShoppingCart, History, TrendingUp, Package } from 'lucide-react';
import { usePortalProfile, usePortalBalance, usePortalOrders } from '@/features/portal/api';
import { StatCard } from '@/components/cards/StatCard';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { formatCurrency, formatDate } from '@saas/shared';

export function PortalDashboardPage() {
  const navigate = useNavigate();
  const { data: profile, isLoading: pl } = usePortalProfile();
  const { data: balance, isLoading: bl } = usePortalBalance();
  const { data: orders } = usePortalOrders({ pageSize: 5 });

  if (pl || bl) return <LoadingState />;
  if (!profile || !balance) return <ErrorState message="Profil yüklenemedi" />;

  const recent = orders?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-6 text-on-primary">
        <h2 className="text-2xl font-bold mb-1">Hoş geldiniz, {profile.name}!</h2>
        <p className="text-sm opacity-90">Siparişlerinizi kolayca yönetin, bakiyenizi takip edin.</p>
        <button onClick={() => navigate('/portal/catalog')} className="mt-4 inline-flex items-center gap-2 rounded-md bg-on-primary px-4 py-2 text-sm font-medium text-primary">
          <ShoppingCart className="h-4 w-4" /> Hızlı Sipariş Ver
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Güncel Bakiye" value={formatCurrency(balance.balance)} icon={<Wallet className="h-5 w-5" />} hint={`Borç: ${formatCurrency(balance.totalDebit)} • Alacak: ${formatCurrency(balance.totalCredit)}`} />
        <StatCard label="Toplam Sipariş" value={orders?.pagination.total ?? 0} icon={<History className="h-5 w-5" />} />
        <StatCard label="Kredi Limiti" value={formatCurrency(profile.creditLimit)} icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      <div className="rounded-lg border border-outline-variant bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Package className="h-4 w-4" /> Son Siparişler</h3>
          <button onClick={() => navigate('/portal/orders')} className="text-xs text-primary hover:underline">Tümünü Gör</button>
        </div>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-on-surface-variant">Henüz siparişiniz yok</p>
        ) : (
          <ul className="divide-y divide-outline-variant">
            {recent.map((o) => (
              <li key={o.id} onClick={() => navigate(`/portal/orders/${o.id}`)} className="flex cursor-pointer items-center justify-between py-2.5 hover:bg-surface-variant/50 px-2 rounded">
                <div>
                  <p className="font-mono text-sm font-semibold">{o.orderNumber}</p>
                  <p className="text-xs text-on-surface-variant">{formatDate(o.orderDate)} • {o.warehouse ?? '—'}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(o.grandTotal)}</p>
                  <p className="text-xs text-on-surface-variant">{o.itemCount} kalem</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
