import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Megaphone, Save, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { useCampaign, useCreateCampaign, useUpdateCampaign } from '@/features/pricing/api';
import { CampaignTypeLabel, DiscountTypeLabel, type CampaignStatus, type CampaignType, type DiscountType } from '@saas/shared';

const CAMPAIGN_TYPES: CampaignType[] = ['PRODUCT', 'BRAND', 'CATEGORY', 'CUSTOMER_GROUP', 'CART_AMOUNT', 'QUANTITY', 'DATE_RANGE'];

export function CampaignFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const { data: existing, isLoading } = useCampaign(id ?? '');
  const createMut = useCreateCampaign();
  const updateMut = useUpdateCampaign(id ?? '');

  const [code, setCode] = useState(''); const [name, setName] = useState('');
  const [campaignType, setCampaignType] = useState<CampaignType>('PRODUCT');
  const [startDate, setStartDate] = useState(''); const [endDate, setEndDate] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENT');
  const [discountRate, setDiscountRate] = useState<number | ''>(0);
  const [discountAmount, setDiscountAmount] = useState<number | ''>(0);
  const [minQuantity, setMinQuantity] = useState<number | ''>(0);
  const [minCartAmount, setMinCartAmount] = useState<number | ''>(0);
  const [maxUsageCount, setMaxUsageCount] = useState<number | ''>(0);
  const [perUserLimit, setPerUserLimit] = useState<number | ''>(1);
  const [status, setStatus] = useState<CampaignStatus>('DRAFT');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (existing && isEdit) {
      setCode(existing.code); setName(existing.name); setCampaignType(existing.campaignType);
      setStartDate(existing.startDate.slice(0, 10)); setEndDate(existing.endDate.slice(0, 10));
      setDiscountType(existing.discountType); setDiscountRate(existing.discountRate); setDiscountAmount(existing.discountAmount);
      setMinQuantity(existing.minQuantity); setMinCartAmount(existing.minCartAmount);
      setMaxUsageCount(existing.maxUsageCount); setPerUserLimit(existing.perUserLimit);
      setStatus(existing.status); setDescription(existing.description ?? '');
    }
  }, [existing, isEdit]);

  if (isLoading && isEdit) return <LoadingState />;

  const submit = async () => {
    if (!code || !name || !startDate || !endDate) return;
    const payload: any = {
      code, name, campaignType,
      startDate, endDate,
      discountType,
      discountRate: discountType === 'PERCENT' ? Number(discountRate) : 0,
      discountAmount: discountType !== 'PERCENT' ? Number(discountAmount) : 0,
      minQuantity: Number(minQuantity) || 0, minCartAmount: Number(minCartAmount) || 0,
      maxUsageCount: Number(maxUsageCount) || 0, perUserLimit: Number(perUserLimit) || 1,
      status, description: description || undefined,
    };
    if (isEdit) await updateMut.mutateAsync(payload);
    else await createMut.mutateAsync(payload);
    navigate('/pricing/campaigns');
  };

  return (
    <div className="space-y-4">
      <PageHeader title={isEdit ? 'Kampanya Düzenle' : 'Yeni Kampanya'} description="Ürün/müşteri/sepet bazlı kampanya" actions={<button onClick={() => navigate('/pricing/campaigns')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" /> Geri</button>} />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-3 rounded-lg border border-outline-variant bg-surface p-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-medium">Kod *</label><input value={code} onChange={(e) => setCode(e.target.value)} disabled={isEdit} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm font-mono disabled:opacity-50" /></div>
            <div><label className="mb-1 block text-xs font-medium">Ad *</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Kampanya Tipi *</label><select value={campaignType} onChange={(e) => setCampaignType(e.target.value as CampaignType)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">{CAMPAIGN_TYPES.map((t) => <option key={t} value={t}>{CampaignTypeLabel[t]}</option>)}</select></div>
            <div><label className="mb-1 block text-xs font-medium">Durum</label><select value={status} onChange={(e) => setStatus(e.target.value as CampaignStatus)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm"><option value="DRAFT">Taslak</option><option value="ACTIVE">Aktif</option><option value="PASSIVE">Pasif</option></select></div>
            <div><label className="mb-1 block text-xs font-medium">Başlangıç *</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Bitiş *</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-medium">İndirim Tipi *</label><select value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType)} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm">{Object.entries(DiscountTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            {discountType === 'PERCENT' ? (
              <div><label className="mb-1 block text-xs font-medium">İndirim Oranı %</label><input type="number" step="0.01" min="0" max="100" value={discountRate} onChange={(e) => setDiscountRate(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            ) : (
              <div><label className="mb-1 block text-xs font-medium">İndirim Tutarı</label><input type="number" step="0.01" min="0" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-medium">Min. Adet</label><input type="number" min="0" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Min. Sepet Tutarı</label><input type="number" step="0.01" min="0" value={minCartAmount} onChange={(e) => setMinCartAmount(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Maks. Kullanım (0=sınırsız)</label><input type="number" min="0" value={maxUsageCount} onChange={(e) => setMaxUsageCount(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Kullanıcı Başına Limit</label><input type="number" min="1" value={perUserLimit} onChange={(e) => setPerUserLimit(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
          </div>
          <div><label className="mb-1 block text-xs font-medium">Açıklama</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface p-4">
          <h3 className="mb-2 text-sm font-semibold">Özet</h3>
          <p className="text-xs text-on-surface-variant">Kampanya tipi: {CampaignTypeLabel[campaignType]}</p>
          <p className="mt-2 text-xs text-on-surface-variant">İndirim: {discountType === 'PERCENT' ? `%${discountRate}` : `${discountAmount} TL`}</p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={() => navigate('/pricing/campaigns')} className="rounded-md border border-outline px-4 py-2 text-sm">İptal</button>
        <button onClick={submit} disabled={!code || !name || !startDate || !endDate || createMut.isPending || updateMut.isPending} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-40"><Save className="h-4 w-4" /> {isEdit ? 'Güncelle' : 'Kaydet'}</button>
      </div>
    </div>
  );
}
