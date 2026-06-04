import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Save, ArrowLeft, Send } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { useChannel, useCreateChannel, useUpdateChannel, useTestChannel } from '@/features/notifications/api';
import { NotificationChannelType, NotificationChannelTypeLabel, type NotificationChannelConfig } from '@saas/shared';

export function NotificationChannelFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: channel, isLoading } = useChannel(id ?? '');
  const createMut = useCreateChannel();
  const updateMut = useUpdateChannel(id ?? '');
  const testMut = useTestChannel();

  const [name, setName] = useState(''); const [description, setDescription] = useState(''); const [type, setType] = useState<NotificationChannelType>(NotificationChannelType.IN_APP);
  const [isActive, setIsActive] = useState(true); const [isDefault, setIsDefault] = useState(false);
  const [config, setConfig] = useState<NotificationChannelConfig>({});
  const [testResult, setTestResult] = useState<{ status: string; message: string } | null>(null);

  useEffect(() => {
    if (channel) {
      setName(channel.name); setDescription(channel.description ?? ''); setType(channel.type);
      setIsActive(channel.isActive); setIsDefault(channel.isDefault); setConfig(channel.config);
    }
  }, [channel]);

  const submit = async () => {
    if (!name) { alert('Kanal adı zorunlu'); return; }
    if (isEdit) await updateMut.mutateAsync({ name, description, type, config, isActive, isDefault });
    else await createMut.mutateAsync({ name, description, type, config, isActive, isDefault });
    navigate('/notifications/channels');
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <PageHeader title={isEdit ? 'Kanal Düzenle' : 'Yeni Kanal'} description="SMTP / SMS / Webhook ayarları"
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate('/notifications/channels')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" /> Geri</button>
            {isEdit && <button onClick={async () => { const r = await testMut.mutateAsync(id!); setTestResult(r); }} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><Send className="h-4 w-4" /> Test Et</button>}
            <button onClick={submit} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Save className="h-4 w-4" /> Kaydet</button>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-2">
        <div><label className="mb-1 block text-xs font-medium">Kanal Adı *</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-xs font-medium">Tip *</label>
          <select value={type} onChange={(e) => setType(e.target.value as NotificationChannelType)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" disabled={isEdit}>
            {Object.entries(NotificationChannelTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="md:col-span-2"><label className="mb-1 block text-xs font-medium">Açıklama</label><input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Aktif</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} /> Varsayılan kanal</label>
      </div>

      {type === 'EMAIL' && (
        <section className="rounded-lg border border-outline-variant bg-surface p-3 space-y-2">
          <h3 className="text-sm font-semibold">SMTP Yapılandırması</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <div><label className="mb-1 block text-xs font-medium">SMTP Host</label><input value={config.smtpHost ?? ''} onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })} placeholder="smtp.gmail.com" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">SMTP Port</label><input type="number" value={config.smtpPort ?? 587} onChange={(e) => setConfig({ ...config, smtpPort: Number(e.target.value) })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">SMTP Kullanıcı</label><input value={config.smtpUser ?? ''} onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">SMTP Şifre</label><input type="password" value={config.smtpPasswordRef ?? ''} onChange={(e) => setConfig({ ...config, smtpPasswordRef: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Gönderen Adres</label><input value={config.fromAddress ?? ''} onChange={(e) => setConfig({ ...config, fromAddress: e.target.value })} placeholder="noreply@firma.com" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Gönderen Adı</label><input value={config.fromName ?? ''} onChange={(e) => setConfig({ ...config, fromName: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <label className="flex items-center gap-2 text-sm self-end"><input type="checkbox" checked={config.useTls ?? true} onChange={(e) => setConfig({ ...config, useTls: e.target.checked })} /> TLS kullan</label>
          </div>
        </section>
      )}

      {type === 'SMS' && (
        <section className="rounded-lg border border-outline-variant bg-surface p-3 space-y-2">
          <h3 className="text-sm font-semibold">SMS Sağlayıcı</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <div><label className="mb-1 block text-xs font-medium">Sağlayıcı</label>
              <select value={config.smsProvider ?? 'twilio'} onChange={(e) => setConfig({ ...config, smsProvider: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
                <option value="twilio">Twilio</option><option value="netgsm">Netgsm</option><option value="iletimerkezi">İletimerkezi</option>
              </select>
            </div>
            <div><label className="mb-1 block text-xs font-medium">API Key</label><input type="password" value={config.smsApiKeyRef ?? ''} onChange={(e) => setConfig({ ...config, smsApiKeyRef: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Gönderen Numara</label><input value={config.fromNumber ?? ''} onChange={(e) => setConfig({ ...config, fromNumber: e.target.value })} placeholder="+905551234567" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
          </div>
        </section>
      )}

      {type === 'WEBHOOK' && (
        <section className="rounded-lg border border-outline-variant bg-surface p-3 space-y-2">
          <h3 className="text-sm font-semibold">Webhook Ayarları</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="md:col-span-2"><label className="mb-1 block text-xs font-medium">URL *</label><input value={config.webhookUrl ?? ''} onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })} placeholder="https://example.com/webhook" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">HTTP Metod</label>
              <select value={config.webhookMethod ?? 'POST'} onChange={(e) => setConfig({ ...config, webhookMethod: e.target.value as any })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm"><option>GET</option><option>POST</option><option>PUT</option></select>
            </div>
            <div><label className="mb-1 block text-xs font-medium">Auth Tipi</label>
              <select value={config.webhookAuthType ?? 'NONE'} onChange={(e) => setConfig({ ...config, webhookAuthType: e.target.value as any })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm"><option>NONE</option><option>BEARER</option><option>BASIC</option><option>API_KEY</option></select>
            </div>
            <div className="md:col-span-2"><label className="mb-1 block text-xs font-medium">Ek Header'lar (JSON)</label><textarea value={JSON.stringify(config.webhookHeaders ?? {}, null, 2)} onChange={(e) => { try { setConfig({ ...config, webhookHeaders: JSON.parse(e.target.value) }); } catch {} }} rows={3} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-xs font-mono" /></div>
          </div>
        </section>
      )}

      {type === 'IN_APP' && (
        <section className="rounded-lg border border-outline-variant bg-surface p-3">
          <h3 className="text-sm font-semibold">Uygulama İçi Bildirim</h3>
          <p className="mt-1 text-xs text-on-surface-variant">Ek yapılandırma gerekmez. Tüm bildirimler kullanıcıya anlık olarak uygulama içinde iletilir.</p>
        </section>
      )}

      {testResult && (
        <div className="rounded-lg border-2 border-primary bg-surface p-4">
          <h3 className="text-sm font-semibold">Test Sonucu: <span className={testResult.status === 'OK' ? 'text-green-600' : 'text-red-600'}>{testResult.status}</span></h3>
          <p className="mt-1 text-sm">{testResult.message}</p>
        </div>
      )}
    </div>
  );
}
