import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Save, Plus, Trash2, Eye, ArrowLeft, Play } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { useRule, useCreateRule, useUpdateRule, useChannels, usePreviewRule } from '@/features/notifications/api';
import {
  NotificationTriggerType,
  NotificationTriggerTypeLabel,
  NotificationConditionOperatorLabel,
  NotificationActionTypeLabel,
  NotificationRecipientTypeLabel,
  NotificationRecipientType,
  NotificationChannelType,
  NotificationChannelTypeLabel,
  type NotificationRuleCondition,
  type NotificationRuleAction,
  type NotificationRuleRecipient,
  type NotificationChannel,
} from '@saas/shared';

const SAMPLE_DATA = { customer: { name: 'ABC Ltd.', id: 'cust-1' }, amount: 12500, currency: 'TRY', date: '2026-06-15', product: { name: 'Ürün X' }, stock: 5, threshold: 10 };

export function NotificationRuleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: rule, isLoading } = useRule(id ?? '');
  const { data: channels = [] } = useChannels();
  const createMut = useCreateRule();
  const updateMut = useUpdateRule(id ?? '');
  const previewMut = usePreviewRule(id ?? '');

  const [name, setName] = useState(''); const [description, setDescription] = useState(''); const [triggerType, setTriggerType] = useState<NotificationTriggerType>(NotificationTriggerType.SALE_CREATED);
  const [priority, setPriority] = useState(5); const [isActive, setIsActive] = useState(true); const [cooldownMinutes, setCooldownMinutes] = useState(0);
  const [conditions, setConditions] = useState<NotificationRuleCondition[]>([]);
  const [actions, setActions] = useState<NotificationRuleAction[]>([{ type: 'SEND_NOTIFICATION' as any, template: 'Merhaba, yeni bir {{trigger}} oluştu.' }]);
  const [recipients, setRecipients] = useState<NotificationRuleRecipient[]>([{ type: NotificationRecipientType.ALL_TENANT_USERS }]);
  const [channelIds, setChannelIds] = useState<string[]>([]);
  const [preview, setPreview] = useState<any>(null);

  useEffect(() => {
    if (rule) {
      setName(rule.name); setDescription(rule.description ?? ''); setTriggerType(rule.triggerType);
      setPriority(rule.priority); setIsActive(rule.isActive); setCooldownMinutes(rule.cooldownMinutes);
      setConditions(rule.conditions); setActions(rule.actions); setRecipients(rule.recipients); setChannelIds(rule.channelIds);
    }
  }, [rule]);

  const submit = async () => {
    if (!name) { alert('Kural adı zorunlu'); return; }
    if (isEdit) await updateMut.mutateAsync({ name, description, triggerType, conditions, actions, recipients, channelIds, priority, isActive, cooldownMinutes });
    else await createMut.mutateAsync({ name, description, triggerType, conditions, actions, recipients, channelIds, priority, isActive, cooldownMinutes });
    navigate('/notifications/rules');
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <PageHeader title={isEdit ? 'Kural Düzenle' : 'Yeni Kural'} description="Tetik, koşul, aksiyon ve alıcı tanımla"
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate('/notifications/rules')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" /> Geri</button>
            <button onClick={submit} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Save className="h-4 w-4" /> Kaydet</button>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-2">
        <div><label className="mb-1 block text-xs font-medium">Kural Adı *</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-medium">Tetik Tipi *</label>
          <select value={triggerType} onChange={(e) => setTriggerType(e.target.value as NotificationTriggerType)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
            {Object.entries(NotificationTriggerTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="md:col-span-2"><label className="mb-1 block text-xs font-medium">Açıklama</label><input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-medium">Öncelik (1-10)</label><input type="number" min="1" max="10" value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-medium">Cooldown (dakika)</label><input type="number" min="0" value={cooldownMinutes} onChange={(e) => setCooldownMinutes(Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <label className="flex items-center gap-2 text-sm self-end"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Aktif</label>
      </div>

      {/* Koşullar */}
      <section className="rounded-lg border border-outline-variant bg-surface p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Koşullar (AND/OR)</h3>
          <button onClick={() => setConditions([...conditions, { field: '', operator: 'EQUALS' as any, value: '' }])} className="flex items-center gap-1 text-xs text-primary"><Plus className="h-3 w-3" /> Koşul</button>
        </div>
        {conditions.length === 0 ? <p className="text-xs text-on-surface-variant">Koşul yok → tüm eventler tetiklenir</p> : conditions.map((c, i) => (
          <div key={i} className="mb-1 flex items-center gap-1">
            {i > 0 && <select value={c.joinWith ?? 'AND'} onChange={(e) => { const n = [...conditions]; n[i] = { ...c, joinWith: e.target.value as any }; setConditions(n); }} className="rounded border border-outline bg-surface px-1 text-xs"><option>AND</option><option>OR</option></select>}
            <input value={c.field} onChange={(e) => { const n = [...conditions]; n[i] = { ...c, field: e.target.value }; setConditions(n); }} placeholder="field" className="flex-1 rounded border border-outline bg-surface px-2 py-1 text-xs" />
            <select value={c.operator} onChange={(e) => { const n = [...conditions]; n[i] = { ...c, operator: e.target.value as any }; setConditions(n); }} className="rounded border border-outline bg-surface px-1 text-xs">
              {Object.entries(NotificationConditionOperatorLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input value={String(c.value ?? '')} onChange={(e) => { const n = [...conditions]; n[i] = { ...c, value: e.target.value }; setConditions(n); }} placeholder="değer" className="flex-1 rounded border border-outline bg-surface px-2 py-1 text-xs" />
            <button onClick={() => setConditions(conditions.filter((_, j) => j !== i))} className="text-red-600"><Trash2 className="h-3 w-3" /></button>
          </div>
        ))}
      </section>

      {/* Aksiyonlar */}
      <section className="rounded-lg border border-outline-variant bg-surface p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Aksiyonlar (şablon)</h3>
          <button onClick={() => setActions([...actions, { type: 'SEND_NOTIFICATION' as any, template: '' }])} className="flex items-center gap-1 text-xs text-primary"><Plus className="h-3 w-3" /> Aksiyon</button>
        </div>
        {actions.map((a, i) => (
          <div key={i} className="mb-2 rounded-md border border-outline-variant p-2">
            <div className="mb-1 flex items-center gap-1">
              <select value={a.type} onChange={(e) => { const n = [...actions]; n[i] = { ...a, type: e.target.value as any }; setActions(n); }} className="rounded border border-outline bg-surface px-2 py-1 text-xs">
                {Object.entries(NotificationActionTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input value={a.subject ?? ''} onChange={(e) => { const n = [...actions]; n[i] = { ...a, subject: e.target.value }; setActions(n); }} placeholder="Konu (ops.)" className="flex-1 rounded border border-outline bg-surface px-2 py-1 text-xs" />
              <button onClick={() => setActions(actions.filter((_, j) => j !== i))} className="text-red-600"><Trash2 className="h-3 w-3" /></button>
            </div>
            <textarea value={a.template} onChange={(e) => { const n = [...actions]; n[i] = { ...a, template: e.target.value }; setActions(n); }} rows={3} placeholder="Şablon (ör: Sayın {{customer.name}}, {{amount}} {{currency}} tutarında...)" className="w-full rounded border border-outline bg-surface px-2 py-1 text-xs font-mono" />
            <p className="mt-1 text-[10px] text-on-surface-variant">Değişkenler: {`{{customer.name}}, {{amount}}, {{currency}}, {{date}}, {{product.name}}, {{stock}}, {{threshold}}`}</p>
          </div>
        ))}
      </section>

      {/* Alıcılar */}
      <section className="rounded-lg border border-outline-variant bg-surface p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Alıcılar</h3>
          <button onClick={() => setRecipients([...recipients, { type: NotificationRecipientType.ALL_TENANT_USERS }])} className="flex items-center gap-1 text-xs text-primary"><Plus className="h-3 w-3" /> Alıcı</button>
        </div>
        {recipients.map((r, i) => (
          <div key={i} className="mb-1 flex items-center gap-1">
            <select value={r.type} onChange={(e) => { const n = [...recipients]; n[i] = { ...r, type: e.target.value as any }; setRecipients(n); }} className="rounded border border-outline bg-surface px-2 py-1 text-xs">
              {Object.entries(NotificationRecipientTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {r.type === 'SPECIFIC_USERS' && <input value={(r.targetIds ?? []).join(',')} onChange={(e) => { const n = [...recipients]; n[i] = { ...r, targetIds: e.target.value.split(',') }; setRecipients(n); }} placeholder="User ID'ler" className="flex-1 rounded border border-outline bg-surface px-2 py-1 text-xs" />}
            {r.type === 'ROLE' && <input value={(r.roleIds ?? []).join(',')} onChange={(e) => { const n = [...recipients]; n[i] = { ...r, roleIds: e.target.value.split(',') }; setRecipients(n); }} placeholder="Role ID'ler" className="flex-1 rounded border border-outline bg-surface px-2 py-1 text-xs" />}
            {(r.type === 'CUSTOMER' || r.type === 'SALESPERSON') && <input value={r.fieldRef ?? ''} onChange={(e) => { const n = [...recipients]; n[i] = { ...r, fieldRef: e.target.value }; setRecipients(n); }} placeholder="alan.yolu (ör: customerId)" className="flex-1 rounded border border-outline bg-surface px-2 py-1 text-xs" />}
            <button onClick={() => setRecipients(recipients.filter((_, j) => j !== i))} className="text-red-600"><Trash2 className="h-3 w-3" /></button>
          </div>
        ))}
      </section>

      {/* Kanallar */}
      <section className="rounded-lg border border-outline-variant bg-surface p-3">
        <h3 className="mb-2 text-sm font-semibold">Gönderim Kanalları</h3>
        {channels.length === 0 ? <p className="text-xs text-on-surface-variant">Önce bildirim kanalı oluşturun</p> : (
          <div className="space-y-1">
            {channels.map((c) => (
              <label key={c.id} className="flex items-center gap-2 rounded-md p-1.5 hover:bg-surface-variant/30">
                <input type="checkbox" checked={channelIds.includes(c.id)} onChange={(e) => setChannelIds(e.target.checked ? [...channelIds, c.id] : channelIds.filter((x) => x !== c.id))} />
                <span>{NotificationChannelTypeLabel[c.type]}</span>
                <span className="font-semibold">{c.name}</span>
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>{c.isActive ? 'Aktif' : 'Pasif'}</span>
              </label>
            ))}
          </div>
        )}
      </section>

      {/* Preview */}
      {isEdit && (
        <section className="rounded-lg border-2 border-primary bg-primary-container/10 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-1"><Eye className="h-4 w-4" /> Şablon Önizleme</h3>
            <button onClick={async () => { const p = await previewMut.mutateAsync(SAMPLE_DATA); setPreview(p); }} className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs font-medium text-on-primary"><Play className="h-3 w-3" /> Örnek Veriyle Test Et</button>
          </div>
          {preview ? (
            <div className="rounded-md bg-surface p-3 text-sm">
              {preview.renderedSubject && <p className="font-semibold mb-1">{preview.renderedSubject}</p>}
              <p className="whitespace-pre-wrap">{preview.renderedBody ?? preview.body}</p>
              <p className="mt-2 text-xs text-on-surface-variant">Eşleşen alıcı: {preview.matchedRecipients} kişi</p>
            </div>
          ) : <p className="text-xs text-on-surface-variant">Önizleme için "Örnek Veriyle Test Et" tıklayın</p>}
        </section>
      )}
    </div>
  );
}
