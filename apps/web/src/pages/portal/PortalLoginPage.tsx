import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, User, Key, AlertCircle, ShoppingCart, BarChart3, FileText, LogIn } from 'lucide-react';
import { usePortalLogin } from '@/features/portal/api';

export function PortalLoginPage() {
  const navigate = useNavigate();
  const [tenantCode, setTenantCode] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = usePortalLogin();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login.mutateAsync({ tenantCode, customerCode, password });
      navigate('/portal');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Giriş başarısız');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-container via-surface to-secondary-container flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6">
        {/* Sol: Tanıtım */}
        <div className="hidden md:flex flex-col justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-10 text-on-primary shadow-2xl">
          <ShoppingCart className="h-16 w-16 mb-4" />
          <h1 className="text-3xl font-bold mb-3">Bayi Portalı</h1>
          <p className="text-on-primary/90 mb-6">Siparişlerinizi kolayca verin, bakiyenizi takip edin, ürün kataloğumuzu inceleyin.</p>
          <ul className="space-y-3">
            <li className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Anlık cari bakiye</li>
            <li className="flex items-center gap-2"><FileText className="h-5 w-5" /> Detaylı ekstre</li>
            <li className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Hızlı sipariş</li>
          </ul>
        </div>

        {/* Sağ: Form */}
        <form onSubmit={submit} className="rounded-2xl bg-surface p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-1">Giriş Yap</h2>
          <p className="text-sm text-on-surface-variant mb-6">Hesap bilgilerinizle giriş yapın</p>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium">Firma Kodu</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
                <input value={tenantCode} onChange={(e) => setTenantCode(e.target.value)} placeholder="Örn: demo" required className="w-full rounded-md border border-outline bg-surface pl-10 pr-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Müşteri Kodu</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
                <input value={customerCode} onChange={(e) => setCustomerCode(e.target.value)} placeholder="Örn: M001" required className="w-full rounded-md border border-outline bg-surface pl-10 pr-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Portal Şifresi (PIN)</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Vergi numaranızın son 4 hanesi" required className="w-full rounded-md border border-outline bg-surface pl-10 pr-3 py-2 text-sm" />
              </div>
              <p className="mt-1 text-xs text-on-surface-variant">İlk girişte PIN = vergi numaranızın son 4 hanesi</p>
            </div>
            <button type="submit" disabled={login.isPending} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-on-primary hover:bg-primary/90 disabled:opacity-50">
              <LogIn className="h-4 w-4" /> {login.isPending ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
