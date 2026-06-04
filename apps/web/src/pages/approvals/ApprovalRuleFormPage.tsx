import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Save, Plus, Trash2, ArrowLeft, GripVertical, Users, User, Hash, Building } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { useRule, useCreateRule, useUpdateRule } from '@/features/approvals/api';
import { ApprovalTriggerType, ApprovalTriggerTypeLabel, ApprovalMode, ApprovalModeLabel, ApprovalStepType, ApprovalStepTypeLabel, type ApprovalStep, type ApprovalCondition } from '@saas/shared';

export function ApprovalRuleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: rule, isLoading } = useRule(id ?? '');
  const createMut = useCreateRule();
  const updateMut = useUpdateRule(id ?? '');

  const [name, setName] = useState(''); const [description, setDescription] = useState(''); const [triggerType, setTriggerType] = useState<ApprovalTriggerType>(ApprovalTriggerType.SALE_OVER_LIMIT);
  const [moduleName, setModuleName] = useState('SALES');
  const [mode, setMode] = useState<ApprovalMode>(ApprovalMode.SEQUENTIAL);
  const [amountField, setAmountField] = useState('grandTotal'); const [amountThreshold, setAmountThreshold] = useState<number | undefined>(undefined);
  const [expiryHours, setExpiryHours] = useState(72); const [isActive, setIsActive] = useState(true); const [priority, setPriority] = useState(5);
  const [conditions, setConditions] = useState<ApprovalCondition[]>([]);
  const [steps, setSteps] = useState<any[]>([{ stepOrder: 1, name: 'Müdür Onayı', stepType: ApprovalStepType.ROLE_BASED, config: { roleNames: ['manager'] }, requireAll: false, minApprovals: 1, isOptional: false }]);
  const [settings, setSettings] = useState({ allowDelegation: true, allowReturn: true, notifyOnPending: true, autoEscalate: false });

  useEffect(() => {
    if (rule) {
      setName(rule.name); setDescription(rule.description ?? ''); setTriggerType(rule.triggerType); setModuleName(rule.moduleName ?? '');
      setMode(rule.mode); setAmountField(rule.amountField ?? 'grandTotal'); setAmountThreshold(rule.amountThreshold);
      setExpiryHours(rule.expiryHours); setIsActive(rule.isActive); setPriority(rule.priority);
      setConditions(rule.conditions); setSteps(rule.steps.map((s) => ({ ...s }))); setSettings({ allowDelegation: true, allowReturn: true, notifyOnPending: true, autoEscalate: false, ...rule.settings });
    }
  }, [rule]);

  const submit = async () => {
    if (!name) { alert('Kural adı zorunlu'); return; }
    if (steps.length === 0) { alert('En az 1 adım gerekli'); return; }
    const payload = { name, description, triggerType, moduleName, conditions, mode, amountField, amountThreshold, expiryHours, isActive, priority, settings, steps: steps.map((s, i) => ({ ...s, stepOrder: i + 1 })) };
    if (isEdit) await updateMut.mutateAsync(payload);
    else await createMut.mutateAsync(payload);
    navigate('/approvals/rules');
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <PageHeader title={isEdit ? 'Kural Düzenle' : 'Yeni Onay Kuralı'} description="Tetik, koşul ve adımları tanımla"
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate('/approvals/rules')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" /> Geri</button>
            <button onClick={submit} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Save className="h-4 w-4" /> Kaydet</button>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-2">
        <div><label className="mb-1 block text-xs font-medium">Kural Adı *</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-medium">Tetik Tipi *</label>
          <select value={triggerType} onChange={(e) => setTriggerType(e.target.value as ApprovalTriggerType)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
            {Object.entries(ApprovalTriggerTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div><label className="mb-1 block text-xs font-medium">Modül</label><input value={moduleName} onChange={(e) => setModuleName(e.target.value)} placeholder="SALES, RETURNS, vb." className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-medium">Onay Modu *</label>
          <select value={mode} onChange={(e) => setMode(e.target.value as ApprovalMode)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
            {Object.entries(ApprovalModeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="md:col-span-2"><label className="mb-1 block text-xs font-medium">Açıklama</label><input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-medium">Tutar Alanı (entity'de)</label><input value={amountField} onChange={(e) => setAmountField(e.target.value)} placeholder="grandTotal" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-medium">Tutar Eşiği (altında onaylama)</label><input type="number" value={amountThreshold ?? ''} onChange={(e) => setAmountThreshold(e.target.value ? Number(e.target.value) : undefined)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-medium">Süre (saat)</label><input type="number" value={expiryHours} onChange={(e) => setExpiryHours(Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-medium">Öncelik (1-10)</label><input type="number" min="1" max="10" value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <label className="flex items-center gap-2 text-sm self-end"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Aktif</label>
      </div>

      {/* Adımlar */}
      <section className="rounded-lg border border-outline-variant bg-surface p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Onay Adımları</h3>
          <button onClick={() => setSteps([...steps, { stepOrder: steps.length + 1, name: `${steps.length + 1}. Adım`, stepType: ApprovalStepType.ROLE_BASED, config: { roleNames: [] }, requireAll: false, minApprovals: 1, isOptional: false }])} className="flex items-center gap-1 text-xs text-primary"><Plus className="h-3 w-3" /> Adım</button>
        </div>
        {steps.map((s, i) => (
          <div key={i} className="mb-2 rounded-md border border-outline-variant p-2 bg-background">
            <div className="mb-1 flex items-center gap-1">
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-on-primary">{i + 1}</span>
              <input value={s.name} onChange={(e) => { const n = [...steps]; n[i] = { ...s, name: e.target.value }; setSteps(n); }} placeholder="Adım adı" className="flex-1 rounded border border-outline bg-surface px-2 py-1 text-xs" />
              <select value={s.stepType} onChange={(e) => { const n = [...steps]; n[i] = { ...s, stepType: e.target.value }; setSteps(n); }} className="rounded border border-outline bg-surface px-2 py-1 text-xs">
                {Object.entries(ApprovalStepTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <button onClick={() => setSteps(steps.filter((_, j) => j !== i))} className="text-red-600"><Trash2 className="h-3 w-3" /></button>
            </div>
            <div className="grid gap-1 md:grid-cols-2">
              {s.stepType === 'ROLE_BASED' && (
                <div className="md:col-span-2"><label className="mb-1 block text-[10px] font-medium">Rol Adları (virgülle)</label><input value={(s.config?.roleNames ?? []).join(',')} onChange={(e) => { const n = [...steps]; n[i] = { ...s, config: { ...s.config, roleNames: e.target.value.split(',').map((x) => x.trim()) } }; setSteps(n); }} placeholder="manager, finance_manager" className="w-full rounded border border-outline bg-surface px-2 py-1 text-xs" /></div>
              )}
              {s.stepType === 'USER_BASED' && (
                <div className="md:col-span-2"><label className="mb-1 block text-[10px] font-medium">Kullanıcı ID</label><input value={s.config?.userId ?? ''} onChange={(e) => { const n = [...steps]; n[i] = { ...s, config: { ...s.config, userId: e.target.value } }; setSteps(n); }} className="w-full rounded border border-outline bg-surface px-2 py-1 text-xs" /></div>
              )}
              {s.stepType === 'SPECIFIC_USERS' && (
                <div className="md:col-span-2"><label className="mb-1 block text-[10px] font-medium">Kullanıcı ID'leri (virgülle)</label><input value={(s.config?.userIds ?? []).join(',')} onChange={(e) => { const n = [...steps]; n[i] = { ...s, config: { ...s.config, userIds: e.target.value.split(',').map((x) => x.trim()) } }; setSteps(n); }} className="w-full rounded border border-outline bg-surface px-2 py-1 text-xs" /></div>
              )}
              {s.stepType === 'DYNAMIC_FIELD' && (
                <div className="md:col-span-2"><label className="mb-1 block text-[10px] font-medium">Alan Yolu (entity üzerinde)</label><input value={s.config?.fieldRef ?? ''} onChange={(e) => { const n = [...steps]; n[i] = { ...s, config: { ...s.config, fieldRef: e.target.value } }; setSteps(n); }} placeholder="salesperson.managerId" className="w-full rounded border border-outline bg-surface px-2 py-1 text-xs" /></div>
              )}
              {mode === 'PARALLEL' && (
                <>
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={s.requireAll ?? false} onChange={(e) => { const n = [...steps]; n[i] = { ...s, requireAll: e.target.checked }; setSteps(n); }} /> Tümü onaylamalı</label>
                  <div><label className="mb-1 block text-[10px] font-medium">Min. Onay Sayısı</label><input type="number" min="1" value={s.minApprovals ?? 1} onChange={(e) => { const n = [...steps]; n[i] = { ...s, minApprovals: Number(e.target.value) }; setSteps(n); }} className="w-full rounded border border-outline bg-surface px-2 py-1 text-xs" /></div>
                </>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <input value={s.description ?? ''} onChange={(e) => { const n = [...steps]; n[i] = { ...s, description: e.target.value }; setSteps(n); }} placeholder="Adım açıklaması (ops.)" className="flex-1 rounded border border-outline bg-surface px-2 py-1 text-xs" />
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={s.isOptional ?? false} onChange={(e) => { const n = [...steps]; n[i] = { ...s, isOptional: e.target.checked }; setSteps(n); }} /> Opsiyonel</label>
            </div>
          </div>
        ))}
      </section>

      {/* Ayarlar */}
      <section className="rounded-lg border border-outline-variant bg-surface p-3">
        <h3 className="mb-2 text-sm font-semibold">Ek Ayarlar</h3>
        <div className="grid gap-2 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.allowDelegation} onChange={(e) => setSettings({ ...settings, allowDelegation: e.target.checked })} /> Devir İzni</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.allowReturn} onChange={(e) => setSettings({ ...settings, allowReturn: e.target.checked })} /> Geri Çevirme</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.notifyOnPending} onChange={(e) => setSettings({ ...settings, notifyOnPending: e.target.checked })} /> Bekleyince Bildirim</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.autoEscalate} onChange={(e) => setSettings({ ...settings, autoEscalate: e.target.checked })} /> Otomatik Üst Makama Geç</label>
        </div>
      </section>
    </div>
  );
}
