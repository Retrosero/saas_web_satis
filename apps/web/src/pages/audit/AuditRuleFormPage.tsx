import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { useRule, useCreateRule, useUpdateRule } from '@/features/audit/api';
import { DataCheckType, DataCheckTypeLabel, DataCheckSeverity, DataCheckSeverityLabel } from '@saas/shared';

export function AuditRuleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: rule, isLoading } = useRule(id ?? '');
  const createMut = useCreateRule();
  const updateMut = useUpdateRule(id ?? '');

  const [name, setName] = useState(''); const [description, setDescription] = useState(''); const [checkType, setCheckType] = useState<DataCheckType>(DataCheckType.NEGATIVE_STOCK);
  const [severity, setSeverity] = useState<DataCheckSeverity>(DataCheckSeverity.MEDIUM); const [isActive, setIsActive] = useState(true); const [autoFixable, setAutoFixable] = useState(false);
  const [params, setParams] = useState<any>({});

  useEffect(() => {
    if (rule) {
      setName(rule.name); setDescription(rule.description ?? ''); setCheckType(rule.checkType); setSeverity(rule.severity);
      setIsActive(rule.isActive); setAutoFixable(rule.autoFixable); setParams(rule.parameters);
    }
  }, [rule]);

  const submit = async () => {
    if (!name) { alert('Kural adı zorunlu'); return; }
    const payload = { name, description, checkType, severity, isActive, autoFixable, parameters: params };
    if (isEdit) await updateMut.mutateAsync(payload);
    else await createMut.mutateAsync(payload);
    navigate('/audit/rules');
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <PageHeader title={isEdit ? 'Kural Düzenle' : 'Yeni Denetim Kuralı'} description="Kontrol tipi ve parametreler"
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate('/audit/rules')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" /> Geri</button>
            <button onClick={submit} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Save className="h-4 w-4" /> Kaydet</button>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-2">
        <div><label className="mb-1 block text-xs font-medium">Kural Adı *</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-medium">Kontrol Tipi *</label>
          <select value={checkType} onChange={(e) => setCheckType(e.target.value as DataCheckType)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" disabled={isEdit}>
            {Object.entries(DataCheckTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div><label className="mb-1 block text-xs font-medium">Ciddiyet *</label>
          <select value={severity} onChange={(e) => setSeverity(e.target.value as DataCheckSeverity)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
            {Object.entries(DataCheckSeverityLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-4 self-end">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Aktif</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={autoFixable} onChange={(e) => setAutoFixable(e.target.checked)} /> Otomatik Düzeltilebilir</label>
        </div>
        <div className="md:col-span-2"><label className="mb-1 block text-xs font-medium">Açıklama</label><input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
      </div>

      {/* Parametreler — tip bazlı */}
      {checkType === DataCheckType.DISCOUNT_OVER_LIMIT && (
        <section className="rounded-lg border border-outline-variant bg-surface p-3">
          <h3 className="mb-2 text-sm font-semibold">İskonto Parametreleri</h3>
          <div><label className="mb-1 block text-xs font-medium">Maks. İskonto Oranı (%)</label><input type="number" min="0" max="100" value={params.maxDiscount ?? 50} onChange={(e) => setParams({ ...params, maxDiscount: Number(e.target.value) })} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        </section>
      )}
      {checkType === DataCheckType.COLLECTION_OVERDUE && (
        <section className="rounded-lg border border-outline-variant bg-surface p-3">
          <h3 className="mb-2 text-sm font-semibold">Vade Parametreleri</h3>
          <div><label className="mb-1 block text-xs font-medium">Gecikme Günü Eşiği</label><input type="number" min="1" value={params.daysOverdue ?? 30} onChange={(e) => setParams({ ...params, daysOverdue: Number(e.target.value) })} className="rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        </section>
      )}

      {isEdit && (
        <section className="rounded-lg border-2 border-primary bg-primary-container/10 p-3 text-sm">
          <h3 className="mb-1 font-semibold">Bilgi</h3>
          <p>Çalıştırma sayısı: {rule?.runCount} • Son bulgu: {rule?.lastResultCount} • Son çalıştırma: {rule?.lastRunAt ? new Date(rule.lastRunAt).toLocaleString('tr-TR') : '—'}</p>
        </section>
      )}
    </div>
  );
}
