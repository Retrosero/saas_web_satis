import { useEffect, useState } from 'react';
import { Palette, Image, Globe, FileText, Mail, Save, Check, Upload, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useWhiteLabel, useUpdateWhiteLabel, useValidateDomain } from '@/features/white-label/api';
import type { WhiteLabelSettings } from '@saas/shared';

type Tab = 'brand' | 'logo' | 'colors' | 'domain' | 'login' | 'email' | 'pdf';

const TABS: Array<{ key: Tab; label: string; icon: any }> = [
  { key: 'brand', label: 'Marka', icon: Palette },
  { key: 'logo', label: 'Logo', icon: Image },
  { key: 'colors', label: 'Renkler', icon: Palette },
  { key: 'domain', label: 'Özel Domain', icon: Globe },
  { key: 'login', label: 'Giriş Sayfası', icon: FileText },
  { key: 'email', label: 'E-posta', icon: Mail },
  { key: 'pdf', label: 'PDF/Fatura', icon: FileText },
];

export function WhiteLabelPage() {
  const [tab, setTab] = useState<Tab>('brand');
  const { data: settings, isLoading, error, refetch } = useWhiteLabel();
  const updateMut = useUpdateWhiteLabel();
  const validateMut = useValidateDomain();
  const [draft, setDraft] = useState<Partial<WhiteLabelSettings>>({});
  const [domainResult, setDomainResult] = useState<any>(null);

  useEffect(() => {
    if (settings) setDraft(settings);
  }, [settings]);

  if (isLoading) return <LoadingState />;
  if (error || !settings) return <ErrorState message="Ayarlar yüklenemedi" onRetry={refetch} />;

  const update = (patch: Partial<WhiteLabelSettings>) => setDraft((d) => ({ ...d, ...patch }));
  const save = async () => { await updateMut.mutateAsync(draft); };

  const validateDomain = async () => {
    if (!draft.customDomain) return;
    const r = await validateMut.mutateAsync(draft.customDomain);
    setDomainResult(r);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Marka & White-Label Ayarları"
        description="Firmanızın görünümünü özelleştirin"
        actions={
          <button onClick={save} disabled={updateMut.isPending} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-40">
            {updateMut.isPending ? <><Check className="h-4 w-4" /> Kaydedildi</> : <><Save className="h-4 w-4" /> Kaydet</>}
          </button>
        }
      />

      {/* Tab nav */}
      <div className="flex overflow-x-auto rounded-lg border border-outline-variant bg-surface">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-foreground'}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-outline-variant bg-surface p-4 space-y-3">
        {tab === 'brand' && (
          <div className="grid gap-3 md:grid-cols-2">
            <div><label className="mb-1 block text-xs font-medium">Firma Sloganı</label><input value={draft.slogan ?? ''} onChange={(e) => update({ slogan: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Destek E-posta</label><input type="email" value={draft.supportEmail ?? ''} onChange={(e) => update({ supportEmail: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Destek Telefon</label><input value={draft.supportPhone ?? ''} onChange={(e) => update({ supportPhone: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
          </div>
        )}

        {tab === 'logo' && (
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { key: 'logoUrl', label: 'Ana Logo (URL)', height: 'h-20' },
              { key: 'logoMiniUrl', label: 'Mini Logo (URL)', height: 'h-12' },
              { key: 'faviconUrl', label: 'Favicon (URL)', height: 'h-10' },
            ].map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs font-medium">{f.label}</label>
                <input value={(draft as any)[f.key] ?? ''} onChange={(e) => update({ [f.key]: e.target.value })} placeholder="https://..." className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" />
                <div className={`mt-2 flex items-center justify-center rounded-md border border-dashed border-outline p-2 ${f.height}`}>
                  {(draft as any)[f.key] ? <img src={(draft as any)[f.key]} alt="logo" className="max-h-full max-w-full" /> : <Upload className="h-6 w-6 text-on-surface-variant" />}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'colors' && (
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { key: 'primaryColor', label: 'Ana Renk' },
              { key: 'secondaryColor', label: 'Yardımcı Renk' },
              { key: 'menuColor', label: 'Menü Rengi' },
              { key: 'buttonColor', label: 'Buton Rengi' },
            ].map((c) => (
              <div key={c.key}>
                <label className="mb-1 block text-xs font-medium">{c.label}</label>
                <div className="flex gap-2">
                  <input type="color" value={(draft as any)[c.key] ?? '#6750A4'} onChange={(e) => update({ [c.key]: e.target.value })} className="h-10 w-16 rounded-md border border-outline" />
                  <input value={(draft as any)[c.key] ?? ''} onChange={(e) => update({ [c.key]: e.target.value })} className="flex-1 rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'domain' && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Özel Domain</label>
              <div className="flex gap-2">
                <input value={draft.customDomain ?? ''} onChange={(e) => update({ customDomain: e.target.value })} placeholder="app.firmaniz.com" className="flex-1 rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" />
                <button onClick={validateDomain} disabled={!draft.customDomain || validateMut.isPending} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary disabled:opacity-40">Doğrula</button>
              </div>
              <p className="mt-1 text-xs text-on-surface-variant">CNAME kaydı ekledikten sonra "Doğrula" butonuna basın. SSL otomatik aktifleşir.</p>
            </div>
            {draft.customDomainStatus && (
              <div className={`rounded-md border p-3 text-sm ${draft.customDomainStatus === 'ACTIVE' ? 'border-green-300 bg-green-50 text-green-800' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
                <strong>Domain durumu:</strong> {draft.customDomainStatus} • <strong>SSL:</strong> {draft.customDomainSslStatus}
              </div>
            )}
            {domainResult && (
              <div className="rounded-md border border-blue-300 bg-blue-50 p-3">
                <p className="mb-2 text-sm text-blue-800">{domainResult.message}</p>
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-blue-900"><th className="py-1">Tür</th><th>Host</th><th>Değer</th></tr></thead>
                  <tbody>
                    {domainResult.dnsRecords?.map((r: any, i: number) => (
                      <tr key={i} className="font-mono border-t border-blue-200"><td className="py-1">{r.type}</td><td>{r.host}</td><td>{r.value}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'login' && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2"><label className="mb-1 block text-xs font-medium">Giriş Sayfası Başlık</label><input value={draft.loginPageTitle ?? ''} onChange={(e) => update({ loginPageTitle: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div className="md:col-span-2"><label className="mb-1 block text-xs font-medium">Alt Başlık</label><input value={draft.loginPageSubtitle ?? ''} onChange={(e) => update({ loginPageSubtitle: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Arkaplan Görseli (URL)</label><input value={draft.loginPageBgUrl ?? ''} onChange={(e) => update({ loginPageBgUrl: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" /></div>
            <label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" checked={draft.loginPageShowLogo ?? true} onChange={(e) => update({ loginPageShowLogo: e.target.checked })} /> Logo göster</label>
          </div>
        )}

        {tab === 'email' && (
          <div className="grid gap-3 md:grid-cols-2">
            <div><label className="mb-1 block text-xs font-medium">Gönderen Adı</label><input value={draft.emailFromName ?? ''} onChange={(e) => update({ emailFromName: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Gönderen Adres</label><input type="email" value={draft.emailFromAddress ?? ''} onChange={(e) => update({ emailFromAddress: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Footer Metni</label><input value={draft.emailFooterText ?? ''} onChange={(e) => update({ emailFooterText: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Birincil Renk</label><input type="color" value={draft.emailPrimaryColor ?? '#6750A4'} onChange={(e) => update({ emailPrimaryColor: e.target.value })} className="h-10 w-full rounded-md border border-outline" /></div>
          </div>
        )}

        {tab === 'pdf' && (
          <div className="grid gap-3 md:grid-cols-2">
            <div><label className="mb-1 block text-xs font-medium">Firma Adı (PDF)</label><input value={draft.pdfCompanyName ?? ''} onChange={(e) => update({ pdfCompanyName: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Logo (PDF)</label><input value={draft.pdfCompanyLogo ?? ''} onChange={(e) => update({ pdfCompanyLogo: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" /></div>
            <div className="md:col-span-2"><label className="mb-1 block text-xs font-medium">Footer Metni</label><input value={draft.pdfFooterText ?? ''} onChange={(e) => update({ pdfFooterText: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Birincil Renk</label><input type="color" value={draft.pdfPrimaryColor ?? '#6750A4'} onChange={(e) => update({ pdfPrimaryColor: e.target.value })} className="h-10 w-full rounded-md border border-outline" /></div>
            <div><label className="mb-1 block text-xs font-medium">İkincil Renk</label><input type="color" value={draft.pdfSecondaryColor ?? '#625B71'} onChange={(e) => update({ pdfSecondaryColor: e.target.value })} className="h-10 w-full rounded-md border border-outline" /></div>
            <div><label className="mb-1 block text-xs font-medium">Font Ailesi</label><input value={draft.pdfFontFamily ?? 'Inter'} onChange={(e) => update({ pdfFontFamily: e.target.value })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <label className="flex items-center gap-2 text-sm self-end"><input type="checkbox" checked={draft.pdfShowTaxBreakdown ?? true} onChange={(e) => update({ pdfShowTaxBreakdown: e.target.checked })} /> KDV dökümünü göster</label>
          </div>
        )}
      </div>

      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 flex gap-2">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <span>Değişiklikler "Kaydet" butonu ile aktifleşir. Bazı ayarlar (renk teması, logo) tüm kullanıcıların tarayıcısında anında güncellenir.</span>
      </div>
    </div>
  );
}
