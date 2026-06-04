import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Save, ArrowLeft, Users, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCreatePlan } from '@/features/visits/api';

export function VisitPlanFormPage() {
  const navigate = useNavigate();
  const createMut = useCreatePlan();
  const [name, setName] = useState(''); const [planDate, setPlanDate] = useState(new Date().toISOString().substring(0, 10));
  const [salespersonId, setSalespersonId] = useState(''); const [region, setRegion] = useState(''); const [customerIds, setCustomerIds] = useState('');

  const submit = async () => {
    if (!name || !salespersonId || !customerIds) { alert('Tüm zorunlu alanları doldurun'); return; }
    await createMut.mutateAsync({ name, planDate, salespersonId, region, customerIds: customerIds.split(',').map((x) => x.trim()).filter(Boolean), notes: '' });
    navigate('/visits/plans');
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Yeni Ziyaret Planı" description="Günlük saha satış rotası"
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate('/visits/plans')} className="flex items-center gap-1 rounded-md border border-outline px-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" /> Geri</button>
            <button onClick={submit} className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Save className="h-4 w-4" /> Kaydet</button>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-2">
        <div><label className="mb-1 block text-xs font-medium">Plan Adı *</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Salı Rotası" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-medium">Tarih *</label><input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-medium">Plasiyer (User ID) *</label><input value={salespersonId} onChange={(e) => setSalespersonId(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" /></div>
        <div><label className="mb-1 block text-xs font-medium">Bölge</label><input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Merkez, Kuzey, vs." className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <div className="md:col-span-2"><label className="mb-1 block text-xs font-medium flex items-center gap-1"><Users className="h-3 w-3" /> Müşteri ID'leri (virgülle) *</label><textarea value={customerIds} onChange={(e) => setCustomerIds(e.target.value)} placeholder="cust-1, cust-2, cust-3" rows={3} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" /></div>
      </div>

      <div className="rounded-md border border-blue-300 bg-blue-50 p-3 text-xs text-blue-800 flex items-start gap-2">
        <MapPin className="h-4 w-4 mt-0.5" />
        <div>
          <p className="font-semibold">GPS Check-in</p>
          <p>Plan aktifleştirildikten sonra plasiyer mobil/tablette check-in yapabilir. Konum bilgisi otomatik kaydedilir.</p>
        </div>
      </div>
    </div>
  );
}
