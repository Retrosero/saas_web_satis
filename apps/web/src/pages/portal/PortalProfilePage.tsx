import { User, Building2, Phone, Mail, MapPin, FileText, CreditCard, LogOut } from 'lucide-react';
import { usePortalProfile, usePortalLogout } from '@/features/portal/api';
import { portalAuth } from '@/lib/portal-client';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { formatCurrency } from '@saas/shared';

export function PortalProfilePage() {
  const { data: profile, isLoading, error, refetch } = usePortalProfile();
  const logout = usePortalLogout();
  const customer = portalAuth.getCustomer();

  if (isLoading) return <LoadingState />;
  if (error || !profile) return <ErrorState message="Profil yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-on-primary">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-on-primary/20 p-4">
            <User className="h-12 w-12" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{profile.name}</h2>
            <p className="opacity-90">{profile.code}</p>
            <p className="mt-1 text-xs opacity-75">{profile.type === 'CUSTOMER' ? 'Müşteri' : profile.type === 'SUPPLIER' ? 'Tedarikçi' : 'Müşteri + Tedarikçi'}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-outline-variant bg-surface p-4 space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Building2 className="h-4 w-4" /> Firma Bilgileri</h3>
          <Info icon={FileText} label="Vergi No" value={profile.taxNumber ?? '—'} mono />
          <Info icon={MapPin} label="Adres" value={[profile.address, profile.district, profile.city].filter(Boolean).join(' / ') || '—'} />
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface p-4 space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">İletişim</h3>
          <Info icon={Phone} label="Telefon" value={profile.phone ?? '—'} />
          <Info icon={Mail} label="E-posta" value={profile.email ?? '—'} />
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface p-4">
          <Info icon={CreditCard} label="Kredi Limiti" value={formatCurrency(profile.creditLimit)} />
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface p-4">
          <Info icon={User} label="Durum" value={profile.status === 'ACTIVE' ? 'Aktif' : profile.status === 'PASSIVE' ? 'Pasif' : 'Blokeli'} />
        </div>
      </div>

      <button onClick={logout} className="flex items-center gap-2 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
        <LogOut className="h-4 w-4" /> Oturumu Kapat
      </button>
    </div>
  );
}

function Info({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-on-surface-variant flex items-center gap-1"><Icon className="h-3 w-3" /> {label}</p>
      <p className={`mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
