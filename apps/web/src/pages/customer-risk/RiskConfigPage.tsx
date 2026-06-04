import { useState } from 'react';
import { Save, Settings, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCustomerRiskConfigs, useUpsertRiskConfig } from '@/features/ux-bulk/api';
import { LoadingState } from '@/components/data/LoadingState';

export function RiskConfigPage() {
  const { data: configs, isLoading } = useCustomerRiskConfigs();
  const upsert = useUpsertRiskConfig();
  const [draft, setDraft] = useState<any>({ balanceWarning: 10000, balanceCritical: 50000, daysSinceOrderWarn: 60, daysSinceOrderCrit: 120, daysSincePaymentWarn: 45, daysSincePaymentCrit: 90, isDefault: true });

  const onSave = async () => { await upsert.mutateAsync(draft); };

  return (
    <div className="space-y-4">
      <PageHeader title="Risk Konfigürasyonu" description="Risk seviyeleri için eşik değerleri" actions={<button onClick={onSave} disabled={upsert.isPending} className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Save className="h-4 w-4" /> {upsert.isPending ? 'Kaydediliyor...' : 'Kaydet'}</button>} />

      {isLoading ? <LoadingState /> : (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
          <div className="flex items-center gap-2 font-semibold text-amber-900"><AlertTriangle className="h-4 w-4" /> Bilgi</div>
          <p className="mt-1 text-amber-800">Risk skoru 0-100 arası hesaplanır. Bakiye, sipariş ve ödeme gecikmesine göre ağırlıklı puan toplanır. 70+ kritik, 40+ yüksek, 20+ orta, altı düşük olarak işaretlenir.</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-outline bg-surface p-3">
          <h3 className="mb-2 flex items-center gap-2 font-semibold"><Settings className="h-4 w-4" /> Bakiye Eşikleri (TRY)</h3>
          <div className="space-y-2 text-sm">
            <label className="block">Uyarı Bakiyesi: <input type="number" value={draft.balanceWarning} onChange={(e) => setDraft({ ...draft, balanceWarning: Number(e.target.value) })} className="ml-2 w-32 rounded border px-2 py-1" /></label>
            <label className="block">Kritik Bakiye: <input type="number" value={draft.balanceCritical} onChange={(e) => setDraft({ ...draft, balanceCritical: Number(e.target.value) })} className="ml-2 w-32 rounded border px-2 py-1" /></label>
          </div>
        </div>
        <div className="rounded-lg border border-outline bg-surface p-3">
          <h3 className="mb-2 font-semibold">Sipariş Gecikmesi (gün)</h3>
          <div className="space-y-2 text-sm">
            <label className="block">Uyarı: <input type="number" value={draft.daysSinceOrderWarn} onChange={(e) => setDraft({ ...draft, daysSinceOrderWarn: Number(e.target.value) })} className="ml-2 w-24 rounded border px-2 py-1" /></label>
            <label className="block">Kritik: <input type="number" value={draft.daysSinceOrderCrit} onChange={(e) => setDraft({ ...draft, daysSinceOrderCrit: Number(e.target.value) })} className="ml-2 w-24 rounded border px-2 py-1" /></label>
          </div>
        </div>
        <div className="rounded-lg border border-outline bg-surface p-3 sm:col-span-2">
          <h3 className="mb-2 font-semibold">Ödeme Gecikmesi (gün)</h3>
          <div className="space-y-2 text-sm">
            <label className="block">Uyarı: <input type="number" value={draft.daysSincePaymentWarn} onChange={(e) => setDraft({ ...draft, daysSincePaymentWarn: Number(e.target.value) })} className="ml-2 w-24 rounded border px-2 py-1" /></label>
            <label className="block">Kritik: <input type="number" value={draft.daysSincePaymentCrit} onChange={(e) => setDraft({ ...draft, daysSincePaymentCrit: Number(e.target.value) })} className="ml-2 w-24 rounded border px-2 py-1" /></label>
          </div>
        </div>
      </div>

      {configs && configs.length > 0 && <div className="rounded-lg border border-outline bg-surface p-3"><h3 className="mb-2 font-semibold text-sm">Mevcut Yapılandırmalar</h3><ul className="text-sm">{configs.map((c: any) => <li key={c.id} className="border-b py-1">{c.name ?? 'Default'}: Bakiye uyarı {c.balanceWarning} TRY, kritik {c.balanceCritical} TRY</li>)}</ul></div>}
    </div>
  );
}
