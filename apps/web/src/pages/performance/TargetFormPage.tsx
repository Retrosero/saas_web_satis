import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCreateTarget } from '@/features/performance/api';
import { TargetType, TargetTypeLabel, TargetPeriod, TargetPeriodLabel, formatDate } from '@saas/shared';

export function TargetFormPage() {
  const navigate = useNavigate();
  const createMut = useCreateTarget();
  const [name, setName] = useState(''); const [type, setType] = useState<TargetType>(TargetType.SALES_AMOUNT);
  const [period, setPeriod] = useState<TargetPeriod>(TargetPeriod.MONTHLY);
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().substring(0, 10));
  const [assigneeId, setAssigneeId] = useState(''); const [assigneeName, setAssigneeName] = useState('');
  const [targetValue, setTargetValue] = useState(0);

  const submit = async () => {
    if (!name || !assigneeId) { alert('İsim ve atanan zorunlu'); return; }
    await createMut.mutateAsync({ name, type, period, startDate, endDate, assigneeType: 'USER', assigneeId, assigneeName, targetValue, currency: 'TRY' });
    navigate('/performance/targets');
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Yeni Hedef" description="Personel/ekip/şube hedefi"
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate('/performance/targets')} className="flex items-center gap-1 rounded-md border border-outline px-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" /> Geri</button>
            <button onClick={submit} className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Save className="h-4 w-4" /> Kaydet</button>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-2">
        <div><label className="mb-1 block text-xs font-medium">Hedef Adı *</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aylık 100K TL Satış" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-medium">Tip *</label>
          <select value={type} onChange={(e) => setType(e.target.value as TargetType)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
            {Object.entries(TargetTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div><label className="mb-1 block text-xs font-medium">Dönem</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value as TargetPeriod)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
            {Object.entries(TargetPeriodLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div><label className="mb-1 block text-xs font-medium">Hedef Değer *</label><input type="number" value={targetValue} onChange={(e) => setTargetValue(Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-medium">Başlangıç</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-medium">Bitiş</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-medium">Atanan User ID *</label><input value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" /></div>
        <div><label className="mb-1 block text-xs font-medium">Atanan Ad</label><input value={assigneeName} onChange={(e) => setAssigneeName(e.target.value)} placeholder="Ahmet Yılmaz" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
      </div>
    </div>
  );
}
