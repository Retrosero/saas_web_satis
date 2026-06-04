import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/cards/StatCard';
import { SystemWarningBanner } from '@/components/notifications/SystemWarningBanner';
import { useMe } from '@/features/auth/hooks';
import { formatCurrency, formatNumber, formatDate } from '@saas/shared';
import { TrendingUp, Users, Package, ShoppingCart, AlertCircle } from 'lucide-react';

export function DashboardPage() {
  const { data: user } = useMe();
  const today = new Date();

  return (
    <div className="flex flex-col gap-6">
      <SystemWarningBanner
        title="Demo Veriler"
        message="Bu ekran MVP iskeleti için placeholder değerler gösteriyor. Gerçek veriler FAZ 10'da (Temel Raporlar) eklenecek."
        variant="info"
      />

      <PageHeader
        title={`Merhaba, ${user?.fullName ?? 'Kullanıcı'} 👋`}
        description={`${formatDate(today, 'tr-TR')} — Bugünün özeti`}
        actions={
          <>
            <button className="btn-secondary">
              <Package className="h-4 w-4" />
              Tarama
            </button>
            <button className="btn-primary">
              <ShoppingCart className="h-4 w-4" />
              Yeni Satış
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Günlük Satış"
          value={formatCurrency(0)}
          hint="Bugün"
          icon={<TrendingUp className="h-5 w-5" />}
          trend={{ value: 12, direction: 'up' }}
        />
        <StatCard
          label="Açık Cari"
          value={formatNumber(0)}
          hint="Toplam müşteri sayısı"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Stok Kalemi"
          value={formatNumber(0)}
          hint="Aktif ürün"
          icon={<Package className="h-5 w-5" />}
        />
        <StatCard
          label="Kritik Stok"
          value={formatNumber(0)}
          hint="Min. seviyenin altında"
          icon={<AlertCircle className="h-5 w-5" />}
          trend={{ value: 3, direction: 'down' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-foreground mb-3">Aktif Modüller</h2>
          <div className="flex flex-wrap gap-2">
            {user?.activeModules?.map((m) => (
              <span key={m} className="rounded-full bg-primary-container text-primary px-3 py-1 text-xs font-semibold">
                {m}
              </span>
            )) ?? <span className="text-sm text-on-surface-variant">Henüz modül atanmamış</span>}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-foreground mb-3">Hoş Geldiniz</h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            SaaS İşletme Yönetim Platformu'na giriş yaptınız. Sol menüden modüllere erişebilir,
            üst bardan cari veya ürün araması yapabilirsiniz. Henüz demo aşamasındayız — veriler
            bir sonraki fazda (FAZ 6 — Cari) yüklenecek.
          </p>
        </div>
      </div>
    </div>
  );
}
