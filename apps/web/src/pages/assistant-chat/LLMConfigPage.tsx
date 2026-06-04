import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Save, Send, Trash2, Settings, Zap, Eye, EyeOff } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { useLLMConfig, useUpsertConfig, useDeleteConfig, useTestConfig } from '@/features/assistant-chat/api';
import { LLMProvider, LLMProviderLabel, LLMProviderBaseUrl, POPULAR_MODELS, type LLMProvider as LLMProviderT } from '@saas/shared';

const MODULE_OPTIONS = [
  { code: 'sales', label: 'Satış' }, { code: 'cari', label: 'Cari' }, { code: 'stock', label: 'Stok' },
  { code: 'products', label: 'Ürünler' }, { code: 'pricing', label: 'Fiyat/Kampanya' },
  { code: 'reports', label: 'Raporlar' }, { code: 'dashboard', label: 'Dashboard' },
  { code: 'notifications', label: 'Bildirimler' },
];

const TOOL_OPTIONS = [
  { code: 'get_customer_balance', name: 'Cari Bakiye Sorgula' },
  { code: 'list_customer_pending_sales', name: 'Bekleyen Satışları Listele' },
  { code: 'check_product_stock', name: 'Ürün Stok Sorgula' },
  { code: 'get_dashboard_summary', name: 'Dashboard Özeti' },
];

