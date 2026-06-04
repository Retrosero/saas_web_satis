import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Play, ArrowLeft, Check, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { useCampaign, useTestCampaign } from '@/features/pricing/api';
import { formatCurrency, type CampaignTestResult } from '@saas/shared';

export function CampaignTestPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: campaign, isLoading } = useCampaign(id ?? '');
  const testMut = useTestCampaign();
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [cartAmount, setCartAmount] = useState<number | ''>('');
  const [result, setResult] = useState<CampaignTestResult | null>(null);

  if (isLoading) return <LoadingState />;
  if (!campaign) return null;

  const run = async () => {
    const r = await testMut.mutateAsync({
      campaignId: id!, customerId: customerId || undefined, productId: productId || undefined,
      quantity, unitPrice: Number(unitPrice) || 0, cartAmount: Number(cartAmount) || 0,
    });
    setResult(r);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <PageHeader title={`Kampanya Testi: ${campaign.name}`} description="Örnek cari/ürün/adet ile kampanyayı test edin" actions={<button onClick={() => navigate('/pricing/campaigns')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" /> Geri</button>} />

      <div className="rounded-lg border border-outline-variant bg-surface p-4 space-y-3">
        <h3 className="text-sm font-semibold">Test Parametreleri</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="mb-1 block text-xs font-medium">Cari ID (ops.)</label><input value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="customerId" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" /></div>
          <div><label className="mb-1 block text-xs font-medium">Ürün ID (ops.)</label><input value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="productId" className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono" /></div>
          <div><label className="mb-1 block text-xs font-medium">Adet</label><input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-xs font-medium">Birim Fiyat</label><input type="number" step="0.01" min="0" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
          <div className="col-span-2"><label className="mb-1 block text-xs font-medium">Sepet Tutarı (adet × fiyat yerine manuel)</label><input type="number" step="0.01" min="0" value={cartAmount} onChange={(e) => setCartAmount(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        </div>
        <button onClick={run} disabled={testMut.isPending} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-40">
          <Play className="h-4 w-4" /> {testMut.isPending ? 'Test Ediliyor...' : 'Testi Çalıştır'}
        </button>
      </div>

      {result && (
        <div className={`rounded-lg border p-4 ${result.appliedCampaign ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            {result.appliedCampaign ? <><Check className="h-4 w-4 text-green-700" /> Kampanya Uygulandı</> : <><X className="h-4 w-4 text-amber-700" /> Kampanya Uygulanmadı</>}
          </h3>
          <p className="text-xs text-on-surface-variant mb-3">{result.reason}</p>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt>Brüt Tutar</dt><dd className="font-medium">{formatCurrency(result.originalAmount)}</dd></div>
            <div className="flex justify-between text-red-700"><dt>İndirim</dt><dd className="font-semibold">-{formatCurrency(result.discountAmount)}</dd></div>
            <div className="flex justify-between border-t border-outline pt-2 text-base font-bold"><dt>Net Tutar</dt><dd className="text-primary">{formatCurrency(result.netAmount)}</dd></div>
          </dl>
        </div>
      )}
    </div>
  );
}
