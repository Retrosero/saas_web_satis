import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Plus, Power, Trash2, Activity, Eye, EyeOff, Copy, Check, Filter } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { MobileCardList } from '@/components/data/MobileCardList';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import { useApiKeys, useRevokeApiKey, useDeleteApiKey, useCreateApiKey } from '@/features/api/api';
import { ApiKeyStatusLabel, formatDateTime, type ApiKey, type ApiScope } from '@saas/shared';

const SCOPE_GROUPS: Array<{ title: string; scopes: ApiScope[] }> = [
  { title: 'Cari', scopes: ['customers:read', 'customers:write'] },
  { title: 'Ürün', scopes: ['products:read', 'products:write'] },
  { title: 'Stok', scopes: ['stock:read', 'stock:write'] },
  { title: 'Sipariş', scopes: ['orders:read', 'orders:create', 'orders:cancel'] },
  { title: 'Tahsilat', scopes: ['collections:read', 'collections:create'] },
  { title: 'Diğer', scopes: ['reports:read', 'webhooks:manage'] },
];

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  REVOKED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-200 text-gray-700',
};

export function ApiKeysPage() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<ApiKey | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ApiKey | null>(null);
  const [createdKey, setCreatedKey] = useState<{ apiKey: ApiKey; fullKey: string } | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<ApiScope[]>([]);
  const [expiresAt, setExpiresAt] = useState('');

  const { data: keys = [], isLoading, error, refetch } = useApiKeys();
  const createMut = useCreateApiKey();
  const revokeMut = useRevokeApiKey();
  const delMut = useDeleteApiKey();

  const toggleScope = (s: ApiScope) => {
    setSelectedScopes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const submit = async () => {
    if (!name || selectedScopes.length === 0) return;
    const r = await createMut.mutateAsync({ name, scopes: selectedScopes, expiresAt: expiresAt || undefined });
    setCreatedKey(r);
    setShowForm(false);
    setName(''); setSelectedScopes([]); setExpiresAt('');
    refetch();
  };

  const columns: DataTableColumn<ApiKey>[] = [
    { key: 'name', label: 'Anahtar Adı', render: (k) => <span className="font-semibold">{k.name}</span> },
    { key: 'keyPrefix', label: 'Ön Ek', hideOnMobile: true, render: (k) => <span className="font-mono text-xs">{k.keyPrefix}{k.keyHint}</span> },
    { key: 'scopes', label: 'Yetki Kapsamı', hideOnMobile: true, render: (k) => <span className="text-xs">{k.scopes.length} yetki</span> },
    { key: 'lastUsedAt', label: 'Son Erişim', width: '160px', hideOnMobile: true, render: (k) => k.lastUsedAt ? formatDateTime(k.lastUsedAt) : '—' },
    { key: 'status', label: 'Durum', width: '120px', render: (k) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[k.status]}`}>{ApiKeyStatusLabel[k.status]}</span> },
    {
      key: 'actions', label: '', width: '130px', render: (k) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => navigate(`/api/usage?keyId=${k.id}`)} className="rounded-md p-1.5 text-primary hover:bg-primary-container/40" title="Kullanım Logları"><Activity className="h-4 w-4" /></button>
          {k.status === 'ACTIVE' && (
            <button onClick={() => setConfirmRevoke(k)} className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50" title="Pasife Al"><Power className="h-4 w-4" /></button>
          )}
          <button onClick={() => setConfirmDelete(k)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50" title="Sil"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message="API anahtarları yüklenemedi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="API Anahtarları"
        description="3rd party entegrasyonlar için API anahtarları yönetin"
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate('/api/usage')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm">
              <Activity className="h-4 w-4" /> Kullanım Logları
            </button>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary">
              <Plus className="h-4 w-4" /> Yeni API Anahtarı
            </button>
          </div>
        }
      />

      {showForm && (
        <div className="rounded-lg border-2 border-primary bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold">Yeni API Anahtarı</h3>
          <div className="space-y-3">
            <div><label className="mb-1 block text-xs font-medium">Anahtar Adı *</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Entegrasyon X" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Son Geçerlilik (opsiyonel)</label><input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div>
              <label className="mb-2 block text-xs font-medium">Yetki Kapsamı * (en az 1 seçin)</label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {SCOPE_GROUPS.map((g) => (
                  <div key={g.title} className="rounded-md border border-outline-variant p-2">
                    <p className="mb-1 text-xs font-semibold">{g.title}</p>
                    {g.scopes.map((s) => (
                      <label key={s} className="flex items-center gap-1.5 text-xs">
                        <input type="checkbox" checked={selectedScopes.includes(s)} onChange={() => toggleScope(s)} className="rounded" />
                        <code className="text-[10px]">{s}</code>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
              ⚠️ Anahtar sadece oluşturulduğunda gösterilecek. Sonra kopyalayabilir veya silmeniz gerekecek.
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="rounded-md border border-outline px-3 py-1.5 text-sm">İptal</button>
              <button onClick={submit} disabled={!name || selectedScopes.length === 0 || createMut.isPending} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-on-primary disabled:opacity-40">Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {createdKey && (
        <div className="rounded-lg border-2 border-green-500 bg-green-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-green-800">✓ API Anahtarı Oluşturuldu</h3>
          <p className="mb-2 text-xs text-green-700">Bu anahtarı güvenli bir yere kaydedin. Bir daha gösterilmeyecek!</p>
          <div className="flex items-center gap-2 rounded-md border border-green-300 bg-surface p-2 font-mono text-xs">
            <span className="flex-1 truncate">{showSecret ? createdKey.fullKey : '••••••••••••••••••••••••••••••'}</span>
            <button onClick={() => setShowSecret(!showSecret)} className="rounded p-1 hover:bg-surface-variant">{showSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}</button>
            <button onClick={() => { navigator.clipboard.writeText(createdKey.fullKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="rounded p-1 hover:bg-surface-variant">{copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}</button>
          </div>
          <button onClick={() => setCreatedKey(null)} className="mt-2 text-xs text-green-700 hover:underline">Kapat</button>
        </div>
      )}

      {isLoading ? <LoadingState /> : keys.length === 0 ? (
        <EmptyState icon={<Key className="h-12 w-12" />} title="Henüz API anahtarı yok" description="3rd party entegrasyonlar için ilk anahtarınızı oluşturun" />
      ) : (
        <>
          <DataTable<ApiKey> columns={columns} data={keys} rowKey={(k) => k.id} />
          <MobileCardList<ApiKey>
            data={keys}
            keyFn={(k) => k.id}
            header={(k) => k.name}
            subtitle={(k) => `${k.keyPrefix}${k.keyHint} • ${k.scopes.length} yetki`}
            rightBadge={(k) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[k.status]}`}>{ApiKeyStatusLabel[k.status]}</span>}
            footer={(k) => <span className="text-xs text-on-surface-variant">{k.lastUsedAt ? `Son: ${formatDateTime(k.lastUsedAt)}` : 'Henüz kullanılmadı'}</span>}
          />
        </>
      )}

      <ConfirmModal open={!!confirmRevoke} title="Anahtar Pasife Alınsın mı?" description={`${confirmRevoke?.name} iptal edilecek.`} confirmText="Pasife Al" variant="warning" onClose={() => setConfirmRevoke(null)} onConfirm={async () => { if (confirmRevoke) { await revokeMut.mutateAsync(confirmRevoke.id); setConfirmRevoke(null); } }} />
      <ConfirmModal open={!!confirmDelete} title="Anahtar Silinsin mi?" description={`${confirmDelete?.name} kalıcı olarak silinecek.`} confirmText="Sil" variant="danger" onClose={() => setConfirmDelete(null)} onConfirm={async () => { if (confirmDelete) { await delMut.mutateAsync(confirmDelete.id); setConfirmDelete(null); } }} />
    </div>
  );
}