export function LLMConfigPage() {
  const navigate = useNavigate();
  const { data: config, isLoading } = useLLMConfig();
  const upsert = useUpsertConfig();
  const del = useDeleteConfig();
  const test = useTestConfig();

  const [provider, setProvider] = useState<LLMProviderT>(LLMProvider.OPENROUTER);
  const [apiKey, setApiKey] = useState(''); const [baseUrl, setBaseUrl] = useState('');
  const [defaultModel, setDefaultModel] = useState('deepseek/deepseek-chat');
  const [fallbackModel, setFallbackModel] = useState('');
  const [maxTokens, setMaxTokens] = useState(2048); const [temperature, setTemperature] = useState(0.3); const [topP, setTopP] = useState(0.9);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [toolPermissions, setToolPermissions] = useState<string[]>([]);
  const [rateLimitPerHour, setRateLimitPerHour] = useState(100);
  const [monthlyBudgetUSD, setMonthlyBudgetUSD] = useState<number | undefined>(undefined);
  const [isActive, setIsActive] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    if (config) {
      setProvider(config.provider); setBaseUrl(config.baseUrl ?? ''); setDefaultModel(config.defaultModel);
      setFallbackModel(config.fallbackModel ?? ''); setMaxTokens(config.maxTokens); setTemperature(config.temperature); setTopP(config.topP);
      setSystemPrompt(config.systemPrompt ?? ''); setEnabledModules(config.enabledModules); setToolPermissions(config.toolPermissions);
      setRateLimitPerHour(config.rateLimitPerHour); setMonthlyBudgetUSD(config.monthlyBudgetUSD); setIsActive(config.isActive);
    }
  }, [config]);

  const save = async () => {
    if (!apiKey && !config) { alert('API anahtarı zorunlu'); return; }
    await upsert.mutateAsync({ provider, apiKey: apiKey || '__unchanged__', baseUrl: baseUrl || undefined, defaultModel, fallbackModel: fallbackModel || undefined, maxTokens, temperature, topP, systemPrompt, enabledModules, toolPermissions, rateLimitPerHour, monthlyBudgetUSD, isActive } as any);
    navigate('/assistant-chat');
  };

  const handleTest = async () => {
    if (!apiKey) { alert('Önce API key girin'); return; }
    const r = await test.mutateAsync({ provider, apiKey, baseUrl: baseUrl || undefined, defaultModel });
    setTestResult(r);
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <PageHeader title="LLM Konfigürasyonu" description="API anahtarı ve model ayarları"
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate('/assistant-chat')} className="rounded-md border border-outline px-3 py-2 text-sm">Geri</button>
            <button onClick={handleTest} disabled={!apiKey || test.isPending} className="flex items-center gap-2 rounded-md border border-primary px-3 py-2 text-sm text-primary"><Zap className="h-4 w-4" /> Test Et</button>
            <button onClick={save} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Save className="h-4 w-4" /> Kaydet</button>
          </div>
        }
      />

      {config && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm">
          <p className="font-semibold text-green-800">✓ Yapılandırma mevcut</p>
          <p className="text-green-700">Bu ay kullanım: <strong>${config.monthlyUsageUSD.toFixed(4)}</strong> {config.monthlyBudgetUSD ? `/ $${config.monthlyBudgetUSD}` : ''}</p>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium">Sağlayıcı *</label>
          <select value={provider} onChange={(e) => { setProvider(e.target.value as LLMProviderT); setBaseUrl(LLMProviderBaseUrl[e.target.value as LLMProviderT] ?? ''); }} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">
            {Object.entries(LLMProviderLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <p className="mt-1 text-[10px] text-on-surface-variant">
            <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="text-primary underline">openrouter.ai</a>'den ücretsiz hesap açıp $5 yatırarak 50+ modele erişin.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">API Anahtarı {config ? `(mevcut: ${config.apiKeyMasked})` : '*'}</label>
          <div className="flex gap-1">
            <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type={showKey ? 'text' : 'password'} placeholder="sk-or-..." className="flex-1 rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" />
            <button onClick={() => setShowKey(!showKey)} type="button" className="rounded-md border border-outline px-2">{showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Base URL (ops.)</label>
          <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder={LLMProviderBaseUrl[provider]} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Varsayılan Model</label>
          <input value={defaultModel} onChange={(e) => setDefaultModel(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" />
          <p className="mt-1 text-[10px] text-on-surface-variant">Popüler: deepseek-chat, gpt-4o-mini, claude-3-5-haiku</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Yedek Model (ops.)</label>
          <input value={fallbackModel} onChange={(e) => setFallbackModel(e.target.value)} placeholder="Hata durumunda dene" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Max Token</label>
          <input type="number" min="100" max="32000" value={maxTokens} onChange={(e) => setMaxTokens(Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Temperature: {temperature}</label>
          <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} className="w-full" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Top P: {topP}</label>
          <input type="range" min="0" max="1" step="0.05" value={topP} onChange={(e) => setTopP(Number(e.target.value))} className="w-full" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Saatlik İstek Limiti</label>
          <input type="number" min="1" value={rateLimitPerHour} onChange={(e) => setRateLimitPerHour(Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Aylık Bütçe (USD, ops.)</label>
          <input type="number" min="0" step="1" value={monthlyBudgetUSD ?? ''} onChange={(e) => setMonthlyBudgetUSD(e.target.value ? Number(e.target.value) : undefined)} placeholder="Limitsiz" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm self-end"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Aktif</label>
      </div>

      {/* Popüler Modeller */}
      <section className="rounded-lg border border-outline-variant bg-surface p-3">
        <h3 className="mb-2 text-sm font-semibold flex items-center gap-1"><Settings className="h-4 w-4" /> Popüler Modeller (tıkla seç)</h3>
        <div className="grid gap-1 sm:grid-cols-2">
          {POPULAR_MODELS.map((m) => (
            <button key={m.model} type="button" onClick={() => { setDefaultModel(m.model); setProvider(m.provider); setBaseUrl(LLMProviderBaseUrl[m.provider] ?? ''); }} className={`text-left rounded-md border p-2 text-xs hover:bg-surface-variant/30 ${defaultModel === m.model ? 'border-primary bg-primary-container/20' : 'border-outline-variant'}`}>
              <p className="font-semibold">{m.label}</p>
              <p className="text-on-surface-variant"><code>{m.model}</code> {m.cost > 0 ? `• $${m.cost}/1M` : '• ÜCRETSİZ'}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Modül İzinleri */}
      <section className="rounded-lg border border-outline-variant bg-surface p-3">
        <h3 className="mb-2 text-sm font-semibold">Erişilebilir Modüller</h3>
        <p className="mb-2 text-xs text-on-surface-variant">Asistan sadece seçili modüllere ait bilgi tabanı içeriklerine erişebilir</p>
        <div className="grid gap-1 sm:grid-cols-2 md:grid-cols-4">
          {MODULE_OPTIONS.map((m) => (
            <label key={m.code} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={enabledModules.includes(m.code)} onChange={(e) => setEnabledModules(e.target.checked ? [...enabledModules, m.code] : enabledModules.filter((x) => x !== m.code))} />
              {m.label}
            </label>
          ))}
        </div>
      </section>

      {/* Tool İzinleri */}
      <section className="rounded-lg border border-outline-variant bg-surface p-3">
        <h3 className="mb-2 text-sm font-semibold">Araç (Tool) İzinleri</h3>
        <p className="mb-2 text-xs text-on-surface-variant">Asistan sadece seçili araçları çağırabilir. Boş bırakırsanız tool kullanımı devre dışı.</p>
        <div className="grid gap-1 sm:grid-cols-2">
          {TOOL_OPTIONS.map((t) => (
            <label key={t.code} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={toolPermissions.includes(t.code)} onChange={(e) => setToolPermissions(e.target.checked ? [...toolPermissions, t.code] : toolPermissions.filter((x) => x !== t.code))} />
              {t.name}
            </label>
          ))}
        </div>
      </section>

      {/* System Prompt */}
      <section className="rounded-lg border border-outline-variant bg-surface p-3">
        <h3 className="mb-2 text-sm font-semibold">Sistem Prompt (ops.)</h3>
        <p className="mb-2 text-xs text-on-surface-variant">Boş bırakırsanız varsayılan Mavis Türkçe SaaS asistanı kullanılır.</p>
        <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={4} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" />
      </section>

      {testResult && (
        <div className={`rounded-lg border-2 p-3 ${testResult.ok ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}`}>
          <p className="font-semibold">{testResult.ok ? '✓ Bağlantı Başarılı' : '✗ Bağlantı Hatası'}</p>
          <p className="text-sm">Model: {testResult.model} • {testResult.latencyMs}ms</p>
          <p className="text-xs">{testResult.message}</p>
        </div>
      )}

      {config && (
        <button onClick={async () => { if (confirm('Silmek istediğinize emin misiniz?')) { await del.mutateAsync(); navigate('/assistant-chat'); } }} className="flex items-center gap-2 rounded-md border border-red-300 px-3 py-2 text-sm text-red-700">
          <Trash2 className="h-4 w-4" /> Yapılandırmayı Sil
        </button>
      )}
    </div>
  );
}
